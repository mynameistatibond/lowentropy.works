document.addEventListener('DOMContentLoaded', () => {
    const monitor = document.getElementById('monitor-2'); // Main Sony Monitor
    if (!monitor) return;

    // Find the annotation elements
    const lineContainer = monitor.querySelector('.annotation-line');
    const textContainer = monitor.querySelector('.annotation-text');

    // Prepare Text (Split into spans)
    const rawText = textContainer.innerText.trim();
    textContainer.innerText = ''; // Clear

    // Create spans for each character
    const spans = [];
    rawText.split('').forEach(char => {
        const span = document.createElement('span');
        span.textContent = char;
        span.style.opacity = '0';
        textContainer.appendChild(span);
        spans.push(span);
    });

    // State
    let isHovering = false;
    let typeWriterInterval = null;
    let lineTimeout = null;

    // --- ANIMATION FUNCTIONS ---

    function startSequence() {
        if (!isHovering) return;

        // 1. Draw Line
        lineContainer.classList.add('draw');

        // 2. Schedule Text typing (after line finishes ~1.1s)
        // Using 1000ms to be slightly safe/tight with the 1.1s CSS transition
        lineTimeout = setTimeout(() => {
            if (!isHovering) return; // double check
            startTyping();
        }, 1100);
    }

    function startTyping() {
        let charIndex = 0;
        clearInterval(typeWriterInterval); // safety

        typeWriterInterval = setInterval(() => {
            if (charIndex >= spans.length) {
                clearInterval(typeWriterInterval);
                return;
            }
            if (!isHovering) { // Abort if user left
                clearInterval(typeWriterInterval);
                return;
            }

            spans[charIndex].classList.add('visible');
            charIndex++;
        }, 35); // 35ms per character delay
    }

    function reverseSequence() {
        // Stop any pending triggers
        clearTimeout(lineTimeout);
        clearInterval(typeWriterInterval);

        // 1. Fade out text immediately
        spans.forEach(span => span.classList.remove('visible'));

        // 2. Retract Line (CSS transition handles smooth reverse)
        lineContainer.classList.remove('draw');
    }

    // --- EVENT LISTENERS ---

    // Using mouseenter/leave on the MONITOR element as requested
    monitor.addEventListener('mouseenter', () => {
        isHovering = true;
        startSequence();
    });

    monitor.addEventListener('mouseleave', () => {
        isHovering = false;
        reverseSequence();
    });
});
