// =============================================================================
// PACK CREATOR — Quiz Snake Pre-Start Logic
// =============================================================================
//
// PURPOSE:
//   Controls the pre-start overlay that appears before the snake game.
//   Lets the user either play the default AI EU Act quiz pack, or create a
//   custom quiz pack from any source material using LLM generation.
//
// ARCHITECTURE:
//   This file runs CLIENT-SIDE in the browser. It does NOT contain the LLM.
//   Instead, it calls the fraud-detector FastAPI backend which handles the
//   actual LLM call server-side (keeping the API key safe).
//
//   Flow:
//     1. User pastes source text
//     2. This script POSTs to http://localhost:8000/generate_quiz_pack
//     3. The backend uses Groq (llama-3.3-70b-versatile) to generate questions
//     4. Questions are returned in the same format as quiz-bank.json
//     5. We inject them into window.selectedQuestionPack
//     6. The snake game reads from that variable instead of the default pack
//
// FALLBACK:
//   If the API is unreachable (e.g., fraud-detector server not running),
//   we fall back to a client-side simulation that extracts sentences from
//   the source text and wraps them in simple true/false questions.
//   This ensures the demo always works, even offline.
//
// LLM BACKEND:
//   See: fraud-detector/app.py → POST /generate_quiz_pack
//   Uses the SAME Groq API key and robust_api_call() as fraud explanations.
//
// RELATED FILES:
//   - pages/play-me/index.html         → HTML structure for the overlay
//   - assets/css/pages-play-me.css     → Overlay styling
//   - assets/js/quiz-snake.js          → Snake game (reads selectedQuestionPack)
//   - assets/data/quiz-bank.json       → Default question pack (AI EU Act)
//
// =============================================================================

// ---------------------------------------------------------------------------
// CONFIGURATION
// ---------------------------------------------------------------------------

/**
 * API endpoint for quiz pack generation.
 * Points to the fraud-detector FastAPI backend which runs on port 8000.
 * 
 * In production, this would point to the deployed HuggingFace Space:
 * https://YOUR_USERNAME-YOUR_SPACE_NAME.hf.space/generate_quiz_pack
 */
const QUIZ_API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? "http://localhost:8000/generate_quiz_pack"
    : "https://mynameistatibond-fraud-detector.hf.space/generate_quiz_pack";

/**
 * Number of questions to request from the LLM.
 * The snake game uses 100 questions across 10 levels (10 per level).
 */
const QUIZ_QUESTION_COUNT = 100;


// ---------------------------------------------------------------------------
// STATE
// ---------------------------------------------------------------------------

/**
 * Global variable that the snake game reads from.
 * - null = use default quiz-bank.json (loaded by quiz-snake.js)
 * - array = use this custom pack instead
 */
window.selectedQuestionPack = null;

/**
 * Stores the most recently generated custom pack.
 * Kept separate from selectedQuestionPack so the user can review before launching.
 */
window.customPackGenerated = null;


// ---------------------------------------------------------------------------
// STATE MANAGEMENT (UI)
// ---------------------------------------------------------------------------

/**
 * Switch between overlay states: select, input, loading, review.
 * Each state is a div with class 'pack-state'. Only the active one is visible.
 * 
 * @param {string} stateId - One of: 'select', 'input', 'loading', 'review'
 */
function showPackState(stateId) {
    document.querySelectorAll('.pack-state').forEach(el => el.classList.remove('active'));
    const target = document.getElementById('pack-state-' + stateId);
    if (target) target.classList.add('active');
}

/**
 * Hide the entire pack overlay and show the game UI.
 * Called when the user has chosen a pack and is ready to play.
 */
function hidePackOverlay() {
    const overlay = document.getElementById('pack-overlay');
    if (overlay) overlay.style.display = 'none';

    // Reveal the hidden game elements
    const hud = document.getElementById('game-hud');
    if (hud) hud.style.display = '';

    const canvasContainer = document.getElementById('canvas-container');
    if (canvasContainer) canvasContainer.style.display = '';

    const controlsHint = document.getElementById('game-controls-hint');
    if (controlsHint) controlsHint.style.display = '';
}


// ---------------------------------------------------------------------------
// LAUNCH PATHS
// ---------------------------------------------------------------------------

/**
 * PATH A: Play with the default AI EU Act quiz pack.
 * Sets selectedQuestionPack to null, which tells quiz-snake.js to load
 * the default quiz-bank.json file.
 */
function launchDefault() {
    window.selectedQuestionPack = null;
    hidePackOverlay();
}

/**
 * PATH B: Play with a user-generated custom pack.
 * Sets selectedQuestionPack to the generated array, which quiz-snake.js
 * will use instead of fetching quiz-bank.json.
 */
function launchCustom() {
    if (!window.customPackGenerated || window.customPackGenerated.length === 0) return;
    window.selectedQuestionPack = window.customPackGenerated;
    hidePackOverlay();
}


// ---------------------------------------------------------------------------
// CUSTOM PACK GENERATION
// ---------------------------------------------------------------------------

/**
 * Main generation function. Called when user clicks "Generate 100 Questions".
 * 
 * Strategy:
 *   1. Try the real API (fraud-detector backend → Groq LLM)
 *   2. If API is unreachable, fall back to client-side simulation
 * 
 * The user sees a loading spinner during generation (~5-15 seconds for LLM).
 */
async function generateCustomPack() {
    const sourceText = document.getElementById('pack-source-text').value.trim();

    // Validate minimum input
    if (!sourceText || sourceText.length < 50) {
        alert('Please paste at least a few paragraphs of source material.');
        return;
    }

    // Show loading state
    showPackState('loading');

    let pack = null;
    let usedSimulation = false;

    // -----------------------------------------------------------------------
    // ATTEMPT 1: Call the real LLM API (Groq via fraud-detector backend)
    // -----------------------------------------------------------------------
    try {
        const response = await fetch(QUIZ_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                source_text: sourceText,
                num_questions: QUIZ_QUESTION_COUNT
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `API error: ${response.status}`);
        }

        const data = await response.json();

        // Validate the response structure
        if (data.questions && Array.isArray(data.questions) && data.questions.length >= 5) {
            pack = data.questions;
            console.log(
                `✅ Quiz pack generated via ${data.meta?.provider || 'API'} ` +
                `(${data.meta?.model || 'unknown'}): ${pack.length} questions`
            );
        } else {
            throw new Error('API returned insufficient questions');
        }

    } catch (apiError) {
        // -----------------------------------------------------------------------
        // ATTEMPT 2: Fall back to client-side simulation
        // -----------------------------------------------------------------------
        console.warn('⚠️ LLM API unavailable, using client-side simulation:', apiError.message);
        console.info(
            'To enable real LLM generation, start the fraud-detector backend:\n' +
            '  cd fraud-detector && uvicorn app:app --reload --port 8000\n' +
            'Requires GROQ_API_KEY in fraud-detector/.env'
        );

        // Simulate a short delay to feel realistic
        await new Promise(resolve => setTimeout(resolve, 1500));
        pack = generateSimulatedPack(sourceText);
        usedSimulation = true;
    }

    // Store the generated pack
    window.customPackGenerated = pack;

    // -----------------------------------------------------------------------
    // BUILD PREVIEW UI
    // -----------------------------------------------------------------------
    const previewEl = document.getElementById('pack-preview');
    const countEl = document.getElementById('pack-count');
    countEl.textContent = pack.length;

    let previewHTML = '';

    // Show a notice if we used the simulation fallback
    if (usedSimulation) {
        previewHTML += `
            <div class="pack-preview-card" style="border-color: var(--clr-plot-vermilion, #E53935); background: rgba(229,57,53,0.05);">
                <div class="pack-preview-q" style="color: var(--clr-plot-vermilion, #E53935);">
                    ⚠️ Demo mode — using simulated questions (LLM backend not running)
                </div>
                <div class="pack-preview-answers" style="font-size: 0.75rem; color: var(--clr-text-muted);">
                    Start the fraud-detector server for real AI-generated questions.
                </div>
            </div>`;
    }

    // Preview first 3 questions (just a taste — full review via editor)
    const previewCount = Math.min(3, pack.length);
    for (let i = 0; i < previewCount; i++) {
        const q = pack[i];
        previewHTML += `
            <div class="pack-preview-card">
                <div class="pack-preview-q">${q.prompt}</div>
                <div class="pack-preview-answers">
                    <span class="pack-preview-a ${q.correctIndex === 0 ? 'correct' : ''}">A: ${q.options[0]}</span>
                    <span class="pack-preview-a ${q.correctIndex === 1 ? 'correct' : ''}">B: ${q.options[1]}</span>
                </div>
            </div>`;
    }

    if (pack.length > previewCount) {
        previewHTML += `<div class="pack-preview-more">... and ${pack.length - previewCount} more questions</div>`;
    }

    previewEl.innerHTML = previewHTML;

    // Show review state
    showPackState('review');
}


// ---------------------------------------------------------------------------
// SIMULATION FALLBACK (client-side, no LLM required)
// ---------------------------------------------------------------------------
//
// This is a DEMO fallback for when the fraud-detector backend is not running.
// It extracts sentences from the source text and creates simple true/false
// style questions. The questions are structurally valid for the snake game
// but not as high quality as LLM-generated ones.
//
// This ensures the Quiz Snake game always works, even without the backend.
// ---------------------------------------------------------------------------

/**
 * Generate a simulated question pack from source text.
 * Extracts sentences and wraps them in a true/false format.
 * 
 * @param {string} sourceText - Raw text content
 * @returns {Array} Array of question objects matching quiz-bank.json format
 */
function generateSimulatedPack(sourceText) {
    // Split into sentences (basic sentence boundary detection)
    const sentences = sourceText
        .replace(/\n+/g, ' ')
        .split(/(?<=[.!?])\s+/)
        .filter(s => s.length > 30 && s.length < 300)
        .map(s => s.trim());

    // Fallback: split by periods if sentence detection produced too few
    if (sentences.length < 5) {
        const fallback = sourceText.split('.').filter(s => s.trim().length > 20).map(s => s.trim() + '.');
        sentences.push(...fallback);
    }

    const pack = [];
    const usedSentences = new Set();

    // Generate up to 100 questions
    const targetCount = Math.min(100, Math.max(sentences.length, 20));

    for (let i = 0; i < targetCount && i < sentences.length * 3; i++) {
        const idx = i % sentences.length;
        if (usedSentences.has(idx) && pack.length >= sentences.length) continue;
        usedSentences.add(idx);

        const q = createQuestionFromSentence(sentences[idx], i);
        if (q) pack.push(q);

        if (pack.length >= 100) break;
    }

    // Pad with variations if we didn't get enough
    while (pack.length < Math.min(20, sentences.length)) {
        const idx = Math.floor(Math.random() * sentences.length);
        const q = createQuestionFromSentence(sentences[idx], pack.length + 100);
        if (q) pack.push(q);
    }

    return pack;
}

/**
 * Create a single question from a source sentence.
 * Uses the sentence as a "true" statement and generates a "false" alternative.
 * 
 * @param {string} sentence - A single sentence from the source
 * @param {number} seed - Used for deterministic variation
 * @returns {Object|null} Question object or null if sentence is too short
 */
function createQuestionFromSentence(sentence, seed) {
    let clean = sentence.replace(/^\s*[-•▪]\s*/, '').trim();
    if (clean.length < 25) return null;

    // Rotate through different question frame patterns
    const patterns = [
        { prefix: 'According to the source material: ', suffix: '' },
        { prefix: 'Is the following statement accurate? ', suffix: '' },
        { prefix: 'The source states: ', suffix: '' },
        { prefix: 'Based on the content provided: ', suffix: '' },
    ];
    const pattern = patterns[seed % patterns.length];

    // Truncate very long sentences
    if (clean.length > 150) {
        clean = clean.substring(0, 147) + '...';
    }

    const prompt = pattern.prefix + '"' + clean + '"';

    // Wrong answer options (rotated)
    const wrongAnswers = [
        'This is not stated in the source',
        'The source contradicts this claim',
        'This is inaccurate according to the text',
        'The source does not support this',
    ];

    // Alternate which answer slot gets the correct answer
    const correctFirst = seed % 2 === 0;

    return {
        prompt: prompt,
        options: correctFirst
            ? ['True — this is stated in the source', wrongAnswers[seed % wrongAnswers.length]]
            : [wrongAnswers[seed % wrongAnswers.length], 'True — this is stated in the source'],
        correctIndex: correctFirst ? 0 : 1
    };
}


// ---------------------------------------------------------------------------
// HUMAN-IN-THE-LOOP QUESTION EDITOR
// ---------------------------------------------------------------------------
//
// Allows the user to review ALL generated questions before playing.
// They can:
//   - Edit question text (prompt)
//   - Edit answer options (A and B)
//   - Toggle which answer is correct
//   - Delete bad questions entirely
//   - Save edits and launch the game with the curated set
//
// This ensures the LLM's output is human-verified before gameplay.
// ---------------------------------------------------------------------------

/**
 * Open the full question editor.
 * Builds an editable card for every question in the generated pack.
 * Hides the quick preview and shows the scrollable editor.
 */
function openEditor() {
    const pack = window.customPackGenerated;
    if (!pack || pack.length === 0) return;

    const listEl = document.getElementById('pack-editor-list');
    const editorEl = document.getElementById('pack-editor');
    const previewEl = document.getElementById('pack-preview');
    const actionsEl = document.getElementById('pack-review-actions');

    // Build editable cards for ALL questions
    let html = '';
    pack.forEach((q, i) => {
        html += `
            <div class="pack-editor-card" data-index="${i}" id="editor-card-${i}">
                <div class="pack-editor-num">${i + 1}.</div>
                <div class="pack-editor-body">
                    <input class="pack-editor-prompt" type="text"
                        value="${escapeAttr(q.prompt)}"
                        data-field="prompt" data-index="${i}" />
                    <div class="pack-editor-options">
                        <div class="pack-editor-option">
                            <span class="pack-editor-option-label">A:</span>
                            <input type="text" value="${escapeAttr(q.options[0])}"
                                data-field="optionA" data-index="${i}" />
                            <button class="pack-editor-correct-btn ${q.correctIndex === 0 ? 'is-correct' : ''}"
                                onclick="toggleCorrect(${i}, 0)" title="Mark A as correct">✓</button>
                        </div>
                        <div class="pack-editor-option">
                            <span class="pack-editor-option-label">B:</span>
                            <input type="text" value="${escapeAttr(q.options[1])}"
                                data-field="optionB" data-index="${i}" />
                            <button class="pack-editor-correct-btn ${q.correctIndex === 1 ? 'is-correct' : ''}"
                                onclick="toggleCorrect(${i}, 1)" title="Mark B as correct">✓</button>
                        </div>
                    </div>
                </div>
                <div class="pack-editor-actions">
                    <button class="pack-editor-delete" onclick="deleteEditorCard(${i})" title="Remove this question">✕</button>
                </div>
            </div>`;
    });

    listEl.innerHTML = html;

    // Show editor, hide preview and action buttons
    editorEl.style.display = 'block';
    previewEl.style.display = 'none';
    actionsEl.style.display = 'none';
}

/**
 * Close the editor and return to the quick preview.
 */
function closeEditor() {
    document.getElementById('pack-editor').style.display = 'none';
    document.getElementById('pack-preview').style.display = '';
    document.getElementById('pack-review-actions').style.display = '';
}

/**
 * Toggle which answer (A=0 or B=1) is marked correct for a question.
 * Updates both the visual state and the underlying data.
 */
function toggleCorrect(index, correctIdx) {
    // Update the underlying pack data
    if (window.customPackGenerated[index]) {
        window.customPackGenerated[index].correctIndex = correctIdx;
    }

    // Update visual state — find both buttons in this card
    const card = document.getElementById(`editor-card-${index}`);
    if (!card) return;
    const buttons = card.querySelectorAll('.pack-editor-correct-btn');
    buttons.forEach((btn, i) => {
        btn.classList.toggle('is-correct', i === correctIdx);
    });
}

/**
 * Delete a question card from the editor.
 * Removes the card from DOM and marks it for deletion on save.
 */
function deleteEditorCard(index) {
    const card = document.getElementById(`editor-card-${index}`);
    if (card) {
        card.style.opacity = '0';
        card.style.transform = 'translateX(30px)';
        card.style.transition = 'opacity 0.2s, transform 0.2s';
        setTimeout(() => card.remove(), 200);
    }
    // Mark as null — filtered out on save
    if (window.customPackGenerated[index]) {
        window.customPackGenerated[index] = null;
    }
}

/**
 * Read all edited values from the editor inputs, build the final pack,
 * and launch the game with the curated set.
 */
function saveEditsAndPlay() {
    const cards = document.querySelectorAll('.pack-editor-card');
    const editedPack = [];

    cards.forEach(card => {
        const idx = parseInt(card.dataset.index);
        const original = window.customPackGenerated[idx];
        if (!original) return; // was deleted

        const prompt = card.querySelector('[data-field="prompt"]').value.trim();
        const optionA = card.querySelector('[data-field="optionA"]').value.trim();
        const optionB = card.querySelector('[data-field="optionB"]').value.trim();

        // Determine correct index from the button states
        const buttons = card.querySelectorAll('.pack-editor-correct-btn');
        let correctIndex = 0;
        buttons.forEach((btn, i) => {
            if (btn.classList.contains('is-correct')) correctIndex = i;
        });

        // Only include questions with valid content
        if (prompt && optionA && optionB) {
            editedPack.push({
                prompt: prompt,
                options: [optionA, optionB],
                correctIndex: correctIndex
            });
        }
    });

    if (editedPack.length < 5) {
        alert(`Only ${editedPack.length} questions remaining. You need at least 5 to play.`);
        return;
    }

    // Update the stored pack with edits
    window.customPackGenerated = editedPack;
    console.log(`✏️ Editor: saved ${editedPack.length} questions (human-reviewed)`);

    // Update the count display
    const countEl = document.getElementById('pack-count');
    if (countEl) countEl.textContent = editedPack.length;

    // Launch the game
    launchCustom();
}

/**
 * Escape HTML attribute characters to prevent XSS in input values.
 */
function escapeAttr(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
