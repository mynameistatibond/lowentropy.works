document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("game-canvas");
    const ctx = canvas.getContext("2d");
    const overlay = document.getElementById("game-overlay");
    const livesEl = document.getElementById("lives-count");
    const scoreEl = document.getElementById("score-count");
    const questionEl = document.getElementById("hud-question");

    // Dynamic Sizing
    let cellSizeX = 30;
    let cellSizeY = 30;
    let gridWidth = 40;
    let gridHeight = 28;

    function resizeCanvas() {
        const container = document.getElementById("canvas-container");
        const maxWidth = container.clientWidth;
        const maxHeight = container.clientHeight;

        if (maxWidth === 0 || maxHeight === 0) return;

        let targetCellSize = 32;
        if (maxWidth < 800) targetCellSize = 24;
        if (maxWidth < 500) targetCellSize = 18;

        // How many cells fit
        gridWidth = Math.max(10, Math.floor(maxWidth / targetCellSize));
        gridHeight = Math.max(10, Math.floor(maxHeight / targetCellSize));

        cellSizeX = maxWidth / gridWidth;
        cellSizeY = maxHeight / gridHeight;

        canvas.width = maxWidth;
        canvas.height = maxHeight;
        canvas.style.width = `${maxWidth}px`;
        canvas.style.height = `${maxHeight}px`;

        // Keep snake in bounds if resized while playing
        if (snake.length > 0) {
            for (let s of snake) {
                if (s.x >= gridWidth) s.x = gridWidth - 1;
                if (s.y >= gridHeight) s.y = gridHeight - 1;
                if (s.x < 0) s.x = 0;
                if (s.y < 0) s.y = 0;
            }
        }
    }

    const containerObj = document.getElementById("canvas-container");
    const resizeObserver = new ResizeObserver(() => {
        if (gameState === "RUNNING" && performance.now() - gameStartTime > 500) {
            togglePause(); // Auto-pause on genuine user resize, not startup reflow
        }
        resizeCanvas();
        draw();
    });
    if (containerObj) resizeObserver.observe(containerObj);

    document.addEventListener("componentsLoaded", () => {
        resizeCanvas();
        draw();
    });

    // Game State
    let gameState = "MENU"; // MENU, RUNNING, GAME_OVER, PAUSED, LEVEL_UP, VICTORY
    let tickMs = 260; // Default speed
    let lastTime = 0;
    let accumulator = 0;
    let gameStartTime = 0; // timestamp when game last entered RUNNING — blocks immediate re-pause

    // Particle System (Exploding Hearts)
    let domParticles = [];

    // Quiz State
    let currentQuestion = null;
    let answersOnBoard = [];
    let quizData = [];
    let remainingQuestions = [];
    let isLoaded = false;

    // Load Quiz Database
    function loadQuizData() {
        // Check if a custom pack was injected by pack-creator
        if (window.selectedQuestionPack && window.selectedQuestionPack.length > 0) {
            quizData = window.selectedQuestionPack;
            remainingQuestions = [...quizData];
            isLoaded = true;
            if (gameState === "MENU") {
                document.getElementById("overlay-subtitle").innerHTML = 'Press <span class="key-hint">Space</span> to start';
            }
            return;
        }

        // Default: load from quiz-bank.json
        fetch("../../assets/data/quiz-bank.json")
            .then(response => response.json())
            .then(data => {
                quizData = data;
                remainingQuestions = [...quizData];
                isLoaded = true;
                if (gameState === "MENU") {
                    document.getElementById("overlay-subtitle").innerHTML = 'Press <span class="key-hint">Space</span> to start';
                }
            })
            .catch(err => console.error("Failed to load quiz bank:", err));
    }

    // Check if the pack overlay is still showing
    function isPackOverlayActive() {
        const overlay = document.getElementById('pack-overlay');
        return overlay && overlay.style.display !== 'none';
    }

    function spawnNextQuestion() {
        if (quizData.length === 0) return; // Prevent spawning if JSON hasn't loaded

        if (remainingQuestions.length === 0) {
            remainingQuestions = [...quizData];
            remainingQuestions.sort(() => Math.random() - 0.5);
        }

        const qIndex = Math.floor(Math.random() * remainingQuestions.length);
        // Clone the question so we don't mutate the original array when shuffling options
        currentQuestion = JSON.parse(JSON.stringify(remainingQuestions.splice(qIndex, 1)[0]));

        // Randomly assign the correct answer to A (index 0) or B (index 1)
        if (Math.random() > 0.5) {
            // Swap the text options
            let temp = currentQuestion.options[0];
            currentQuestion.options[0] = currentQuestion.options[1];
            currentQuestion.options[1] = temp;

            // Toggle the correctIndex (0 becomes 1, 1 becomes 0)
            currentQuestion.correctIndex = 1 - currentQuestion.correctIndex;
        }

        questionEl.innerHTML = `<strong>${currentQuestion.prompt}</strong> <br> <span style="font-size: 0.85em; color: var(--clr-text-muted);">A: ${currentQuestion.options[0]} &nbsp;&nbsp;|&nbsp;&nbsp; B: ${currentQuestion.options[1]}</span>`;

        answersOnBoard = [];
        const head = snake[0];
        let retries = 0;
        while (answersOnBoard.length < 2 && retries < 100) {
            const rx = Math.floor(Math.random() * gridWidth);
            const ry = Math.floor(Math.random() * gridHeight);

            let isOnSnake = false;
            for (let s of snake) if (s.x === rx && s.y === ry) isOnSnake = true;

            let distToHead = Math.abs(head.x - rx) + Math.abs(head.y - ry);
            if (distToHead < 4) isOnSnake = true;

            if (answersOnBoard.length === 1) {
                let distToOther = Math.abs(answersOnBoard[0].x - rx) + Math.abs(answersOnBoard[0].y - ry);
                if (distToOther < 6) isOnSnake = true;
            }

            if (!isOnSnake) {
                // Ensure we place exactly one 'A' and one 'B'
                let textToPlace = answersOnBoard.length === 0 ? "A" : "B";
                answersOnBoard.push({
                    x: rx,
                    y: ry,
                    text: textToPlace,
                    isCorrect: (textToPlace === "A" && currentQuestion.correctIndex === 0) ||
                        (textToPlace === "B" && currentQuestion.correctIndex === 1)
                });
            }
            retries++;
        }

        // Failsafe if grid is too small or crowded to spawn both points
        if (answersOnBoard.length === 1) {
            let emergencyText = answersOnBoard[0].text === "A" ? "B" : "A";
            answersOnBoard.push({
                x: 0,
                y: 0,
                text: emergencyText,
                isCorrect: (emergencyText === "A" && currentQuestion.correctIndex === 0) ||
                    (emergencyText === "B" && currentQuestion.correctIndex === 1)
            })
        }
    }
    // Player State
    let snake = [];
    let direction = { dx: 1, dy: 0 };
    let pendingDirection = null;
    let growthQueue = 0;
    let lives = 5;
    let score = 0;

    // Colors
    function getThemeColor(varName, fallback) {
        return getComputedStyle(document.body).getPropertyValue(varName).trim() || fallback;
    }

    // Inputs
    document.addEventListener("keydown", (e) => {
        // Prevent default scrolling for arrows and space
        if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].indexOf(e.code) > -1) {
            e.preventDefault();
        }

        if (gameState === "MENU" || gameState === "VICTORY") {
            if (e.code === "Space" || e.code === "Enter") {
                if (!isLoaded || isPackOverlayActive()) return;
                startGame();
            }
            return;
        }

        if (gameState === "GAME_OVER") {
            if (e.code === "Space" || e.code === "Enter") {
                resetToMenu();
            }
            return;
        }

        if (gameState === "LEVEL_UP") {
            if (e.code === "Space" || e.code === "Enter") {
                startNextLevel();
            }
            return;
        }

        if (gameState === "PAUSED") {
            if (e.code === "Space") {
                togglePause();
            }
            return;
        }

        if (gameState === "RUNNING") {
            if (e.code === "Space") {
                // Block pause for 300ms after game starts to absorb the triggering keypress
                if (performance.now() - gameStartTime > 300) {
                    togglePause();
                }
                return;
            }
            if (e.code === "ArrowUp" || e.code === "KeyW") {
                if (direction.dy === 0) pendingDirection = { dx: 0, dy: -1 };
            } else if (e.code === "ArrowDown" || e.code === "KeyS") {
                if (direction.dy === 0) pendingDirection = { dx: 0, dy: 1 };
            } else if (e.code === "ArrowLeft" || e.code === "KeyA") {
                if (direction.dx === 0) pendingDirection = { dx: -1, dy: 0 };
            } else if (e.code === "ArrowRight" || e.code === "KeyD") {
                if (direction.dx === 0) pendingDirection = { dx: 1, dy: 0 };
            }
        }
    });

    // Touch Inputs
    let touchStartX = 0;
    let touchStartY = 0;

    canvas.addEventListener('touchstart', function (e) {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
        if (gameState !== "RUNNING") e.preventDefault();
    }, { passive: false });

    canvas.addEventListener('touchend', function (e) {
        if (gameState !== "RUNNING") {
            if (gameState === "MENU" || gameState === "VICTORY") {
                if (isLoaded && !isPackOverlayActive()) startGame();
            }
            else if (gameState === "GAME_OVER") resetToMenu();
            else if (gameState === "LEVEL_UP") startNextLevel();
            return;
        }

        let touchEndX = e.changedTouches[0].screenX;
        let touchEndY = e.changedTouches[0].screenY;

        let dx = touchEndX - touchStartX;
        let dy = touchEndY - touchStartY;

        if (Math.abs(dx) > Math.abs(dy)) {
            // Horizontal swipe
            if (dx > 30 && direction.dx === 0) pendingDirection = { dx: 1, dy: 0 };
            else if (dx < -30 && direction.dx === 0) pendingDirection = { dx: -1, dy: 0 };
        } else {
            // Vertical swipe
            if (dy > 30 && direction.dy === 0) pendingDirection = { dx: 0, dy: 1 };
            else if (dy < -30 && direction.dy === 0) pendingDirection = { dx: 0, dy: -1 };
        }
    }, { passive: true });

    function initSnake() {
        snake = [
            { x: Math.floor(gridWidth / 2), y: Math.floor(gridHeight / 2) },
            { x: Math.floor(gridWidth / 2) - 1, y: Math.floor(gridHeight / 2) },
            { x: Math.floor(gridWidth / 2) - 2, y: Math.floor(gridHeight / 2) }
        ];
        direction = { dx: 1, dy: 0 };
        pendingDirection = null;
        growthQueue = 0;
    }

    function startGame() {
        resizeCanvas();
        initSnake();
        lives = 5;
        score = 0;
        level = 1;
        tickMs = 260;
        updateHUD();
        overlay.classList.add("hidden");
        gameState = "RUNNING";
        gameStartTime = performance.now(); // arm the pause guard

        remainingQuestions = [...quizData];
        remainingQuestions.sort(() => Math.random() - 0.5);
        spawnNextQuestion();

        lastTime = performance.now();
        accumulator = 0;
        requestAnimationFrame(gameLoop);
    }

    function resetToMenu() {
        gameState = "MENU";
        overlay.classList.remove("hidden");
        document.getElementById("overlay-title").innerText = "Quiz Snake";
        document.getElementById("overlay-subtitle").innerHTML = 'Press <span class="key-hint">Space</span> to start';
        draw();
    }

    function togglePause() {
        if (gameState === "RUNNING") {
            gameState = "PAUSED";
            overlay.classList.remove("hidden");
            document.getElementById("overlay-title").innerText = "Paused";
            document.getElementById("overlay-subtitle").innerHTML = 'Press <span class="key-hint">Space</span> to resume';
            draw();
        } else if (gameState === "PAUSED") {
            gameState = "RUNNING";
            overlay.classList.add("hidden");
            lastTime = performance.now(); // Reset time to avoid massive delta
            requestAnimationFrame(gameLoop);
        }
    }

    // Helper: detect if playing a custom quiz pack
    function isCustomPack() {
        return window.selectedQuestionPack && window.selectedQuestionPack.length > 0;
    }

    function levelUp() {
        gameState = "LEVEL_UP";
        overlay.classList.remove("hidden");

        // --- EU AI Act themed messages (default pack) ---
        const aiActMessages = {
            1: `10 correct answers.<br>You are now Mildly Compliant.<br><br>Press Space to continue your bureaucratic awakening.`,
            2: `You survived basic transparency obligations.<br>You are now Provisionally Lawful.<br><br>Press Space to escalate responsibility.`,
            3: `Annex III is no longer staring at you menacingly.<br>Status: Risk-Aware Entity.<br><br>Press Space before the Commission notices.`,
            4: `You can now distinguish high-risk from "just vibes."<br>Certification: Conformity-Curious.<br><br>Press Space to submit your mental CE mark.`,
            5: `You avoided prohibited practices. Impressive.<br>Title unlocked: Fundamental Rights Adjacent.<br><br>Press Space to continue regulatory ascension.`,
            6: `Systemic risk no longer scares you.<br>Rank achieved: FLOP Literate.<br><br>Press Space before we calculate your compute.`,
            7: `You now understand provider vs deployer liability.<br>Status: Structurally Sound Human.<br><br>Press Space to proceed with oversight.`,
            8: `You spotted the filter provision trap.<br>Designation: Annex Whisperer.<br><br>Press Space to enter advanced compliance.`,
            9: `You navigated sanctions without blinking.<br>Promotion: Dissuasion-Grade Intelligence.<br><br>Press Space for final review.`
        };

        // --- Generic knowledge-themed messages (custom packs) ---
        const customMessages = {
            1: `10 correct answers. Not bad for a warm-up.<br>Status: Casually Informed.<br><br>Press Space to level up.`,
            2: `You're starting to remember things you never thought you'd need.<br>Rank: Pub Quiz Contender.<br><br>Press Space to continue.`,
            3: `Your brain is firing on all cylinders now.<br>Title unlocked: Knowledge Sponge.<br><br>Press Space to absorb more.`,
            4: `The snake grows. Your confidence grows faster.<br>Designation: Walking Encyclopedia.<br><br>Press Space to keep climbing.`,
            5: `Halfway through. You're officially dangerous at trivia night.<br>Status: Certified Know-It-All.<br><br>Press Space to prove it.`,
            6: `Six levels deep and still standing.<br>Achievement: Relentless Learner.<br><br>Press Space to push further.`,
            7: `Most people gave up five levels ago.<br>Title: Suspiciously Well-Read.<br><br>Press Space for the final stretch.`,
            8: `Your snake is a worm of knowledge now.<br>Rank: Senior Scholar Serpent.<br><br>Press Space to enter the finals.`,
            9: `One more level. Just one.<br>You can feel the victory screen from here.<br><br>Press Space for the grand finale.`
        };

        const messages = isCustomPack() ? customMessages : aiActMessages;
        document.getElementById("overlay-title").innerText = `Level ${level} Complete!`;

        // Wrap "Press Space" in all level up messages
        let msg = messages[level] || `You answered 10 questions correctly.<br><br>Press Space to start Level ${level + 1}`;
        msg = msg.replace(/Press Space/gi, "Press <span class='key-hint'>Space</span>");

        document.getElementById("overlay-subtitle").innerHTML = msg;
        draw();
    }

    function startNextLevel() {
        // Preserve the accumulated snake length — only reset position & direction
        const savedLength = snake.length + growthQueue;
        initSnake();
        // Restore the extra tail segments beyond the default 3
        if (savedLength > 3) {
            const tail = snake[snake.length - 1];
            for (let i = 3; i < savedLength; i++) {
                snake.push({ x: tail.x - i + 2, y: tail.y });
            }
        }

        level++;

        const speedMap = {
            1: 260, 2: 250, 3: 240, 4: 230,
            5: 220, 6: 200, 7: 190, 8: 180,
            9: 170, 10: 145
        };
        tickMs = speedMap[level] || 145;

        updateHUD();
        overlay.classList.add("hidden");
        gameState = "RUNNING";
        gameStartTime = performance.now(); // arm the pause guard for the new level
        spawnNextQuestion();

        lastTime = performance.now();
        accumulator = 0;
        requestAnimationFrame(gameLoop);
    }

    function victory() {
        gameState = "VICTORY";
        overlay.classList.remove("hidden");

        let html = `Score: ${score}<br>Level Reached: ${level}<br><br>`;

        if (isCustomPack()) {
            document.getElementById("overlay-title").innerText = "Quiz Mastery Complete";
            html += `You devoured every question the LLM threw at you.<br>`;
            html += `100 answers. 10 levels. One relentless snake.<br><br>`;
            html += `Press Space to run it again.`;
        } else {
            document.getElementById("overlay-title").innerText = "AI Act Survival Complete";
            html += `Full regulatory survival achieved.<br>`;
            html += `You demonstrated structural understanding of the EU AI Act.<br><br>`;
            html += `Press Space to run the simulation again.`;
        }

        document.getElementById("overlay-subtitle").innerHTML = html;
        draw();
    }

    function gameOver() {
        gameState = "GAME_OVER";
        overlay.classList.remove("hidden");

        let title = "Game Over";
        let message = "";
        let instructions = "";

        if (isCustomPack()) {
            // --- Generic game over messages (custom packs) ---
            if (level <= 2) {
                title = "Game Over — Just Getting Started";
                message = "The journey of a thousand questions begins with a single correct answer.<br>You'll get there.";
                instructions = "Press Space to try again.";
            } else if (level <= 4) {
                title = "Game Over — Warming Up";
                message = "You were finding your rhythm.<br>The snake believes in you.";
                instructions = "Press Space to give it another go.";
            } else if (level <= 6) {
                title = "Game Over — Solid Run";
                message = "Halfway there and counting.<br>Your knowledge is real, your reflexes just need tuning.";
                instructions = "Press Space to sharpen up.";
            } else if (level <= 8) {
                title = "Game Over — So Close";
                message = "You were deep in the zone.<br>A few more correct answers and you'd have made history.";
                instructions = "Press Space to finish what you started.";
            } else {
                title = "Game Over — One Level Away";
                message = "Level 9. You could taste the victory screen.<br>The snake mourns what could have been.";
                instructions = "Press Space to claim your destiny.";
            }
        } else {
            // --- EU AI Act themed game over messages (default pack) ---
            if (level <= 2) {
                title = "Game Over — Compliance Initiated";
                message = "You've begun understanding the risk framework.<br>Annex III requires more attention.";
                instructions = "Press Space to try again.";
            } else if (level <= 4) {
                title = "Game Over — Risk Awareness Detected";
                message = "You can distinguish prohibited practices.<br>But high-risk classification caught you.";
                instructions = "Press Space to refine your compliance reflexes.";
            } else if (level <= 6) {
                title = "Game Over — Conformity In Progress";
                message = "You understand intended purpose and systemic risk.<br>One misclassification ended the run.";
                instructions = "Press Space to pursue audit readiness.";
            } else if (level <= 8) {
                title = "Game Over — Advanced Operator Interrupted";
                message = "You navigate GPAI and timeline traps confidently.<br>Small errors still collapse systems.";
                instructions = "Press Space to restore operational status.";
            } else {
                title = "Game Over — Near Audit-Ready";
                message = "You were one decision away from full survival.<br>The Commission was almost impressed.";
                instructions = "Press Space to finalize mastery.";
            }
        }

        document.getElementById("overlay-title").innerText = title;

        let html = `Score: ${score}<br>Level Reached: ${level}<br><br>`;
        html += `${message}<br><br>`;
        html += `${instructions}`;

        document.getElementById("overlay-subtitle").innerHTML = html;
    }

    function loseLife(resetSnake = true) {
        // Trigger Explosion Particle Effect at the HUD Hearts
        const heartSpans = livesEl.querySelectorAll('.hud-heart');
        if (heartSpans.length > 0) {
            const lastHeart = heartSpans[heartSpans.length - 1];
            const rect = lastHeart.getBoundingClientRect();
            // Center of the heart
            const px = rect.left + rect.width / 2;
            const py = rect.top + rect.height / 2;

            const clrVermilion = getThemeColor('--clr-plot-vermilion', '#E53935');

            // Create DOM particles
            for (let i = 0; i < 25; i++) {
                const el = document.createElement("div");
                el.style.position = "fixed";
                el.style.width = "5px";
                el.style.height = "5px";
                el.style.backgroundColor = clrVermilion;
                el.style.borderRadius = "50%";
                el.style.left = px + "px";
                el.style.top = py + "px";
                el.style.pointerEvents = "none";
                el.style.zIndex = "9999";
                document.body.appendChild(el);

                domParticles.push({
                    el: el,
                    x: px,
                    y: py,
                    vx: (Math.random() - 0.5) * 12, // Scatter horizontally
                    vy: (Math.random() - 0.5) * 12 - 5, // Scatter mostly upwards initially
                    life: 1.0, // Fade out over time
                    decay: Math.random() * 0.02 + 0.015
                });
            }
        }

        lives--;
        updateHUD();
        if (lives <= 0) {
            gameOver();
        } else {
            if (resetSnake) {
                initSnake();
            }
        }
    }

    function updateHUD() {
        livesEl.innerHTML = "";
        for (let i = 0; i < lives; i++) {
            let span = document.createElement("span");
            span.innerText = "♥";
            span.className = "hud-heart";
            span.style.display = "inline-block";
            livesEl.appendChild(span);
        }
        scoreEl.innerHTML = `Level ${level} | Score: <span id="score-number" style="display:inline-block">${score}</span>`;
    }

    function scoreSuccessAnimation() {
        const scoreNum = document.getElementById("score-number");
        if (!scoreNum) return;

        // Trigger the scale/flash CSS animation strictly on the number
        scoreNum.classList.add("score-pop");
        setTimeout(() => {
            scoreNum.classList.remove("score-pop");
        }, 1200);

        const rect = scoreEl.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const currentTheme = document.documentElement.getAttribute("data-theme") || document.body.getAttribute("data-theme") || "light";
        const clrPurple = currentTheme === "dark" ? '#E1BEE7' : getThemeColor('--clr-plot-purple', '#9C27B0');

        for (let i = 0; i < 15; i++) {
            const el = document.createElement("span");
            el.innerText = "✦";
            el.style.position = "fixed";
            el.style.color = clrPurple;
            el.style.fontSize = (Math.random() * 16 + 8) + "px"; // 8px to 24px

            // Random initial opacity between 0.4 and 1.0
            const initialLife = Math.random() * 0.6 + 0.4;
            el.style.opacity = initialLife;

            el.style.pointerEvents = "none";
            el.style.zIndex = "9999";
            el.style.textShadow = `0 0 8px ${clrPurple}`;

            document.body.appendChild(el);

            const startAngle = Math.random() * Math.PI * 2;

            // Much greater variance in radius so they don't bunch up
            const radius = Math.random() * 50 + 40; // 40px to 90px

            domParticles.push({
                type: 'orbit',
                el: el,
                centerX: centerX,
                centerY: centerY,
                angle: startAngle,
                radius: radius,
                // Slight difference in speeds
                angularVelocity: (Math.random() * 0.15 + 0.05) * (Math.random() > 0.5 ? 1 : -1),
                orbitTurns: 0,
                // Keep them circling out longer for a better spectacle
                maxTurns: Math.random() * 2.0 + 1.0,
                x: centerX + Math.cos(startAngle) * radius,
                y: centerY + Math.sin(startAngle) * radius,
                vx: 0,
                vy: 0,
                life: initialLife,
                decay: 0 // Doesn't decay while orbiting
            });
        }
    }

    function gameLoop(time) {
        const deltaMs = time - lastTime;
        lastTime = time;

        // Always update particles for smooth animation even if paused or dead
        updateParticles();

        if (gameState === "RUNNING") {
            accumulator += deltaMs;

            while (accumulator >= tickMs) {
                updateLogic();
                accumulator -= tickMs;
            }
        }

        draw();
        requestAnimationFrame(gameLoop);
    }

    function updateParticles() {
        for (let i = domParticles.length - 1; i >= 0; i--) {
            let p = domParticles[i];

            if (p.type === 'orbit') {
                // Orbital Phase
                p.angle += p.angularVelocity;
                p.orbitTurns += Math.abs(p.angularVelocity) / (Math.PI * 2);

                // Spiral slightly outward
                p.radius += 0.2;

                p.x = p.centerX + Math.cos(p.angle) * p.radius;
                p.y = p.centerY + Math.sin(p.angle) * p.radius;

                // Break orbit
                if (p.orbitTurns >= p.maxTurns) {
                    p.type = 'gravity';
                    // Convert tangential velocity to linear velocity
                    p.vx = -Math.sin(p.angle) * Math.abs(p.angularVelocity) * p.radius * 0.3;
                    p.vy = Math.cos(p.angle) * Math.abs(p.angularVelocity) * p.radius * 0.3;
                    p.decay = Math.random() * 0.02 + 0.01; // Start dying
                }
            } else {
                // Standard Gravity Phase (For both broken orbits and exploding hearts)
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.5; // Gravity
                p.life -= p.decay;
            }

            // Sync visual DOM
            p.el.style.left = p.x + "px";
            p.el.style.top = p.y + "px";
            p.el.style.opacity = Math.max(0, p.life);

            // Cleanup off-screen or dead
            if (p.life <= 0 || p.y > window.innerHeight) {
                p.el.remove();
                domParticles.splice(i, 1);
            }
        }
    }

    function updateLogic() {
        if (pendingDirection) {
            direction = pendingDirection;
            pendingDirection = null;
        }

        const head = snake[0];
        const newHead = { x: head.x + direction.dx, y: head.y + direction.dy };

        // Wall Collision (Kill Mode)
        if (newHead.x < 0 || newHead.x >= gridWidth || newHead.y < 0 || newHead.y >= gridHeight) {
            loseLife();
            return;
        }

        // Self Collision
        for (let i = 0; i < snake.length; i++) {
            if (newHead.x === snake[i].x && newHead.y === snake[i].y) {
                // Ignore collision with the very last tail segment if not growing
                if (i === snake.length - 1 && growthQueue === 0) continue;
                loseLife();
                return;
            }
        }

        // Answer Collision
        for (let i = 0; i < answersOnBoard.length; i++) {
            const ans = answersOnBoard[i];
            if (newHead.x === ans.x && newHead.y === ans.y) {
                if (ans.isCorrect) {
                    score++;
                    growthQueue += 1;
                    updateHUD();
                    scoreSuccessAnimation();

                    if (score === 100) {
                        victory();
                        return; // Halt logic
                    } else if (score % 10 === 0) {
                        levelUp();
                        return; // Halt logic
                    } else {
                        spawnNextQuestion();
                    }
                } else {
                    loseLife(false);
                    updateHUD();
                    if (lives > 0) {
                        spawnNextQuestion();
                    }
                }
                break;
            }
        }

        // Move
        snake.unshift(newHead);
        if (growthQueue > 0) {
            growthQueue--;
        } else {
            snake.pop();
        }
    }

    function draw() {
        // Fetch current theme colors dynamically for real-time toggling
        const clrBg = getThemeColor('--clr-bg', '#FAFAFA');
        const clrText = getThemeColor('--clr-text', '#000000');
        const clrSnakeOutline = clrBg;
        const clrSnakeFill = clrText;

        // Clear background
        ctx.fillStyle = clrBg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw structural grid layer (almost invisible, but more visible on dark theme)
        const currentTheme = document.documentElement.getAttribute("data-theme") || document.body.getAttribute("data-theme") || "light";
        ctx.strokeStyle = clrText; // Theme text color
        ctx.globalAlpha = currentTheme === "dark" ? 0.2 : 0.08;    // Opacity applied to theme text color
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = 0; x <= gridWidth; x++) {
            ctx.moveTo(x * cellSizeX, 0);
            ctx.lineTo(x * cellSizeX, canvas.height);
        }
        for (let y = 0; y <= gridHeight; y++) {
            ctx.moveTo(0, y * cellSizeY);
            ctx.lineTo(canvas.width, y * cellSizeY);
        }
        ctx.stroke();
        ctx.globalAlpha = 1.0; // Reset opacity for main rendering

        // Draw Answers
        for (let i = 0; i < answersOnBoard.length; i++) {
            const ans = answersOnBoard[i];
            const px = ans.x * cellSizeX;
            const py = ans.y * cellSizeY;

            ctx.fillStyle = getThemeColor('--clr-plot-vermilion', '#E53935');
            ctx.fillRect(px, py, cellSizeX, cellSizeY);

            ctx.fillStyle = clrBg;
            ctx.font = `${Math.floor(Math.min(cellSizeX, cellSizeY) * 0.55)}px sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(ans.text, px + cellSizeX / 2, py + (cellSizeY / 2));
        }

        // Draw Snake
        for (let i = 0; i < snake.length; i++) {
            const segment = snake[i];
            const px = segment.x * cellSizeX;
            const py = segment.y * cellSizeY;

            ctx.fillStyle = clrSnakeFill;
            ctx.strokeStyle = clrSnakeOutline; // Ensure border is explicitly black
            ctx.lineWidth = 1.0;
            ctx.fillRect(px, py, cellSizeX, cellSizeY);
            ctx.strokeRect(px, py, cellSizeX, cellSizeY);

            // Draw Pointy Nose and Eyes on Head
            if (i === 0) {
                // Nose
                ctx.beginPath();
                if (direction.dx === 1) { // Right
                    ctx.moveTo(px + cellSizeX, py);
                    ctx.lineTo(px + cellSizeX + cellSizeX / 2, py + cellSizeY / 2);
                    ctx.lineTo(px + cellSizeX, py + cellSizeY);
                } else if (direction.dx === -1) { // Left
                    ctx.moveTo(px, py);
                    ctx.lineTo(px - cellSizeX / 2, py + cellSizeY / 2);
                    ctx.lineTo(px, py + cellSizeY);
                } else if (direction.dy === 1) { // Down
                    ctx.moveTo(px, py + cellSizeY);
                    ctx.lineTo(px + cellSizeX / 2, py + cellSizeY + cellSizeY / 2);
                    ctx.lineTo(px + cellSizeX, py + cellSizeY);
                } else if (direction.dy === -1) { // Up
                    ctx.moveTo(px, py);
                    ctx.lineTo(px + cellSizeX / 2, py - cellSizeY / 2);
                    ctx.lineTo(px + cellSizeX, py);
                }
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                // Removed connecting line erasure

                // Draw eyes
                ctx.fillStyle = clrSnakeOutline;
                // Make eyes round and slightly larger, spread further apart
                let eyeRadius = Math.max(1.5, Math.min(cellSizeX, cellSizeY) * 0.08);
                let eyeSideOffset = cellSizeX * 0.35; // Wider distance from middle

                // Base coordinates pushed slightly less far into nose
                let baseY = py + cellSizeY / 2;
                let baseX = px + cellSizeX / 2;
                let eye1x, eye1y, eye2x, eye2y;

                let forwardOffset = 0.6; // Not quite as far out, cuter snout

                if (direction.dx === 1) { // Right
                    eye1x = baseX + cellSizeX * forwardOffset; eye1y = baseY - eyeSideOffset;
                    eye2x = baseX + cellSizeX * forwardOffset; eye2y = baseY + eyeSideOffset;
                } else if (direction.dx === -1) { // Left
                    eye1x = baseX - cellSizeX * forwardOffset; eye1y = baseY - eyeSideOffset;
                    eye2x = baseX - cellSizeX * forwardOffset; eye2y = baseY + eyeSideOffset;
                } else if (direction.dy === 1) { // Down
                    eye1x = baseX - eyeSideOffset; eye1y = baseY + cellSizeY * forwardOffset;
                    eye2x = baseX + eyeSideOffset; eye2y = baseY + cellSizeY * forwardOffset;
                } else if (direction.dy === -1) { // Up
                    eye1x = baseX - eyeSideOffset; eye1y = baseY - cellSizeY * forwardOffset;
                    eye2x = baseX + eyeSideOffset; eye2y = baseY - cellSizeY * forwardOffset;
                }

                // Round cute eyes
                ctx.beginPath();
                ctx.arc(eye1x, eye1y, eyeRadius, 0, Math.PI * 2);
                ctx.fill();

                ctx.beginPath();
                ctx.arc(eye2x, eye2y, eyeRadius, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    // Initial setup
    // If the pack overlay is active, wait for it to be dismissed
    function initGameWhenReady() {
        if (isPackOverlayActive()) {
            // Poll until overlay is gone
            const poller = setInterval(() => {
                if (!isPackOverlayActive()) {
                    clearInterval(poller);
                    loadQuizData();
                    resizeCanvas();
                    initSnake();
                    draw();
                    // Show game HUD & canvas
                    document.getElementById('game-hud').style.display = '';
                    document.getElementById('canvas-container').style.display = '';
                    document.getElementById('game-controls-hint').style.display = '';
                }
            }, 100);
        } else {
            loadQuizData();
            resizeCanvas();
            initSnake();
            draw();
        }
    }

    initGameWhenReady();

    // Recheck layout after header is dynamically injected 
    setTimeout(() => {
        if (gameState === "MENU" && !isPackOverlayActive()) {
            resizeCanvas();
            draw();
        }
    }, 250);
});
