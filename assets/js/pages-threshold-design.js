/**
 * Threshold Design Report Visualizations
 * Loads Plotly charts and dynamic HTML grids for the Threshold Design page.
 */

document.addEventListener("DOMContentLoaded", () => {
    // Wait for Plotly to be available
    const initCharts = () => {
        if (typeof Plotly === "undefined") {
            setTimeout(initCharts, 100);
            return;
        }
        renderEvalModes();
        renderThresholdSweep();
        renderConfusionMatrix();
    };

    initCharts();
});

const clrPrimary = "#FF4800"; // vermilion
const clrText = "rgba(40,40,40,0.8)";
const clrGrid = "rgba(0,0,0,0.05)";
const clrBgAlt = "#F4F4F4";

function getLayout(title) {
    return {
        title: { text: title, font: { family: "Inter, sans-serif", size: 14 } },
        paper_bgcolor: "transparent",
        plot_bgcolor: "transparent",
        font: { family: "Inter, sans-serif", color: clrText },
        margin: { t: 40, r: 20, l: 60, b: 40 },
        height: 400,
        showlegend: true,
        legend: { orientation: "h", y: -0.2 }
    };
}

// 1. Vis 1: Eval Modes Diagram (HTML/CSS)
function renderEvalModes() {
    const grid = document.getElementById("plot-eval-modes");
    if (!grid) return;

    const html = `
        <div style="background: white; border: 1px solid var(--clr-divider); border-radius: 6px; padding: 2rem; box-shadow: 0 2px 8px rgba(0,0,0,0.02); display: flex; flex-direction: column; gap: 1rem;">
            <div style="font-weight: 600; font-size: 1.1rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--clr-divider);">Mode A: Operational Alerting</div>
            <div style="font-size: 0.9rem; color: var(--clr-text-muted);">Goal: Catch fraud efficiently</div>
            <div style="display: flex; align-items: center; gap: 0.5rem; font-family: monospace; font-size: 0.85rem; background: var(--clr-bg-alt); padding: 1rem; border-radius: 4px;">
                <div style="background: white; padding: 0.5rem; border: 1px solid var(--clr-divider); border-radius: 4px;">Score</div>
                <div style="color: var(--clr-plot-vermilion); font-weight: bold;">&ge; Thr</div>
                <div style="background: white; padding: 0.5rem; border: 1px solid var(--clr-divider); border-radius: 4px;">Alert (TP/FP)</div>
            </div>
            <div style="font-size: 0.8rem; margin-top: auto; color: var(--clr-text-muted);">Metric: <strong style="color: var(--clr-text);">F2 Score</strong></div>
        </div>

        <div style="background: white; border: 1px solid var(--clr-divider); border-radius: 6px; padding: 2rem; box-shadow: 0 2px 8px rgba(0,0,0,0.02); display: flex; flex-direction: column; gap: 1rem; opacity: 0.6;">
            <div style="font-weight: 600; font-size: 1.1rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--clr-divider);">Mode B: Triage Ranking</div>
            <div style="font-size: 0.9rem; color: var(--clr-text-muted);">Goal: Perfect ordering</div>
            <div style="display: flex; flex-direction: column; gap: 0.2rem; font-family: monospace; font-size: 0.85rem; background: var(--clr-bg-alt); padding: 1rem; border-radius: 4px;">
                <div>1. Claim 892 (0.95)</div>
                <div>2. Claim 104 (0.88)</div>
                <div>3. Claim 441 (0.86)</div>
            </div>
            <div style="font-size: 0.8rem; margin-top: auto; color: var(--clr-text-muted);">Metric: <strong style="color: var(--clr-text);">PR-AUC</strong></div>
        </div>
    `;
    grid.innerHTML = html;
}

// 2. Vis 3: Threshold Sweep Plot (Plotly)
function renderThresholdSweep() {
    const thresholds = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];

    // Synthetic operational data mimicking the report for RandomForest
    const precision = [0.38, 0.45, 0.52, 0.58, 0.61, 0.68, 0.74, 0.82, 0.90];
    const recall = [0.96, 0.89, 0.85, 0.85, 0.83, 0.72, 0.55, 0.35, 0.10];
    const f2 = [0.72, 0.76, 0.79, 0.80, 0.78, 0.71, 0.58, 0.39, 0.12];
    const flagged = [135, 105, 90, 80, 64, 50, 35, 22, 8];

    const traces = [
        { x: thresholds, y: f2, name: "F2 (Target)", type: "scatter", mode: "lines+markers", line: { color: clrPrimary, width: 3 } },
        { x: thresholds, y: recall, name: "Recall", type: "scatter", mode: "lines", line: { color: "#222222", width: 2, dash: "dot" } },
        { x: thresholds, y: precision, name: "Precision", type: "scatter", mode: "lines", line: { color: "#888888", width: 2, dash: "dash" } },
        { x: thresholds, y: flagged, name: "Claims Flagged", type: "bar", yaxis: "y2", marker: { color: clrGrid, opacity: 0.5 } }
    ];

    const layout = getLayout("RandomForest: Operational Tradeoff by Threshold");
    layout.yaxis = { title: "Score", range: [0, 1.05], gridcolor: clrGrid };
    layout.yaxis2 = { title: "Workload (Claims Flagged)", overlaying: "y", side: "right", range: [0, 150], showgrid: false };
    layout.legend = { orientation: "h", y: -0.2, x: 0 };
    layout.margin.r = 60;

    // Highlight the chosen ~0.49 operating point
    layout.shapes = [{
        type: 'line', x0: 0.49, x1: 0.49, y0: 0, y1: 1,
        line: { color: clrPrimary, width: 1, dash: 'dot' }
    }];

    Plotly.newPlot("plot-threshold-sweep", traces, layout, { displayModeBar: false, responsive: true });
}

// 3. Vis 4: Confusion Matrix (Plotly Heatmap)
function renderConfusionMatrix() {
    // TP=42, FP=23, FN=7, TN=128 (assuming 200 test set, P=49, N=151)
    const zData = [
        [128, 23], // True Negatives, False Positives
        [7, 42]    // False Negatives, True Positives
    ];

    // Custom label text for squares
    const textData = [
        ["128<br><span style='font-size:10px'>True Negative (Legit ignored)</span>", "23<br><span style='font-size:10px'>False Positive (False alarm)</span>"],
        ["7<br><span style='font-size:10px'>False Negative (Missed fraud)</span>", "42<br><span style='font-size:10px;font-weight:bold;'>True Positive (Fraud caught)</span>"]
    ];

    // Minimal custom colorscale: mostly beige, with vermilion highlight for FN
    const colorscale = [
        [0.0, clrBgAlt],
        [1.0, clrBgAlt]
    ];

    const trace = {
        z: zData,
        x: ["Pred: Legit (0)", "Pred: Fraud (1)"],
        y: ["Actual: Legit (0)", "Actual: Fraud (1)"],
        type: "heatmap",
        colorscale: colorscale,
        showscale: false,
        text: textData,
        texttemplate: "%{text}",
        hoverinfo: "none"
    };

    const layout = getLayout("Operating Point Matrix (RF @ Thr 0.49)");
    layout.margin = { t: 60, r: 40, l: 120, b: 60 };
    layout.xaxis = { side: "top" };
    layout.yaxis = { autorange: "reversed" };

    // Add red outline strictly around the FN box (x=0, y=1)
    layout.shapes = [{
        type: 'rect',
        x0: -0.48, x1: 0.48,
        y0: 0.52, y1: 1.48,
        line: { color: clrPrimary, width: 3 }
    }];

    Plotly.newPlot("plot-confusion-matrix", [trace], layout, { displayModeBar: false, responsive: true });
}
