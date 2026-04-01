// js/validator.js
// =============================================================================
// VANGUARD AI — RESPONSE VALIDATION LAYER
// =============================================================================
// Validates all structured outputs from the Prompt Engine before they reach
// the Render Engine. Enforces:
//   • COUNT compliance (exact item count as requested)
//   • Required field presence per module type
//   • Data integrity (no nulls, no empty strings in critical fields)
//   • Fallback handling with specific error reporting
// =============================================================================

const Validator = (() => {

    const REQUIRED_FIELDS = {
        MCQ: {
            root: ['module', 'topic', 'questions', 'count'],
            item: ['id', 'question', 'options', 'correct', 'explanation', 'why_others_wrong'],
            options_keys: ['A', 'B', 'C', 'D']
        },
        CURRENT_AFFAIRS: {
            root: ['module', 'topic', 'items', 'count'],
            item: ['headline', 'explanation', 'importance', 'ssb_angle']
        },
        PLANNER: {
            root: ['module', 'target_exam', 'goal', 'strategy', 'daily_schedule', 'weekly_goals'],
            schedule_item: ['day', 'label', 'am', 'pm', 'evening']
        },
        SSB_INIT: {
            root: ['module', 'session_type', 'pre_flight', 'directive'],
            pre_flight: ['tests', 'approach', 'avoid']
        },
        SSB_EVAL: {
            root: ['module', 'session_type', 'evaluation'],
            eval: ['strengths', 'weaknesses', 'olqs_mapped', 'behavioral_insight', 'improved_answer', 'next_directive', 'final_judgment']
        }
    };

    // -------------------------------------------------------------------------
    // Core validation runner
    // Returns: { valid: bool, errors: string[], warnings: string[], data: obj }
    // -------------------------------------------------------------------------
    const validate = (payload, requestedCount = null) => {
        if (!payload || typeof payload !== 'object') {
            return _fail(['CRITICAL: Payload is null or not an object. Cannot render output.']);
        }

        const moduleType = payload.module;
        if (!moduleType) {
            return _fail(['CRITICAL: Payload missing "module" field — cannot determine render mode.']);
        }

        const errors = [];
        const warnings = [];

        switch (moduleType) {
            case 'MCQ':
                _validateRoot(payload, REQUIRED_FIELDS.MCQ.root, errors);
                if (!Array.isArray(payload.questions)) {
                    errors.push('MCQ: "questions" must be an array.');
                } else {
                    // COUNT enforcement
                    if (requestedCount && payload.questions.length !== requestedCount) {
                        errors.push(`MCQ COUNT VIOLATION: Requested ${requestedCount} questions but received ${payload.questions.length}. Regenerating.`);
                    }
                    if (payload.questions.length === 0) {
                        errors.push('MCQ: questions array is empty — no content to display.');
                    }
                    // Item-level validation
                    payload.questions.forEach((q, i) => {
                        _validateItem(q, REQUIRED_FIELDS.MCQ.item, errors, `MCQ[${i}]`);
                        if (q.options && typeof q.options === 'object') {
                            REQUIRED_FIELDS.MCQ.options_keys.forEach(k => {
                                if (!q.options[k]) errors.push(`MCQ[${i}]: Option "${k}" is missing or empty.`);
                            });
                        }
                        if (q.correct && !['A', 'B', 'C', 'D'].includes(q.correct)) {
                            errors.push(`MCQ[${i}]: "correct" must be A, B, C, or D. Got: "${q.correct}".`);
                        }
                    });
                }
                break;

            case 'CURRENT_AFFAIRS':
                _validateRoot(payload, REQUIRED_FIELDS.CURRENT_AFFAIRS.root, errors);
                if (!Array.isArray(payload.items)) {
                    errors.push('CURRENT_AFFAIRS: "items" must be an array.');
                } else {
                    if (requestedCount && payload.items.length !== requestedCount) {
                        errors.push(`CA COUNT VIOLATION: Requested ${requestedCount} items but received ${payload.items.length}.`);
                    }
                    if (payload.items.length === 0) {
                        errors.push('CURRENT_AFFAIRS: items array is empty — no content to display.');
                    }
                    payload.items.forEach((item, i) => {
                        _validateItem(item, REQUIRED_FIELDS.CURRENT_AFFAIRS.item, errors, `CA_ITEM[${i}]`);
                        if (item.headline && item.headline.trim().length < 10) {
                            warnings.push(`CA_ITEM[${i}]: Headline seems very short. Should be descriptive.`);
                        }
                    });
                }
                break;

            case 'PLANNER':
                _validateRoot(payload, REQUIRED_FIELDS.PLANNER.root, errors);
                if (!Array.isArray(payload.daily_schedule)) {
                    errors.push('PLANNER: "daily_schedule" must be an array.');
                } else {
                    if (payload.daily_schedule.length < 1) {
                        errors.push('PLANNER: daily_schedule is empty — no day plan to display.');
                    }
                    payload.daily_schedule.forEach((day, i) => {
                        _validateItem(day, REQUIRED_FIELDS.PLANNER.schedule_item, errors, `PLAN_DAY[${i}]`);
                    });
                }
                if (!Array.isArray(payload.weekly_goals) || payload.weekly_goals.length === 0) {
                    warnings.push('PLANNER: weekly_goals is empty or missing.');
                }
                break;

            case 'SSB_INIT':
                _validateRoot(payload, REQUIRED_FIELDS.SSB_INIT.root, errors);
                if (payload.pre_flight && typeof payload.pre_flight === 'object') {
                    _validateItem(payload.pre_flight, REQUIRED_FIELDS.SSB_INIT.pre_flight, errors, 'SSB_INIT.pre_flight');
                } else {
                    errors.push('SSB_INIT: "pre_flight" object is missing or malformed.');
                }
                if (!payload.directive || payload.directive.trim().length < 5) {
                    errors.push('SSB_INIT: "directive" is empty or too short.');
                }
                break;

            case 'SSB_EVAL':
                _validateRoot(payload, REQUIRED_FIELDS.SSB_EVAL.root, errors);
                if (payload.evaluation && typeof payload.evaluation === 'object') {
                    _validateItem(payload.evaluation, REQUIRED_FIELDS.SSB_EVAL.eval, errors, 'SSB_EVAL.evaluation');
                    if (!Array.isArray(payload.evaluation.strengths) || payload.evaluation.strengths.length === 0) {
                        errors.push('SSB_EVAL: strengths array is empty or missing.');
                    }
                    if (!Array.isArray(payload.evaluation.weaknesses) || payload.evaluation.weaknesses.length === 0) {
                        errors.push('SSB_EVAL: weaknesses array is empty or missing.');
                    }
                    if (!Array.isArray(payload.evaluation.olqs_mapped) || payload.evaluation.olqs_mapped.length === 0) {
                        errors.push('SSB_EVAL: olqs_mapped array is empty or missing.');
                    }
                    if (payload.evaluation.final_judgment) {
                        const fj = payload.evaluation.final_judgment;
                        if (!['Low', 'Moderate', 'High'].includes(fj.readiness)) {
                            warnings.push(`SSB_EVAL: final_judgment.readiness should be Low/Moderate/High, got: "${fj.readiness}"`);
                        }
                    }
                } else {
                    errors.push('SSB_EVAL: "evaluation" object is missing or malformed.');
                }
                break;

            default:
                errors.push(`UNKNOWN MODULE TYPE: "${moduleType}" — no validation schema available.`);
        }

        if (errors.length > 0) {
            return { valid: false, errors, warnings, data: null };
        }

        return { valid: true, errors: [], warnings, data: payload };
    };

    // -------------------------------------------------------------------------
    // Helper validators
    // -------------------------------------------------------------------------
    const _validateRoot = (obj, fields, errors) => {
        fields.forEach(f => {
            if (obj[f] === undefined || obj[f] === null) {
                errors.push(`ROOT: Required field "${f}" is missing.`);
            }
        });
    };

    const _validateItem = (obj, fields, errors, label) => {
        fields.forEach(f => {
            const val = obj[f];
            if (val === undefined || val === null || val === '') {
                errors.push(`${label}: Required field "${f}" is missing or empty.`);
            }
        });
    };

    const _fail = (errors) => ({ valid: false, errors, warnings: [], data: null });

    // -------------------------------------------------------------------------
    // Render a validation failure card for the output area
    // -------------------------------------------------------------------------
    const buildErrorHTML = (result) => {
        const errHtml = result.errors.map(e => `<li class="text-error" style="margin-bottom:4px;">${e}</li>`).join('');
        const warnHtml = result.warnings.map(w => `<li style="color:var(--color-warning); margin-bottom:4px;">${w}</li>`).join('');
        return `
            <div class="output-card" style="border-left-color: var(--color-error);">
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px;">
                    <span style="font-size:1.2rem;">⚠️</span>
                    <span class="report-heading" style="color:var(--color-error); border-bottom:none; margin:0;">
                        VALIDATION FAILURE — Output Rejected
                    </span>
                </div>
                <p class="text-sm text-muted" style="margin-bottom:10px;">The engine detected an integrity issue. The following errors were found:</p>
                <ul style="padding-left:16px; font-size:0.8rem; font-family:var(--font-mono);">
                    ${errHtml}
                </ul>
                ${warnHtml ? `<div style="margin-top:10px;"><strong class="text-sm" style="color:var(--color-warning);">Warnings:</strong><ul style="padding-left:16px; font-size:0.8rem; font-family:var(--font-mono);">${warnHtml}</ul></div>` : ''}
                <p class="text-sm text-muted" style="margin-top:12px; padding-top:8px; border-top:1px solid var(--color-border);">
                    Action: Adjust your input parameters and try again. If this persists, use the fallback mode.
                </p>
            </div>
        `;
    };

    // -------------------------------------------------------------------------
    // Summary log for dev console
    // -------------------------------------------------------------------------
    const logResult = (result, context = '') => {
        if (result.valid) {
            console.log(`%c[VALIDATOR ✓] ${context} — PASSED`, 'color:#22c55e; font-weight:bold;', result.warnings.length ? `Warnings: ${result.warnings.join('; ')}` : '');
        } else {
            console.error(`[VALIDATOR ✗] ${context} — FAILED`, result.errors);
            if (result.warnings.length) console.warn('[VALIDATOR ⚠] Warnings:', result.warnings);
        }
    };

    return { validate, buildErrorHTML, logResult };

})();

window.VanguardValidator = Validator;
