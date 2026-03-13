/**
 * OpenSpec 互操作测试
 */

const { parseOpenSpecMarkdown, convertToDevFlowSpec } = require('../import-openspec');
const { parseDevFlowSpec, convertToOpenSpec } = require('../export-openspec');

describe('OpenSpec Import', () => {
  test('should parse OpenSpec format correctly', () => {
    const openspecContent = `# Authentication Module

## Purpose
Provides secure authentication and session management.

## Requirements

### Requirement: User Login
The system SHALL allow users to log in with email and password.

#### Scenario: Valid credentials
- GIVEN a registered user
- WHEN the user submits valid email and password
- THEN a JWT token is issued
- AND the user is redirected to dashboard

#### Scenario: Invalid credentials
- GIVEN a registered user
- WHEN the user submits invalid password
- THEN an error message is displayed
- AND no token is issued

### Requirement: Session Management
The system MUST expire sessions after 30 minutes of inactivity.

#### Scenario: Idle timeout
- GIVEN an authenticated session
- WHEN 30 minutes pass without activity
- THEN the session is invalidated
- AND the user must re-authenticate
`;

    const result = parseOpenSpecMarkdown(openspecContent);

    expect(result.moduleName).toBe('Authentication Module');
    expect(result.purpose).toContain('secure authentication');
    expect(result.requirements).toHaveLength(2);
    expect(result.requirements[0].name).toBe('User Login');
    expect(result.requirements[0].scenarios).toHaveLength(2);
    expect(result.requirements[0].scenarios[0].name).toBe('Valid credentials');
    expect(result.requirements[0].scenarios[0].steps).toHaveLength(4);
  });

  test('should convert to DevFlow spec with TDD tasks', () => {
    const openspecData = {
      moduleName: 'Auth Module',
      purpose: 'Authentication',
      requirements: [
        {
          name: 'User Login',
          description: 'Login functionality',
          scenarios: [
            {
              name: 'Valid credentials',
              steps: ['GIVEN a user', 'WHEN login', 'THEN success']
            }
          ]
        },
        {
          name: 'Session Management',
          description: 'Session handling',
          scenarios: [
            {
              name: 'Timeout',
              steps: ['GIVEN session', 'WHEN timeout', 'THEN invalidate']
            }
          ]
        }
      ]
    };

    const devflowSpec = convertToDevFlowSpec(openspecData, 'REQ-123', 'Auth System');

    expect(devflowSpec).toContain('req_id: "REQ-123"');
    expect(devflowSpec).toContain('title: "Auth System"');
    expect(devflowSpec).toContain('## Purpose');
    expect(devflowSpec).toContain('## Requirements');
    expect(devflowSpec).toContain('## Design');
    expect(devflowSpec).toContain('## Tasks');
    expect(devflowSpec).toContain('[TEST] User Login - 测试');
    expect(devflowSpec).toContain('[IMPL] User Login - 实现 (dependsOn:T001)');
    expect(devflowSpec).toContain('[TEST] Session Management - 测试');
    expect(devflowSpec).toContain('[IMPL] Session Management - 实现 (dependsOn:T003)');
  });
});

describe('OpenSpec Export', () => {
  test('should parse DevFlow spec correctly', () => {
    const devflowContent = `---
req_id: "REQ-123"
title: "Auth System"
---

# Authentication Module

## Purpose

Provides secure authentication.

## Requirements

### Requirement: User Login

The system SHALL allow login.

#### Scenario: Valid credentials
- GIVEN a registered user
- WHEN the user submits credentials
- THEN a JWT token is issued

### Requirement: Session Management

The system MUST expire sessions.

## Design

[NEEDS CLARIFICATION: Implementation details]

## Tasks

- [ ] T001 [TEST] User Login - 测试
- [ ] T002 [IMPL] User Login - 实现 (dependsOn:T001)
`;

    const result = parseDevFlowSpec(devflowContent);

    expect(result.moduleName).toBe('Authentication Module');
    expect(result.purpose).toContain('secure authentication');
    expect(result.requirements).toHaveLength(2);
    expect(result.requirements[0].name).toBe('User Login');
    expect(result.requirements[0].scenarios).toHaveLength(1);
  });

  test('should convert to OpenSpec format without metadata', () => {
    const devflowData = {
      moduleName: 'Auth Module',
      purpose: 'Authentication',
      requirements: [
        {
          name: 'User Login',
          description: 'Login functionality',
          scenarios: [
            {
              name: 'Valid credentials',
              steps: ['GIVEN a user', 'WHEN login', 'THEN success']
            }
          ]
        }
      ]
    };

    const openspecContent = convertToOpenSpec(devflowData);

    expect(openspecContent).toContain('# Auth Module');
    expect(openspecContent).toContain('## Purpose');
    expect(openspecContent).toContain('## Requirements');
    expect(openspecContent).toContain('### Requirement: User Login');
    expect(openspecContent).toContain('#### Scenario: Valid credentials');
    expect(openspecContent).not.toContain('req_id');
    expect(openspecContent).not.toContain('---');
    expect(openspecContent).not.toContain('[NEEDS CLARIFICATION');
    expect(openspecContent).not.toContain('## Design');
    expect(openspecContent).not.toContain('## Tasks');
  });
});

describe('Round-trip conversion', () => {
  test('should preserve requirements through import-export cycle', () => {
    const originalOpenSpec = `# Test Module

## Purpose
Test purpose

## Requirements

### Requirement: Feature A
Description A

#### Scenario: Case 1
- GIVEN condition
- WHEN action
- THEN result
`;

    // Import to DevFlow
    const openspecData = parseOpenSpecMarkdown(originalOpenSpec);
    const devflowSpec = convertToDevFlowSpec(openspecData, 'REQ-001', 'Test');

    // Export back to OpenSpec
    const devflowData = parseDevFlowSpec(devflowSpec);
    const exportedOpenSpec = convertToOpenSpec(devflowData);

    // Verify requirements preserved
    expect(exportedOpenSpec).toContain('# Test Module');
    expect(exportedOpenSpec).toContain('## Purpose');
    expect(exportedOpenSpec).toContain('Test purpose');
    expect(exportedOpenSpec).toContain('### Requirement: Feature A');
    expect(exportedOpenSpec).toContain('#### Scenario: Case 1');
    expect(exportedOpenSpec).toContain('- GIVEN condition');
    expect(exportedOpenSpec).toContain('- WHEN action');
    expect(exportedOpenSpec).toContain('- THEN result');
  });
});
