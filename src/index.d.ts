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
  status: "sent" | string;
};

export type NmailClientOptions = {
  apiKey: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
};

export class NmailApiError extends Error {
  status: number;
  code: string;
  details?: unknown;
}

export class NmailClient {
  constructor(options: NmailClientOptions);
  sendEmail(input: NmailSendEmailInput): Promise<NmailSendEmailResult>;
}

export function createNmailClient(options: NmailClientOptions): NmailClient;
export function sendEmail(input: NmailSendEmailInput, options: NmailClientOptions): Promise<NmailSendEmailResult>;
