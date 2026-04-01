// js/api.js
// Mock API Client returning complex structured objects for the HTML Render Engine

const Api = {
    // Helper to simulate latency
    delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

    async fetchCurrentAffairs(date, depth, user = {}) {
        await this.delay(1200);
        const resolvedDate = date.trim() || new Date().toISOString().split('T')[0];
        const isAdvanced = user.level === 'Advanced';
        
        return {
            metadata: { endpoint: '/api/v1/intelligence/current-affairs', status: 200 },
            data: {
                module: 'CURRENT_AFFAIRS',
                headline: "Ministry of Defence Inks 400Cr Contract for Indigenous Light Tanks",
                date: resolvedDate,
                key_points: [
                    "Contract signed with L&T for next-generation light tanks 'Zorawar'.",
                    "Aimed at rapid deployment in the high-altitude Eastern Ladakh sector.",
                    "Integrates swarm drone networking and AI-based fire control."
                ],
                why_it_matters: `This significantly boosts India's mountain warfare capabilities against immediate threats. ${user.exam === 'CDS' ? 'UPSC heavily focuses on indigenous DRDO/L&T defense collaborations.' : ''}`,
                ssb_relevance: "Highly relevant for Group Discussion (GD) on indigenous defense procurement and modernization of the Armed Forces under Atmanirbhar Bharat.",
                mcqs: isAdvanced ? [
                    {
                        question: "Which of the following best describes the specific tactical objective of Project Zorawar?",
                        options: { A: "Coastal Defense", B: "High-Altitude Rapid Deployment", C: "Urban Anti-Terror", D: "Deep Sea Exploration" },
                        correct: "B",
                        explanation: "Zorawar is designed specifically for high-power-to-weight ratio maneuvering in thin-air environments like Ladakh.",
                        why_others_wrong: "Coastal Defense applies to anti-ship batteries, Urban Anti-Terror implies CQB assets, and Deep Sea Exploration is for submersibles."
                    }
                ] : []
            }
        };
    },

    async fetchMCQs(topic, difficulty, count, user = {}) {
        await this.delay(1500);
        const resolvedTopic = topic.trim() || 'General Defense Topography';
        const isAdvanced = user.level === 'Advanced' || difficulty === 'Hard';

        return {
            metadata: { endpoint: '/api/v1/training/mcq-generator', status: 200 },
            data: {
                module: 'MCQ',
                topic: resolvedTopic,
                difficulty: difficulty || 'Standard',
                questions: [
                    {
                        id: 1,
                        question: `Which doctrine fundamentally addresses the concept of ${resolvedTopic} in a multi-front scenario?`,
                        options: { A: "Cold Start Doctrine", B: "Proactive Strategy", C: "Two-Front War Paradigm", D: "Non-Alignment 2.0" },
                        correct: isAdvanced ? "C" : "A",
                        explanation: `The Two-Front Paradigm addresses simultaneous engagements, heavily tested in recent examinations.`,
                        why_others_wrong: "Cold Start focuses on rapid mobilization against a single neighbor, while Non-Alignment relates to foreign policy stance rather than operational military doctrine."
                    },
                    {
                        id: 2,
                        question: `Identify the primary asset utilized for airborne surveillance regarding ${resolvedTopic}.`,
                        options: { A: "Netra AEW&C", B: "Phalcon AWACS", C: "P-8I Poseidon", D: "Heron TP Mark 2" },
                        correct: "A",
                        explanation: "Netra is the indigenous DRDO airborne early warning system, crucial for domestic topographical intelligence.",
                        why_others_wrong: "P-8I is specifically for maritime patrol (ASW), and Heron is an unmanned UAV, not a primary early warning command aircraft."
                    }
                ]
            }
        };
    },

    async startSSBInterview(type, user = {}) {
        await this.delay(800);
        let tests, approach, avoid, question;
        
        // Analyze past attempts to simulate scaling difficulty
        let prog = JSON.parse(localStorage.getItem('vanguard_progression')) || { attempts: 0 };
        const pressureTxt = prog.attempts > 1 ? " [TIME PRESSURE: Respond in 2-3 lines. Time is limited.]" : "";

        if (type === 'WAT') {
            tests = "Subconscious association and immediate psychological reaction mapping to core OLQs.";
            approach = "Write the first constructive sentence that comes to mind. Keep it short (5-6 words). Ensure positive frame.";
            avoid = "Avoid dictionary meanings, negative words, or preachy 'should/must' sentences.";
            question = "Word: CHALLENGE" + pressureTxt;
        } else if (type === 'SRT') {
            tests = "Practical intelligence, reasoning ability, and courage under acute environmental stress.";
            approach = "Be practical, react quickly but logically. Assume normal resources. Complete the action definitively.";
            avoid = "Avoid superhuman solutions, passing the buck, or leaving the scenario unresolved.";
            question = prog.attempts > 2 ? 
                "Stress Scenario: You are commanding a patrol in hostile terrain. Communication drops, two men are injured, and an ambush is suspected ahead. Sunset is in 20 minutes." + pressureTxt : 
                "Scenario: You are en route to your final exam. You see a man lying critically injured on the road after a hit-and-run. Time is running out. What will you do?" + pressureTxt;
        } else {
            // PI
            tests = "Honesty, self-awareness, expression, reasoning, and overall psychological congruence (All 15 OLQs).";
            approach = "Be entirely truthful. Give structured, concise answers. Back your claims with real-life examples from your PIQ.";
            avoid = "Avoid lying, bragging, arguing, or giving generic rote memorization answers.";
            question = prog.attempts > 2 ? 
                `Intense PI: Justify precisely why the Armed Forces should select you over 100 other equally qualified candidates, focusing solely on one core failure you've overcome.` + pressureTxt:
                `Directive: Summarize your educational background and explicit motivation for joining the Armed Forces via the ${user.exam || 'upcoming'} entry.` + pressureTxt;
        }
        
        return {
            metadata: { endpoint: '/api/v1/simulation/ssb/init', status: 200 },
            data: {
                module: 'SSB_INIT',
                session_type: type,
                pre_flight: { tests, approach, avoid },
                directive: question
            }
        };
    },

    async evaluateSSBAnswer(answer, type, user = {}) {
        await this.delay(2000);
        
        let evaluation = {};
        let prog = JSON.parse(localStorage.getItem('vanguard_progression')) || { attempts: 0, history: [] };
        prog.attempts++;
        
        // Store history for adaptive feedback
        prog.history.push({ type, length: answer.trim().split(' ').length });
        if(prog.history.length > 3) prog.history.shift();
        localStorage.setItem('vanguard_progression', JSON.stringify(prog));

        const isAdvanced = user.level === 'Advanced';
        const isShort = answer.trim().split(' ').length < 10;
        
        // AI Memory context
        let memory_feedback = "";
        if (prog.history.length > 1) {
            if (isShort && prog.history[prog.history.length-2].length < 10) {
                memory_feedback = "ADAPTIVE WARNING: You consistently show hesitation and lack of depth across multiple responses.";
            } else if (!isShort && prog.history[prog.history.length-2].length < 10) {
                memory_feedback = "Compared to your previous answer, your detail has improved, but structural clarity needs monitoring.";
            }
        }
        
        if (isShort && type !== 'WAT') {
            evaluation = {
                strengths: ["Direct execution."],
                weaknesses: ["Insufficient detail to accurately assess psychological depth", "Lacks logical conclusion under pressure"],
                olqs_mapped: ["Effective Intelligence (Lacking)"],
                behavioral_insight: memory_feedback || "Hesitation detected. Evades full situational responsibility.",
                improved_answer: "Provide context and action. E.g., 'I would immediately render first aid, notify authorities, ensure medical handover, and proceed to my exam.'",
                next_directive: "Let's try again. Elaborate on your rationale.",
                final_judgment: {
                    readiness: "Low",
                    risk_factor: "High (Evasion of responsibility)",
                    action: "Practice expanding on situational constraints.",
                    ai_confidence: "88%"
                }
            };
        } else {
            if (type === 'WAT') {
                evaluation = {
                    strengths: ["Rapid turnaround", "Constructive psychological framing"],
                    weaknesses: ["Generic sentence structure mapping"],
                    olqs_mapped: ["Sense of Responsibility", "Determination"],
                    behavioral_insight: memory_feedback || "Acceptable standard associative response.",
                    improved_answer: "A resilient leader views every challenge as an opportunity to grow.",
                    next_directive: "Next word: DEFEAT",
                    final_judgment: {
                        readiness: "Moderate",
                        risk_factor: "Low",
                        action: "Inject more personal originality into standard words.",
                        ai_confidence: "92%"
                    }
                };
            } else {
                evaluation = {
                    strengths: ["Logical sequencing", "Maintains priorities under time pressure"],
                    weaknesses: isAdvanced ? ["Fails to delegate resource management effectively"] : ["Basic tactical oversight"],
                    olqs_mapped: ["Reasoning Ability", "Courage", "Speed of Decision"],
                    behavioral_insight: memory_feedback || "Demonstrates composure but lacks deep organizational forecasting.",
                    improved_answer: "Clear structure. You successfully assumed command, resolved the immediate crisis, and anchored the primary obligation.",
                    next_directive: "Directive: How do you handle prolonged operational stress when a structural plan collapses?",
                    final_judgment: {
                        readiness: "High",
                        risk_factor: "Moderate (Resource extrapolation lacking)",
                        action: "Incorporate timeline checkpoints in future SRTs.",
                        ai_confidence: "95%"
                    }
                };
            }
        }

        return {
            metadata: { endpoint: '/api/v1/simulation/ssb/evaluate', status: 200 },
            data: {
                module: 'SSB_EVAL',
                evaluation: evaluation
            }
        };
    },

    async generateStudyPlan(exam, hours, weakAreas, user = {}) {
        await this.delay(1800);
        
        const hrsNum = parseInt(hours) || 4;
        const mainFactor = Math.floor(hrsNum * 0.6);
        const secFactor = hrsNum - mainFactor;
        const target = exam || user.exam || 'Defence Exam';
        
        return {
            metadata: { endpoint: '/api/v1/planning/scheduler', status: 200 },
            data: {
                module: 'PLANNER',
                target_exam: target,
                commitment: `${hrsNum} Hours/Day`,
                strategy: `Focus 60% of your time on identified weak areas (${weakAreas || 'Core subjects'}) and 40% on high-scoring topography and current affairs.`,
                focus_area: "Mathematical Fundamentals & SRT Situational Control",
                expected_outcome: "20% improvement in mock test speed and 100% completion in WAT within time limits.",
                daily_schedule: [
                    {
                        block: "Morning (High Focus)",
                        duration: `${mainFactor} hrs`,
                        tasks: ["Deep dive into weak concepts", "Chapter-wise mock tests and analysis"]
                    },
                    {
                        block: "Evening (Revision & Breadth)",
                        duration: `${secFactor} hrs`,
                        tasks: ["Current Affairs & Newspaper Analysis", "Wat/SRT practice (30 mins)", "Light revision marking"]
                    }
                ],
                weekly_goals: [
                    "Complete 2 full-length simulated mock exams",
                    "Compile specialized notes for Current Affairs",
                    "Conduct 1 peer-reviewed PI session"
                ]
            }
        };
    }
};

window.VanguardAPI = Api;
