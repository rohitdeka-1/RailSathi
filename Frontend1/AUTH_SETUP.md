# Cognito account page

1. The local `.env` has your supplied Cognito domain. For another environment, set `VITE_COGNITO_DOMAIN` to its HTTPS managed-login domain. The local pool/client IDs were copied from the backend; keep both applications pointed at the same app client.
2. In Cognito configure a public app client without a client secret, authorization code grant, and `openid` + `email` scopes. Enable Cognito as an identity provider, self-service signup, email verification, and a working managed-login domain/branding.
3. Register this exact allowed callback URL: `http://localhost:5173/auth/callback`.
4. Register this exact allowed sign-out URL: `http://localhost:5173/`.
5. Apply pending database migrations from Backend: `npx prisma migrate dev --config prisma7.config.ts`. Do not reset a database containing needed data.
6. Start Backend with `npm run dev`, then Frontend with `npm run dev`. Open `http://localhost:5173`.
7. Click Sign in / Create account. Choose Sign up on Cognito's page if needed, verify your email, and sign in. The callback is handled by the OIDC library with authorization code + PKCE.
8. The page calls GET `/api/v1/users/me`, which provisions the PostgreSQL user. Save a name, reload, and verify it persists. Sign out and confirm the account page returns to its signed-out state.

`VITE_*` values are public browser configuration, never secrets. Never add an AWS access key, client secret, database URL, or password there. Tokens are kept in per-tab sessionStorage, not rendered or logged. Session storage is accessible to JavaScript, so avoid untrusted scripts. Automatic renewal uses the refresh token; failures require another sign-in. Logout revokes the refresh token, clears local state, and redirects to Cognito logout. Already-issued access tokens can remain valid to offline verification until expiry.

The dev proxy uses `API_PROXY_TARGET` from `.env`. In production serve `/api` through a reverse proxy to Fastify, serve the SPA at `/auth/callback`, and use HTTPS frontend callback/logout URLs registered in Cognito. Vite's development proxy does not configure production hosting. For a separate API origin, configure backend CORS for that exact frontend origin.

If login fails, check domain, app-client ID, callback URL, allowed scopes, and branding in AWS. An unavailable profile can indicate the backend is down, a pending migration, expired credentials, or mismatched pool/client IDs. The frontend does not bypass backend token verification.
