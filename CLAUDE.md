@AGENTS.md

# Commit conventions

Split work into small, independently-reviewable commits. Each commit should:
- Do one logical thing (a component, a type, a config change, wiring two things together)
- Build without errors on its own
- Have a subject line in the form `type: short description` (`feat`, `fix`, `chore`, `docs`, `refactor`)

Never squash unrelated changes into one commit. Never leave "WIP" commits in a PR.
