# gray-matter: YAML Frontmatter Parser

**Source**: [gray-matter GitHub](https://github.com/jonschlinkert/gray-matter)
**Context7 Library ID**: `/jonschlinkert/gray-matter`
**Fetched**: 2025-12-19

---

## Overview

Parse front-matter from a string or file. Fast, reliable and easy to use, with support for **YAML, JSON, TOML, and Coffee Front-Matter**.

---

## Installation

```bash
npm install gray-matter
```

---

## Basic Usage

### Input Format

```markdown
---
title: Hello
slug: home
---
<h1>Hello world!</h1>
```

### Parsing

```javascript
const matter = require('gray-matter');

const file = matter(`---
title: Hello
slug: home
---
<h1>Hello world!</h1>`);

console.log(file);
// {
//   content: '<h1>Hello world!</h1>',
//   data: { title: 'Hello', slug: 'home' },
//   isEmpty: false,
//   excerpt: ''
// }
```

### Accessing Parsed Data

```javascript
// Access only the YAML front matter
console.log(file.data);
// { title: 'Hello', slug: 'home' }

// Access only the content
console.log(file.content);
// '<h1>Hello world!</h1>'
```

---

## Check for Front Matter Existence

```javascript
const hasYFM = function (src, options) {
  const obj = matter(src, options).data;
  return Object.keys(obj).length > 0;
};
```

---

## Example: Complex Front Matter

```yaml
---
title: custom-delims
foo: bar
version: 2
---
```

```javascript
const file = matter(content);
console.log(file.data);
// { title: 'custom-delims', foo: 'bar', version: 2 }
```

---

## RM-008 Usage in Adapter Compiler

### Current Implementation

The existing `lib/compiler/parser.js` uses gray-matter for command parsing:

```javascript
const matter = require('gray-matter');

function parseCommand(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const { data: frontmatter, content: body } = matter(content);

  // Validate with Zod schema
  const validated = commandSchema.parse(frontmatter);

  return {
    frontmatter: validated,
    body,
    hash: computeHash(content)
  };
}
```

### Frontmatter Schema (Commands)

```javascript
const commandSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  scripts: z.record(z.string()).optional(),
  templates: z.record(z.string()).optional(),
  guides: z.record(z.string()).optional(),
  agent_scripts: z.record(z.string()).optional()
});
```

### Skills Frontmatter Schema

```javascript
const skillSchema = z.object({
  name: z.string(),
  type: z.enum(['domain', 'guardrail']),
  description: z.string(),
  priority: z.enum(['critical', 'high', 'medium', 'low']).optional(),
  triggers: z.object({
    keywords: z.array(z.string()).optional(),
    filePatterns: z.array(z.string()).optional(),
    intentPatterns: z.array(z.string()).optional()
  }).optional()
});
```

---

## Key API Methods

| Method | Description |
|--------|-------------|
| `matter(string)` | Parse string with front matter |
| `matter.read(filepath)` | Read and parse file |
| `matter.stringify(string, data)` | Create string with front matter |
| `matter.test(string)` | Test if string has front matter |

---

## Options

```javascript
matter(content, {
  delimiters: '---',        // Custom delimiters
  language: 'yaml',         // Language (yaml, json, toml)
  engines: { /* custom */ } // Custom parsers
});
```
