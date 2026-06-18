import assert from "node:assert/strict";
import { test } from "node:test";
import { NmailApiError, NmailClient, NmailValidationError } from "../src/index.js";

test("sendEmail posts normalized payload", async () => {
  const requests = [];
  const client = new NmailClient({
    apiKey: "nmail_live_test",
    fetchImpl: async (url, init) => {
      requests.push({ url, init });
      return Response.json({ id: "msg_1", status: "queued" });
    },
  });

  const result = await client.sendEmail({
    from: "app@example.com",
    to: "user@example.com",
    subject: "Hello",
    text: "Welcome",
  });

  assert.equal(result.status, "queued");
  assert.equal(requests[0].url, "https://nmail.nythral.com/api/nmail/v1/send");
  assert.equal(requests[0].init.headers.authorization, "Bearer nmail_live_test");
  assert.deepEqual(JSON.parse(requests[0].init.body), {
    from: "app@example.com",
    to: "user@example.com",
    subject: "Hello",
    text: "Welcome",
  });
});

test("sendEmail throws structured API errors", async () => {
  const client = new NmailClient({
    apiKey: "nmail_live_test",
    fetchImpl: async () => Response.json({
      error: {
        code: "ses_domain_required",
        message: "Sender domain must have verified SES delivery before API sending",
      },
    }, { status: 403 }),
  });

  await assert.rejects(
    () => client.sendEmail({ from: "app@example.com", to: "user@example.com", subject: "Hello", text: "Welcome" }),
    (error) => error instanceof NmailApiError && error.status === 403 && error.code === "ses_domain_required",
  );
});

test("sendEmail validates required content before making a request", async () => {
  const client = new NmailClient({
    apiKey: "nmail_live_test",
    fetchImpl: async () => {
      throw new Error("fetch should not be called");
    },
  });

  await assert.rejects(
    () => client.sendEmail({ from: "app@example.com", to: "user@example.com", subject: "Hello" }),
    (error) => error instanceof NmailValidationError && error.field === "content",
  );
});

test("sendEmail retries opt-in transient API errors", async () => {
  let calls = 0;
  const client = new NmailClient({
    apiKey: "nmail_live_test",
    maxRetries: 1,
    retryDelayMs: 1,
    fetchImpl: async () => {
      calls += 1;
      if (calls === 1) {
        return Response.json({ error: { code: "service_unavailable", message: "Try again" } }, { status: 503 });
      }
      return Response.json({ id: "msg_retry", status: "queued" });
    },
  });

  const result = await client.sendEmail({
    from: "app@example.com",
    to: "user@example.com",
    subject: "Hello",
    text: "Welcome",
  });

  assert.equal(result.id, "msg_retry");
  assert.equal(calls, 2);
});

test("sendEmail does not retry non-transient API errors", async () => {
  let calls = 0;
  const client = new NmailClient({
    apiKey: "nmail_live_test",
    maxRetries: 2,
    retryDelayMs: 1,
    fetchImpl: async () => {
      calls += 1;
      return Response.json({ error: { code: "daily_limit_exceeded", message: "Limit reached" } }, { status: 429 });
    },
  });

  await assert.rejects(
    () => client.sendEmail({ from: "app@example.com", to: "user@example.com", subject: "Hello", text: "Welcome" }),
    (error) => error instanceof NmailApiError && error.code === "daily_limit_exceeded",
  );
  assert.equal(calls, 1);
});
