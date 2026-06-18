import assert from "node:assert/strict";
import { test } from "node:test";
import { NmailApiError, NmailClient } from "../src/index.js";

test("sendEmail posts normalized payload", async () => {
  const requests = [];
  const client = new NmailClient({
    apiKey: "nmail_live_test",
    fetchImpl: async (url, init) => {
      requests.push({ url, init });
      return Response.json({ id: "msg_1", status: "sent" });
    },
  });

  const result = await client.sendEmail({
    from: "app@example.com",
    to: "user@example.com",
    subject: "Hello",
    text: "Welcome",
  });

  assert.equal(result.status, "sent");
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
