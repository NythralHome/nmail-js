export type NmailSendEmailInput = {
  from: string;
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
};

export type NmailSendEmailResult = {
  id?: string;
  messageId?: string;
  status: "queued" | string;
};

export type NmailClientOptions = {
  apiKey: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  maxRetries?: number;
  retryDelayMs?: number;
};

export class NmailApiError extends Error {
  status: number;
  code: string;
  details?: unknown;
  readonly retryable: boolean;
}

export class NmailValidationError extends Error {
  code: "validation_failed";
  field?: string;
}

export class NmailClient {
  constructor(options: NmailClientOptions);
  sendEmail(input: NmailSendEmailInput): Promise<NmailSendEmailResult>;
}

export function createNmailClient(options: NmailClientOptions): NmailClient;
export function sendEmail(input: NmailSendEmailInput, options: NmailClientOptions): Promise<NmailSendEmailResult>;
