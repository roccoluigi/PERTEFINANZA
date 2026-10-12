# Admin authentication security review

## Finding

**Medium — Login brute-force throttling can be bypassed across sessions**

[`admin/login.php`](./admin/login.php) limits failed login attempts within a session. Since a visitor can start a fresh session and receive a new attempt counter, this does not reliably limit repeated password guesses. Apply throttling across sessions, preferably using a combination of account and source-based limits, with care around shared IP addresses and trusted proxy configuration.

## Existing protections observed

- Passwords are stored with PHP `password_hash(..., PASSWORD_DEFAULT)`.
- Setup and password changes require passwords of at least 14 characters.
- Successful login regenerates the session ID; session cookies use `HttpOnly` and `SameSite=Strict`, and use `Secure` when PHP detects HTTPS.
- Authenticated routes require admin authorization. State-changing forms use CSRF tokens, and logout requires POST with CSRF validation.
- Setup is disabled once credentials exist. Setup tokens are compared with `hash_equals`.
- Private storage has an Apache access-denial rule; storing it outside the document root is preferable. The access-denial fallback depends on the deployed server honoring `.htaccess`.

## Scope and limitations

This review assessed the repository's authentication policy and implementation, not the secret password value or live server configuration. The strength of the configured password therefore cannot be confirmed. The user has reported that the public site uses HTTPS.
