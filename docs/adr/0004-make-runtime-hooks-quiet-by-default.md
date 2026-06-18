# Make Runtime Hooks Quiet By Default

cc-devflow runtime hooks will run at host lifecycle points but emit nothing unless the runtime policy core finds a workflow-relevant selector match or a definite gate violation. This is required because `UserPromptSubmit` and `Stop` fire on every occurrence in both Codex and Claude Code, so the harness must avoid turning every chat turn into workflow context noise while still enforcing real phase and delivery boundaries.
