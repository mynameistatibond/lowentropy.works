(function () {
    document.addEventListener('DOMContentLoaded', () => {
        // Elements
        const hotspot = document.querySelector('.fraud-screen-hotspot');
        const paths = document.querySelectorAll('.anno-curve'); // All curves that need "d" update
        const animPath = document.querySelector('.anno-mask-path'); // The one that animates (in mask)
        const textBlock = document.querySelector('.annotation-text-block');

        if (!hotspot || paths.length === 0 || !textBlock) {
            console.warn('Annotation Hover: Elements not found.');
            return;
        }

        // Configuration: Single Source of Truth for Layout
        const config = {
            start: { x: 290, y: 68 },
            elbow: { x: 350, y: 68 },
            end: { x: 640, y: -255 },
            textGap: 34,        // Horizontal gap between line tip and text
            textYOffset: -35   // Vertical offset (Text Top relative to Line End Y)
        };

        // Apply Layout Dynamically
        function updateLayout() {
            // 1. Draw Line (Update all geometric instances)
            const d = `M ${config.start.x} ${config.start.y} L ${config.elbow.x} ${config.elbow.y} L ${config.end.x} ${config.end.y}`;
            paths.forEach(p => p.setAttribute('d', d));

            // 2. Position Text
            const textLeft = config.end.x + config.textGap;
            const textTop = config.end.y + config.textYOffset;

            textBlock.style.left = `${textLeft}px`;
            textBlock.style.top = `${textTop}px`;
        }

        // Initialize Layout
        updateLayout();

        // Initialize Text: Split into chars for typing effect
        // We want to preserve structure: Header -> Status -> Body Lines
        // Let's grab all text-containing leaf nodes or specific classes
        const textElements = textBlock.querySelectorAll('.anno-header, .anno-status, .anno-body div');

        // Map to store the spans for each element
        const charSpansMap = [];

        textElements.forEach(el => {
            const rawText = el.innerText;
            el.innerHTML = ''; // Clear text
            const spans = [];
            rawText.split('').forEach(char => {
                const span = document.createElement('span');
                span.textContent = char;
                span.classList.add('type-char');
                el.appendChild(span);
                spans.push(span);
            });
            charSpansMap.push(spans);
        });

        // Calculate path length for perfect drawing
        if (animPath) {
            const length = animPath.getTotalLength();

            // Disable transition to force immediate hide
            animPath.style.transition = 'none';
            animPath.style.strokeDasharray = length + 200; // Extra buffer
            animPath.style.strokeDashoffset = length + 200;

            // Force layout
            animPath.getBoundingClientRect();

            // Restore transition
            animPath.style.transition = '';
        }

        let typeTimeouts = [];
        let isHovering = false;

        // Sequence Logic
        function startSequence() {
            if (!isHovering) return;

            // 1. Line Draw (CSS Transition)
            if (animPath) animPath.classList.add('active');
            textBlock.classList.remove('hidden'); // Ensure container is visible

            // 2. Typing Start Delay (Reduced for faster overlap)
            const lineDuration = 600;

            // Clear any existing timeouts first
            clearTypeTimeouts();

            // create a master timeline offset
            let globalDelay = lineDuration;

            // Iterate through each block (Header, Status, Body Lines)
            charSpansMap.forEach((spans, blockIndex) => {
                // Add a small pause between blocks?
                if (blockIndex > 0) globalDelay += 50; // 50ms pause between lines

                spans.forEach((span, charIndex) => {
                    const timeout = setTimeout(() => {
                        if (isHovering) span.classList.add('visible');
                    }, globalDelay + (charIndex * 15)); // 15ms per char
                    typeTimeouts.push(timeout);
                });

                // Increment globalDelay by the time it took to type this block
                globalDelay += (spans.length * 15);
            });
        }

        function reverseSequence() {
            clearTypeTimeouts();

            // 1. Text fades out fast
            textBlock.classList.add('hidden');

            // 2. Reset chars to invisible (after fade out visual completes, or immediately)
            // We do it immediately but the container opacity hides it
            charSpansMap.forEach(spans => {
                spans.forEach(span => span.classList.remove('visible'));
            });

            // 3. Line Retracts
            if (animPath) animPath.classList.remove('active');
        }

        function clearTypeTimeouts() {
            typeTimeouts.forEach(t => clearTimeout(t));
            typeTimeouts = [];
        }

        // Event Listeners
        hotspot.addEventListener('mouseenter', () => {
            isHovering = true;
            // Reset line state if needed? CSS handles it.
            startSequence();
        });

        hotspot.addEventListener('mouseleave', () => {
            isHovering = false;
            reverseSequence();
        });
        // --- NOKIA SNAKE ANNOTATION ---
        (function () {
            const hotspot = document.querySelector('.nokia-screen-hotspot');
            const paths = document.querySelectorAll('.nokia-anno-curve');
            const animPath = document.querySelector('.nokia-anno-mask-path');
            const textBlock = document.querySelector('.nokia-annotation-text-block');

            if (!hotspot || paths.length === 0 || !textBlock) {
                return;
            }

            // Configuration for Nokia Monitor (Draws Right & Up - 1:1 Pixel Mapping)
            // Monitor is ~170px wide, ~130px tall. SVG is 100% of that size.
            // Center is roughly x: 85, y: 65
            // Main monitor line is ~ 350px width, 323px height.
            const config = {
                start: { x: 85, y: 65 },
                elbow: { x: 145, y: 65 },     // Go right 60px
                end: { x: 360, y: -80 },      // Angle lower so text isn't cut off by the top of the page
                textGap: 34,
                textYOffset: -35
            };

            function updateLayout() {
                const d = `M ${config.start.x} ${config.start.y} L ${config.elbow.x} ${config.elbow.y} L ${config.end.x} ${config.end.y}`;
                paths.forEach(p => p.setAttribute('d', d));

                // Move text closer to the arrow end
                const textLeft = config.end.x + (config.textGap * 0.5);
                const textTop = config.end.y + config.textYOffset;

                textBlock.style.left = `${textLeft}px`;
                textBlock.style.top = `${textTop}px`;

                // Read the parent monitor's inline --r rotation (e.g. "-14deg") and invert it
                const parentWithR = hotspot.closest('[style*="--r:"]');
                let rotationDeg = 0;
                if (parentWithR) {
                    const styleAttr = parentWithR.getAttribute('style') || '';
                    const match = styleAttr.match(/--r:\s*([^;]+)/);
                    if (match && match[1]) {
                        rotationDeg = parseFloat(match[1]);
                    }
                }

                // Note: since this is an absolute positioned element inside a rotated parent,
                // we rotate it by the opposite amount so it remains level with the page.
                textBlock.style.setProperty('--counter-rot', `${-rotationDeg}deg`);
                // Set initial state (just rotation, let the inner wrapper handle translation)
                textBlock.style.transform = `rotate(${-rotationDeg}deg)`;
                textBlock.style.transformOrigin = `top left`;
            }

            updateLayout();

            const textContentLayer = textBlock.querySelector('.nokia-anno-content') || textBlock;
            const textElements = textContentLayer.querySelectorAll('.anno-header, .anno-status, .anno-body div');
            const charSpansMap = [];

            textElements.forEach(el => {
                const rawText = el.innerText;
                el.innerHTML = '';
                const spans = [];
                rawText.split('').forEach(char => {
                    const span = document.createElement('span');
                    span.textContent = char;
                    span.classList.add('type-char');
                    el.appendChild(span);
                    spans.push(span);
                });
                charSpansMap.push(spans);
            });

            if (animPath) {
                const length = animPath.getTotalLength();
                animPath.style.transition = 'none';
                animPath.style.strokeDasharray = length + 200;
                animPath.style.strokeDashoffset = length + 200;
                animPath.getBoundingClientRect();
                animPath.style.transition = '';
            }

            let typeTimeouts = [];
            let isHovering = false;

            function startSequence() {
                if (!isHovering) return;

                if (animPath) animPath.classList.add('active');
                textBlock.classList.remove('hidden');

                const lineDuration = 600;
                clearTypeTimeouts();
                let globalDelay = lineDuration;

                charSpansMap.forEach((spans, blockIndex) => {
                    if (blockIndex > 0) globalDelay += 50;

                    spans.forEach((span, charIndex) => {
                        const timeout = setTimeout(() => {
                            if (isHovering) span.classList.add('visible');
                        }, globalDelay + (charIndex * 15));
                        typeTimeouts.push(timeout);
                    });
                    globalDelay += (spans.length * 15);
                });
            }

            function reverseSequence() {
                clearTypeTimeouts();
                textBlock.classList.add('hidden');
                charSpansMap.forEach(spans => {
                    spans.forEach(span => span.classList.remove('visible'));
                });
                if (animPath) animPath.classList.remove('active');
            }

            function clearTypeTimeouts() {
                typeTimeouts.forEach(t => clearTimeout(t));
                typeTimeouts = [];
            }

            hotspot.addEventListener('mouseenter', () => {
                isHovering = true;
                startSequence();
            });

            hotspot.addEventListener('mouseleave', () => {
                isHovering = false;
                reverseSequence();
            });
        })();
    });
})();
