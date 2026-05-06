# Resume Index

## Document Meta

- Output language: en

- Requirement: REQ-002-unified-roadmap-truth
- Current stage: cc-act
- Current task: ship:post-merge-closeout
- Ready tasks: follow-up review
- Updated at: 2026-05-06 10:26:05 +0800

## Last Good Checkpoint

- verdict=pass; fresh gates prove roadmap.json state, generated projections, helper priority, public contract metadata, examples, Codex mirror parity, publish validation, and diff hygiene.
- Ship mode decided as `post-merge-closeout`.

## Follow-Ups

- summary: Decide the release where deprecated BACKLOG.md projection is removed. | current: BACKLOG.md is generated as a compatibility projection for one release. | desired: A future roadmap decision removes the deprecated projection after downstream compatibility evidence is collected. | interfaces: cc-roadmap, docs/examples, downstream project initialization | acceptance: Downstream refresh evidence shows roadmap.json adoption; Docs and examples no longer require BACKLOG.md projection | out-of-scope: Removing BACKLOG.md in REQ-002
- Which future release removes deprecated BACKLOG.md output?
- Should architecture diagrams support grouped subgraphs after flat node/edge usage proves insufficient?
- When should downstream projects be upgraded after this requirement lands?

## Next Action

- Finish release note, backlog writeback, and archive the requirement.
- Formal spec sync belongs in cc-act before final ship closeout.

## Parallel Notes

- Safe to parallelize: documentation review, backlog wording, release note polish.
- Must stay sequential: cc-check pass -> doc sync -> pr brief render -> ship action.
