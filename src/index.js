const defaultBaseUrl = "https://nmail.nythral.com";

export class NmailApiError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = "NmailApiError";
    this.status = options.status || 0;
    this.code = options.code || "request_failed";
    this.details = options.details;
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
    if (!this.fetchImpl) {
      throw new Error("Fetch is not available. Use Node.js 18+ or pass fetchImpl.");
    }
  }

  async sendEmail(input) {
    const response = await this.fetchImpl(`${this.baseUrl}/api/nmail/v1/send`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${this.apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(normalizeEmailInput(input)),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new NmailApiError(payload?.error?.message || "Nmail email request failed", {
        status: response.status,
        code: payload?.error?.code,
        details: payload?.error?.details,
      });
    }
    return payload;
  }
}

export function createNmailClient(options) {
  return new NmailClient(options);
}

export async function sendEmail(input, options) {
  return createNmailClient(options).sendEmail(input);
}

function normalizeEmailInput(input = {}) {
  const payload = {
    from: input.from,
    to: input.to,
    subject: input.subject,
  };
  if (input.text) payload.text = input.text;
  if (input.html) payload.html = input.html;
  if (input.replyTo) payload.replyTo = input.replyTo;
  return payload;
}
