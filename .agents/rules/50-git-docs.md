---
trigger: model_decision
description: Apply when writing commit messages, branch names, pull request text, README or documentation, or issue text.
---

# Git, issues and documentation

- Do not commit or push. Prepare the change and suggest the branch name and commit message.
- Branches: feat/<issue>-short-name, fix/..., docs/..., chore/... One story per branch.
- Commit messages (English, imperative, with issue number): "feat: add book form (#12)", "fix: ...", "docs: ...", "chore: ...".
- PR text: what and why, how to test, "Closes #<issue>".
- Issues: user stories with acceptance criteria as checklists. Labels: type (epic/story/bug/spike),
  area (backend/frontend/design/devops/docs), priority (must/should/could).
- Root README covers: what the app does, tech table, project structure, how to run locally (docker compose, user-secrets,
  dotnet run, npm start), architecture and hosting decisions, assumptions table (per-user data, max 5 quotes, JWT 60 min,
  localStorage trade-off, password hashing, permanent delete), API endpoints, how auth works, live URL, screenshots.
- Keep README and docs in step with the code in the same change.
- Never put real secrets or tokens in docs or examples; use placeholders.