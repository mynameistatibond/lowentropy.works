(function () {
    document.addEventListener('DOMContentLoaded', () => {
        const canvas = document.getElementById('nokia-snake-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        // Virtual LCD Resolution
        const RES_W = 84;
        const RES_H = 64;
        canvas.width = RES_W;
        canvas.height = RES_H;

        ctx.imageSmoothingEnabled = false;

        const fg = '#111';
        const bg = '#9bbc0f';

        // Dynamically fetch foreground color from theme body
        function getFgColor() {
            return getComputedStyle(document.body).getPropertyValue('--clr-text').trim() || '#111';
        }

        // Grid system for 3x3 pixel snake blocks
        const CELL = 3;
        const COLS = 26;
        const ROWS = 15;

        const offsetX = 3;
        const offsetY = 16;

        let snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }, { x: 8, y: 11 }, { x: 8, y: 12 }];
        let dir = { x: 1, y: 0 };
        let food = { x: 15, y: 8 };
        let score = 36;

        // Pixel font (3x5)
        const font = [
            [0x7, 0x5, 0x5, 0x5, 0x7], /* 0 */
            [0x2, 0x6, 0x2, 0x2, 0x7], /* 1 */
            [0x7, 0x1, 0x7, 0x4, 0x7], /* 2 */
            [0x7, 0x1, 0x7, 0x1, 0x7], /* 3 */
            [0x5, 0x5, 0x7, 0x1, 0x1], /* 4 */
            [0x7, 0x4, 0x7, 0x1, 0x7], /* 5 */
            [0x7, 0x4, 0x7, 0x5, 0x7], /* 6 */
            [0x7, 0x1, 0x1, 0x1, 0x1], /* 7 */
            [0x7, 0x5, 0x7, 0x5, 0x7], /* 8 */
            [0x7, 0x5, 0x7, 0x1, 0x7]  /* 9 */
        ];

        function drawScore() {
            let str = score.toString().padStart(4, '0');
            for (let i = 0; i < str.length; i++) {
                let n = parseInt(str[i]);
                let glyph = font[n];
                // Draw at 2x scale for crisp readability
                for (let r = 0; r < 5; r++) {
                    for (let c = 0; c < 3; c++) {
                        if (glyph[r] & (1 << (2 - c))) {
                            ctx.fillRect(4 + i * 8 + c * 2, 3 + r * 2, 2, 2);
                        }
                    }
                }
            }
        }

        function genFood() {
            let safe = false;
            let limit = 50;
            while (!safe && limit > 0) {
                food = {
                    x: Math.floor(Math.random() * COLS),
                    y: Math.floor(Math.random() * ROWS)
                };
                safe = true;
                for (let i = 0; i < snake.length; i++) {
                    if (snake[i].x === food.x && snake[i].y === food.y) safe = false;
                }
                limit--;
            }
        }

        function update() {
            let head = snake[0];
            let dx = food.x - head.x;
            let dy = food.y - head.y;

            let pDirs = [];

            // Classic orthogonal snake pathfinding: only turn 90 degrees if needed.
            if (dir.x !== 0) { // Moving horizontally
                if (head.x === food.x) { // Aligned horizontally, turn vertical
                    pDirs.push({ x: 0, y: Math.sign(dy) });
                } else if (Math.sign(dx) === dir.x) { // Moving towards food horizontally
                    pDirs.push(dir);
                } else { // Moving away horizontally
                    pDirs.push({ x: 0, y: dy !== 0 ? Math.sign(dy) : 1 });
                    pDirs.push({ x: 0, y: dy !== 0 ? -Math.sign(dy) : -1 });
                }
            } else { // Moving vertically
                if (head.y === food.y) { // Aligned vertically, turn horizontal
                    pDirs.push({ x: Math.sign(dx), y: 0 });
                } else if (Math.sign(dy) === dir.y) { // Moving towards food vertically
                    pDirs.push(dir);
                } else { // Moving away vertically
                    pDirs.push({ x: dx !== 0 ? Math.sign(dx) : 1, y: 0 });
                    pDirs.push({ x: dx !== 0 ? -Math.sign(dx) : -1, y: 0 });
                }
            }

            pDirs.push(dir); // Always have current direction as fallback if turns fail

            // Filter invalid backward moves (just in case)
            pDirs = pDirs.filter(d => !(d.x === -dir.x && d.y === -dir.y));

            let targetDir = dir;
            let foundSafe = false;

            // Find first desired direction that is safe
            for (let d of pDirs) {
                let nx = head.x + d.x;
                let ny = head.y + d.y;
                let safe = true;
                if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) safe = false;
                for (let i = 0; i < snake.length - 1; i++) {
                    if (snake[i].x === nx && snake[i].y === ny) safe = false;
                }
                if (safe) {
                    targetDir = d;
                    foundSafe = true;
                    break;
                }
            }

            if (!foundSafe) {
                // Panic mode: try ALL safe orthogonal directions
                const possible = [
                    { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }
                ].filter(d => !(d.x === -dir.x && d.y === -dir.y));

                for (let d of possible) {
                    let cx = head.x + d.x;
                    let cy = head.y + d.y;
                    let cSafe = true;
                    if (cx < 0 || cx >= COLS || cy < 0 || cy >= ROWS) cSafe = false;
                    for (let i = 0; i < snake.length - 1; i++) {
                        if (snake[i].x === cx && snake[i].y === cy) cSafe = false;
                    }
                    if (cSafe) {
                        targetDir = d;
                        break;
                    }
                }
            }

            dir = targetDir;
            let newHead = { x: head.x + dir.x, y: head.y + dir.y };

            // If completely trapped, auto-restart
            let trapped = false;
            if (newHead.x < 0 || newHead.x >= COLS || newHead.y < 0 || newHead.y >= ROWS) trapped = true;
            for (let i = 0; i < snake.length - 1; i++) {
                if (snake[i].x === newHead.x && snake[i].y === newHead.y) trapped = true;
            }

            if (trapped) {
                snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
                dir = { x: 1, y: 0 };
                score = 36;
                genFood();
                return;
            }

            snake.unshift(newHead);
            if (newHead.x === food.x && newHead.y === food.y) {
                score++;
                genFood();
            } else {
                snake.pop();
            }
        }

        function draw() {
            // Re-fetch the CSS variable every frame so it instantly reacts to theme toggles
            const currentFgColor = getComputedStyle(document.body).getPropertyValue('--clr-text').trim() || '#111';

            ctx.clearRect(0, 0, RES_W, RES_H);
            ctx.fillStyle = currentFgColor;

            drawScore();

            let bx = offsetX - 2;
            let by = offsetY - 2;
            let bw = COLS * CELL + 4;
            let bh = ROWS * CELL + 4;

            // Double Border
            ctx.fillRect(bx, by, bw, 1);
            ctx.fillRect(bx, by + bh - 1, bw, 1);
            ctx.fillRect(bx, by, 1, bh);
            ctx.fillRect(bx + bw - 1, by, 1, bh);

            ctx.fillRect(bx - 2, by - 2, bw + 4, 1);
            ctx.fillRect(bx - 2, by + bh + 1, bw + 4, 1);
            ctx.fillRect(bx - 2, by - 2, 1, bh + 4);
            ctx.fillRect(bx + bw + 1, by - 2, 1, bh + 4);

            // Snake Body (2x2 squares inside 3x3 cells for gaps)
            for (let i = 0; i < snake.length; i++) {
                let seg = snake[i];
                let px = offsetX + seg.x * CELL;
                let py = offsetY + seg.y * CELL;
                ctx.fillRect(px, py, CELL - 1, CELL - 1);
            }

            // Food (Cross/Diamond)
            let fx = offsetX + food.x * CELL;
            let fy = offsetY + food.y * CELL;
            ctx.fillRect(fx + 1, fy, 1, 3);
            ctx.fillRect(fx, fy + 1, 3, 1);
        }

        let lastTime = 0;
        function loop(time) {
            requestAnimationFrame(loop);
            if (time - lastTime < 1000 / 8) return; // ~8 FPS
            lastTime = time;
            update();
            draw();
        }

        requestAnimationFrame(loop);
    });
})();
