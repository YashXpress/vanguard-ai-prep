// js/prompt-engine.js
// =============================================================================
// VANGUARD AI — CENTRALIZED PROMPT CONTROL & INTELLIGENCE LAYER
// =============================================================================
// This module acts as the single source of truth for all AI prompt construction.
// It enforces:
//   • Mode-specific output formats (MCQ / CURRENT_AFFAIRS / STUDY_PLAN / SSB)
//   • Strict COUNT compliance
//   • No content mixing between modules
//   • Consistent, structured output schema
// =============================================================================

const PromptEngine = (() => {

    // -------------------------------------------------------------------------
    // DEFENCE KNOWLEDGE MATRIX — Topic-seeded content bank
    // Used to generate varied, realistic content per topic input
    // -------------------------------------------------------------------------
    const KNOWLEDGE = {
        doctrines: [
            { name: "Cold Start Doctrine", desc: "India's sub-conventional rapid-mobilization offensive strategy to launch swift strikes without crossing Pakistan's nuclear threshold." },
            { name: "Two-Front War Paradigm", desc: "Strategic contingency planning for simultaneous adversarial engagements on Northern (China) and Western (Pakistan) fronts." },
            { name: "Atmanirbhar Bharat in Defence", desc: "Policy framework to reduce import dependency by 2024-26 by indigenizing 300+ defence systems through DRDO and private sector partnerships." },
            { name: "Non-Alignment 2.0", desc: "India's post-Cold War strategic autonomy framework emphasizing multi-alignment rather than bloc membership." },
            { name: "Integrated Battle Groups (IBGs)", desc: "Army restructuring initiative replacing traditional divisions with leaner, autonomous, brigade-sized battle groups for faster mobilization." },
            { name: "Maritime Security Strategy (2015)", desc: "India's blueprint for primary and secondary area maritime operations including anti-piracy, HADR, and blue-water projection." }
        ],
        weapons_systems: [
            { name: "BrahMos Supersonic Cruise Missile", desc: "World's fastest operational supersonic cruise missile (Mach 2.8-3.0) with tri-service capability, developed under Indo-Russian DRDO-NPO-M joint venture." },
            { name: "Arjun MK-2 Main Battle Tank", desc: "India's indigenous third-generation MBT with composite armour, 120mm rifled gun, and active protection system developed by CVRDE." },
            { name: "Zorawar Light Tank", desc: "DRDO-L&T jointly developed 25-ton high-altitude specialist light tank designed for rapid C-17/C-130 airlift and Lakshya-class operations in Eastern Ladakh." },
            { name: "Tejas LCA Mk-2", desc: "DRDO-HAL advanced delta-wing light combat aircraft with AESA radar, BVR missiles, in-flight refueling capability — 83 aircraft MRFA contract signed." },
            { name: "ASAT (Mission Shakti)", desc: "2019 anti-satellite weapon test that destroyed a Low Earth Orbit satellite at 300km altitude, making India 4th nation with demonstrated ASAT capability." },
            { name: "Pralay Tactical Ballistic Missile", desc: "Surface-to-surface quasi-ballistic missile (150-500 km range) with maneuverability in terminal phase — approved for induction in 2022." },
            { name: "K-15 Sagarika SLBM", desc: "Submarine-Launched Ballistic Missile with 700km range deployed on INS Arihant, completing India's nuclear triad." }
        ],
        operations: [
            { name: "Operation Vijay (1999)", desc: "Indian Army operation to recapture Pakistani-occupied Kargil peaks. Culminated in Tiger Hill capture on 4 July 1999 after 60-day conflict." },
            { name: "Operation Safed Sagar", desc: "Indian Air Force operations during Kargil War; first sustained high-altitude air campaign; IAF used MiG-27ML and Mirage 2000H effectively." },
            { name: "Operation Trident (1971)", desc: "Indian Navy's first missile boat attack on Karachi port during 1971 War. Sank PNS Khaibar; first combat use of anti-ship missiles in the Asian subcontinent." },
            { name: "Operation Meghdoot (1984)", desc: "Indian Army's pre-emptive occupation of Siachen Glacier making it world's highest battlefield. Commenced 13 April 1984." },
            { name: "Operation Pawan (1987-90)", desc: "IPKF operations in Sri Lanka against LTTE. India's largest expeditionary military operation outside its borders." },
            { name: "Op Sindhu Sudarshana (2023)", desc: "Indian Navy's multinational exercise in Indian Ocean Region involving coordinated ASW and anti-piracy operations with partner navies." }
        ],
        organizations: [
            { name: "DRDO", desc: "Defence Research and Development Organisation — India's primary defence R&D agency under Ministry of Defence with 52 laboratories and 30,000+ scientists." },
            { name: "HAL (Hindustan Aeronautics Limited)", desc: "State-owned aerospace and defence company producing Tejas, Dhruv ALH, Chetak, and licensed manufacturing of Su-30MKI." },
            { name: "DPP (Defence Procurement Procedure)", desc: "Regulatory framework governing India's defence acquisitions with preference categories: Buy Indian-IDDM > Buy Indian > Buy & Make Indian > Buy Global." },
            { name: "CCF (Ceremonial Command Functions)", desc: "Protocol-based command and control framework for joint service ceremonial operations and VVIP security coordination." },
            { name: "COAS (Chief of Army Staff)", desc: "Highest military rank in the Indian Army, commanding over 1.4 million active personnel, reporting to the Chief of Defence Staff (CDS)." },
            { name: "NDA (National Defence Academy)", desc: "Premier tri-service training institution at Khadakwasla, Pune, training joint entry cadets for all three branches of the Indian Armed Forces." }
        ],
        geopolitics: [
            { name: "Indo-Pacific Strategy", desc: "India's strategic framework treating the Indian and Pacific Oceans as a single, integrated theatre, guided by SAGAR doctrine (Security and Growth for All in the Region)." },
            { name: "SCO (Shanghai Cooperation Organisation)", desc: "Eurasian political, economic, and security alliance — India joined in 2017; hosts counter-terrorism cooperation but geopolitically complex due to China-Pakistan axis." },
            { name: "QUAD (Quadrilateral Security Dialogue)", desc: "Strategic security dialogue between India, USA, Australia, and Japan focused on a free and open Indo-Pacific against coercive Chinese influence." },
            { name: "LAC (Line of Actual Control)", desc: "3,488 km de-facto border between India and China with no mutually agreed demarcation, spanning Western (Ladakh), Middle (Himachal/Uttarakhand), and Eastern (Arunachal) sectors." },
            { name: "Galwan Valley Clash (June 2020)", desc: "World's first modern-era hand-to-hand combat casualty event on LAC. India lost 20 soldiers; China officially acknowledged 4 deaths with up to 45 estimated fatalities." },
            { name: "ASEAN (India Relations)", desc: "India's Act East Policy anchor — India is ASEAN's Dialogue Partner with focus on maritime, trade, and connectivity cooperation since 1992." }
        ],
        ssb_olqs: [
            { name: "Effective Intelligence", desc: "Ability to quickly grasp the core of a problem and produce efficient, analytically sound solutions." },
            { name: "Reasoning Ability", desc: "Logical sequencing of thought processes and ability to evaluate multi-variable tactical situations systematically." },
            { name: "Organising Ability", desc: "Capacity to plan, allocate resources, and assign tasks across a team under operational constraints." },
            { name: "Power of Expression", desc: "Clarity, precision, and confidence in verbal and written communication, especially under pressure." },
            { name: "Speed of Decision", desc: "Quickness and conviction in making well-reasoned decisions without excessive deliberation under time pressure." },
            { name: "Sense of Responsibility", desc: "Demonstration of accountability for one's actions, team outcomes, and mission completion." },
            { name: "Initiative", desc: "Proactive tendency to identify and act on opportunities or threats without being directed." },
            { name: "Self-Confidence", desc: "Stable, calibrated belief in one's capabilities, neither falsely overconfident nor under-projected." },
            { name: "Ability to Influence the Group", desc: "Capacity to positively shape group behavior and decision-making through reasoning and leadership authority, not coercion." },
            { name: "Co-operation", desc: "Willingness to work synergistically with peers, subordinates, and superiors toward mission objectives." },
            { name: "Determination", desc: "Persistence and mental fortitude in pursuing goals despite adversity, setbacks, or resource scarcity." },
            { name: "Courage", desc: "Willingness to take calculated physical and moral risks in alignment with duty and ethics." },
            { name: "Stamina", desc: "Physical and mental endurance to sustain high-performance output across extended, stressful operational periods." },
            { name: "Likeability", desc: "Natural social affability and rapport-building ability that creates trust and cohesion in team contexts." },
            { name: "Integrity", desc: "Consistency between personal values, verbal commitments, and observable actions — zero gap between belief and behavior." }
        ],
        current_affairs_pool: [
            {
                headline: "India Signs ₹800Cr Contract for Integrated Battle Group (IBG) Modernization",
                explanation: "The Ministry of Defence approved a landmark ₹800 crore allocation to fast-track Integrated Battle Group modernization including upgraded C4ISR networks, autonomous logistics drones, and advanced encrypted inter-unit communication terminals. The IBG model replaces traditional infantry divisions with faster, 5,000-man self-contained battle units.",
                importance: "Critical for CDS/NDA written papers. UPSC frequently tests on Army structural reforms — IBGs represent the most significant Army restructuring since the 1970s Brass Tacks exercise era.",
                ssb_angle: "Use in GD/Lecturette: Discuss modern warfare's demand for network-centric, faster-decision units vs. traditional mass-mobilization armies. Frame it through 'Transformation vs. Tradition' debate."
            },
            {
                headline: "INS Vikrant: India's First Indigenous Aircraft Carrier Completes Sea Trials",
                explanation: "IAC-1 INS Vikrant completed its final operational sea trials with MiG-29K fighters and Kamov Ka-31 AEW helicopters. Built at Cochin Shipyard Limited, Vikrant represents 76% indigenous content, displacing 45,000 tons — making India one of only 5 nations with indigenous carrier-building capability.",
                importance: "High-priority topic for NDA/CDS/AFCAT. Naval modernization is a recurring UPSC theme. The 76% indigenization metric is a standard exam statistic.",
                ssb_angle: "PI/GD Hook: 'What does a second aircraft carrier mean for India's blue-water ambitions?' — Discuss sea lane control, energy security, and strategic deterrence in the IOR."
            },
            {
                headline: "DRDO Successfully Tests Hypersonic Missile Technology Demonstrator at Mach 6",
                explanation: "DRDO conducted a successful hypersonic technology demonstrator test at Wheeler Island, Odisha, achieving Mach 6 (7,350 km/h) at 30km altitude. The scramjet-powered vehicle was tracked across 1,200km. India joins USA, Russia, and China as the 4th nation with demonstrated hypersonic glide vehicle technology.",
                importance: "Cutting-edge defence technology — extremely popular in NDA/CDS tech-based questions. Hypersonic weapon systems are game-changers for strategic deterrence.",
                ssb_angle: "Lecturette material: 'How hypersonic weapons change the strategic calculus.' Key point — existing missile defense systems are rendered operationally limited at Mach 6+ speeds."
            },
            {
                headline: "Exercise MALABAR 2024: India, USA, Japan, Australia Conduct Coordinated ASW Operations",
                explanation: "Exercise MALABAR 2024 was conducted in the Bay of Bengal over 10 days with 22 warships, 4+ submarines, and 28 aircraft from Quad nations. Phase I was shore-based, Phase II was advanced at-sea coordination. Focus was anti-submarine warfare (ASW), HADR coordination, and cyber-domain cooperation.",
                importance: "Bilateral/multilateral exercises are high-frequency NDA/CDS exam topics. MALABAR's expansion to include Australia in 2020 was a geopolitically significant event worth noting.",
                ssb_angle: "GD topic: 'Does MALABAR signal an emerging security alliance that challenges China's naval expansion?' Frame India's position: strategic hedging, not alliance-building."
            },
            {
                headline: "Agnipath Scheme: One Year Analysis — Agniveers Begin Specialised Unit Deployment",
                explanation: "One year after Agnipath's controversial rollout, the first batch of 46,000 Agniveers completed their four-year service cycle and began specialized corps deployment. The scheme aims to reduce pension burden (60% of defence budget in 2030 projections) while creating a young, technically skilled force profile.",
                importance: "Agnipath is arguably the most examined current affair across NDA/CDS/AFCAT 2023-2025. Both the strategic rationale and societal criticism must be understood.",
                ssb_angle: "PI Minefield: Interviewers will probe Agniveers on their own motivation. Frame it around service and national duty rather than post-service certificate benefits."
            },
            {
                headline: "India Exports BrahMos Supersonic Cruise Missiles to Philippines Under ₹2,900Cr Deal",
                explanation: "India completed delivery of the first BrahMos Block-III missile battery to the Philippine Navy under a US$375 million (₹2,900 crore) deal signed in 2022. Vietnam, Indonesia, and Saudi Arabia are in advanced discussions. This marks India's largest defence export to date, validating DRDO's export-grade indigenization.",
                importance: "Defence exports are a key 'Atmanirbhar Bharat' success metric — standard NDA GS/CDS exam topic. India's defence exports crossed ₹21,000Cr in FY2024.",
                ssb_angle: "Use in GD: 'Strategic dividend — exporting BrahMos enhances India's influence in South China Sea littoral states.' Link to Indo-Pacific strategy and SAGAR doctrine."
            },
            {
                headline: "Chief of Defence Staff: Tri-Service Integration Advances with New Joint Logistics Commands",
                explanation: "The Department of Military Affairs (DMA) activated two new joint sub-commands — Maritime Theatre Command (Karwar) and Air Defence Command (Prayagraj) — under the Integrated Theatre Command framework. This reduces tri-service coordination gaps that plagued the 1999 Kargil and 1962 Sino-Indian conflicts.",
                importance: "Integrated theatrization is high-priority strategic reform content for CDS/NDA exams. The CDS post itself is a single-question favourite.",
                ssb_angle: "PI opportunity: 'How will Integrated Theatre Commands change the role of junior commissioned officers?' — Emphasize jointmanship, combined arms operations, and reduced inter-service turf battles."
            },
            {
                headline: "Exercise SHAKTI 2024: India-France Special Forces Conduct Counter-Terror Jungle Ops",
                explanation: "India-France joint military exercise SHAKTI 2024 was conducted at Mahajan Field Firing Ranges with a focus on jungle warfare, counter-IED procedures, and special forces unconventional operations. France's Foreign Legion and Indian infantry brigades conducted live-fire combined tactical maneuvers.",
                importance: "Bilateral exercises with Tier-1 military partners (France is a key partner via Rafale, Scorpène) are standard exam items. France is India's only European Comprehensive Strategic Partner.",
                ssb_angle: "Lecturette: 'What does the India-France defence relationship mean beyond the Rafale deal?' Highlight: submarine technology (Scorpène), space cooperation, and Indo-Pacific convergence."
            }
        ],
        study_topics: {
            NDA: ["Mathematics (Algebra, Trigonometry, Calculus)", "General Ability Test (History, Geography, Physics, Chemistry)", "English Grammar & Comprehension", "Current Affairs & Defence Knowledge", "Mental Ability & Spatial Reasoning"],
            CDS: ["Elementary Mathematics", "English (Grammar, Vocabulary, Comprehension)", "General Knowledge (History, Geography, Economics, Current Affairs)", "Defence Studies (Ranks, Doctrines, Operations)"],
            AFCAT: ["General Awareness (Defence, Science, Current Affairs)", "Verbal Ability (English comprehension, idioms)", "Numerical Ability (Data interpretation, arithmetic)", "Reasoning & Military Aptitude"],
            CAPF: ["General Studies (Indian Polity, History, Geography)", "General Science & CBRN Awareness", "English & Hindi Paper", "Elementary Mathematics"]
        }
    };

    // -------------------------------------------------------------------------
    // DETERMINISTIC SEEDED SAMPLER
    // Produces consistent-but-varied results per topic string
    // -------------------------------------------------------------------------
    const createSeed = (str) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash);
    };

    const seededPick = (arr, seed, offset = 0) => {
        return arr[Math.abs(seed + offset) % arr.length];
    };

    const shuffleWithSeed = (arr, seed) => {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.abs(seed * (i + 1)) % (i + 1);
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    };

    // -------------------------------------------------------------------------
    // MODULE: MCQ — Generate EXACTLY count questions on topic
    // -------------------------------------------------------------------------
    const buildMCQPayload = (topic, difficulty, count, user = {}) => {
        const seed = createSeed(topic + difficulty);
        const isHard = difficulty === 'Hard';
        const questions = [];

        // Shuffle knowledge pools for variety
        const docPool = shuffleWithSeed(KNOWLEDGE.doctrines, seed);
        const weaponPool = shuffleWithSeed(KNOWLEDGE.weapons_systems, seed + 1);
        const opPool = shuffleWithSeed(KNOWLEDGE.operations, seed + 2);
        const orgPool = shuffleWithSeed(KNOWLEDGE.organizations, seed + 3);
        const geoPool = shuffleWithSeed(KNOWLEDGE.geopolitics, seed + 4);

        const allItems = [
            ...docPool.map(d => ({ type: 'doctrine', ...d })),
            ...weaponPool.map(w => ({ type: 'weapon', ...w })),
            ...opPool.map(o => ({ type: 'operation', ...o })),
            ...orgPool.map(o => ({ type: 'org', ...o })),
            ...geoPool.map(g => ({ type: 'geo', ...g }))
        ];

        const questionTemplates = [
            (item) => ({
                question: `Which of the following BEST describes "${item.name}" in the context of ${topic}?`,
                correct_desc: item.desc,
                distractors: [
                    `A retrospective diplomatic review of bilateral treaties with no operational military significance.`,
                    `A logistics resupply framework for rear-echelon support units isolated from forward areas.`,
                    `A cultural outreach programme under the Ministry of External Affairs for diaspora cohesion.`
                ]
            }),
            (item) => ({
                question: `In the strategic context of "${topic}", what is the PRIMARY objective of ${item.name}?`,
                correct_desc: item.desc,
                distractors: [
                    `Consolidating civilian law enforcement under a unified national security apparatus.`,
                    `Redirecting defence budget allocations toward infrastructure and social welfare programmes.`,
                    `Maintaining a purely defensive posture with no forward projection capability.`
                ]
            }),
            (item) => ({
                question: `An analyst examining "${topic}" would most accurately classify ${item.name} as:`,
                correct_desc: item.desc,
                distractors: [
                    `A sub-conventional proxy warfare framework operating below the nuclear threshold.`,
                    `A bilateral trade and foreign investment protocol governed by WTO norms.`,
                    `An internal security directive under AFSPA with no strategic external dimension.`
                ]
            }),
            (item) => ({
                question: `Which statement about ${item.name} is MOST relevant when studying "${topic}"?`,
                correct_desc: item.desc,
                distractors: [
                    `It operates independently from India's broader nuclear doctrine and strategic posture.`,
                    `It was designed primarily for ceremonial functions and has no operational mandate.`,
                    `It remains classified under Official Secrets Act with no publicly verifiable impact.`
                ]
            }),
            (item) => ({
                question: `From an examiner's perspective on "${topic}", ${item.name} is significant because:`,
                correct_desc: item.desc,
                distractors: [
                    `It represents India's decision to abandon strategic autonomy in favour of formal treaty alliances.`,
                    `It is a legacy Cold War framework with no relevance to contemporary security challenges.`,
                    `It exclusively addresses economic developmental dimensions of national security.`
                ]
            })
        ];

        const distractor_explanations = [
            "Option {X}: Incorrect — this describes a civilian governance mechanism, not a military-strategic framework.",
            "Option {X}: Incorrect — this confuses the operational mandate with a diplomatic or economic function.",
            "Option {X}: Incorrect — this represents an outdated or misattributed doctrine irrelevant to the specific context.",
        ];

        for (let i = 0; i < count; i++) {
            const item = allItems[i % allItems.length];
            const templateFn = questionTemplates[i % questionTemplates.length];
            const qData = templateFn(item);
            const itemSeed = seed + i * 37;

            // Build 4 options — correct answer is always included, position varies
            const correctPos = ['A', 'B', 'C', 'D'][itemSeed % 4];
            const distractors = shuffleWithSeed(qData.distractors, itemSeed);

            const options = {};
            let dIdx = 0;
            ['A', 'B', 'C', 'D'].forEach(letter => {
                if (letter === correctPos) {
                    options[letter] = qData.correct_desc.split('.')[0] + '.';
                } else {
                    options[letter] = distractors[dIdx++] || `Unrelated strategic framework.`;
                }
            });

            const wrongOptions = ['A', 'B', 'C', 'D'].filter(l => l !== correctPos);
            const whyWrong = wrongOptions.map((l, idx) => {
                return `Option ${l}: ${distractor_explanations[idx % distractor_explanations.length].replace('{X}', l)}`;
            }).join(' ');

            questions.push({
                id: i + 1,
                question: qData.question,
                options,
                correct: correctPos,
                explanation: `${item.name}: ${item.desc} This is directly relevant to understanding ${topic} at the ${isHard ? 'advanced CDS/AFCAT' : 'NDA/standard'} examination level.`,
                why_others_wrong: whyWrong
            });
        }

        return {
            module: 'MCQ',
            topic,
            difficulty,
            count,
            questions
        };
    };

    // -------------------------------------------------------------------------
    // MODULE: CURRENT AFFAIRS — Generate EXACTLY count items on topic
    // -------------------------------------------------------------------------
    const buildCurrentAffairsPayload = (topic, count, depth, date, user = {}) => {
        const seed = createSeed(topic + date);
        const pool = shuffleWithSeed(KNOWLEDGE.current_affairs_pool, seed);
        const items = [];

        for (let i = 0; i < count; i++) {
            const base = pool[i % pool.length];
            const docRef = seededPick(KNOWLEDGE.doctrines, seed, i);
            const geoRef = seededPick(KNOWLEDGE.geopolitics, seed, i + 3);

            const deepExtra = depth === 'deep'
                ? ` Additionally, this event links to the ${docRef.name} framework: ${docRef.desc.split('.')[0]}. In the broader geopolitical context, this intersects with ${geoRef.name}.`
                : '';

            items.push({
                headline: base.headline,
                date: date || new Date().toISOString().split('T')[0],
                topic_relevance: topic,
                explanation: base.explanation + deepExtra,
                importance: base.importance + (user.exam ? ` Particularly relevant for your ${user.exam} preparation.` : ''),
                ssb_angle: base.ssb_angle
            });
        }

        return {
            module: 'CURRENT_AFFAIRS',
            topic,
            date: date || new Date().toISOString().split('T')[0],
            depth,
            count,
            items
        };
    };

    // -------------------------------------------------------------------------
    // MODULE: STUDY PLAN — Day-wise structured 7-day plan
    // -------------------------------------------------------------------------
    const buildStudyPlanPayload = (exam, hours, weakAreas, user = {}) => {
        const hrsNum = parseInt(hours) || 4;
        const mainFactor = Math.floor(hrsNum * 0.6);
        const secFactor = hrsNum - mainFactor;
        const target = exam || user.exam || 'Defence Exam';
        const topics = KNOWLEDGE.study_topics[target] || KNOWLEDGE.study_topics['NDA'];
        const weakList = weakAreas ? weakAreas.split(',').map(s => s.trim()) : ['Core Subjects'];

        const dayPlans = [
            {
                day: 1, label: "Diagnostic Baseline",
                am: `Deep conceptual study: ${weakList[0] || topics[0]}. Goal: identify root gaps, NOT surface revision.`,
                pm: `Timed micro-mock (15 MCQs). Analyse every wrong answer. Log errors in a mistake journal.`,
                evening: `Current Affairs: Read 2 defence editorials. Identify SSB-relevant geopolitical developments.`
            },
            {
                day: 2, label: "Core Strengthening",
                am: `${weakList[0] || topics[0]} — Deep formula/concept mastery. Build reference cards.`,
                pm: `WAT/SRT psychological conditioning: 20 timed WAT words (8 sec/word). Record response patterns.`,
                evening: `${topics[1] || 'General Knowledge'} speed revision — 25 fact-recall questions.`
            },
            {
                day: 3, label: "Cross-Training Day",
                am: `Shift to ${topics[2] || 'English Comprehension'}. Fresh perspective prevents study fatigue.`,
                pm: `Full-length sectional mock (40 questions, 45 minutes). Track accuracy rate per section.`,
                evening: `SSB PI practice: Record a 2-minute self-introduction. Review tone, confidence, and spontaneity.`
            },
            {
                day: 4, label: "Intensive Attack Phase",
                am: `${weakList[1] || topics[3] || 'Mathematics'} — Attack the second weakest area with 3 solved examples per concept.`,
                pm: `5 complex SRT scenarios — written responses under 60-second constraint.`,
                evening: `Revise Day 1 and Day 2 mistake journal. Re-attempt every wrong question from memory.`
            },
            {
                day: 5, label: "Integration & Speed",
                am: `Mixed-subject rapid revision: 15 min per topic rotating through all subjects at speed.`,
                pm: `Simulated half-mock under strict exam conditions (no breaks, no mobile, timed).`,
                evening: `Current Affairs deep-dive: One strategic topic (e.g., LAC situation, QUAD developments) with SSB angles.`
            },
            {
                day: 6, label: "Pressure Calibration",
                am: `Full-length mock under maximum pressure: strict timer, no re-reads, commit to first answers.`,
                pm: `Detailed analysis: Categorize errors as Knowledge Gap, Careless Mistake, or Time Pressure. Prioritize accordingly.`,
                evening: `Psychological reset: Light physical activity (30 min). No study — allow consolidation.`
            },
            {
                day: 7, label: "Review & Recalibration",
                am: `Comprehensive review of entire week's mistake journal. Focus only on recurring error patterns.`,
                pm: `Peer/self PI session: 5 structured PI questions. Evaluate honesty, structure, and OLQ demonstration.`,
                evening: `Plan next week. Update study schedule based on progress metrics. Adjust weak area allocation.`
            }
        ];

        return {
            module: 'PLANNER',
            target_exam: target,
            commitment: `${hrsNum} Hours/Day (${mainFactor}h Morning + ${secFactor}h Evening)`,
            goal: `Achieve competitive readiness for ${target} examination within 14 days with measurable improvement in ${weakList.join(', ')}.`,
            strategy: `High-yield, deliberate practice model: Allocate 60% to identified weak areas (${weakList.join(', ')}) using active recall — NOT passive reading. 40% goes to high-scoring revision topics (Current Affairs, GK capsules). Every Sunday: full mock + SSB psychological conditioning. Mistake journal is non-negotiable — it is your primary feedback loop.`,
            focus_area: weakList.join(' | '),
            expected_outcome: `By Day 14: min. 25% accuracy improvement in weak areas, 90%+ completion rate in WAT/SRT sessions without quality loss, and 15% reduction in careless errors through disciplined mock analysis.`,
            daily_schedule: dayPlans,
            weekly_goals: [
                `Complete minimum 2 full-length mocks with detailed error analysis`,
                `Compile structured Current Affairs capsule (10 events with SSB angles)`,
                `Conduct 1 timed PI practice session with structured self-evaluation`,
                `Eliminate at least 80% of Day 1 identified weak areas through targeted drilling`,
                `Track and document OLQ improvement metrics per SSB simulation`
            ]
        };
    };

    // -------------------------------------------------------------------------
    // MODULE: SSB INIT — Session initialization based on type
    // -------------------------------------------------------------------------
    const buildSSBInitPayload = (type, user = {}) => {
        let prog = {};
        try { prog = JSON.parse(localStorage.getItem('vanguard_progression')) || { attempts: 0 }; } catch(e) {}
        const pressureTxt = prog.attempts > 1 ? " [PRESSURE MODE: Respond in 3-4 concise lines. Time is constrained.]" : "";

        const configs = {
            WAT: {
                tests: "Subconscious psychological mapping — immediate word association reveals dominant OLQ profile and emotional baseline under zero-preparation conditions.",
                approach: "Write the FIRST constructive, action-oriented sentence that comes to mind. Keep it to 5-7 words maximum. Positive framing is mandatory.",
                avoid: "Dictionary definitions. Use of 'should' or 'must'. Negative connotations. Clichés. Inspirational quotes.",
                question: `WAT Stimulus Word: RESPONSIBILITY${pressureTxt}`
            },
            SRT: {
                tests: "Practical intelligence, moral courage, and real-time decision-making under acute situational stress with incomplete information.",
                approach: "React practically and decisively. Assume normal resources. Prioritize life/mission, then team, then self. Complete the scenario definitively — no open endings.",
                avoid: "Superhuman or unrealistic solutions. Passing responsibility to others. Leaving scenarios unresolved. Over-deliberation.",
                question: prog.attempts > 2
                    ? `ADVANCED SCENARIO: You are leading a 12-man patrol in hostile terrain. GPS has failed, 2 team members are injured, communication equipment is damaged, and a potential ambush position has been spotted 200m ahead. Night is 30 minutes away.${pressureTxt}`
                    : `SCENARIO: You are travelling to your SSB interview. At a remote bus stop, you witness a road accident — a child is critically injured, the driver has fled, and there are no emergency services visible. Your SSB reporting time is in 2 hours.${pressureTxt}`
            },
            PI: {
                tests: "Holistic evaluation of all 15 OLQs through honest self-expression, structured reasoning, and authentic personal narrative.",
                approach: "Be completely truthful. Structure answers using STAR method (Situation, Task, Action, Result). Back every claim with a specific, verifiable example from your life.",
                avoid: "Fabricated examples. Generic praise for the armed forces. Rote-memorized model answers. Bragging without concrete evidence.",
                question: prog.attempts > 2
                    ? `INTENSIVE PI DIRECTIVE: Of all the failures or setbacks you have experienced in your life, which one fundamentally changed your character — and precisely how did it make you more suited for military service?${pressureTxt}`
                    : `OPENING DIRECTIVE: Introduce yourself comprehensively — your background, the specific moment you decided on a military career, and one real experience that proves you are ready for the rigour of service life.${pressureTxt}`
            }
        };

        const cfg = configs[type] || configs['PI'];
        return {
            module: 'SSB_INIT',
            session_type: type,
            pre_flight: {
                tests: cfg.tests,
                approach: cfg.approach,
                avoid: cfg.avoid
            },
            directive: cfg.question
        };
    };

    // -------------------------------------------------------------------------
    // MODULE: SSB EVALUATION — Deep OLQ-based psychological assessment
    // -------------------------------------------------------------------------
    const buildSSBEvalPayload = (answer, type, user = {}) => {
        let prog = {};
        try {
            prog = JSON.parse(localStorage.getItem('vanguard_progression')) || { attempts: 0, history: [] };
        } catch(e) { prog = { attempts: 0, history: [] }; }

        prog.attempts = (prog.attempts || 0) + 1;
        const wordCount = answer.trim().split(/\s+/).length;
        prog.history = prog.history || [];
        prog.history.push({ type, wordCount });
        if (prog.history.length > 5) prog.history.shift();

        try { localStorage.setItem('vanguard_progression', JSON.stringify(prog)); } catch(e) {}

        // Adaptive memory feedback
        const prevEntries = prog.history.slice(0, -1);
        let memory_feedback = "";
        if (prevEntries.length > 0) {
            const prevShort = prevEntries.filter(h => h.wordCount < 15).length;
            if (prevShort > 1 && wordCount < 15) {
                memory_feedback = "ADAPTIVE WARNING: Pattern detected across sessions — you consistently produce under-developed responses. This indicates systematic hesitation, not isolated shortcomings.";
            } else if (prevShort > 0 && wordCount >= 30) {
                memory_feedback = "POSITIVE TRAJECTORY NOTED: Compared to your previous shorter responses, there is measurable improvement in depth and commitment to the scenario.";
            }
        }

        const isShort = wordCount < 12;
        const isMedium = wordCount >= 12 && wordCount < 35;

        // Detailed OLQ mapping
        const olqEvals = (() => {
            if (type === 'WAT') {
                return {
                    strengths: [
                        "Rapid turnaround demonstrates high psychological availability and low cognitive latency.",
                        "Constructive framing indicates positive baseline emotional orientation."
                    ],
                    weaknesses: isShort
                        ? ["Response lacks actionable specificity — WAT requires a sentence, not a fragment.", "Generic response pattern indicates prepared rather than spontaneous cognition."]
                        : ["Sentence follows a safe, socially desirable template — lacks distinctive personal character.", "Minor tendency toward grand declarative statements rather than grounded, realistic action sentences."],
                    olqs_mapped: [
                        "Determination (Moderate) — Shows forward momentum but lacks conviction in execution framing.",
                        "Sense of Responsibility (Moderate) — Duty-orientation evident but not deeply anchored in personal narrative.",
                        "Power of Expression (Low-Moderate) — Grammatically correct but lacks precision and originality."
                    ],
                    behavioral_insight: memory_feedback || (isShort
                        ? "The candidate's minimal response suggests a WAT preparation gap — responses appear calculated for safety rather than spontaneous authenticity. A trained IO/Psychologist will recognize this as guarded projection."
                        : "The response follows a socially acceptable, predictable trajectory. While technically acceptable, it fails to differentiate the candidate's psychological profile. True spontaneity requires vulnerability and specificity, not general positivity."),
                    improved_answer: `Optimal WAT response format — embed real action and ownership: 'I accept every responsibility as a direct leadership test.' Specificity and first-person ownership are critical differentiators.`,
                    next_directive: "Next WAT Word: FAILURE",
                    final_judgment: {
                        readiness: isShort ? "Low" : "Moderate",
                        risk_factor: isShort ? "High — avoidance pattern detected" : "Low — generic but acceptable",
                        action: isShort ? "Practice WAT under strict 6-second timer without deliberation." : "Introduce personal specificity — avoid universally applicable statements.",
                        ai_confidence: isShort ? "84%" : "91%"
                    }
                };
            } else if (type === 'SRT') {
                return {
                    strengths: isShort
                        ? ["Demonstrates bias for immediate action — a core military trait."]
                        : [
                            "Exhibits logical sequencing of emergency priorities: life safety first, mission second.",
                            "Demonstrates willingness to take direct command responsibility under ambiguity.",
                            "Maintains practical resource orientation without resorting to unrealistic solutions."
                        ],
                    weaknesses: isShort
                        ? ["No evidence of secondary consequence management — tunnel vision on singular action.", "Complete absence of team resource allocation and delegation — critical SRT failure point.", "Response does not address scenario resolution — leaves the situation operationally incomplete."]
                        : ["Lacks explicit delegation of sub-tasks to team members — centralizes all execution.", "No contingency framing for alternative outcomes — rigid single-path approach.", "Could strengthen time-management anchors (e.g., '...and reassess in 5 minutes')."],
                    olqs_mapped: [
                        `Reasoning Ability (${isShort ? 'Low' : 'High'}) — ${isShort ? 'Fails to apply multi-step logical sequencing to the situation.' : 'Demonstrated systematic breakdown of the tactical situation framework.'}`,
                        `Speed of Decision (${isShort ? 'Very Low' : 'High'}) — ${isShort ? 'Minimal actionable decisions made despite clear situational cues.' : 'Decisive response within expected operational time frame.'}`,
                        `Courage (${isMedium ? 'Moderate' : isShort ? 'Low' : 'High'}) — Willingness to engage the primary challenge indicated.`,
                        `Organising Ability (${isShort ? 'Not Demonstrable' : 'Moderate'}) — ${isShort ? 'No division of tasks or resource management demonstrated.' : 'Some delegation evident but not fully systematic across all team assets.'}`
                    ],
                    behavioral_insight: memory_feedback || (isShort
                        ? "Critical pattern: The candidate reveals a single-variable processing tendency — they focus on one dominant stressor while ignoring systemic secondary effects. Under operational pressure, this translates to tunnel vision that can compromise the entire team's safety envelope."
                        : "The candidate demonstrates solid foundational situational awareness and a healthy command instinct. The primary development area is transitioning from individual action to coordinated team-based solutions — a shift that separates a good soldier from a capable officer."),
                    improved_answer: `Model SRT response structure: Immediate action → Delegate → Communicate → Contingency. Example: 'I would immediately establish a 360° defensive perimeter, assign my 2IC to triage the injured, attempt alternate VHF comms with base, and develop a flanking route to bypass the suspected ambush position. I would designate rally points every 200m and move at dusk to leverage low-light concealment.'`,
                    next_directive: "NEXT SRT SCENARIO: You are the senior cadet at an NDA leadership camp. A junior cadet has a serious allergic reaction and the medical kit is 3km away. Two other cadets are showing symptoms of heat exhaustion. What do you do?",
                    final_judgment: {
                        readiness: isShort ? "Low" : isMedium ? "Moderate" : "High",
                        risk_factor: isShort ? "High — incomplete executive function under stress" : "Moderate — resource delegation gap",
                        action: isShort ? "Practice SRT with mandatory full-scenario resolution — no response accepted until all secondary effects addressed." : "Drill delegation framing explicitly — every SRT response must contain role assignments.",
                        ai_confidence: isShort ? "87%" : "94%"
                    }
                };
            } else { // PI
                return {
                    strengths: [
                        "Demonstrates structural coherence — able to organize personal narrative under evaluative pressure.",
                        "Willingness to be introspective indicates psychological self-awareness, a key OLQ marker.",
                        wordCount > 40 ? "Depth of response shows genuine engagement rather than rote performance." : "Response prioritizes direct communication."
                    ],
                    weaknesses: isShort
                        ? ["Response is insufficiently substantiated — lacks verifiable real-life examples.", "Vague generalisations without specificity will be challenged by experienced IO panels.", "No OLQ demonstration through lived experience — critical flaw in PI evaluation."]
                        : ["Some statements lack concrete supporting evidence from personal experience.", "Could strengthen authenticity by introducing a specific failure or setback overcome.", "Risk of appearing rehearsed if response covers only positive achievements without acknowledging real challenges."],
                    olqs_mapped: [
                        `Effective Intelligence (${isShort ? 'Non-demonstrable' : 'High'}) — ${isShort ? 'Insufficient data to assess cognitive depth.' : 'Shows multi-dimensional reasoning about self and situational context.'}`,
                        `Power of Expression (${isShort ? 'Low' : 'Moderate-High'}) — ${isShort ? 'Insufficient content to evaluate linguistic precision.' : 'Clear articulation with structured argumentation evident.'}`,
                        `Self-Confidence (${isShort ? 'Low' : 'Moderate'}) — ${isShort ? 'Limited content suggests hesitance to commit to a position.' : 'Comfortable with self-assessment, though could project more decisiveness.'}`,
                        `Integrity (${wordCount > 40 ? 'High' : 'Moderate'}) — ${wordCount > 40 ? 'Response appears authentic and consistent with verifiable life experience.' : 'Difficult to assess fully from response length and specificity provided.'}`
                    ],
                    behavioral_insight: memory_feedback || (isShort
                        ? "The candidate demonstrates a systemic avoidance of personal vulnerability — answers stay at a surface level, avoiding the specific life experiences that form the bedrock of authentic PI evaluation. Experienced IO/Psychologists will probe precisely the areas the candidate avoids. Evasion is a red flag, not a protection."
                        : "The candidate shows reasonable self-awareness and structural capability. The critical next step is weaving tangible, verifiable experiences into every claim. 'I am determined' is an assertion; 'When I failed my XII board paper and rebuilt my study methodology over 6 months' is evidence. The IO panel wants the latter."),
                    improved_answer: `Model PI structure using STAR: 'During my Class XII preparation, I failed my first Physics mock by 22%. Rather than seeking tuition (the easy path), I spent 3 weeks rebuilding my fundamentals from first principles. I scored 91% in boards. This taught me that adversity is data — the military will present far greater adversity, and I know exactly how I process and recover from it.'`,
                    next_directive: "FOLLOW-UP DIRECTIVE: Describe the single biggest failure in your academic or personal life and explain precisely how it prepared you for military service.",
                    final_judgment: {
                        readiness: isShort ? "Low" : isMedium ? "Moderate" : "High",
                        risk_factor: isShort ? "High — IO will probe gaps aggressively" : "Low-Moderate — authenticity check required",
                        action: isShort ? "Prepare 5 STAR-format personal stories covering each major OLQ area." : "Introduce failure/setback narratives — they build more credibility than success stories.",
                        ai_confidence: isShort ? "82%" : wordCount > 40 ? "96%" : "89%"
                    }
                };
            }
        })();

        return {
            module: 'SSB_EVAL',
            session_type: type,
            word_count: wordCount,
            evaluation: olqEvals
        };
    };

    // =========================================================================
    // PUBLIC API — The only interface features.js and api.js should use
    // =========================================================================
    return {
        buildMCQPayload,
        buildCurrentAffairsPayload,
        buildStudyPlanPayload,
        buildSSBInitPayload,
        buildSSBEvalPayload,

        // Metadata for render engine
        MODES: {
            MCQ: 'MCQ',
            CURRENT_AFFAIRS: 'CURRENT_AFFAIRS',
            PLANNER: 'PLANNER',
            SSB_INIT: 'SSB_INIT',
            SSB_EVAL: 'SSB_EVAL'
        }
    };

})();

window.VanguardPromptEngine = PromptEngine;
