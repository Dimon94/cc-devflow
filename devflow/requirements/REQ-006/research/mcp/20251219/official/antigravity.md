Agent
>
Rules / Workflows
Rules
Rules are manually defined constraints for the Agent to follow, at both the local and global levels. Rules allow users to guide the agent to follow behaviors particular to their own use cases and style.

To get started with Rules:

Open the Customizations panel via the "..." dropdown at the top of the editor's agent panel.
Navigate to the Rules panel.
Click + Global to create new Global Rules, or + Workspace to create new Workspace-specific rules.
A Rule itself is simply a Markdown file, where you can input the constraints to guide the Agent to your tasks, stack, and style.

Rules files are limited to 12,000 characters each.

Global Rules
Global rules live in ~/.gemini/GEMINI.md and are applied across all workspaces.

Workspace Rules
Workspace rules live in the .agent/rules folder of your workspace or git root.

At the rule level you can define how a rule should be activated:

Manual: The rule is manually activated via at mention in Agent’s input box.
Always On: The rule is always applied.
Model Decision: Based on a natural language description of the rule, the model decides whether to apply the rule.
Glob: Based on the glob pattern you define (e.g., .js, src/**/.ts), the rule will be applied to all files that match the pattern.
@ Mentions
You can reference other files using @filename in a Rules file. If filename is a relative path, it will be interpreted relative to the location of the Rules file. If filename is an absolute path, it will be resolved as a true absolute path, otherwise it will be resolved relative to the repository. For example, @/path/to/file.md will first attempt to be resolved to /path/to/file.md, and if that file does not exist, it will be resolved to workspace/path/to/file.md.

Workflows
Workflows enable you to define a series of steps to guide the Agent through a repetitive set of tasks, such as deploying a service or responding to PR comments. These Workflows are saved as markdown files, allowing you to have an easy repeatable way to run key processes. Once saved, Workflows can be invoked in Agent via a slash command with the format /workflow-name.

While Rules provide models with guidance by providing persistent, reusable context at the prompt level, Workflows provide a structured sequence of steps or prompts at the trajectory level, guiding the model through a series of interconnected tasks or actions.

To create a workflow:

Open the Customizations panel via the "..." dropdown at the top of the editor's agent panel.
Navigate to the Workflows panel.
Click the + Global button to create a new global workflow that can be accessed across all your workspaces, or click the + Workspace button to create a workflow specific to your current workspace.
To execute a workflow, simply invoke it in Agent using the /workflow-name command. You can call other Workflows from within a workflow! For example, /workflow-1 can include instructions like “Call /workflow-2” and “Call /workflow-3”. Upon invocation, Agent sequentially processes each step defined in the workflow, performing actions or generating responses as specified.

Workflows are saved as markdown files and contain a title, a description and a series of steps with specific instructions for Agent to follow. Workflow files are limited to 12,000 characters each.

Agent-Generated Workflows
You can also ask Agent to generate Workflows for you! This works particularly well after manually working with Agent through a series of steps since it can use the conversation history to create the Workflow.