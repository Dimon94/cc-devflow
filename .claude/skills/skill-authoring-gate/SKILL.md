---
name: skill-authoring-gate
version: 1.0.0
description: Chain Skill for writing and editing cc-devflow skills with predictable invocation, hierarchy, completion, disclosure, wording, and pruning contracts.
skill_class: chain
route_family: contract
---

# Skill Authoring Gate

This is a Chain Skill: other skills and agents read it to author or review
skill content. It is not a User Entry Skill and must not grow `triggers`.

## Skill Classes

**User Entry Skill** starts or resumes a human-visible workflow phase. It may
have trigger phrases because a person or model needs to reach it as a primary
entrypoint.

**Chain Skill** is shared contract language for other skills. It is referenced
from `reads`, task packets, or review instructions, and stays narrow enough to
reuse without copying.

**Agent-facing internal contract language** is wording that changes agent
behavior inside a workflow. It is not marketing copy, status prose, or a loose
checklist; each sentence must affect what the agent reads, does, avoids, or
proves.

## Gate

- Invocation: choose User Entry Skill only for a primary workflow entrypoint;
  choose Chain Skill when the material is reused by other skills. A Chain Skill
  may have a description for discovery, but no human trigger list.
- Information hierarchy: keep required steps in `SKILL.md`; keep reusable
  reference beside the concept it defines; disclose branch-only reference behind
  a named pointer.
- Completion criteria: every step or flat reference gate needs a checkable done
  condition. "Understand" and "consider" are not criteria.
- Progressive disclosure: move material down only when not every branch needs
  it. If the material is mandatory, sharpen the pointer or inline it.
- Leading words: use stable repo terms such as Durable Truth, Chain Skill, or
  Task Contract instead of repeating a long explanation at every call site.
- Pruning: delete stale, duplicated, or no-op instructions before adding new
  prose. One meaning gets one source of truth.

## Completion

A skill change passes this gate when its invocation class is explicit, required
contract language sits at the right hierarchy level, completion criteria are
checkable, disclosed material has a reliable pointer, leading words replace
duplicated prose, and stale instructions were removed instead of preserved.
