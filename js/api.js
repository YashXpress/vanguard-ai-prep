// js/api.js
// =============================================================================
// VANGUARD AI — API ORCHESTRATION LAYER
// Data Flow: Module Selection → Prompt Engine → Validator → Response
// =============================================================================
// This layer:
//   1. Receives structured parameters from module forms
//   2. Routes them to the correct PromptEngine builder
//   3. Validates output through Validator
//   4. Returns a clean, validated response object to the Render Engine
//   5. Simulates network latency for UX realism
// =============================================================================

const Api = {

    // Simulated network latency
    delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

    // -------------------------------------------------------------------------
    // INTERNAL: Route to Prompt Engine and validate
    // -------------------------------------------------------------------------
    _buildAndValidate(payload, requestedCount = null, context = '') {
        const result = window.VanguardValidator.validate(payload, requestedCount);
        window.VanguardValidator.logResult(result, context);
        return result;
    },

    // =========================================================================
    // 1. CURRENT AFFAIRS MODULE
    // =========================================================================
    async fetchCurrentAffairs(topic, date, depth, count, user = {}) {
        await this.delay(1100 + Math.random() * 400);

        const safeCount = Math.max(1, Math.min(parseInt(count) || 3, 10));
        const safeTopic = (topic && topic.trim()) ? topic.trim() : 'Indian Defence & Security';
        const safeDate = (date && date.trim()) ? date.trim() : new Date().toISOString().split('T')[0];

        const payload = window.VanguardPromptEngine.buildCurrentAffairsPayload(
            safeTopic, safeCount, depth, safeDate, user
        );

        const validation = this._buildAndValidate(payload, safeCount, 'CURRENT_AFFAIRS');

        return {
            metadata: {
                endpoint: '/api/v1/intelligence/current-affairs',
                status: validation.valid ? 200 : 422,
                count_requested: safeCount,
                count_delivered: payload.items?.length || 0,
                topic: safeTopic,
                depth,
                validated: validation.valid,
                warnings: validation.warnings
            },
            data: validation.valid ? payload : null,
            _validation: validation
        };
    },

    // =========================================================================
    // 2. MCQ GENERATOR MODULE
    // =========================================================================
    async fetchMCQs(topic, difficulty, count, user = {}) {
        await this.delay(1400 + Math.random() * 500);

        const safeCount = Math.max(1, Math.min(parseInt(count) || 5, 30));
        const safeTopic = (topic && topic.trim()) ? topic.trim() : 'General Defence Knowledge';
        const safeDiff = difficulty || 'Standard';

        const payload = window.VanguardPromptEngine.buildMCQPayload(
            safeTopic, safeDiff, safeCount, user
        );

        const validation = this._buildAndValidate(payload, safeCount, 'MCQ');

        return {
            metadata: {
                endpoint: '/api/v1/training/mcq-generator',
                status: validation.valid ? 200 : 422,
                count_requested: safeCount,
                count_delivered: payload.questions?.length || 0,
                topic: safeTopic,
                difficulty: safeDiff,
                validated: validation.valid,
                warnings: validation.warnings
            },
            data: validation.valid ? payload : null,
            _validation: validation
        };
    },

    // =========================================================================
    // 3. SSB SIMULATOR — INIT PHASE
    // =========================================================================
    async startSSBInterview(type, user = {}) {
        await this.delay(700 + Math.random() * 300);

        const payload = window.VanguardPromptEngine.buildSSBInitPayload(type, user);
        const validation = this._buildAndValidate(payload, null, `SSB_INIT(${type})`);

        return {
            metadata: {
                endpoint: '/api/v1/simulation/ssb/init',
                status: validation.valid ? 200 : 422,
                session_type: type,
                validated: validation.valid
            },
            data: validation.valid ? payload : null,
            _validation: validation
        };
    },

    // =========================================================================
    // 4. SSB SIMULATOR — EVALUATE PHASE
    // =========================================================================
    async evaluateSSBAnswer(answer, type, user = {}) {
        await this.delay(1800 + Math.random() * 600);

        if (!answer || !answer.trim()) {
            return {
                metadata: { endpoint: '/api/v1/simulation/ssb/evaluate', status: 400 },
                data: null,
                _validation: { valid: false, errors: ['Empty answer submitted.'], warnings: [] }
            };
        }

        const payload = window.VanguardPromptEngine.buildSSBEvalPayload(answer, type, user);
        const validation = this._buildAndValidate(payload, null, `SSB_EVAL(${type})`);

        return {
            metadata: {
                endpoint: '/api/v1/simulation/ssb/evaluate',
                status: validation.valid ? 200 : 422,
                session_type: type,
                word_count: payload.word_count,
                validated: validation.valid,
                warnings: validation.warnings
            },
            data: validation.valid ? payload : null,
            _validation: validation
        };
    },

    // =========================================================================
    // 5. STUDY PLANNER MODULE
    // =========================================================================
    async generateStudyPlan(exam, hours, weakAreas, user = {}) {
        await this.delay(1600 + Math.random() * 500);

        const safeExam = exam || user?.exam || 'NDA';
        const safeHours = Math.max(1, Math.min(parseInt(hours) || 4, 16));
        const safeWeak = (weakAreas && weakAreas.trim()) ? weakAreas.trim() : 'Core Subjects';

        const payload = window.VanguardPromptEngine.buildStudyPlanPayload(
            safeExam, safeHours, safeWeak, user
        );

        const validation = this._buildAndValidate(payload, null, 'PLANNER');

        return {
            metadata: {
                endpoint: '/api/v1/planning/scheduler',
                status: validation.valid ? 200 : 422,
                exam: safeExam,
                hours: safeHours,
                weak_areas: safeWeak,
                validated: validation.valid,
                warnings: validation.warnings
            },
            data: validation.valid ? payload : null,
            _validation: validation
        };
    }

};

window.VanguardAPI = Api;
