# CC-Spec-Init Skill Changelog

## v1.4.0 - 2026-05-18

- add a Default Output contract for capability spec initialization and updates

## v1.3.0 - 2026-05-18

- add a capability-spec checklist contract for boundary, current truth, gaps, language, index link, and commit pause points

## v1.1.0 - 2026-04-28

- add a language boundary gate for canonical capability terms, aliases to avoid, flagged ambiguity, and relationship constraints
- require new capability specs to include a minimal language block before registration in `INDEX.md`
- prevent implementation names from becoming capability truth unless they already represent stable public domain language

## v1.0.1 - 2026-04-27

- require capability specs, spec indexes, and change metadata to resolve the runtime output policy before writing durable artifacts
- record `Output language` as the machine-enforced language contract while treating `agent_preferences` as advisory style input

## v1.0.0 - 2026-04-19

- 初始版 `cc-spec-init`，用于 capability-centered spec 初始化、能力真相源维护和 `change-meta.json` 链路收口。
- 新增 `INDEX.md`、capability spec、`change-meta.json` 三类模板。
- 新增 bootstrap 与链接校验脚本，供 `cc-roadmap`、`cc-plan`、`cc-act` 前后复用。
