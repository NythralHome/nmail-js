# @nythral/nmail

Server-side JavaScript client for the Nmail transactional email API.

Do not use this package in browser code. Keep `NMAIL_API_KEY` in server environment variables.

## Node.js

```js
import { NmailClient } from "@nythral/nmail";

const nmail = new NmailClient({ apiKey: process.env.NMAIL_API_KEY });

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

## Errors

Failed requests throw `NmailApiError` with `status`, `code`, and optional `details`.
