// js/features.js

document.addEventListener('DOMContentLoaded', () => {

    // --- AUTHENTICATION & PERSONALIZATION ---
    let currentUser = null;
    if(window.VanguardAuth) {
        window.VanguardAuth.requireAuth(); 
        currentUser = window.VanguardAuth.getUser();
    }

    const setupPersonalization = (user) => {
        if(!user) return;
        const welcomeEl = document.getElementById('user-welcome');
        if(!welcomeEl) return;
        
        const rec = window.VanguardAuth.getRecommendation(user);
        
        welcomeEl.classList.remove('hidden');
        welcomeEl.innerHTML = `
            <div>
                <h3 style="margin-bottom: 0.2rem; display: flex; align-items: center; gap: 8px;">
                    Welcome back, ${user.name} <span class="status-dot tooltip" style="width: 6px; height: 6px;" title="Online"></span>
                </h3>
                <div class="user-meta-tags mt-sm">
                    <span class="tag target">Target: ${user.exam}</span>
                    <span class="tag">Focus: ${user.goal}</span>
                    <span class="tag">Level: ${user.level}</span>
                </div>
            </div>
            <div style="text-align: right; margin-top: 10px;">
                ${user.lastModule ? 
                  `<div class="text-sm text-muted mb-xs">Continue preparing:</div>
                   <button class="btn btn-outline btn-sm" onclick="document.querySelector('[data-target=\\'${user.lastModule}\\']').click()">Launch Last Module &rarr;</button>` 
                  : 
                  `<div class="text-sm text-muted mb-xs">Recommended for you:</div>
                   <button class="btn btn-primary btn-sm" onclick="document.querySelector('[data-target=\\'${rec.id}\\']').click()">${rec.title} &rarr;</button>
                   <div class="text-xs text-muted mt-xs" style="font-size: 0.65rem; max-width: 200px; margin-left: auto;">${rec.reason}</div>`
                }
            </div>
        `;
    };

    if(currentUser) setupPersonalization(currentUser);

    // --- TOAST NOTIFICATIONS ---
    const showToast = (msg, type = 'success') => {
        const container = document.getElementById('toast-container');
        if(!container) return;
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerText = msg;
        container.appendChild(toast);
        // Animate in
        setTimeout(() => toast.classList.add('show'), 10);
        // Remove after 3s
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    };

    // --- UTILITIES & TOGGLES ---
    // Global state for outputs
    const OutputState = {
        'ca-output': { mode: 'clean', data: null },
        'mcq-output': { mode: 'clean', data: null },
        'ssb-output': { mode: 'clean', data: null },
        'plan-output': { mode: 'clean', data: null }
    };

    const setupUtilityBars = () => {
        const containers = {
            'ca': 'ca-output-container',
            'mcq': 'mcq-output-container',
            'ssb': 'ssb-output-container',
            'plan': 'plan-output-container'
        };

        for (const [mod, containerId] of Object.entries(containers)) {
            const container = document.getElementById(containerId);
            if(!container) continue;
            
            // Create Utility Bar
            const bar = document.createElement('div');
            bar.className = 'panel-actions hidden'; // hidden until data exists
            bar.id = `${mod}-utility-bar`;
            bar.innerHTML = `
                <div class="action-toggles">
                    <button class="toggle-btn active" onclick="window.VanguardToggle('${mod}-output', 'clean')">Clean View</button>
                    <button class="toggle-btn" onclick="window.VanguardToggle('${mod}-output', 'raw')">Raw JSON</button>
                </div>
                <div class="utility-btns">
                    <button class="btn btn-outline btn-sm" onclick="window.VanguardCopy('${mod}-output')">Copy</button>
                    <button class="btn btn-primary btn-sm" onclick="window.VanguardPDF('${mod}-output', '${mod.toUpperCase()}')">Export PDF</button>
                </div>
            `;
            // Insert before the output area
            container.insertBefore(bar, document.getElementById(`${mod}-output`));
        }
    };
    setupUtilityBars();

    // Export Toggles & Utilities to window so inline onclicks can reach them
    window.VanguardToggle = (outputId, mode) => {
        if(!OutputState[outputId].data) return;
        OutputState[outputId].mode = mode;
        
        // Update button states
        const bar = document.getElementById(outputId.replace('-output', '-utility-bar'));
        if(bar) {
            const btns = bar.querySelectorAll('.toggle-btn');
            btns[0].classList.toggle('active', mode === 'clean');
            btns[1].classList.toggle('active', mode === 'raw');
        }
        
        // Re-render
        renderOutput(outputId, OutputState[outputId].data);
    };

    window.VanguardCopy = (outputId) => {
        const el = document.getElementById(outputId);
        if(!el) return;
        const text = el.innerText;
        navigator.clipboard.writeText(text).then(() => {
            showToast('Output copied successfully');
        }).catch(() => {
            showToast('Failed to copy', 'error');
        });
    };

    window.VanguardPDF = (outputId, titleStr) => {
        const el = document.getElementById(outputId);
        if(!el || !window.html2pdf) {
            showToast('PDF Export Engine Offline', 'error');
            return;
        }
        showToast('Generating PDF sequence...');
        
        // Create a clone to cleanly format without utility bars inside if any existed
        const wrapper = document.createElement('div');
        wrapper.style.padding = '20px';
        wrapper.innerHTML = `
            <h2 style="color: #000; text-align: center; font-family: sans-serif; border-bottom: 2px solid #ccc; padding-bottom: 10px;">Vanguard AI Prep Report</h2>
            <h4 style="color: #444; text-align: center; font-family: sans-serif; margin-bottom: 20px;">Module: ${titleStr}</h4>
            <div style="color: #000; font-family: sans-serif;">
                ${el.innerHTML}
            </div>
        `;

        const opt = {
          margin:       0.5,
          filename:     `Vanguard_Report_${titleStr}.pdf`,
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { scale: 2 },
          jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(wrapper).save().then(() => {
            showToast('PDF Downloaded successfully');
        });
    };

    // --- STRUCTURED HTML ENGINE ---

    // JSON Highlighter Helper
    const formatJSON = (jsonObj) => {
        let json = JSON.stringify(jsonObj, undefined, 4);
        json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const highlighted = json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
            let cls = 'json-number';
            if (/^"/.test(match)) {
                if (/:$/.test(match)) { cls = 'json-key'; } else { cls = 'json-string'; }
            } else if (/true|false/.test(match)) { cls = 'json-boolean'; } else if (/null/.test(match)) { cls = 'json-null'; }
            return '<span class="' + cls + '">' + match + '</span>';
        });
        return `<pre>${highlighted}</pre>`; 
    };

    const generateCleanHTML = (dataObj) => {
        const payload = dataObj.data;
        if(!payload) return `<div class="text-error">Missing payload data</div>`;
        const type = payload.module;
        let html = '';

        if(type === 'CURRENT_AFFAIRS') {
            html += `<div class="output-card">`;
            html += `<div class="output-meta">Intel Sourced: ${payload.date}</div>`;
            html += `<div class="output-headline">${payload.headline}</div>`;
            html += `<div class="evaluation-block">`;
            payload.key_points.forEach(pt => html += `<span class="report-bullet report-text">${pt}</span>`);
            html += `</div>`;
            html += `<span class="report-heading">Strategic Importance</span>`;
            html += `<div class="report-text text-muted" style="border-left: 2px solid var(--color-accent); padding-left: 10px;">${payload.why_it_matters}</div>`;
            
            if(payload.mcqs && payload.mcqs.length > 0) {
                html += `<span class="report-heading mt-sm">Potential MCQs</span>`;
                payload.mcqs.forEach(m => {
                    html += `<div style="background: rgba(0,0,0,0.2); padding: 10px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.05);">`;
                    html += `<strong style="display:block; margin-bottom: 8px;">Q: ${m.question}</strong>`;
                    for(const [k, v] of Object.entries(m.options)) {
                        html += `<div>${k}: ${v}</div>`;
                    }
                    html += `<div class="correct-answer mt-xs">Correct: Option ${m.correct}</div>`;
                    if(m.explanation) html += `<div class="text-sm text-muted"><strong>Exp:</strong> ${m.explanation}</div>`;
                    html += `</div>`;
                });
            }
            html += `</div>`;
        } 
        else if (type === 'MCQ') {
            html += `<div class="output-meta mb-sm">Topic: ${payload.topic} | Level: ${payload.difficulty}</div>`;
            payload.questions.forEach((q, idx) => {
                html += `<div class="output-card">
                            <strong style="display:block; margin-bottom: 10px; font-size: 1.05rem;">Q${idx+1}: ${q.question}</strong>`;
                for(const [k, v] of Object.entries(q.options)) {
                    const isCorrect = k === q.correct;
                    if(isCorrect) {
                        html += `<div class="correct-answer">${k}: ${v} (Correct)</div>`;
                    } else {
                        html += `<div style="padding: 4px 8px; color: var(--color-text-muted);">${k}: ${v}</div>`;
                    }
                }
                html += `<div class="evaluation-block" style="margin-top: 10px;">
                            <span class="report-heading" style="font-size: 0.85rem">Evaluator's Note</span>
                            <div class="text-sm text-muted">${q.explanation}</div>
                         </div>
                         </div>`;
            });
        }
        else if (type === 'SSB_EVAL') {
            const ev = payload.evaluation;
            html += `<div class="output-card" style="border-color: var(--color-success);">
                        <h4 class="text-gradient" style="margin-bottom: 15px;">Psychological Evaluation mapped</h4>`;
            
            // OLQs
            html += `<div style="margin-bottom: 15px;">`;
            ev.olqs_mapped.forEach(olq => {
                const weak = olq.includes("Lacking") ? "weak" : "";
                html += `<span class="olq-tag ${weak}">${olq}</span>`;
            });
            html += `</div>`;

            // S / W
            html += `<div class="grid grid-2" style="gap: 15px; margin-bottom: 15px;">
                        <div style="background: rgba(16, 185, 129, 0.05); padding: 10px; border-left: 2px solid var(--color-success);">
                            <strong class="text-success text-sm" style="display:block; margin-bottom: 5px; text-transform:uppercase;">Strengths</strong>
                            <ul style="padding-left: 15px; margin: 0; font-size: 0.85rem;" class="text-muted">
                                ${ev.strengths.map(s => `<li>${s}</li>`).join('')}
                            </ul>
                        </div>
                        <div style="background: rgba(239, 68, 68, 0.05); padding: 10px; border-left: 2px solid var(--color-error);">
                            <strong class="text-error text-sm" style="display:block; margin-bottom: 5px; text-transform:uppercase;">Weaknesses</strong>
                            <ul style="padding-left: 15px; margin: 0; font-size: 0.85rem;" class="text-muted">
                                ${ev.weaknesses.map(w => `<li>${w}</li>`).join('')}
                            </ul>
                        </div>
                    </div>`;
            
            // Improvement
            html += `<div class="evaluation-block">
                        <span class="report-heading text-accent">Structural Improvement</span>
                        <div class="text-sm">"${ev.improved_answer}"</div>
                     </div>
                     </div>`;
        }
        else if (type === 'PLANNER') {
            html += `<div class="output-card">
                        <div class="output-headline">Strategic Roadmap: ${payload.target_exam}</div>
                        <div class="output-meta">Commitment: ${payload.commitment}</div>
                        
                        <div class="evaluation-block">
                            <span class="report-heading">Core Strategy</span>
                            <p class="text-muted text-sm">${payload.strategy}</p>
                        </div>
                        
                        <span class="report-heading mt-sm mb-sm">Daily Schedule Iteration</span>
                        <div class="grid grid-2">`;
            
            payload.daily_schedule.forEach(block => {
                html += `<div class="plan-day-card">
                            <strong style="color:var(--color-accent); font-size: 0.9rem; margin-bottom: 4px; display:block;">${block.block} (${block.duration})</strong>
                            <ul style="padding-left: 15px; margin: 0; font-size: 0.8rem;" class="text-muted">
                                ${block.tasks.map(t => `<li>${t}</li>`).join('')}
                            </ul>
                         </div>`;
            });
            
            html += `   </div>
                        <div class="mt-sm pt-sm border-top">
                            <span class="report-heading">Weekly Milestones</span>
                            <ul style="padding-left: 15px; margin: 0; font-size: 0.85rem;" class="text-muted">
                                ${payload.weekly_goals.map(g => `<li>${g}</li>`).join('')}
                            </ul>
                        </div>
                    </div>`;
        }

        return html;
    };

    const renderOutput = (outputId, dataObj) => {
        const el = document.getElementById(outputId);
        if(!el) return;
        
        OutputState[outputId].data = dataObj;
        const mode = OutputState[outputId].mode;

        el.classList.remove('empty');
        
        // Show utility bar if hidden
        const utilBar = document.getElementById(outputId.replace('-output', '-utility-bar'));
        if(utilBar) utilBar.classList.remove('hidden');

        if(mode === 'raw') {
            el.innerHTML = formatJSON(dataObj);
        } else {
            el.innerHTML = generateCleanHTML(dataObj);
        }
    };


    // --- HELPERS ---
    const getLoadingHTML = (textLabel) => {
        return `
            <div class="futuristic-loader-container">
                <div class="hex-spinner"></div>
                <div class="loader-text">${textLabel}<span class="loader-dots"></span></div>
            </div>
        `;
    };

    const toggleButtonState = (btnId, isLoading, originalText = 'Execute') => {
        const btn = document.getElementById(btnId);
        if(!btn) return;
        if (isLoading) {
            btn.innerHTML = `<span class="loader" style="width: 14px; height: 14px; border-width: 2px;"></span> Analyzing`;
            btn.disabled = true;
        } else {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    };


    // --- DASHBOARD TAB SWITCHING ---
    const moduleItems = document.querySelectorAll('.module-item');
    const panels = document.querySelectorAll('.panel-wrapper');

    const switchModule = (targetId) => {
        moduleItems.forEach(item => {
            item.classList.toggle('active', item.dataset.target === targetId);
        });
        panels.forEach(panel => {
            if(panel.id === targetId) { panel.classList.remove('hidden'); panel.classList.add('active'); } 
            else { panel.classList.add('hidden'); panel.classList.remove('active'); }
        });

        const modeMap = {
            'module-ca': 'CURRENT AFFAIRS STREAM',
            'module-mcq': 'MCQ SYNTHESIZER',
            'module-ssb': 'SSB IO SIMULATION',
            'module-plan': 'STRATEGIC CALCULATION'
        };
        const topMode = document.getElementById('top-bar-mode');
        if(topMode && modeMap[targetId]) {
            topMode.innerHTML = `ANALYSIS MODE: <span style="color: #fff">${modeMap[targetId]}</span>`;
        }

        if(window.VanguardAuth && targetId && !targetId.includes('undefined')) {
            window.VanguardAuth.updatePreference('lastModule', targetId);
            const updatedUser = window.VanguardAuth.getUser();
            if(updatedUser) setupPersonalization(updatedUser);
        }
    };

    moduleItems.forEach(item => {
        item.addEventListener('click', () => {
            if(item.dataset.target) {
                switchModule(item.dataset.target);
                const url = new URL(window.location);
                url.searchParams.set('module', item.dataset.target.replace('module-', ''));
                window.history.pushState({}, '', url);
            }
        });
    });

    const urlParams = new URLSearchParams(window.location.search);
    const moduleParam = urlParams.get('module');
    if(moduleParam && document.getElementById(`module-${moduleParam}`)) {
        switchModule(`module-${moduleParam}`);
    } else if (currentUser && currentUser.lastModule) {
        switchModule(currentUser.lastModule);
    } else {
        const firstPanel = document.querySelector('.panel-wrapper');
        if(firstPanel) firstPanel.classList.add('hidden');
    }


    // --- FORM SUBMITTALS & API HOOKS ---
    const validateForm = (formId) => {
        const form = document.getElementById(formId);
        if(!form) return false;
        const inputs = form.querySelectorAll('[required]');
        for(let input of inputs) {
            if(!input.value.trim()) {
                showToast(`Validation Failed: Missing constraints.`, 'error');
                return false;
            }
        }
        return true;
    };

    // 1. Current Affairs
    const caForm = document.getElementById('ca-form');
    if (caForm) {
        caForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if(!validateForm('ca-form')) return;

            const dateVal = document.getElementById('ca-date').value;
            const depthVal = document.getElementById('ca-depth').value;
            
            toggleButtonState('ca-btn', true);
            const outputEl = document.getElementById('ca-output');
            outputEl.classList.add('active-processing');
            
            // Hide util bar while loading
            const bar = document.getElementById('ca-utility-bar');
            if(bar) bar.classList.add('hidden');
            
            outputEl.innerHTML = getLoadingHTML('Aggregating Intelligence');
            outputEl.classList.remove('empty');
            
            try {
                const res = await window.VanguardAPI.fetchCurrentAffairs(dateVal, depthVal, currentUser || {});
                outputEl.classList.remove('active-processing');
                renderOutput('ca-output', res);
                showToast('Intelligence aggregated successfully');
            } catch (err) {
                outputEl.innerHTML = `<span style="color:var(--color-error)">Network Error: ${err}</span>`;
            } finally {
                toggleButtonState('ca-btn', false, 'Execute Query');
            }
        });
    }

    // 2. MCQ Generator
    const mcqForm = document.getElementById('mcq-form');
    if (mcqForm) {
        mcqForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if(!validateForm('mcq-form')) return;

            const topicVal = document.getElementById('mcq-topic').value;
            const diffVal = document.getElementById('mcq-difficulty').value;
            const countVal = document.getElementById('mcq-count').value;
            
            toggleButtonState('mcq-btn', true);
            const outputEl = document.getElementById('mcq-output');
            outputEl.classList.add('active-processing');
            if(document.getElementById('mcq-utility-bar')) document.getElementById('mcq-utility-bar').classList.add('hidden');
            outputEl.innerHTML = getLoadingHTML('Synthesizing Topography');
            outputEl.classList.remove('empty');
            
            try {
                const res = await window.VanguardAPI.fetchMCQs(topicVal, diffVal, countVal, currentUser || {});
                outputEl.classList.remove('active-processing');
                renderOutput('mcq-output', res);
                showToast('MCQ Block Synthesized');
            } catch (err) {
                outputEl.innerHTML = `<span style="color:var(--color-error)">Network Error: ${err}</span>`;
            } finally {
                toggleButtonState('mcq-btn', false, 'Synthesize Database');
            }
        });
    }

    // 3. SSB Simulator (Multi-Stage)
    const ssbStartBtn = document.getElementById('ssb-start-btn');
    const ssbForm = document.getElementById('ssb-form');
    let ssbCurrentType = 'PI';

    if (ssbStartBtn && ssbForm) {
        ssbStartBtn.addEventListener('click', async () => {
             const typeSel = document.getElementById('ssb-type');
             if(!typeSel) return;
             ssbCurrentType = typeSel.value;
             
             toggleButtonState('ssb-start-btn', true);
             const outputEl = document.getElementById('ssb-output');
             outputEl.classList.add('active-processing');
             if(document.getElementById('ssb-utility-bar')) document.getElementById('ssb-utility-bar').classList.add('hidden');
             
             // Initial load for instructions
             outputEl.innerHTML = getLoadingHTML('Initializing IO Model');
             outputEl.classList.remove('empty');
             
             try {
                 const res = await window.VanguardAPI.startSSBInterview(ssbCurrentType, currentUser || {});
                 outputEl.classList.remove('active-processing');
                 
                 // Display 'Thinking Mode' Data in the form side
                 const p = res.data.pre_flight;
                 document.getElementById('ssb-mode-tests').innerText = p.tests;
                 document.getElementById('ssb-mode-approach').innerText = p.approach;
                 document.getElementById('ssb-mode-avoid').innerText = p.avoid;
                 document.getElementById('ssb-thinking-mode').classList.remove('hidden');
                 
                 // Show Question
                 document.getElementById('ssb-question-display').textContent = res.data.directive;
                 
                 // Hide start button, show form
                 ssbStartBtn.parentElement.classList.add('hidden'); 
                 ssbForm.classList.remove('hidden'); 
                 
                 // Clear output area entirely since we moved data to the input form side
                 outputEl.innerHTML = `<div class="text-center text-muted" style="margin-top: 50px;">Awaiting candidate response.</div>`;
                 outputEl.classList.add('empty');
                 showToast('IO Model Connected. Awaiting Response.');
             } catch (err) {
                 outputEl.innerHTML = `<span style="color:var(--color-error)">Error: ${err}</span>`;
                 toggleButtonState('ssb-start-btn', false, 'Connect Model');
             }
        });

        ssbForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if(!validateForm('ssb-form')) return;
            const answer = document.getElementById('ssb-answer').value;

            toggleButtonState('ssb-submit-btn', true);
            const outputEl = document.getElementById('ssb-output');
            outputEl.classList.add('active-processing');
            if(document.getElementById('ssb-utility-bar')) document.getElementById('ssb-utility-bar').classList.add('hidden');
            outputEl.innerHTML = getLoadingHTML('Evaluating OLQs Pattern');
            outputEl.classList.remove('empty');
            
            try {
                const res = await window.VanguardAPI.evaluateSSBAnswer(answer, ssbCurrentType, currentUser || {});
                outputEl.classList.remove('active-processing');
                renderOutput('ssb-output', res);
                showToast('Response evaluated');
                
                // Update UI Prompt for next phase
                document.getElementById('ssb-question-display').textContent = res.data.evaluation.next_directive;
                document.getElementById('ssb-answer').value = ''; 
            } catch (err) {
                outputEl.innerHTML = `<span style="color:var(--color-error)">Network Error</span>`;
            } finally {
                toggleButtonState('ssb-submit-btn', false, 'Submit Response');
            }
        });
    }

    // 4. Study Planner
    const planForm = document.getElementById('plan-form');
    if (planForm) {
        planForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if(!validateForm('plan-form')) return;

            const exam = document.getElementById('plan-exam').value;
            const hours = document.getElementById('plan-hours').value;
            const weak = document.getElementById('plan-weak').value;
            
            toggleButtonState('plan-btn', true);
            const outputEl = document.getElementById('plan-output');
            outputEl.classList.add('active-processing');
            if(document.getElementById('plan-utility-bar')) document.getElementById('plan-utility-bar').classList.add('hidden');
            outputEl.innerHTML = getLoadingHTML('Calculating Schedule Matrix');
            outputEl.classList.remove('empty');
            
            try {
                const res = await window.VanguardAPI.generateStudyPlan(exam, hours, weak, currentUser || {});
                outputEl.classList.remove('active-processing');
                renderOutput('plan-output', res);
                showToast('Strategy matrix compiled');
            } catch (err) {
                outputEl.innerHTML = `<span style="color:var(--color-error)">Network Error: ${err}</span>`;
            } finally {
                toggleButtonState('plan-btn', false, 'Compile Strategy');
            }
        });
    }

});
