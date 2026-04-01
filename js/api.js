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
                mcqs: isAdvanced ? [
                    {
                        question: "Which of the following best describes the specific tactical objective of Project Zorawar?",
                        options: { A: "Coastal Defense", B: "High-Altitude Rapid Deployment", C: "Urban Anti-Terror", D: "Deep Sea Exploration" },
                        correct: "B",
                        explanation: "Zorawar is designed specifically for high-power-to-weight ratio maneuvering in thin-air environments like Ladakh."
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
                        explanation: `The Two-Front Paradigm addresses simultaneous engagements, heavily tested in recent ${user.exam || 'defense'} examinations.`
                    },
                    {
                        id: 2,
                        question: `Identify the primary asset utilized for airborne surveillance regarding ${resolvedTopic}.`,
                        options: { A: "Netra AEW&C", B: "Phalcon AWACS", C: "P-8I Poseidon", D: "Heron TP Mark 2" },
                        correct: "A",
                        explanation: "Netra is the indigenous DRDO airborne early warning system, crucial for domestic topographical intelligence."
                    }
                ]
            }
        };
    },

    async startSSBInterview(type, user = {}) {
        await this.delay(800);
        let tests, approach, avoid, question;
        
        if (type === 'WAT') {
            tests = "Subconscious association and immediate psychological reaction mapping to core OLQs.";
            approach = "Write the first constructive sentence that comes to mind. Keep it short (5-6 words). Ensure positive frame.";
            avoid = "Avoid dictionary meanings, negative words, or preachy 'should/must' sentences.";
            question = "Word: CHALLENGE";
        } else if (type === 'SRT') {
            tests = "Practical intelligence, reasoning ability, and courage under acute environmental stress.";
            approach = "Be practical, react quickly but logically. Assume normal resources. Complete the action definitively.";
            avoid = "Avoid superhuman solutions, passing the buck, or leaving the scenario unresolved.";
            question = "Scenario: You are en route to your final exam. You see a man lying critically injured on the road after a hit-and-run. Time is running out. What will you do?";
        } else {
            // PI
            tests = "Honesty, self-awareness, expression, reasoning, and overall psychological congruence (All 15 OLQs).";
            approach = "Be entirely truthful. Give structured, concise answers. Back your claims with real-life examples from your PIQ.";
            avoid = "Avoid lying, bragging, arguing, or giving generic rote memorization answers.";
            question = `Welcome. Tell me about your educational background, your family, and what specifically motivates you to join the Armed Forces via the ${user.exam || 'upcoming'} entry.`;
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
        const isAdvanced = user.level === 'Advanced';
        
        if (answer.trim().split(' ').length < 10 && type !== 'WAT') {
            evaluation = {
                strengths: ["Direct and unhesitating."],
                weaknesses: ["Insufficient detail to accurately assess psychological depth", "Lacks a logical conclusion"],
                olqs_mapped: ["Effective Intelligence (Lacking)"],
                improved_answer: "Always provide context and action. E.g., 'I would immediately render first aid, call an ambulance/police, ensure the victim is handed over to medical care, and then rush to my exam.'",
                next_directive: "Let's try again. Do not rush. Elaborate on your rationale."
            };
        } else {
            if (type === 'WAT') {
                evaluation = {
                    strengths: ["Quick turnaround", "Positive psychological framing"],
                    weaknesses: ["Sentence structure is slightly generic"],
                    olqs_mapped: ["Sense of Responsibility", "Liveliness", "Determination"],
                    improved_answer: "A resilient leader views every challenge as an opportunity to grow.",
                    next_directive: "Good. Next word: DEFEAT"
                };
            } else {
                evaluation = {
                    strengths: ["Clear logical sequence", "Demonstrates practical situational thinking", "Kept priorities straight"],
                    weaknesses: isAdvanced ? ["Could specify timeline urgency and delegation"] : ["None significant for this level"],
                    olqs_mapped: ["Reasoning Ability", "Social Adaptability", "Courage", "Speed of Decision"],
                    improved_answer: "Excellent structure. You took charge, managed the crisis, and still accounted for your primarily obligation.",
                    next_directive: "Understood. Moving forward, how do you handle prolonged stress when a critical plan fails?"
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
