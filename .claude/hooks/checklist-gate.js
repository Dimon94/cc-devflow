#!/usr/bin/env node
/**
 * ============================================================================
 * checklist-gate.js
 * ============================================================================
 * Epic Entry Gate Hook - Validates Checklist completion before Epic generation
 *
 * Usage: node checklist-gate.js [OPTIONS]
 *
 * OPTIONS:
 *   --req-id ID     Requirement ID (e.g., REQ-002)
 *   --json          Output in JSON format
 *   --skip          Skip gate check
 *   --reason TEXT   Reason for skipping (required with --skip)
 *
 * EXIT CODES:
 *   0 - PASS or SKIPPED
 *   1 - FAIL (completion below threshold)
 *   2 - ERROR (configuration or file error)
 *
 * Reference: contracts/hook-interface.md, TECH_DESIGN.md Section 4.3
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ============================================================================
// Constants
// ============================================================================
const DEFAULT_THRESHOLD = 80;
const REPO_ROOT = findRepoRoot();

// ============================================================================
// Argument Parsing
// ============================================================================
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        reqId: null,
        json: false,
        skip: false,
        reason: null
    };

    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--req-id':
                options.reqId = args[++i];
                break;
            case '--json':
                options.json = true;
                break;
            case '--skip':
                options.skip = true;
                break;
            case '--reason':
                options.reason = args[++i];
                break;
            case '--help':
            case '-h':
                printHelp();
                process.exit(0);
        }
    }

    return options;
}

function printHelp() {
    console.log(`
Usage: node checklist-gate.js [OPTIONS]

OPTIONS:
  --req-id ID     Requirement ID (e.g., REQ-002)
  --json          Output in JSON format
  --skip          Skip gate check
  --reason TEXT   Reason for skipping (required with --skip)
  --help, -h      Show this help message

EXAMPLES:
  node checklist-gate.js --req-id REQ-002 --json
  node checklist-gate.js --req-id REQ-002 --skip --reason "Emergency release"
`);
}

// ============================================================================
// Helper Functions
// ============================================================================
function findRepoRoot() {
    try {
        return execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' }).trim();
    } catch {
        return process.cwd();
    }
}

function getReqIdFromEnv() {
    // Try environment variable
    if (process.env.DEVFLOW_REQ_ID) {
        return process.env.DEVFLOW_REQ_ID;
    }
    // Try git branch
    try {
        const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
        const match = branch.match(/(REQ-[0-9]+)/);
        if (match) return match[1];
    } catch {}
    return null;
}

function loadConfig() {
    const configPath = path.join(REPO_ROOT, 'config', 'quality-rules.yml');
    try {
        if (!fs.existsSync(configPath)) {
            return { threshold: DEFAULT_THRESHOLD, requireReason: true };
        }
        // Simple YAML parsing for threshold
        const content = fs.readFileSync(configPath, 'utf-8');
        const thresholdMatch = content.match(/threshold:\s*(\d+)/);
        const requireReasonMatch = content.match(/require_reason:\s*(true|false)/);
        return {
            threshold: thresholdMatch ? parseInt(thresholdMatch[1]) : DEFAULT_THRESHOLD,
            requireReason: requireReasonMatch ? requireReasonMatch[1] === 'true' : true
        };
    } catch (err) {
        return { threshold: DEFAULT_THRESHOLD, requireReason: true };
    }
}

function getBeijingTime() {
    const now = new Date();
    const beijingOffset = 8 * 60;
    const utcOffset = now.getTimezoneOffset();
    const beijingTime = new Date(now.getTime() + (beijingOffset + utcOffset) * 60 * 1000);
    return beijingTime.toISOString().replace('T', ' ').substring(0, 19);
}

// ============================================================================
// Checklist Calculation
// ============================================================================
function calculateCompletion(checklistsDir) {
    if (!fs.existsSync(checklistsDir)) {
        return { error: 'NO_CHECKLISTS', message: 'Checklists directory not found' };
    }

    const files = fs.readdirSync(checklistsDir).filter(f => f.endsWith('.md'));
    if (files.length === 0) {
        return { error: 'NO_CHECKLISTS', message: 'No checklist files found' };
    }

    let totalItems = 0;
    let checkedItems = 0;
    const checklists = [];

    for (const file of files) {
        const filePath = path.join(checklistsDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');

        // Count all checkbox items (- [ ] or - [x] or - [X])
        const totalMatches = content.match(/^\s*- \[[ xX]\]/gm) || [];
        const checkedMatches = content.match(/^\s*- \[[xX]\]/gm) || [];

        const fileTotal = totalMatches.length;
        const fileChecked = checkedMatches.length;
        const filePercentage = fileTotal > 0 ? Math.round((fileChecked / fileTotal) * 100) : 0;

        totalItems += fileTotal;
        checkedItems += fileChecked;

        checklists.push({
            file: file,
            total: fileTotal,
            checked: fileChecked,
            percentage: filePercentage
        });
    }

    const overallPercentage = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

    return {
        total: totalItems,
        checked: checkedItems,
        percentage: overallPercentage,
        checklists: checklists
    };
}

// ============================================================================
// Status Update
// ============================================================================
function updateOrchestrationStatus(reqDir, completion, skip, reason) {
    const statusPath = path.join(reqDir, 'orchestration_status.json');
    try {
        const status = JSON.parse(fs.readFileSync(statusPath, 'utf-8'));

        if (!status.checklist) {
            status.checklist = {};
        }

        status.checklist.total_items = completion.total;
        status.checklist.checked_items = completion.checked;
        status.checklist.completion_percentage = completion.percentage;
        status.checklist.gate_passed = !skip && completion.percentage >= loadConfig().threshold;
        status.checklist.gate_skipped = skip;
        status.checklist.skip_reason = reason || null;
        status.checklist.last_check_at = new Date().toISOString().replace('Z', '+08:00');

        fs.writeFileSync(statusPath, JSON.stringify(status, null, 2) + '\n');
    } catch (err) {
        // Silently fail - status update is not critical
    }
}

// ============================================================================
// Audit Logging
// ============================================================================
function logGateSkip(reqDir, completion, threshold, reason) {
    const logPath = path.join(reqDir, 'EXECUTION_LOG.md');
    const timestamp = getBeijingTime();
    const weekday = ['日', '一', '二', '三', '四', '五', '六'][new Date().getDay()];

    const logEntry = `
### ${timestamp} (周${weekday})
**Event**: Gate Skipped
**Actor**: user
**Completion**: ${completion.percentage}%
**Threshold**: ${threshold}%
**Reason**: ${reason}
**Command**: /flow-epic --skip-gate --reason "${reason}"
`;

    try {
        fs.appendFileSync(logPath, logEntry);
    } catch (err) {
        // Silently fail - audit log is not critical for gate decision
    }
}

// ============================================================================
// Output Functions
// ============================================================================
function outputJson(result) {
    console.log(JSON.stringify(result, null, 2));
}

function outputText(result) {
    const { status, completion, threshold } = result;

    if (status === 'NO_CHECKLISTS') {
        console.log('❌ Checklist Gate: NO_CHECKLISTS');
        console.log('   No checklist files found.');
        console.log('');
        console.log('   Run /flow-checklist --type <type> first.');
        return;
    }

    const icon = status === 'PASS' ? '✅' : status === 'SKIPPED' ? '⚠️' : '❌';
    console.log(`${icon} Checklist Gate: ${status}`);
    console.log(`   Completion: ${completion.percentage}% (${completion.checked}/${completion.total})`);
    console.log(`   Threshold: ${threshold}%`);
    console.log('');

    if (result.details && result.details.checklists) {
        console.log('   Details:');
        for (const cl of result.details.checklists) {
            console.log(`   - ${cl.file}: ${cl.percentage}% (${cl.checked}/${cl.total})`);
        }
    }

    if (status === 'FAIL') {
        console.log('');
        console.log('   To continue:');
        console.log('   1. Review and complete checklist items');
        console.log('   2. Run /flow-checklist --status to check progress');
        console.log('   3. Or use --skip-gate --reason "your reason" to bypass');
    }

    if (status === 'SKIPPED') {
        console.log('');
        console.log(`   Reason: ${result.skip_reason}`);
        console.log('   ⚠️  Audit logged to EXECUTION_LOG.md');
    }
}

// ============================================================================
// Main
// ============================================================================
function main() {
    const options = parseArgs();

    // Get requirement ID
    const reqId = options.reqId || getReqIdFromEnv();
    if (!reqId) {
        const result = { status: 'ERROR', error: 'NO_REQ_ID', message: 'Could not determine requirement ID' };
        if (options.json) {
            outputJson(result);
        } else {
            console.error('ERROR: NO_REQ_ID - Could not determine requirement ID');
            console.error('Use --req-id REQ-XXX or set DEVFLOW_REQ_ID environment variable');
        }
        process.exit(2);
    }

    // Validate skip with reason
    if (options.skip && !options.reason) {
        const result = { status: 'ERROR', error: 'SKIP_REASON_REQUIRED', message: '--reason is required when using --skip' };
        if (options.json) {
            outputJson(result);
        } else {
            console.error('ERROR: SKIP_REASON_REQUIRED');
            console.error('--reason is required when using --skip');
        }
        process.exit(2);
    }

    // Load configuration
    const config = loadConfig();
    const threshold = config.threshold;

    // Get checklists directory
    const reqDir = path.join(REPO_ROOT, 'devflow', 'requirements', reqId);
    const checklistsDir = path.join(reqDir, 'checklists');

    // Calculate completion
    const completion = calculateCompletion(checklistsDir);

    // Handle NO_CHECKLISTS error
    if (completion.error) {
        const result = {
            status: 'NO_CHECKLISTS',
            message: completion.message
        };
        if (options.json) {
            outputJson(result);
        } else {
            outputText(result);
        }
        process.exit(1);
    }

    // Handle skip
    if (options.skip) {
        logGateSkip(reqDir, completion, threshold, options.reason);
        updateOrchestrationStatus(reqDir, completion, true, options.reason);

        const result = {
            status: 'SKIPPED',
            completion: completion.percentage,
            threshold: threshold,
            skip_reason: options.reason,
            audit_logged: true,
            message: `Gate skipped with reason: ${options.reason}`,
            details: {
                total_items: completion.total,
                checked_items: completion.checked,
                checklists: completion.checklists
            }
        };

        if (options.json) {
            outputJson(result);
        } else {
            outputText(result);
        }
        process.exit(0);
    }

    // Check gate
    const passed = completion.percentage >= threshold;
    updateOrchestrationStatus(reqDir, completion, false, null);

    const result = {
        status: passed ? 'PASS' : 'FAIL',
        completion: completion.percentage,
        threshold: threshold,
        details: {
            total_items: completion.total,
            checked_items: completion.checked,
            checklists: completion.checklists
        },
        message: passed
            ? `Checklist completion ${completion.percentage}% >= ${threshold}% threshold`
            : `Checklist completion ${completion.percentage}% < ${threshold}% threshold. Run /flow-checklist --status to review.`
    };

    if (options.json) {
        outputJson(result);
    } else {
        outputText(result);
    }

    process.exit(passed ? 0 : 1);
}

main();
