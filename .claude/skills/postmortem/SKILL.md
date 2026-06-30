---
name: postmortem
version: 1.0.0
description: >-
  Postmortem failure-memory skill. Use when a bug, reroute, repeated failure,
  failed verification, review escape, or another workflow skill needs to
  recall, interrogate, record, or update project postmortems as reusable
  failure lessons.
skill_class: capability
route_family: none
triggers:
  - 写尸检
  - 记录这个教训
  - 召回历史尸检
  - 这个问题要沉淀
  - postmortem this
  - record this failure
  - recall postmortems
reads:
  - PLAYBOOK.md
  - assets/POSTMORTEM_TEMPLATE.md
  - assets/POSTMORTEM_INDEX_TEMPLATE.md
writes:
  - path: devflow/postmortems/INDEX.md
    durability: durable
    required: false
    when: creating or updating a postmortem
  - path: devflow/postmortems/incidents/<date>-<change-key-or-manual-slug>.md
    durability: durable
    required: false
    when: standalone recording is explicit or cc-act closeout writes a confirmed lesson
  - path: devflow/changes/<change-key>/task.md
    durability: durable
    required: false
    when: an active cc-devflow change should record only Failure Ledger evidence
---

# Postmortem

`postmortem` 维护失败模型：复发原因、逃逸点、下次处理警告、以及最小工作流修补候选。

它既是可单独调用的 User Entry Skill，也是其他 workflow skill 可读取的失败记忆合同。不要把它变成任务状态、PR closeout、review finding 或长篇复盘系统。

## Quick Start

1. Read `PLAYBOOK.md`.
2. Choose exactly one mode: `recall`, `interrogate`, or `record`.
3. For `recall`, read `devflow/postmortems/INDEX.md` first when present, then use `rg` against `devflow/postmortems`.
4. For `interrogate`, ask one missing fact at a time; inspect repo evidence instead of asking when cheap.
5. For `record`, search before writing; update the existing postmortem when `recurrence_key` matches.

## Modes

| Mode | Use |
| --- | --- |
| `recall` | Before planning, diagnosing, reviewing, or implementing work that may match earlier failures. |
| `interrogate` | When the failure facts are too thin to decide root cause, recurrence, or lesson type. |
| `record` | When the user explicitly asks to record a lesson, or `cc-act` closeout must write a confirmed lesson. |

## Durable Stores

```text
CONTEXT.md = 业务语言
task.md#Failure Ledger = 现场失败证据
devflow/postmortems/ = 长期失败记忆
```

Default project paths:

```text
devflow/postmortems/INDEX.md
devflow/postmortems/incidents/<date>-<change-key-or-manual-slug>.md
```

## Hard Rules

- Output postmortem content in Chinese.
- Use YAML frontmatter plus the six-section body from `assets/POSTMORTEM_TEMPLATE.md`.
- Use `lesson_type: recurring-pattern` for reusable failure patterns.
- Use `lesson_type: special-case` for narrow incidents; recall them only when `recall_only_when` matches.
- Use `recurrence_key = <primary_module>/<failure_class>/<stable_signature>`.
- Prefer stable signatures in this order: confirmed root cause, exact error code/name, violated contract, repeated symptom phrase.
- Same `recurrence_key` updates the existing postmortem; same symptom with a different root cause creates a new postmortem and links the related one inside `复发判断`.
- In an active cc-devflow change, non-`cc-act` workflow skills write or update `task.md#Failure Ledger`; they do not write final incident files unless the user explicitly requests standalone recording.
- Standalone recording may write directly only when the user explicitly asks and the minimum facts are present: symptom, evidence, lesson type, recall condition, and confirmed/suspected/unknown root-cause status.

## Exit Criteria

- `recall`: matching postmortems are listed as applied, skipped, or blocked with the reason.
- `interrogate`: the minimum missing fact is answered or a single next question is asked with a recommended answer.
- `record`: `INDEX.md` and exactly one incident file are created or updated, or the skill stops with the missing minimum facts.
