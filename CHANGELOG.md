# Changelog

## 0.1.0 - 2026-06-18

- Initial server-side JavaScript/Next.js SDK for Nmail transactional email.
- Added `NmailClient.sendEmail()`.
- Added `NmailApiError` with `status`, `code`, `details`, and `retryable`.
- Added `NmailValidationError` for local validation before network requests.
- Added timeout support and opt-in retry for transient failures.
- Added Node.js, Next.js, OTP, and order confirmation examples.
