---
trigger: model_decision
description: Apply when working on Dockerfile, hosting, Netlify, Render, Neon, environment variables, proxy configuration or deployment.
---

# Deployment rules

- Frontend on Netlify: base directory web, build command npm run build, publish directory dist/<project>/browser
  (check the exact path after ng build).
- web/public/_redirects keeps the /api rule FIRST and the SPA fallback second:
    /api/*  https://<render-service>.onrender.com/api/:splat  200
    /*      /index.html  200
  Netlify proxy requests time out after 26 s; free Render services sleep after ~15 min and need about a minute to wake.
  That is why the frontend wakes the API via /api/health with retries. Do not remove it.
- API on Render as a Docker web service (port 8080). Environment variables: ConnectionStrings__Default, Jwt__Key,
  Jwt__Issuer, Jwt__Audience. Never commit them.
- Database: Neon PostgreSQL (Npgsql connection string with SSL Mode=Require). Free compute pauses when idle; keep retry on.
  Do not use SQLite or Render's free Postgres (expires after 30 days) in production.
- No CORS anywhere. If a CORS error appears, fix the proxy or the relative URL instead of adding CORS.
- Deploy early (hello world) and verify the whole chain: Netlify → /api proxy → Render → Neon.
- Before submitting, test the live site end to end (register, login, books, quotes, mobile) and warm up the API first.