// js/features.js
// =============================================================================
// VANGUARD AI — RENDER ENGINE & UI CONTROLLER
// Data Flow: API Response → Validation Check → Render Engine → DOM Output
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {

    // =========================================================================
    // AUTHENTICATION & PERSONALIZATION
    // =========================================================================
    let currentUser = null;
    if (window.VanguardAuth) {
        window.VanguardAuth.requireAuth();
        currentUser = window.VanguardAuth.getUser();
    }

    const setupPersonalization = (user) => {
        if (!user) return;
        const welcomeEl = document.getElementById('user-welcome');
        if (!welcomeEl) return;
        const rec = window.VanguardAuth.getRecommendation(user);
        const lastModText = user.lastModule ? user.lastModule.replace('module-', '').toUpperCase() : 'N/A';
        const focusAreaText = user.weakArea || 'Pending Analysis';
        welcomeEl.classList.remove('hidden');
        welcomeEl.innerHTML = `
            <div>
                <h3 style="margin-bottom: 0.2rem; display: flex; align-items: center; gap: 8px;">
                    Welcome back, ${user.name} <span class="status-dot tooltip" style="width: 6px; height: 6px;" title="Online"></span>
                </h3>
                <div class="user-meta-tags mt-sm mb-xs">
                    <span class="tag target">Target: ${user.exam}</span>
                    <span class="tag">Goal: ${user.goal}</span>
                    <span class="tag">Level: ${user.level}</span>
                </div>
                <div class="user-meta-tags mt-sm pt-sm border-top" style="border-top-style: dashed;">
                    <span class="text-xs text-muted" style="text-transform: uppercase;">Recent Activity: </span>
                    <span class="tag" style="color: var(--color-warning); border-color: rgba(245, 158, 11, 0.3);">Last Module: ${lastModText}</span>
                    <span class="tag" style="color: var(--color-error); border-color: rgba(239, 68, 68, 0.3);">Focus Area: ${focusAreaText}</span>
                </div>
            </div>
            <div style="text-align: right; margin-top: 10px; display: flex; flex-direction: column; align-items: flex-end; justify-content: flex-end; gap: 8px;">
                ${user.lastModule
                    ? `<button class="btn btn-outline btn-sm" onclick="document.querySelector('[data-target=\\'${user.lastModule}\\']').click()"><span style="color:var(--color-warning);">⟲</span> Continue Last Activity</button>`
                    : ''}
                <button class="btn btn-primary btn-sm" onclick="document.querySelector('[data-target=\\'${rec.id}\\']').click()">${rec.title} (Recommended)</button>
            </div>
        `;
    };

    const updateProgressionUI = () => {
        const progCard = document.getElementById('progression-overview');
        if (!progCard) return;
        let progData = null;
        try { progData = JSON.parse(localStorage.getItem('vanguard_progression')); } catch(e) {}
        if (progData && progData.attempts > 0) {
            progCard.classList.remove('hidden');
            document.getElementById('prog-count').textContent = progData.attempts;
            if (progData.attempts > 4) {
                document.getElementById('ssb-readiness-val').textContent = '82%';
                document.getElementById('prog-strong-olq').textContent = 'Reasoning Ability';
                document.getElementById('prog-weak-olq').textContent = 'Resource Mgt';
                document.getElementById('prog-trend').textContent = 'Improving';
                document.getElementById('prog-trend').className = 'text-md font-weight-700 text-success';
            } else if (progData.attempts > 2) {
                document.getElementById('ssb-readiness-val').textContent = '74%';
                document.getElementById('prog-strong-olq').textContent = 'Determination';
                document.getElementById('prog-weak-olq').textContent = 'Effective Intel';
                document.getElementById('prog-trend').textContent = 'Tracking';
                document.getElementById('prog-trend').className = 'text-md font-weight-700 text-warning';
            } else {
                document.getElementById('ssb-readiness-val').textContent = '61%';
                document.getElementById('prog-strong-olq').textContent = 'Pending';
                document.getElementById('prog-weak-olq').textContent = 'Pending';
                document.getElementById('prog-trend').textContent = 'Baseline';
                document.getElementById('prog-trend').className = 'text-md font-weight-700';
            }
        }
    };

    if (currentUser) {
        setupPersonalization(currentUser);
        updateProgressionUI();
        if (!localStorage.getItem('hasSeenIntro')) {
            const introHTML = `
              <div id="intro-modal" class="auth-overlay">
                 <div class="auth-modal card fade-in-section is-visible text-center" style="max-width: 400px; padding: 2.5rem 2rem;">
                    <h2 class="text-gradient mb-xs text-center" style="font-size: 2rem;">Engine Initialized</h2>
                    <p class="text-muted mb-md">Your AI Prep System is ready.</p>
                    <div style="text-align: left; background: rgba(0,0,0,0.2); padding: 1.5rem; border-radius: var(--radius-sm); border: 1px solid var(--color-border); margin-bottom: 1.5rem;">
                        <ol style="margin: 0; padding-left: 1.2rem; color: var(--color-text); line-height: 1.8;">
                           <li>Select Module → Enter Topic + Count</li>
                           <li>Prompt Engine generates structured output</li>
                           <li>Validator confirms integrity before render</li>
                        </ol>
                    </div>
                    <button class="btn btn-primary" style="width: 100%;" onclick="document.getElementById('intro-modal').remove(); localStorage.setItem('hasSeenIntro', 'true');">Initialize Training →</button>
                 </div>
              </div>
            `;
            document.body.insertAdjacentHTML('beforeend', introHTML);
        }
    }

    // =========================================================================
    // TOAST NOTIFICATIONS
    // =========================================================================
    const showToast = (msg, type = 'success') => {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerText = msg;
        container.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); }, 3500);
    };

    // =========================================================================
    // OUTPUT STATE MANAGEMENT
    // =========================================================================
    const OutputState = {
        'ca-output': { mode: 'clean', data: null },
        'mcq-output': { mode: 'clean', data: null },
        'ssb-output': { mode: 'clean', data: null },
        'plan-output': { mode: 'clean', data: null }
    };

    // =========================================================================
    // UTILITY BARS
    // =========================================================================
    const setupUtilityBars = () => {
        const containers = { 'ca': 'ca-output-container', 'mcq': 'mcq-output-container', 'ssb': 'ssb-output-container', 'plan': 'plan-output-container' };
        for (const [mod, containerId] of Object.entries(containers)) {
            const container = document.getElementById(containerId);
            if (!container) continue;
            const bar = document.createElement('div');
            bar.className = 'panel-actions hidden';
            bar.id = `${mod}-utility-bar`;
            bar.innerHTML = `
                <div class="action-toggles">
                    <button class="toggle-btn active" onclick="window.VanguardToggle('${mod}-output', 'clean')">Clean View</button>
                    <button class="toggle-btn" onclick="window.VanguardToggle('${mod}-output', 'raw')">Raw JSON</button>
                </div>
                <div class="utility-btns">
                    <button class="btn btn-outline btn-sm" onclick="window.VanguardCopy('${mod}-output')">Copy Output</button>
                    <button class="btn btn-primary btn-sm" onclick="window.VanguardPDF('${mod}-output', '${mod.toUpperCase()}')">Download PDF</button>
                </div>
            `;
            container.insertBefore(bar, document.getElementById(`${mod}-output`));
        }
    };
    setupUtilityBars();

    window.VanguardToggle = (outputId, mode) => {
        if (!OutputState[outputId] || !OutputState[outputId].data) return;
        OutputState[outputId].mode = mode;
        const bar = document.getElementById(outputId.replace('-output', '-utility-bar'));
        if (bar) {
            bar.querySelectorAll('.toggle-btn')[0].classList.toggle('active', mode === 'clean');
            bar.querySelectorAll('.toggle-btn')[1].classList.toggle('active', mode === 'raw');
        }
        renderOutput(outputId, OutputState[outputId].data);
    };

    window.VanguardCopy = (outputId) => {
        const el = document.getElementById(outputId);
        if (!el) return;
        navigator.clipboard.writeText(el.innerText).then(() => showToast('Output copied to clipboard')).catch(() => showToast('Copy failed', 'error'));
    };

    window.VanguardPDF = async (outputId, titleStr) => {
        const el = document.getElementById(outputId);
        if (!el || !window.html2pdf) { showToast('PDF Engine Offline', 'error'); return; }
        if (!el.innerHTML.trim() || el.classList.contains('empty')) { showToast('No content to export', 'error'); return; }

        showToast('Generating PDF...');
        await new Promise(r => setTimeout(r, 900));

        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'padding:20px;font-family:Arial,Helvetica,sans-serif;color:#000;background:#fff;width:100%;';
        wrapper.innerHTML = `
            <h2 style="color:#000;text-align:center;border-bottom:2px solid #ccc;padding-bottom:10px;margin-bottom:6px;">Vanguard AI Prep Report</h2>
            <h4 style="color:#333;text-align:center;margin-bottom:20px;">Module: ${titleStr}</h4>
            <div>${el.innerHTML}</div>
        `;
        wrapper.querySelectorAll('*').forEach(n => {
            n.style.color = '#000';
            n.style.background = 'transparent';
            n.style.webkitTextFillColor = '#000';
            n.style.overflow = 'visible';
            n.style.height = 'auto';
        });
        wrapper.querySelectorAll('.correct-answer').forEach(n => { n.style.color = '#065f46'; n.style.fontWeight = 'bold'; });
        wrapper.querySelectorAll('.report-heading').forEach(n => { n.style.color = '#1e3a5f'; n.style.fontWeight = '700'; });

        html2pdf().set({
            margin: 10, filename: `Vanguard_Report_${titleStr}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, logging: false, scrollY: 0 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        }).from(wrapper).save().then(() => showToast('PDF downloaded')).catch(() => showToast('PDF failed', 'error'));
    };

    // =========================================================================
    // JSON FORMATTER (Raw Mode)
    // =========================================================================
    const formatJSON = (obj) => {
        let json = JSON.stringify(obj, null, 4)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        json = json.replace(/(\"(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*\"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, match => {
            let cls = 'json-number';
            if (/^"/.test(match)) cls = /:$/.test(match) ? 'json-key' : 'json-string';
            else if (/true|false/.test(match)) cls = 'json-boolean';
            else if (/null/.test(match)) cls = 'json-null';
            return `<span class="${cls}">${match}</span>`;
        });
        return `<pre>${json}</pre>`;
    };

    // =========================================================================
    // RENDER ENGINE — Clean HTML generation per module type
    // =========================================================================
    const generateCleanHTML = (responseObj) => {
        // Handle validation failures
        if (!responseObj.data && responseObj._validation) {
            return window.VanguardValidator.buildErrorHTML(responseObj._validation);
        }

        const payload = responseObj.data;
        if (!payload) return `<div class="text-error">Missing payload.</div>`;

        const type = payload.module;
        let html = '';

        // ------------------------------------------------------------------
        // CURRENT AFFAIRS — Renders EXACTLY count items
        // ------------------------------------------------------------------
        if (type === 'CURRENT_AFFAIRS') {
            const meta = responseObj.metadata || {};
            html += `
                <div class="output-meta" style="margin-bottom: var(--space-sm);">
                    TOPIC: ${payload.topic} &nbsp;|&nbsp; DATE: ${payload.date} &nbsp;|&nbsp; DEPTH: ${payload.depth?.toUpperCase()} &nbsp;|&nbsp; 
                    <span style="color: var(--color-success);">ITEMS: ${payload.items?.length || 0}</span>
                    ${meta.warnings?.length ? `<span style="color:var(--color-warning); margin-left:8px;">⚠ ${meta.warnings[0]}</span>` : ''}
                </div>
            `;

            payload.items.forEach((item, idx) => {
                html += `
                    <div class="output-card fade-in-section" style="margin-bottom: var(--space-md);">
                        <div class="output-meta">${idx + 1} / ${payload.items.length} &nbsp;|&nbsp; ${item.date}</div>
                        <div class="output-headline">${item.headline}</div>

                        <div class="evaluation-block" style="margin-top: var(--space-xs);">
                            <span class="report-heading">📋 Explanation</span>
                            <p class="report-text text-muted text-sm">${item.explanation}</p>
                        </div>

                        <div class="evaluation-block">
                            <span class="report-heading" style="color: var(--color-warning);">📌 Exam Importance</span>
                            <p class="report-text text-muted text-sm">${item.importance}</p>
                        </div>

                        <div class="evaluation-block" style="border-left-color: var(--color-primary);">
                            <span class="report-heading" style="color: var(--color-primary);">🎖️ SSB Angle</span>
                            <p class="report-text text-muted text-sm">${item.ssb_angle}</p>
                        </div>
                    </div>
                `;
            });
        }

        // ------------------------------------------------------------------
        // MCQ — Renders EXACTLY count questions with full structured format
        // ------------------------------------------------------------------
        else if (type === 'MCQ') {
            const meta = responseObj.metadata || {};
            html += `
                <div class="output-meta" style="margin-bottom: var(--space-sm);">
                    TOPIC: ${payload.topic} &nbsp;|&nbsp; DIFFICULTY: ${payload.difficulty} &nbsp;|&nbsp;
                    <span style="color: var(--color-success);">QUESTIONS: ${payload.questions?.length || 0}/${payload.count}</span>
                    ${meta.warnings?.length ? `<span style="color:var(--color-warning); margin-left:8px;">⚠ ${meta.warnings[0]}</span>` : ''}
                </div>
            `;

            payload.questions.forEach((q, idx) => {
                html += `
                    <div class="output-card fade-in-section" style="margin-bottom: var(--space-md);">
                        <div class="output-meta">Q${idx + 1} / ${payload.questions.length}</div>
                        <div style="font-weight: 700; font-size: 1rem; margin-bottom: var(--space-sm); line-height: 1.5; color: var(--color-text);">
                            ${q.question}
                        </div>

                        <div style="display: flex; flex-direction: column; gap: 6px; margin-bottom: var(--space-sm);">
                `;
                ['A', 'B', 'C', 'D'].forEach(letter => {
                    const isCorrect = letter === q.correct;
                    if (isCorrect) {
                        html += `<div class="correct-answer">✓ ${letter}: ${q.options[letter]}</div>`;
                    } else {
                        html += `<div style="padding: 6px 10px; color: var(--color-text-muted); border: 1px solid var(--color-border); border-radius: var(--radius-sm); font-size:0.85rem;">${letter}: ${q.options[letter]}</div>`;
                    }
                });
                html += `
                        </div>

                        <div class="evaluation-block" style="margin-top: var(--space-xs);">
                            <span class="report-heading" style="font-size: 0.8rem; color: var(--color-success);">✦ Explanation</span>
                            <p class="text-sm text-muted">${q.explanation}</p>
                        </div>

                        <div class="evaluation-block" style="border-left-color: var(--color-error);">
                            <span class="report-heading" style="font-size: 0.8rem; color: var(--color-error);">✦ Why Others Are Wrong</span>
                            <p class="text-sm text-muted">${q.why_others_wrong}</p>
                        </div>
                    </div>
                `;
            });

            // Summary block
            const totalQ = payload.questions.length;
            const diffLabel = payload.difficulty === 'Hard' ? 'Advanced (CDS/AFCAT)' : 'Standard (NDA)';
            html += `
                <div class="evaluation-block fade-in-section mt-md" style="border: 1px solid var(--color-border); border-left: 4px solid var(--color-primary); background: rgba(0,0,0,0.1); padding: 15px; border-radius: 4px;">
                    <span class="report-heading" style="border-bottom:none; color: var(--color-primary); text-transform: uppercase;">Evaluative Overview</span>
                    <div style="display:flex; gap: 20px; flex-wrap: wrap; margin-top: 8px;">
                        <div><span class="text-sm text-muted">Questions Delivered:</span> <strong style="color:var(--color-text);">${totalQ} / ${payload.count}</strong></div>
                        <div><span class="text-sm text-muted">Difficulty:</span> <strong style="color:var(--color-text);">${diffLabel}</strong></div>
                        <div><span class="text-sm text-muted">Topic Coverage:</span> <strong style="color:var(--color-text);">${payload.topic}</strong></div>
                    </div>
                </div>
            `;
        }

        // ------------------------------------------------------------------
        // SSB EVAL — Full OLQ behavioral assessment output
        // ------------------------------------------------------------------
        else if (type === 'SSB_EVAL') {
            const ev = payload.evaluation;
            const fj = ev.final_judgment || {};
            const readinessColors = { High: 'var(--color-success)', Moderate: 'var(--color-warning)', Low: 'var(--color-error)' };
            const readinessLabels = { High: 'RECOMMENDED', Moderate: 'NEEDS DEVELOPMENT', Low: 'NOT YET READY' };
            const rdColor = readinessColors[fj.readiness] || 'var(--color-text-muted)';
            const rdLabel = readinessLabels[fj.readiness] || fj.readiness;

            html += `
                <div class="output-card" style="border-left-color: ${rdColor};">
                    <div class="flex-between align-center mb-sm">
                        <h4 class="text-gradient" style="margin: 0; font-size: 1.2rem;">Psychological Assessment Report</h4>
                        ${fj.ai_confidence ? `<span class="badge" style="background:rgba(0,119,255,0.1); color:var(--color-primary); font-weight:700;">AI Confidence: ${fj.ai_confidence}</span>` : ''}
                    </div>

                    <!-- Session Info -->
                    <div class="output-meta" style="margin-bottom: var(--space-sm);">
                        SESSION TYPE: ${payload.session_type} &nbsp;|&nbsp; RESPONSE: ${payload.word_count} WORDS
                    </div>

                    <!-- OLQ Tags -->
                    <div style="margin-bottom: var(--space-sm);">
                        <span class="report-heading" style="font-size:0.75rem; border-bottom:none; margin-bottom: 6px;">OLQ MAPPING</span>
                        <div>${ev.olqs_mapped.map(olq => {
                            const isWeak = olq.toLowerCase().includes('lacking') || olq.toLowerCase().includes('low') || olq.toLowerCase().includes('not demonstrable');
                            return `<span class="olq-tag ${isWeak ? 'weak' : ''}">${olq}</span>`;
                        }).join('')}</div>
                    </div>

                    <!-- Behavioral Insight -->
                    ${ev.behavioral_insight ? `
                    <div class="evaluation-block mb-sm" style="border-left-color: var(--color-accent); padding: var(--space-xs) 0 var(--space-xs) var(--space-sm); border-left-width: 3px;">
                        <span class="report-heading" style="font-size:0.8rem;">🧠 Behavioral Pattern Analysis</span>
                        <p class="text-sm text-muted">${ev.behavioral_insight}</p>
                    </div>` : ''}

                    <!-- Strengths / Weaknesses -->
                    <div class="grid grid-2" style="gap: 12px; margin-bottom: var(--space-sm);">
                        <div style="padding: 12px; border-left: 3px solid var(--color-success); background: rgba(34,197,94,0.03); border-radius: 0 var(--radius-sm) var(--radius-sm) 0;">
                            <strong style="display:block; margin-bottom: 6px; font-size:0.75rem; text-transform:uppercase; color:var(--color-success);">✓ Strengths</strong>
                            <ul style="padding-left: 14px; margin: 0; font-size: 0.82rem; color: var(--color-text-muted);">
                                ${ev.strengths.map(s => `<li style="margin-bottom:4px;">${s}</li>`).join('')}
                            </ul>
                        </div>
                        <div style="padding: 12px; border-left: 3px solid var(--color-error); background: rgba(239,68,68,0.03); border-radius: 0 var(--radius-sm) var(--radius-sm) 0;">
                            <strong style="display:block; margin-bottom: 6px; font-size:0.75rem; text-transform:uppercase; color:var(--color-error);">✗ Development Areas</strong>
                            <ul style="padding-left: 14px; margin: 0; font-size: 0.82rem; color: var(--color-text-muted);">
                                ${ev.weaknesses.map(w => `<li style="margin-bottom:4px;">${w}</li>`).join('')}
                            </ul>
                        </div>
                    </div>

                    <!-- Final Verdict -->
                    <div class="evaluation-block fade-in-section" style="border: 1px solid ${rdColor}; border-left: 4px solid ${rdColor}; background: var(--color-bg); padding: 14px; border-radius: 4px; margin-bottom: var(--space-sm);">
                        <span class="report-heading" style="text-transform: uppercase; color: ${rdColor}; border-bottom: none; margin-bottom: 10px; font-size: 1.05rem; display:block;">
                            Final Verdict: ${rdLabel}
                        </span>
                        <div class="grid grid-2" style="gap: 8px; margin-bottom: 10px;">
                            <div><span class="text-muted text-sm">AI Confidence:</span> <strong style="color:${rdColor};">${fj.ai_confidence || 'N/A'}</strong></div>
                            <div><span class="text-muted text-sm">Risk Factor:</span> <strong>${fj.risk_factor || 'N/A'}</strong></div>
                        </div>
                        <div style="padding-top:8px; border-top:1px solid rgba(255,255,255,0.05);">
                            <span class="text-muted text-sm" style="display:block;">Required Action:</span>
                            <strong class="text-sm">${fj.action || 'Continue practice.'}</strong>
                        </div>
                    </div>

                    <!-- Improvement Reference -->
                    <div class="evaluation-block" style="border-left-color: var(--color-primary);">
                        <span class="report-heading text-accent">🎯 Structural Improvement Reference</span>
                        <p class="text-sm" style="font-style:italic; color: var(--color-text);">"${ev.improved_answer}"</p>
                    </div>
                </div>
            `;
        }

        // ------------------------------------------------------------------
        // STUDY PLANNER — Day-wise structured output
        // ------------------------------------------------------------------
        else if (type === 'PLANNER') {
            html += `
                <div class="output-card">
                    <div class="output-headline">${payload.target_exam} — Strategic Preparation Roadmap</div>
                    <div class="output-meta">${payload.commitment}</div>

                    <!-- Goal & Strategy -->
                    <div class="evaluation-block" style="margin-top: var(--space-xs);">
                        <span class="report-heading">🎯 Mission Goal</span>
                        <p class="text-sm text-muted">${payload.goal}</p>
                    </div>

                    <div class="evaluation-block">
                        <span class="report-heading">📐 Core Strategy</span>
                        <p class="text-sm text-muted">${payload.strategy}</p>
                        <div style="margin-top: 8px; display:flex; flex-wrap:wrap; gap:8px;">
                            <div><strong class="text-sm" style="color:var(--color-warning);">Focus Areas:</strong> <span class="text-muted text-sm">${payload.focus_area}</span></div>
                        </div>
                        <div style="margin-top: 6px;">
                            <strong class="text-sm text-success">Expected Outcome:</strong> <span class="text-muted text-sm">${payload.expected_outcome}</span>
                        </div>
                    </div>

                    <!-- Day-by-Day Plan -->
                    <span class="report-heading mt-sm" style="margin-bottom: var(--space-xs);">📅 Day-Wise Breakdown</span>
                    <div style="display:flex; flex-direction:column; gap: var(--space-xs);">
            `;
            payload.daily_schedule.forEach(day => {
                html += `
                    <div class="plan-day-card fade-in-section">
                        <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px; border-bottom:1px dashed var(--color-border); padding-bottom:8px;">
                            <span style="background:var(--color-primary); color:#000; font-weight:800; font-size:0.75rem; padding:2px 8px; border-radius:3px; font-family:var(--font-mono);">DAY ${day.day}</span>
                            <strong style="font-size:0.92rem; color:var(--color-text);">${day.label}</strong>
                        </div>
                        <div style="display:flex; flex-direction:column; gap:8px; font-size:0.82rem;">
                            <div style="display:flex; gap:8px;">
                                <span style="color:var(--color-warning); font-weight:700; min-width:60px; font-family:var(--font-mono); font-size:0.7rem;">MORNING</span>
                                <span class="text-muted">${day.am}</span>
                            </div>
                            <div style="display:flex; gap:8px;">
                                <span style="color:var(--color-primary); font-weight:700; min-width:60px; font-family:var(--font-mono); font-size:0.7rem;">MIDDAY</span>
                                <span class="text-muted">${day.pm}</span>
                            </div>
                            <div style="display:flex; gap:8px;">
                                <span style="color:var(--color-success); font-weight:700; min-width:60px; font-family:var(--font-mono); font-size:0.7rem;">EVENING</span>
                                <span class="text-muted">${day.evening}</span>
                            </div>
                        </div>
                    </div>
                `;
            });
            html += `
                    </div>

                    <!-- Weekly Goals -->
                    <div style="margin-top: var(--space-md); padding-top: var(--space-sm); border-top: 1px solid var(--color-border);">
                        <span class="report-heading">🏆 Weekly Milestones</span>
                        <ul style="padding-left: 16px; margin: 0; font-size: 0.85rem; color: var(--color-text-muted);">
                            ${payload.weekly_goals.map(g => `<li style="margin-bottom:6px;">${g}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            `;
        }

        return html || `<div class="text-error">No render handler for module type: ${type}</div>`;
    };

    // =========================================================================
    // RENDER DISPATCHER
    // =========================================================================
    const renderOutput = (outputId, responseObj) => {
        const el = document.getElementById(outputId);
        if (!el) return;
        OutputState[outputId].data = responseObj;
        const mode = OutputState[outputId].mode;
        el.classList.remove('empty');
        const utilBar = document.getElementById(outputId.replace('-output', '-utility-bar'));
        if (utilBar) utilBar.classList.remove('hidden');
        el.innerHTML = mode === 'raw' ? formatJSON(responseObj) : generateCleanHTML(responseObj);
        if (window.VanguardObserver) {
            el.querySelectorAll('.fade-in-section:not(.is-visible)').forEach(el => window.VanguardObserver.observe(el));
        }
    };

    // =========================================================================
    // HELPERS
    // =========================================================================
    const getLoadingHTML = (label) => `
        <div class="futuristic-loader-container">
            <div class="hex-spinner"></div>
            <div class="loader-text">${label}<span class="loader-dots"></span></div>
        </div>
    `;

    const toggleBtn = (btnId, loading, originalText = 'Execute') => {
        const btn = document.getElementById(btnId);
        if (!btn) return;
        if (loading) { btn.innerHTML = `<span class="loader" style="width:14px;height:14px;border-width:2px;"></span> Processing`; btn.disabled = true; }
        else { btn.innerHTML = originalText; btn.disabled = false; }
    };

    const showLoading = (outputId, utilBarId, label) => {
        const el = document.getElementById(outputId);
        const bar = document.getElementById(utilBarId);
        if (el) { el.innerHTML = getLoadingHTML(label); el.classList.remove('empty'); el.classList.add('active-processing'); }
        if (bar) bar.classList.add('hidden');
    };

    const hideLoading = (outputId) => {
        const el = document.getElementById(outputId);
        if (el) el.classList.remove('active-processing');
    };

    // =========================================================================
    // DASHBOARD TAB SWITCHING
    // =========================================================================
    const moduleItems = document.querySelectorAll('.module-item');
    const panels = document.querySelectorAll('.panel-wrapper');

    const switchModule = (targetId) => {
        moduleItems.forEach(item => item.classList.toggle('active', item.dataset.target === targetId));
        panels.forEach(panel => {
            if (panel.id === targetId) { panel.classList.remove('hidden'); panel.classList.add('active'); }
            else { panel.classList.add('hidden'); panel.classList.remove('active'); }
        });
        const modeMap = {
            'module-ca': 'CURRENT AFFAIRS STREAM',
            'module-mcq': 'MCQ SYNTHESIZER',
            'module-ssb': 'SSB IO SIMULATION',
            'module-plan': 'STRATEGIC CALCULATION'
        };
        const topMode = document.getElementById('top-bar-mode');
        if (topMode && modeMap[targetId]) topMode.innerHTML = `ANALYSIS MODE: <span style="color:#fff">${modeMap[targetId]}</span>`;

        if (window.VanguardAuth && targetId && !targetId.includes('undefined')) {
            window.VanguardAuth.updatePreference('lastModule', targetId);
            const updatedUser = window.VanguardAuth.getUser();
            if (updatedUser) setupPersonalization(updatedUser);
        }
    };

    moduleItems.forEach(item => {
        item.addEventListener('click', () => {
            if (item.dataset.target) {
                switchModule(item.dataset.target);
                const url = new URL(window.location);
                url.searchParams.set('module', item.dataset.target.replace('module-', ''));
                window.history.pushState({}, '', url);
            }
        });
    });

    const urlParams = new URLSearchParams(window.location.search);
    const moduleParam = urlParams.get('module');
    if (moduleParam && document.getElementById(`module-${moduleParam}`)) {
        switchModule(`module-${moduleParam}`);
    } else if (currentUser?.lastModule) {
        switchModule(currentUser.lastModule);
    }

    // =========================================================================
    // FORM VALIDATION
    // =========================================================================
    const validateForm = (formId) => {
        const form = document.getElementById(formId);
        if (!form) return false;
        for (let input of form.querySelectorAll('[required]')) {
            if (!input.value.trim()) { showToast('Required fields missing', 'error'); return false; }
        }
        return true;
    };

    // =========================================================================
    // MODULE 1: CURRENT AFFAIRS
    // =========================================================================
    const caForm = document.getElementById('ca-form');
    if (caForm) {
        caForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!validateForm('ca-form')) return;

            const topicVal = document.getElementById('ca-topic')?.value || '';
            const dateVal = document.getElementById('ca-date')?.value || '';
            const depthVal = document.getElementById('ca-depth')?.value || 'summary';
            const countVal = document.getElementById('ca-count')?.value || '3';

            toggleBtn('ca-btn', true);
            showLoading('ca-output', 'ca-utility-bar', `Aggregating ${countVal} Intelligence Items`);

            try {
                const res = await window.VanguardAPI.fetchCurrentAffairs(topicVal, dateVal, depthVal, countVal, currentUser || {});
                hideLoading('ca-output');
                if (!res.data && res._validation) {
                    document.getElementById('ca-output').innerHTML = window.VanguardValidator.buildErrorHTML(res._validation);
                    showToast('Output validation failed', 'error');
                } else {
                    renderOutput('ca-output', res);
                    showToast(`${res.data.items.length} items aggregated`);
                }
            } catch (err) {
                document.getElementById('ca-output').innerHTML = `<span class="text-error">Engine Error: ${err.message}</span>`;
                showToast('Engine error', 'error');
            } finally {
                toggleBtn('ca-btn', false, 'Execute Query');
            }
        });
    }

    // =========================================================================
    // MODULE 2: MCQ GENERATOR
    // =========================================================================
    const mcqForm = document.getElementById('mcq-form');
    if (mcqForm) {
        mcqForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!validateForm('mcq-form')) return;

            const topicVal = document.getElementById('mcq-topic').value;
            const diffVal = document.getElementById('mcq-difficulty').value;
            const countVal = document.getElementById('mcq-count').value;

            toggleBtn('mcq-btn', true);
            showLoading('mcq-output', 'mcq-utility-bar', `Synthesizing ${countVal} Questions`);

            try {
                const res = await window.VanguardAPI.fetchMCQs(topicVal, diffVal, countVal, currentUser || {});
                hideLoading('mcq-output');
                if (!res.data && res._validation) {
                    document.getElementById('mcq-output').innerHTML = window.VanguardValidator.buildErrorHTML(res._validation);
                    showToast('Output validation failed', 'error');
                } else {
                    renderOutput('mcq-output', res);
                    showToast(`${res.data.questions.length} MCQs synthesized`);
                }
            } catch (err) {
                document.getElementById('mcq-output').innerHTML = `<span class="text-error">Engine Error: ${err.message}</span>`;
                showToast('Engine error', 'error');
            } finally {
                toggleBtn('mcq-btn', false, 'Synthesize Database');
            }
        });
    }

    // =========================================================================
    // MODULE 3: SSB SIMULATOR
    // =========================================================================
    const ssbStartBtn = document.getElementById('ssb-start-btn');
    const ssbForm = document.getElementById('ssb-form');
    let ssbCurrentType = 'PI';

    if (ssbStartBtn && ssbForm) {
        ssbStartBtn.addEventListener('click', async () => {
            const typeSel = document.getElementById('ssb-type');
            if (!typeSel) return;
            ssbCurrentType = typeSel.value;
            toggleBtn('ssb-start-btn', true);
            showLoading('ssb-output', 'ssb-utility-bar', 'Initializing IO Model');

            try {
                const res = await window.VanguardAPI.startSSBInterview(ssbCurrentType, currentUser || {});
                hideLoading('ssb-output');

                if (!res.data) {
                    document.getElementById('ssb-output').innerHTML = window.VanguardValidator.buildErrorHTML(res._validation);
                    toggleBtn('ssb-start-btn', false, 'Connect Model');
                    return;
                }

                const p = res.data.pre_flight;
                document.getElementById('ssb-mode-tests').innerText = p.tests;
                document.getElementById('ssb-mode-approach').innerText = p.approach;
                document.getElementById('ssb-mode-avoid').innerText = p.avoid;
                document.getElementById('ssb-thinking-mode').classList.remove('hidden');
                document.getElementById('ssb-question-display').textContent = res.data.directive;
                ssbStartBtn.parentElement.classList.add('hidden');
                ssbForm.classList.remove('hidden');
                document.getElementById('ssb-output').innerHTML = `
                    <div class="text-center" style="margin-top: 40px; color: var(--color-text-muted);">
                        <div style="font-size:1.5rem; margin-bottom:8px;">🎖️</div>
                        <div class="text-sm font-mono" style="text-transform:uppercase; letter-spacing:2px;">IO Model Connected</div>
                        <div class="text-sm text-muted" style="margin-top:4px;">Awaiting candidate response...</div>
                    </div>
                `;
                document.getElementById('ssb-output').classList.add('empty');
                showToast('IO Model Connected');
            } catch (err) {
                document.getElementById('ssb-output').innerHTML = `<span class="text-error">Error: ${err.message}</span>`;
                toggleBtn('ssb-start-btn', false, 'Connect Model');
            }
        });

        ssbForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!validateForm('ssb-form')) return;
            const answer = document.getElementById('ssb-answer').value;

            toggleBtn('ssb-submit-btn', true);
            showLoading('ssb-output', 'ssb-utility-bar', 'AI is analysing your response');

            const stages = ['Mapping behavioral patterns...', 'Cross-referencing OLQ indicators...', 'Finalizing psychological assessment...'];
            let si = 0;
            const cycleInterval = setInterval(() => {
                const textEl = document.getElementById('ssb-output')?.querySelector('.loader-text');
                if (textEl) { si = (si + 1) % stages.length; textEl.innerHTML = `${stages[si]}<span class="loader-dots"></span>`; }
            }, 800);

            try {
                const res = await window.VanguardAPI.evaluateSSBAnswer(answer, ssbCurrentType, currentUser || {});
                clearInterval(cycleInterval);
                hideLoading('ssb-output');

                if (!res.data && res._validation) {
                    document.getElementById('ssb-output').innerHTML = window.VanguardValidator.buildErrorHTML(res._validation);
                    showToast('Evaluation failed', 'error');
                } else {
                    renderOutput('ssb-output', res);
                    showToast('Response evaluated');
                    document.getElementById('ssb-question-display').textContent = res.data.evaluation.next_directive;
                    document.getElementById('ssb-answer').value = '';
                    updateProgressionUI();

                    if (window.VanguardAuth && res.data.evaluation.weaknesses?.length > 0) {
                        window.VanguardAuth.updatePreference('weakArea', res.data.evaluation.weaknesses[0]);
                        setupPersonalization(window.VanguardAuth.getUser());
                    }
                }
            } catch (err) {
                clearInterval(cycleInterval);
                document.getElementById('ssb-output').innerHTML = `<span class="text-error">Network Error</span>`;
                showToast('Evaluation failed', 'error');
            } finally {
                toggleBtn('ssb-submit-btn', false, 'Submit Response');
            }
        });
    }

    // =========================================================================
    // MODULE 4: STUDY PLANNER
    // =========================================================================
    const planForm = document.getElementById('plan-form');
    if (planForm) {
        planForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!validateForm('plan-form')) return;

            const exam = document.getElementById('plan-exam').value;
            const hours = document.getElementById('plan-hours').value;
            const weak = document.getElementById('plan-weak').value;

            toggleBtn('plan-btn', true);
            showLoading('plan-output', 'plan-utility-bar', 'Calculating 7-Day Schedule Matrix');

            try {
                const res = await window.VanguardAPI.generateStudyPlan(exam, hours, weak, currentUser || {});
                hideLoading('plan-output');
                if (!res.data && res._validation) {
                    document.getElementById('plan-output').innerHTML = window.VanguardValidator.buildErrorHTML(res._validation);
                    showToast('Plan generation failed', 'error');
                } else {
                    renderOutput('plan-output', res);
                    showToast('7-day strategy matrix compiled');
                    if (window.VanguardAuth && weak) {
                        window.VanguardAuth.updatePreference('weakArea', weak);
                        setupPersonalization(window.VanguardAuth.getUser());
                    }
                }
            } catch (err) {
                document.getElementById('plan-output').innerHTML = `<span class="text-error">Engine Error: ${err.message}</span>`;
                showToast('Engine error', 'error');
            } finally {
                toggleBtn('plan-btn', false, 'Compile Strategy');
            }
        });
    }

});
