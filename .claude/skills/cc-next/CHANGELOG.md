# Changelog

## v1.5.0 - 2026-05-31

- slim the entrypoint to the cc-next boundary, load table, selection flow, and default output
- move candidate evidence, active change classes, ranking priority, multi-candidate choice, and Goal Packet template into `PLAYBOOK.md`
- preserve the no-implementation boundary while making the entry faster for agents to enter

## v1.4.1 - 2026-05-24

- add review gate hints to `cc-dev` Goal Packets so next-work selection preserves complexity, hardening, test-strategy, and release-risk signals
- require selected goals to say whether plan/investigation and implementation `cc-review` gates should run, can be skipped with low-risk reasons, or are blocked by missing evidence

## v1.4.0 - 2026-05-21

- change cc-next from unilateral next-work selection to ranked candidate choice when multiple ready items exist
- route multi-candidate next-work decisions through the shared user-choice output protocol before producing the final Goal Packet

## v1.3.0 - 2026-05-18

- add a Default Output contract for next-work selection and no-ready-goal responses

## 1.2.0

- add a next-work checklist contract so queue selection pauses on roadmap truth, active changes, archive state, and handoff reality before producing a Goal Packet

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
