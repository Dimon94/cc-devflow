# Changelog

## 1.1.1

- replace manifest and verification-report wording with `task.md`, fresh evidence, and response-only routing
- compress required output to queue truth, selected goal, reason, goal packet, and route
- forbid JSON/status/resume/report process files during next-work selection

## 1.0.1

- Include unarchived `devflow/changes/<REQ|FIX>-*` directories as next-work candidates before fresh issue selection.
- Add candidate classes for resume-planning, resume-execution, resume-check, resume-act, archive-closeout, and archive-blocked.
- Treat done-but-unarchived changes as closeout candidates until `cc-devflow archive-change <change-key>` moves them under `devflow/changes/archive/YYYY-MM/`.

## 1.0.0

- Added roadmap-aware next-work selection and Goal Packet handoff to `cc-dev`.
