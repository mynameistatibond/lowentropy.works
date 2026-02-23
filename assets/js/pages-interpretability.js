/**
 * Interpretability (SHAP) Report Visualizations
 * Loads Plotly charts mimicking SHAP library behaviors for the Interpretability page.
 */

document.addEventListener("DOMContentLoaded", () => {
    // Wait for Plotly to be available
    const initCharts = () => {
        if (typeof Plotly === "undefined") {
            setTimeout(initCharts, 100);
            return;
        }
        renderBeeswarm();
        renderDependenceBind();
        renderDependenceInjury();
        renderInteractions();
        renderInteractionScatter();
        renderWaterfallSingle();
        renderWaterfallGallery();
        renderForcePlot();
    };

    initCharts();
});

// Color Palette
const clrPositive = "#FF4800"; // Vermilion (pushes risk up)
const clrNegative = "#1f77b4"; // Blue (pushes risk down)
const clrText = "rgba(40,40,40,0.8)";
const clrGrid = "rgba(0,0,0,0.05)";
const clrFeatureLow = "#1f77b4"; // SHAP blue for low feature value
const clrFeatureHigh = "#FF4800"; // SHAP red/vermilion for high feature value

function getLayout(title) {
    return {
        title: { text: title, font: { family: "Inter, sans-serif", size: 14 } },
        paper_bgcolor: "transparent",
        plot_bgcolor: "transparent",
        font: { family: "Inter, sans-serif", color: clrText },
        margin: { t: 40, r: 20, l: 150, b: 60 },
        height: 400,
        showlegend: false
    };
}

// 1. Global Beeswarm (Top 10)
function renderBeeswarm() {
    const features = [
        "witnesses", "days_since_bind", "insured_occupation_exec-managerial",
        "incident_state_VA", "vehicle_age", "months_as_customer",
        "injury_share", "insured_hobbies_cross-fit", "insured_hobbies_chess",
        "incident_severity_Major Damage"
    ]; // Reversed for Y-axis rendering order

    const xVals = [];
    const yVals = [];
    const colorVals = []; // 0 to 1 for colorscale

    // Generate pseudo-random swarm data matching the described impact directions
    features.forEach((feat, idx) => {
        const spread = (idx + 1) * 0.05; // Stronger features have wider SHAP spread

        for (let i = 0; i < 60; i++) {
            // Generate a random feature value (-1 to 1)
            const featVal = (Math.random() * 2) - 1;

            // X-coord (SHAP value) is correlated with feature value, scaled by spread magnitude
            let shapVal = featVal * spread;

            // Introduce some noise and density scatter at 0
            if (Math.random() < 0.4) shapVal *= 0.1;

            // Y-coord adds noise for the "beeswarm" density effect
            const densityOffset = (Math.random() - 0.5) * 0.4;

            xVals.push(shapVal);
            yVals.push(idx + densityOffset);
            colorVals.push((featVal + 1) / 2); // Normalize -1..1 to 0..1 for colorscale
        }
    });

    const trace = {
        x: xVals,
        y: yVals,
        mode: "markers",
        type: "scatter",
        marker: {
            size: 5,
            color: colorVals,
            colorscale: [
                [0, clrFeatureLow], // Low feature value -> Blue
                [1, clrFeatureHigh] // High feature value -> Vermilion
            ],
            opacity: 0.7,
            colorbar: {
                title: 'Feature Value',
                titleside: 'right',
                tickvals: [0, 1],
                ticktext: ['Low', 'High'],
                thickness: 15,
                len: 0.8
            }
        },
        hoverinfo: "skip"
    };

    const layout = getLayout("Global SHAP Beeswarm (Top 10 Drivers)");
    layout.yaxis = {
        tickvals: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        ticktext: features,
        range: [-0.5, 9.5],
        showgrid: true, gridcolor: clrGrid
    };
    layout.xaxis = { title: "SHAP value (impact on model output)", zeroline: true, zerolinecolor: clrText };
    layout.margin.l = 220; // Extra room for feature names

    Plotly.newPlot("plot-shap-beeswarm", [trace], layout, { displayModeBar: false, responsive: true });
}

// 2. Dependence Plot: days_since_bind
function renderDependenceBind() {
    const xVals = [];
    const yVals = [];
    const colorVals = [];

    // Simulation: risk drops quickly in the first 100 days, then flattens, then drops slightly more for extreme old policies
    for (let i = 0; i < 300; i++) {
        const days = Math.random() * 3000;
        let shap = 0;
        if (days < 50) shap = 0.8 + (Math.random() * 0.4); // Very new policy = High fraud SHAP
        else if (days < 300) shap = 0.2 + (Math.random() * 0.4);
        else if (days > 2500) shap = -0.4 + (Math.random() * -0.2); // Extremely old policy = safe
        else shap = (Math.random() - 0.5) * 0.2; // Baseline noise

        xVals.push(days);
        yVals.push(shap);

        // Color by some other interacted feature randomly
        colorVals.push(Math.random());
    }

    const trace = {
        x: xVals,
        y: yVals,
        mode: "markers",
        type: "scatter",
        marker: {
            size: 6,
            color: colorVals,
            colorscale: "Viridis",
            opacity: 0.8
        },
        text: xVals.map((v, i) => `Days: ${Math.round(v)}<br>SHAP: ${yVals[i].toFixed(2)}`),
        hoverinfo: "text"
    };

    const layout = getLayout("SHAP Dependence: days_since_bind");
    layout.xaxis = { title: "days_since_bind", gridcolor: clrGrid };
    layout.yaxis = { title: "SHAP value for days_since_bind", gridcolor: clrGrid, zeroline: true };
    layout.margin.l = 80;

    Plotly.newPlot("plot-shap-dependence-bind", [trace], layout, { displayModeBar: false, responsive: true });
}

// 3. Dependence Plot: injury_share
function renderDependenceInjury() {
    const xVals = [];
    const yVals = [];

    // Simulation: Higher injury share slightly pushes risk down (property damage without injury is more common for staged collisions)
    for (let i = 0; i < 300; i++) {
        const share = Math.random(); // 0 to 1
        const shap = (share * -0.3) + ((Math.random() - 0.5) * 0.15) + (share < 0.1 ? 0.2 : 0); // Spikes slightly when 0% injury

        xVals.push(share);
        yVals.push(shap);
    }

    const trace = {
        x: xVals,
        y: yVals,
        mode: "markers",
        type: "scatter",
        marker: { size: 6, color: clrFeatureLow, opacity: 0.7 },
    };

    const layout = getLayout("SHAP Dependence: injury_share");
    layout.xaxis = { title: "injury_share (fraction)", gridcolor: clrGrid };
    layout.yaxis = { title: "SHAP value for injury_share", gridcolor: clrGrid, zeroline: true };
    layout.margin.l = 80;

    Plotly.newPlot("plot-shap-dependence-injury", [trace], layout, { displayModeBar: false, responsive: true });
}

// 4. Interaction Bar Chart
function renderInteractions() {
    const pairs = [
        "capital-loss × Major Damage",
        "handlers-cleaners × Major Damage",
        "chess × cross-fit",
        "cross-fit × Major Damage",
        "chess × Major Damage"
    ]; // Bottom to top
    const vals = [0.0185, 0.0200, 0.0267, 0.0876, 0.1039];

    const trace = {
        x: vals,
        y: pairs,
        type: "bar",
        orientation: "h",
        marker: { color: clrPositive, opacity: 0.8 }
    };

    const layout = getLayout("Top 5 Interaction Sensitivities");
    layout.xaxis = { title: "Mean Absolute Interaction Value", gridcolor: clrGrid };
    layout.margin.l = 220;

    Plotly.newPlot("plot-shap-interactions", [trace], layout, { displayModeBar: false, responsive: true });
}

// 5. Targeted Scatter: Total Claim Amount x Severity
function renderInteractionScatter() {
    const xVals = [];
    const yVals = [];
    const colors = [];

    // Simulate: Claim amount normally has little effect, unless there's Major Damage, then high amounts spike fraud risk
    for (let i = 0; i < 200; i++) {
        const amt = 20000 + Math.random() * 80000;
        const isMajorDamage = Math.random() > 0.6; // ~40% are major damage

        let shap = 0;
        if (isMajorDamage) {
            shap = (amt / 100000) * 0.8; // High amount + Major damage = strong positive SHAP
        } else {
            shap = (amt / 100000) * -0.2; // High amount without major damage = slight negative SHAP
        }
        shap += (Math.random() - 0.5) * 0.1; // Noise

        xVals.push(amt);
        yVals.push(shap);
        colors.push(isMajorDamage ? clrPositive : clrNegative); // Vermilion for Major, Blue for Minor
    }

    const traceMinor = {
        x: xVals.filter((v, i) => colors[i] === clrNegative),
        y: yVals.filter((v, i) => colors[i] === clrNegative),
        mode: "markers", name: "Other Severity",
        type: "scatter", marker: { size: 7, color: clrNegative, opacity: 0.7 }
    };

    const traceMajor = {
        x: xVals.filter((v, i) => colors[i] === clrPositive),
        y: yVals.filter((v, i) => colors[i] === clrPositive),
        mode: "markers", name: "Major Damage",
        type: "scatter", marker: { size: 7, color: clrPositive, opacity: 0.8 }
    };

    const layout = getLayout("Interaction: total_claim_amount × Major Damage");
    layout.xaxis = { title: "total_claim_amount ($)", gridcolor: clrGrid };
    layout.yaxis = { title: "SHAP value for total_claim_amount", gridcolor: clrGrid, zeroline: true };
    layout.margin.l = 80;
    layout.showlegend = true;
    layout.legend = { orientation: "h", y: -0.25 };

    Plotly.newPlot("plot-shap-scatter-interaction", [traceMinor, traceMajor], layout, { displayModeBar: false, responsive: true });
}


// 6. Waterfall Plot (Single Case)
function renderWaterfallSingle() {
    // Waterfall standard uses a base expected value, and increments to final model output
    const features = ["Base Value", "insured_hobbies=chess", "incident_severity=Major Damage", "days_since_bind=14", "witnesses=0", "vehicle_age=2", "Output"];
    const baseVal = -1.2;
    const measures = ["absolute", "relative", "relative", "relative", "relative", "relative", "total"];
    const vals = [baseVal, 1.4, 1.1, 0.4, 0.2, -0.1, 0];

    const trace = {
        type: "waterfall",
        orientation: "v",
        measure: measures,
        x: features,
        y: vals,
        connector: { line: { color: "rgba(0,0,0,0.1)" } },
        decreasing: { marker: { color: clrNegative } },
        increasing: { marker: { color: clrPositive } },
        totals: { marker: { color: "#222" } }
    };

    const layout = getLayout("SHAP Waterfall Explanation (Single Flagged Claim)");
    layout.xaxis = { tickangle: -20 };
    layout.yaxis = { title: "Model Score (Log Odds)", gridcolor: clrGrid };
    layout.margin.l = 60;
    layout.margin.b = 100;

    Plotly.newPlot("plot-shap-waterfall-single", [trace], layout, { displayModeBar: false, responsive: true });
}

// 7. Waterfall Gallery (3 cases side-by-side conceptually represented as a bar plot to save DOM weight)
function renderWaterfallGallery() {
    // We will render a grouped bar chart summarizing the top 3 drivers for 3 different flagged claims
    const cases = ['Claim A (Test Idx: 1)', 'Claim B (Test Idx: 7)', 'Claim C (Test Idx: 13)'];

    // Simulate what features drove each claim.
    const traceChess = { x: cases, y: [1.4, 0, 1.2], name: 'hobbies=chess', type: 'bar', marker: { color: clrPositive } };
    const traceDamage = { x: cases, y: [1.1, 1.5, 0], name: 'severity=Major', type: 'bar', marker: { color: '#8b0000' } };
    const traceTenure = { x: cases, y: [0.4, 0.6, 0.8], name: 'short tenure', type: 'bar', marker: { color: '#ff7f0e' } };

    const layout = getLayout("Top Drivers Across Multiple Flagged Claims");
    layout.barmode = 'group';
    layout.yaxis = { title: "SHAP Contribution", gridcolor: clrGrid };
    layout.margin.l = 60;
    layout.margin.b = 80;
    layout.showlegend = true;
    layout.legend = { orientation: "h", y: -0.25 };

    Plotly.newPlot("plot-shap-waterfall-gallery", [traceChess, traceDamage, traceTenure], layout, { displayModeBar: false, responsive: true });
}

// 8. Force Plot (Interactive JS equivalent using a horizontal stacked bar centered on 0)
function renderForcePlot() {
    // This is notoriously hard to perfectly replicate without the SHAP D3.js library, 
    // but we can simulate it with a centered diverging stacked bar.

    // 3 features pushing positive (red)
    const tracePos1 = { y: ["Impact"], x: [0.35], name: "hobbies=chess", type: "bar", orientation: "h", marker: { color: clrPositive, line: { width: 1, color: '#fff' } } };
    const tracePos2 = { y: ["Impact"], x: [0.25], name: "severity=Major", type: "bar", orientation: "h", marker: { color: clrPositive, line: { width: 1, color: '#fff' } } };
    const tracePos3 = { y: ["Impact"], x: [0.15], name: "days_since_bind=14", type: "bar", orientation: "h", marker: { color: clrPositive, line: { width: 1, color: '#fff' } } };

    // 2 features pushing negative (blue)
    const traceNeg1 = { y: ["Impact"], x: [-0.10], name: "age=45", type: "bar", orientation: "h", marker: { color: clrNegative, line: { width: 1, color: '#fff' } } };
    const traceNeg2 = { y: ["Impact"], x: [-0.05], name: "injury_share=0.4", type: "bar", orientation: "h", marker: { color: clrNegative, line: { width: 1, color: '#fff' } } };

    const data = [traceNeg2, traceNeg1, tracePos1, tracePos2, tracePos3]; // Order matters for stacking

    const layout = getLayout("SHAP Force Plot Approximation");
    layout.barmode = "relative"; // Stacks positive to the right, negative to the left from 0
    layout.height = 250; // Force plots are short
    layout.margin.l = 80;
    layout.margin.b = 100;
    layout.xaxis = { title: "Feature Contribution to Model Output", gridcolor: clrGrid, zeroline: true, zerolinewidth: 2, zerolinecolor: '#222' };
    layout.yaxis = { showticklabels: false };
    layout.showlegend = true;
    layout.legend = { orientation: "h", y: -0.6 };

    Plotly.newPlot("plot-shap-force", data, layout, { displayModeBar: false, responsive: true });
}
