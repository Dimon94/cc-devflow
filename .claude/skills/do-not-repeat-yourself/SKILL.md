---
name: do-not-repeat-yourself
version: 1.0.0
description: >-
  Use before adding a new helper, utility, adapter, validator, parser, script,
  skill, prompt rule, schema, or other reusable mechanism, and before creating a
  git commit, to find existing wheels, avoid duplicate meaning, and record
  justified narrow duplication.
reads:
  - current task, spec, or user request
  - current Git diff or planned mechanism
  - nearby callers, helpers, docs, skills, and dependency surface
writes: []
---

# Do Not Repeat Yourself

Run a reuse-first DRY gate at coding time and commit time. DRY means do not
duplicate meaning, mechanisms, or wheels; it does not mean extracting every
similar two lines into a bad abstraction.

## Steps

1. Freeze the scope.
   - Coding-time scope: the mechanism you are about to add.
   - Commit-time scope: `git diff --cached`; if nothing is staged, use the
     task-scoped dirty diff.
   - Completion: every checked file or planned mechanism is in scope, or is
     explicitly excluded.

2. Walk the wheel ladder from nearest to farthest.
   - Nearby callers, same-directory helpers, and local module patterns.
   - Repo utilities, services, adapters, scripts, skills, and generated
     contracts.
   - Project docs, ADRs, runbooks, and declared entrypoints.
   - Standard library, shell builtins, and native platform features.
   - Already-installed dependencies.
   - New code only after the earlier rung is missing, wrong, or too costly.
   - Completion: each new mechanism has search evidence or a reused wheel.

3. Gate every new mechanism.
   - Mechanism means helper, utility, adapter, validator, parser, normalizer,
     retry, cache, queue, CLI wrapper, script, skill, prompt rule, config schema,
     artifact schema, or cross-module doc rule.
   - If an existing wheel covers the mechanism, delete the new mechanism from
     the current diff and reuse the existing one.
   - If an existing wheel is close but wrong, record why it fails this task.
   - Completion: no current-diff wheel is duplicated without a reason.

4. Classify remaining duplication.
   - Duplicate meaning: the same business rule, error semantics, prompt rule,
     doc rule, state transition, or external contract appears twice.
   - Duplicate mechanism: a second implementation of an existing reusable path.
   - Duplicate wheel: custom code where stdlib, platform, dependency, or skill
     already fits.
   - Completion: avoidable duplication is removed or named as deferred.

5. Do not force abstraction.
   - Keep boundary duplication across modules, APIs, CLIs, artifact schemas, or
     trust boundaries when sharing would leak internals.
   - Keep test fixture duplication when it makes cases independent and readable.
   - Keep provider quirk duplication when merging would hide external behavior.
   - Keep small local duplication when abstraction costs more than 2-3 repeated
     lines.
   - Keep temporary migration duplication only with a removal condition.
   - Completion: retained duplication fits one category and has a ceiling.

6. Check docs and skills only when touched.
   - If the diff changes `AGENTS.md`, `SKILL.md`, `CONTEXT.md`, ADRs, runbooks,
     or `docs/agents/*`, check whether the same rule already lives nearby.
   - Prefer one single source of truth plus pointers. If a rule must be copied,
     record the canonical source.
   - Completion: no touched doc or skill adds an untracked second source of
     truth.

## DRY Record

End with this record:

```text
DRY record:
- scope:
- searched:
- reused:
- remaining duplication:
```

Use `none` only after checking. Historical duplication outside the current
scope is reported, not fixed, unless it blocks the current task.
