# YAML Library Documentation (eemeli/yaml)

**Source**: Context7 MCP - `/eemeli/yaml`
**Date Fetched**: 2025-12-15

---

## Overview

A definitive library for YAML, supporting both YAML 1.1 and 1.2, parsing and writing comments and blank lines, and running on Node.js and modern browsers.

---

## Parse & Stringify API

### Import
```javascript
import { parse, stringify } from 'yaml'
```

### Functions
- `parse(str, reviver?, options?)`: Parses a YAML string and returns the corresponding JavaScript value.
- `stringify(value, replacer?, options?)`: Converts a JavaScript value to a YAML string.

---

## Schema Options

YAML schemas define the data types supported in a document. The library supports:

- **`failsafe`**: The minimal schema.
- **`json`**: A superset of `failsafe`, required for parsing JSON.
- **`core`**: The default schema, a superset of `json`.
- **`yaml-1.1`**: Supports YAML 1.1 types, including binary data and timestamps.

### Parse Options

- **`schema`** (string | Schema) - Optional - The base schema to use. Defaults to `'core'`.
- **`version`** (string) - Optional - Specifies the YAML version (e.g., `'1.1'`, `'1.2'`).
- **`customTags`** (Tag[] | function) - Optional - Custom tags for the schema.
- **`mapAsMap`** (boolean) - Optional - Use JavaScript Map instead of Object for mappings.

---

## Usage Examples

### Basic Parsing
```javascript
import YAML from 'yaml'

YAML.parse('3.14159')
// 3.14159

YAML.parse('[ true, false, maybe, null ]\n')
// [ true, false, 'maybe', null ]
```

### Parsing with Schema Options
```javascript
parse('3') // 3 (Using YAML 1.2 core schema by default)
parse('3', { schema: 'failsafe' }) // '3'

parse('No') // 'No'
parse('No', { schema: 'yaml-1.1' }) // false
```

### File Parsing
```javascript
import fs from 'fs'
import YAML from 'yaml'

const file = fs.readFileSync('./file.yml', 'utf8')
const config = YAML.parse(file)
```

---

## Application to quality-rules.yml

For REQ-002, the quality-rules.yml configuration file should use:
- YAML 1.2 core schema (default)
- Nested structures for dimensions, weights, and examples
- Human-readable comments for documentation

### Example Structure
```yaml
# Quality Rules Configuration for /flow-checklist
version: "1.0.0"

dimensions:
  completeness:
    tag: "[Completeness]"
    weight: 1.0
    examples:
      - "是否定义了所有 API 端点的请求/响应格式？"
      - "是否明确了所有用户角色的权限范围？"

  clarity:
    tag: "[Clarity]"
    weight: 1.0
    examples:
      - "'快速响应' 是否有具体的时间指标？"

threshold:
  minimum_pass: 80
  blocking: true
```
