/**
 * Calibration Report Visualizations
 * Loads Plotly charts for the Probability Calibration page.
 */

document.addEventListener("DOMContentLoaded", () => {
    // Wait for Plotly to be available
    const initCharts = () => {
        if (typeof Plotly === "undefined") {
            setTimeout(initCharts, 100);
            return;
        }
        renderReliabilityCurve();
        renderProbDistribution();
    };

    initCharts();
});

const clrUncalibrated = "#9b928f"; // 'Original' dataset color
const clrCalibrated = "#FF4800"; // 'Trees' dataset color (Vermilion)
const clrText = "rgba(40,40,40,0.8)";
const clrGrid = "rgba(0,0,0,0.05)";

function getLayout(title) {
    return {
        title: { text: title, font: { family: "Inter, sans-serif", size: 14 } },
        paper_bgcolor: "transparent",
        plot_bgcolor: "transparent",
        font: { family: "Inter, sans-serif", color: clrText },
        margin: { t: 40, r: 20, l: 60, b: 90 },
        height: 400,
        showlegend: true,
        legend: { orientation: "h", y: -0.4 }
    };
}

// 1. Vis 1: Reliability Curve (Calibration Plot)
function renderReliabilityCurve() {
    // Synthetic data for the calibration curves (10 bins)
    const probPred = [0.05, 0.15, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 0.85, 0.95];

    // Uncalibrated (XGBoost typically pushes probabilities toward extremes)
    const probTrueUncal = [0.01, 0.05, 0.12, 0.20, 0.30, 0.45, 0.70, 0.90, 0.98, 1.00];

    // Calibrated (Hugs the diagonal closer)
    const probTrueCal = [0.04, 0.14, 0.23, 0.36, 0.46, 0.57, 0.63, 0.76, 0.84, 0.96];

    // Perfect calibration diagonal [0,1]
    const traceDiagonal = {
        x: [0, 1], y: [0, 1],
        name: "Perfect Calibration",
        type: "scatter",
        mode: "lines",
        line: { color: "#222222", width: 2, dash: "dash" }
    };

    const traceUncal = {
        x: probPred, y: probTrueUncal,
        name: "XGBoost (Uncalibrated)",
        type: "scatter",
        mode: "lines+markers",
        marker: { size: 6 },
        line: { color: clrUncalibrated, width: 2 }
    };

    const traceCal = {
        x: probPred, y: probTrueCal,
        name: "XGBoost (Platt Scaled)",
        type: "scatter",
        mode: "lines+markers",
        marker: { size: 8 },
        line: { color: clrCalibrated, width: 3 }
    };

    const layout = getLayout("Reliability Curve: XGBoost");
    layout.xaxis = { title: "Predicted Probability", range: [-0.05, 1.05], gridcolor: clrGrid };
    layout.yaxis = { title: "Observed Fraud Rate", range: [-0.05, 1.05], gridcolor: clrGrid };

    Plotly.newPlot("plot-reliability-curve", [traceDiagonal, traceUncal, traceCal], layout, { displayModeBar: false, responsive: true });
}

// 2. Vis 2: Before/After Probability Distribution (Density/Histogram)
function renderProbDistribution() {
    // Generate synthetic bimodal arrays to represent the score distributions before & after scaling

    // Generate a distribution pushing toward 0 and 1
    const uncalDist = [];
    for (let i = 0; i < 800; i++) uncalDist.push(Math.max(0, Math.min(1, Math.random() * 0.3))); // mostly 0
    for (let i = 0; i < 200; i++) uncalDist.push(Math.max(0, Math.min(1, 0.8 + Math.random() * 0.2))); // mostly 1

    // Generate a smoother, wider calibrated distribution
    const calDist = [];
    for (let i = 0; i < 800; i++) calDist.push(Math.max(0, Math.min(1, Math.random() * 0.45))); // spread out 0s
    for (let i = 0; i < 200; i++) calDist.push(Math.max(0, Math.min(1, 0.6 + Math.random() * 0.4))); // spread out 1s


    const traceUncal = {
        x: uncalDist,
        name: "Uncalibrated Scores",
        type: "histogram",
        opacity: 0.6,
        marker: { color: clrUncalibrated },
        histnorm: "probability density"
    };

    const traceCal = {
        x: calDist,
        name: "Calibrated Probabilities",
        type: "histogram",
        opacity: 0.6,
        marker: { color: clrCalibrated },
        histnorm: "probability density"
    };

    const layout = getLayout("Score Distribution Shift (XGBoost)");
    layout.barmode = "overlay";
    layout.margin.t = 80; // Add space at the top for the legend
    layout.margin.b = 40; // Restore a normal bottom margin
    layout.legend = { orientation: "h", y: 1.15, x: 0 }; // Move legend to the Top Left
    layout.xaxis = { title: "Score Value", range: [-0.05, 1.05], gridcolor: clrGrid };
    layout.yaxis = { title: "Density", showgrid: false, zeroline: false, showticklabels: false };

    // Mark threshold 0.5
    layout.shapes = [{
        type: 'line', x0: 0.5, x1: 0.5, y0: 0, y1: 1, yref: 'paper',
        line: { color: '#222222', width: 1, dash: 'dot' }
    }];

    // Annotate the threshold
    layout.annotations = [{
        x: 0.5, y: 1, xref: 'x', yref: 'paper',
        text: 'Threshold 0.5',
        showarrow: false,
        xanchor: 'left',
        xshift: 5,
        font: { size: 10, color: '#555' }
    }];

    Plotly.newPlot("plot-prob-distribution", [traceUncal, traceCal], layout, { displayModeBar: false, responsive: true });
}
