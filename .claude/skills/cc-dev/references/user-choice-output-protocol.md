# User Choice Output Protocol

## Purpose

When a workflow reaches a real user decision, the agent must prefer host-native
choice UI over prose. Text blocks are fallback only.

Use this protocol for decision questions, route approval, repair choices, and
delivery-mode choices that change scope, implementation boundary, verification,
or Git delivery.

## Source Check

- OpenAI's public Codex docs describe Codex as an interactive CLI workflow and
  MCP-capable coding agent. They do not document a Markdown block that turns an
  assistant reply into a native selector.
- Codex App sessions may expose a host tool named `request_user_input`; when it
  is present, that host tool is the choice UI protocol. Do not fake it with
  Markdown.
- Claude Code official docs expose Skills, slash-command arguments, MCP prompts,
  and MCP elicitation. Claude Code does not document a general Markdown block
  that turns an assistant reply into a native selector. Do not claim one exists.

## Codex Host Format

When the Codex host exposes `request_user_input`, ask one question with this
shape:

```json
{
  "questions": [
    {
      "header": "<short label, 12 chars or fewer>",
      "id": "<stable_snake_case_id>",
      "question": "<one sentence question>",
      "options": [
        {
          "label": "<A label> (Recommended)",
          "description": "<one sentence impact or tradeoff>"
        },
        {
          "label": "<B label>",
          "description": "<one sentence impact or tradeoff>"
        }
      ]
    }
  ]
}
```

Rules:

1. Ask at most one decision question per pause point.
2. Provide 2-3 mutually exclusive options.
3. Put the recommended option first and suffix its label with
   `(Recommended)`.
4. Keep labels short; put tradeoffs in descriptions.
5. Stop after the tool call and wait for the user's answer.

## Claude Code Host Format

When Claude Code has a real structured-input tool available, use it instead of
text:

- MCP elicitation: request a single-select field with enum values `A`, `B`, and
  optional `C`; include the recommended option in the field description or
  option label.
- Any explicit ask-question / choice tool supplied by the host: map the same
  fields as the fallback block below into that tool's native schema.

When no structured-input tool is available, emit this fallback text and stop:

```text
D<N> - <decision title>
Question: <one sentence question>
Recommendation: <A/B/C> because <reason>
Options:
A) <label> (recommended)
   Good: <upside>
   Cost/Risk: <cost or risk>
B) <label>
   Good: <upside>
   Cost/Risk: <cost or risk>
C) <label, optional>
   Good: <upside>
   Cost/Risk: <cost or risk>
Impact: <what changes downstream>
Reply with A, B, or C.
STOP: wait for the user answer before continuing.
```

Rules:

1. Do not call the fallback block a native selector.
2. Do not continue in the same turn after asking.
3. Record the selected option in the owning durable artifact before proceeding.

## Fallback Discipline

If neither host-native choice UI nor a supported structured-input tool is
available, the fixed text block is acceptable because it is human-readable and
parseable. It is not allowed to invent hidden protocol markers, XML tags, or
magic comments that the official host docs do not describe.
