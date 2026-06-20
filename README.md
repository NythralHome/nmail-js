# @nythral/nmail

Server-side JavaScript and Next.js client for the Nmail transactional email API.

Do not use this package in browser code. Keep `NMAIL_API_KEY` in server environment variables.

The `from` address must be an active Nmail address created for your account. It can be a receiving inbox or a sender-only address. Nmail does not allow arbitrary `anything@yourdomain.com` sender addresses, even when the domain is verified in SES.

## Create an API key

1. Open `https://nmail.nythral.com/manage/#api`.
2. Sign in with the Nythral account that owns the sender address.
3. Make sure the sender address or sender-only mailbox you want to use is active.
4. Create an API key, give it a clear name such as `production-app`, and copy the secret once.
5. Store it as `NMAIL_API_KEY` in your server environment.

API keys are server-side secrets. Do not expose them through browser bundles, `NEXT_PUBLIC_` variables, mobile apps, public issue trackers, or committed `.env` files. Rotate the key from the dashboard if it is exposed.

## Install

```bash
npm install @nythral/nmail
```

## Node.js

```js
import { NmailClient } from "@nythral/nmail";

const nmail = new NmailClient({
  apiKey: process.env.NMAIL_API_KEY,
  timeoutMs: 10000,
});

await nmail.sendEmail({
  from: "app@yourdomain.com",
  to: "customer@example.com",
  subject: "Your login code",
  text: "Your login code is 184209.",
});
```

## Next.js Route Handler

```js
import { NmailClient } from "@nythral/nmail";

const nmail = new NmailClient({ apiKey: process.env.NMAIL_API_KEY });

export async function POST() {
  const result = await nmail.sendEmail({
    from: "app@yourdomain.com",
    to: "customer@example.com",
    subject: "Password reset",
    html: "<p>Use the secure link to reset your password.</p>",
  });

  return Response.json(result);
}
```

## OTP example

```js
export async function sendLoginCode(email, code) {
  return nmail.sendEmail({
    from: "app@yourdomain.com",
    to: email,
    subject: "Your login code",
    text: `Your login code is ${code}. It expires in 10 minutes.`,
  });
}
```

## Order confirmation example

```js
await nmail.sendEmail({
  from: "orders@yourdomain.com",
  to: customer.email,
  subject: `Order ${order.number} confirmed`,
  html: `<p>Your order was confirmed.</p><p>Total: ${order.total}</p>`,
});
```

## Errors

Validation failures throw `NmailValidationError` before any network request.

Failed API requests throw `NmailApiError` with:

- `status`: HTTP status code.
- `code`: Nmail error code such as `invalid_api_key`, `sender_mailbox_required`, `ses_domain_required`, `daily_limit_exceeded`, `recipient_limit_exceeded`, or `account_suspended`.
- `details`: optional structured metadata.
- `retryable`: true for transient upstream errors (`502`, `503`, `504`).

```js
import { NmailApiError, NmailValidationError } from "@nythral/nmail";

try {
  await nmail.sendEmail(message);
} catch (error) {
  if (error instanceof NmailValidationError) {
    console.error(error.field, error.message);
  } else if (error instanceof NmailApiError) {
    console.error(error.status, error.code, error.message);
  } else {
    throw error;
  }
}
```

## Retries

Automatic retries are disabled by default to avoid duplicate transactional email. You can opt in for transient transport/upstream failures:

```js
const nmail = new NmailClient({
  apiKey: process.env.NMAIL_API_KEY,
  maxRetries: 1,
  retryDelayMs: 250,
});
```
