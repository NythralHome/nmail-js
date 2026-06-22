const defaultBaseUrl = "https://nmail.nythral.com";
const defaultTimeoutMs = 10000;
const retryableStatuses = new Set([502, 503, 504]);

export class NmailApiError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = "NmailApiError";
    this.status = options.status || 0;
    this.code = options.code || "request_failed";
    this.details = options.details;
  }

  get retryable() {
    return retryableStatuses.has(this.status);
  }
}

export class NmailValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = "NmailValidationError";
    this.code = "validation_failed";
    this.field = field;
  }
}

export class NmailClient {
  constructor(options = {}) {
    if (!options.apiKey) {
      throw new Error("Nmail API key is required");
    }
    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl || defaultBaseUrl).replace(/\/$/, "");
    this.fetchImpl = options.fetchImpl || globalThis.fetch;
    this.timeoutMs = numberOrDefault(options.timeoutMs, defaultTimeoutMs);
    this.maxRetries = Math.max(0, Math.min(3, numberOrDefault(options.maxRetries, 0)));
    this.retryDelayMs = numberOrDefault(options.retryDelayMs, 250);
    if (!this.fetchImpl) {
      throw new Error("Fetch is not available. Use Node.js 18+ or pass fetchImpl.");
    }
  }

  async sendEmail(input) {
    const payload = normalizeEmailInput(input);
    return await this.#request("/api/nmail/v1/send", payload);
  }

  async #request(path, payload) {
    let attempt = 0;
    let lastError = null;

    while (attempt <= this.maxRetries) {
      try {
        return await this.#requestOnce(path, payload);
      } catch (error) {
        lastError = error;
        const retryable = error instanceof NmailApiError
          ? error.retryable
          : error?.name === "AbortError" || error instanceof TypeError;
        if (!retryable || attempt >= this.maxRetries) throw error;
        await sleep(this.retryDelayMs * (attempt + 1));
      }
      attempt += 1;
    }

    throw lastError;
  }

  async #requestOnce(path, payload) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    let response;
    try {
      response = await this.fetchImpl(`${this.baseUrl}${path}`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${this.apiKey}`,
          "content-type": "application/json",
          "user-agent": "@nythral/nmail",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new NmailApiError(data?.error?.message || "Nmail email request failed", {
        status: response.status,
        code: data?.error?.code,
        details: data?.error?.details,
      });
    }
    return data;
  }
}

export function createNmailClient(options) {
  return new NmailClient(options);
}

export async function sendEmail(input, options) {
  return createNmailClient(options).sendEmail(input);
}

function normalizeEmailInput(input = {}) {
  assertEmail(input.from, "from");
  const to = normalizeEmailList(input.to);
  const cc = normalizeEmailList(input.cc);
  const bcc = normalizeEmailList(input.bcc);
  const attachments = normalizeAttachments(input.attachments);
  if (!to.length || [...to, ...cc, ...bcc].some((recipient) => !validEmail(recipient))) {
    throw new NmailValidationError("Use one or more valid recipient email addresses", "to");
  }
  if (!input.subject || typeof input.subject !== "string") {
    throw new NmailValidationError("Email subject is required", "subject");
  }
  if (!input.text && !input.html) {
    throw new NmailValidationError("Provide text or html content", "content");
  }
  if (input.replyTo) assertEmail(input.replyTo, "replyTo");

  const payload = {
    from: input.from,
    to: Array.isArray(input.to) ? to : to[0],
    subject: input.subject,
  };
  if (cc.length) payload.cc = cc;
  if (bcc.length) payload.bcc = bcc;
  if (input.text) payload.text = input.text;
  if (input.html) payload.html = input.html;
  if (input.replyTo) payload.replyTo = input.replyTo;
  if (input.stream) payload.stream = input.stream;
  if (input.idempotencyKey) payload.idempotencyKey = input.idempotencyKey;
  if (attachments.length) payload.attachments = attachments;
  return payload;
}

function normalizeEmailList(value) {
  if (value === undefined || value === null || value === "") return [];
  const list = Array.isArray(value) ? value : [value];
  return [...new Set(list.map((item) => String(item || "").trim()).filter(Boolean))];
}

function normalizeAttachments(value) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    throw new NmailValidationError("Attachments must be an array", "attachments");
  }
  return value.map((attachment, index) => {
    if (!attachment || typeof attachment !== "object") {
      throw new NmailValidationError(`Attachment ${index + 1} must be an object`, "attachments");
    }
    const filename = String(attachment.filename || attachment.name || "").trim();
    const contentType = String(attachment.contentType || attachment.content_type || "application/octet-stream").trim();
    const contentBase64 = String(attachment.contentBase64 || attachment.content || "").trim();
    if (!filename) throw new NmailValidationError(`Attachment ${index + 1} requires a filename`, "attachments");
    if (!contentBase64) throw new NmailValidationError(`Attachment ${filename} requires contentBase64`, "attachments");
    return {
      filename,
      contentType,
      contentBase64,
      ...(attachment.disposition ? { disposition: attachment.disposition } : {}),
    };
  });
}

function assertEmail(value, field) {
  if (!validEmail(value)) {
    throw new NmailValidationError(`Use a valid ${field} email address`, field);
  }
}

function validEmail(value) {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function numberOrDefault(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
