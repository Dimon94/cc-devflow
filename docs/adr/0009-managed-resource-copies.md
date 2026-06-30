# Keep Managed Resource Copies Skill-Local

cc-devflow will keep bundled resource files such as `git-commit-guidelines.md`
copied into skill-local paths instead of moving them into a shared directory,
because host adapters, package consumers, and generated mirrors need stable
relative paths inside each skill. Drift for identical copies will be controlled
by an owner-plus-copies manifest and publish gate, while intentionally different
copies remain local variants with an explicit reason.
