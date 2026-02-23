/**
 * Tree Optimization Report Visualizations
 * Loads Plotly charts and dynamic HTML grids for the Tree Optimization page.
 */

document.addEventListener("DOMContentLoaded", () => {
    // Wait for Plotly to be available
    const initCharts = () => {
        if (typeof Plotly === "undefined") {
            setTimeout(initCharts, 100);
            return;
        }
        renderCVComparison();
        renderHyperparamsGrid();
        renderTestLeaderboard();
    };

    initCharts();
});

const clrBaseline = "#9b928f"; // 'Original' dataset color
const clrOptimized = "#FF4800"; // 'Trees' dataset color
const clrText = "rgba(40,40,40,0.8)";
const clrGrid = "rgba(0,0,0,0.05)";

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

// 1. Vis 1: CV Comparison (Grouped Bar Chart)
function renderCVComparison() {
    const models = ["Bagging", "ExtraTrees", "RandomForest", "AdaBoost", "XGBoost"]; // Sorted roughly by gain

    // Original Dataset (50 features)
    const originalF2 = [0.5331, 0.6449, 0.6477, 0.6502, 0.6479];
    // Trees Dataset (42 features)
    const treesF2 = [0.7233, 0.7452, 0.7931, 0.7886, 0.8325];

    const trace1 = {
        x: models,
        y: originalF2,
        name: "Original Dataset (50 feat.)",
        type: "bar",
        marker: { color: clrBaseline, opacity: 0.8 }
    };

    const trace2 = {
        x: models,
        y: treesF2,
        name: "Trees Dataset (42 feat.)",
        type: "bar",
        marker: { color: clrOptimized }
    };

    const layout = getLayout("Best Cross-Validated F2 by Feature Representation");
    layout.barmode = "group";
    layout.yaxis = { title: "CV F2 Score", gridcolor: clrGrid, range: [0.4, 0.9] };
    layout.xaxis = { fixedrange: true };

    Plotly.newPlot("plot-cv-comparison", [trace1, trace2], layout, { displayModeBar: false, responsive: true });
}

// 2. Vis 2: Hyperparameter Card Grid (HTML/CSS injection)
function renderHyperparamsGrid() {
    const grid = document.getElementById("plot-hyperparams-grid");
    if (!grid) return;

    const cardsData = [
        {
            model: "RandomForest",
            f2: "0.7931",
            params: ["n_estimators: 200", "max_depth: 15", "min_samples_leaf: 4"],
            imbalance: "balanced_subsample"
        },
        {
            model: "XGBoost",
            f2: "0.8325",
            params: ["n_estimators: 200", "max_depth: 8", "learning_rate: 0.005", "subsample: 0.6"],
            imbalance: "scale_pos_weight: 7",
            highlight: true
        },
        {
            model: "ExtraTrees",
            f2: "0.7452",
            params: ["n_estimators: 400", "max_depth: 10", "min_samples_leaf: 4"],
            imbalance: "balanced_subsample"
        },
        {
            model: "AdaBoost",
            f2: "0.7886",
            params: ["n_estimators: 50", "learning_rate: 0.01", "base_max_depth: 3"],
            imbalance: "indirect via boosting"
        }
    ];

    let html = "";
    cardsData.forEach(c => {
        const border = c.highlight ? "border-color: #FF4800; border-width: 2px;" : "";
        const titleColor = c.highlight ? "color: #FF4800;" : "";

        html += `
            <div style="background: white; border: 1px solid var(--clr-divider); border-radius: 6px; padding: 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.02); display: flex; flex-direction: column; gap: 0.5rem; ${border}">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <strong style="font-size: 1.1rem; ${titleColor}">${c.model}</strong>
                    <span style="background: var(--clr-bg-alt); padding: 0.2rem 0.6rem; border-radius: 4px; font-weight: 600; font-size: 0.85rem;">F2: ${c.f2}</span>
                </div>
                <ul style="margin: 0; padding-left: 1.2rem; font-size: 0.85rem; color: var(--clr-text-muted); line-height: 1.6;">
                    ${c.params.map(p => `<li><code style="background:transparent; padding:0; color:inherit;">${p}</code></li>`).join("")}
                </ul>
                <div style="margin-top: auto; padding-top: 1rem; font-size: 0.8rem; border-top: 1px dotted var(--clr-divider);">
                    <span style="opacity:0.7">Imbalance:</span> <strong>${c.imbalance}</strong>
                </div>
            </div>
        `;
    });

    grid.innerHTML = html;
}

// 3. Vis 3: Test Leaderboard (Horizontal Bar)
function renderTestLeaderboard() {
    // Sort ascending so the best is at the top of the horizontal bar chart
    const models = ["XGBoost", "RandomForest", "AdaBoost", "VotingEnsemble", "Bagging", "ExtraTrees"];
    const testF2 = [0.6917, 0.7087, 0.7227, 0.7393, 0.7393, 0.7854];

    // Highlight ExtraTrees
    const colors = models.map(m => m === "ExtraTrees" ? clrOptimized : clrBaseline);

    const trace = {
        y: models,
        x: testF2,
        type: "bar",
        orientation: "h",
        marker: { color: colors, opacity: 0.9 },
        text: testF2.map(v => v.toFixed(4)),
        textposition: "auto",
        insidetextanchor: "end"
    };

    const layout = getLayout("Test-Set Leaderboard (Threshold = 0.5)");
    layout.showlegend = false;
    layout.margin.l = 100; // room for model names
    layout.xaxis = { title: "Test F2 Score", gridcolor: clrGrid, range: [0.65, 0.8] };
    layout.yaxis = { fixedrange: true };

    Plotly.newPlot("plot-test-leaderboard", [trace], layout, { displayModeBar: false, responsive: true });
}
