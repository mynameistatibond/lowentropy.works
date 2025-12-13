/* Plotly bootstrap — theme vars from the right node (body/html) */
(() => {
  const root = document.documentElement;

  // ---------- utils
  const cssVar = (el, name, fb) => {
    const v = getComputedStyle(el).getPropertyValue(name);
    return (v && v.trim()) || fb;
  };
  const themeEl = () =>
    document.body.hasAttribute('data-theme') ? document.body : document.documentElement;

  // NEW: read data-layout overrides safely
  const layoutOverrides = (el) => {
    const raw = el.getAttribute('data-layout');
    if (!raw) return {};
    try { return JSON.parse(raw); } catch { return {}; }
  };

  // NEW: shallow deep-merge good enough for Plotly layout objects
  const merge = (base, over) => {
    const out = { ...base };
    for (const k in over) {
      const v = over[k];
      if (v && typeof v === 'object' && !Array.isArray(v))
        out[k] = merge(base[k] || {}, v);
      else
        out[k] = v;
    }
    return out;
  };

  const resolvePlotFont = (tn) => {
    const raw = cssVar(tn, '--plot-font', '');
    if (raw && !raw.includes('var(')) return raw;
    return getComputedStyle(document.body).fontFamily
        || 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
  };

  function tokens(el){
    const tn  = themeEl();
    const csEl = getComputedStyle(el);
    return {
      font: resolvePlotFont(tn),
      axis: cssVar(tn, '--plot-axis', '#666'),
      grid: cssVar(tn, '--plot-grid', '#ccc'),
      tint: cssVar(tn, '--plot-trace', csEl.color || '#30343F')
    };
  }

  const LINE_DASHES = ['solid','dot','dash','longdash','dashdot','longdashdot'];
  const MARKERS     = ['circle','square','diamond','x','triangle-up','triangle-down'];
  const BAR_PATS    = ['', '/', '\\', 'x', '-', '.', '|', '+'];

  function differentiateTraces(data, tint) {
    let lineIdx = 0, barIdx = 0;
    data.forEach(tr => {
      if (tr.type === 'bar') {
        tr.marker = tr.marker || {};
        tr.marker.color = tr.marker.color || tint;
        tr.marker.line = tr.marker.line || {};
        tr.marker.line.width = tr.marker.line.width ?? 1;
        tr.marker.pattern = tr.marker.pattern || {};
        tr.marker.pattern.shape = tr.marker.pattern.shape || BAR_PATS[barIdx % BAR_PATS.length];
        tr.opacity = tr.opacity ?? 0.9;
        barIdx++;
      } else {
        tr.line = tr.line || {};
        tr.line.color = tr.line.color || tint;
        tr.line.width = tr.line.width ?? 2.5;
        tr.line.dash  = tr.line.dash  || LINE_DASHES[lineIdx % LINE_DASHES.length];
        if (tr.mode && tr.mode.includes('markers')) {
          tr.marker = tr.marker || {};
          tr.marker.color  = tr.marker.color  || tint;
          tr.marker.size   = tr.marker.size   ?? 6;
          tr.marker.symbol = tr.marker.symbol || MARKERS[lineIdx % MARKERS.length];
        }
        lineIdx++;
      }
    });
  }

  function layoutFor(el){
    const t = tokens(el);
    const w = Math.max(240, Math.floor(el.getBoundingClientRect().width));
    const h = parseInt(el.getAttribute('data-height') || '340', 10);
    // NOTE: bigger default left margin + automargin on y to avoid clipping
    return {
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor:  'rgba(0,0,0,0)',
      width: w, height: h,
      margin: { l: 140, r: 20, t: 20, b: 42 },   // was l:46
      font: { family: t.font, color: t.axis, size: 12 },
      hoverlabel: { font: { family: t.font, size: 12 } },
      xaxis: { showgrid:true, gridcolor:t.grid, linecolor:t.axis, zeroline:false, ticks:'outside', tickfont:{ size:11 } },
      yaxis: { showgrid:true, gridcolor:t.grid, linecolor:t.axis, zeroline:false, ticks:'outside', tickfont:{ size:11 }, automargin:true }
    };
  }

  function configFor(el){
    return {
      responsive: true,
      displaylogo: false,
      displayModeBar: ((el.getAttribute('data-modebar') ?? 'true') !== 'false') ? 'hover' : false,
      modeBarButtonsToRemove: ['toImage','lasso2d','select2d'],
      scrollZoom: false
    };
  }

  async function getData(el){
    const src = (el.dataset.src || 'demo:line').trim();
    if (src.startsWith('demo:')) {
      const k = src.split(':')[1];
      return (k === 'bar')
        ? [{ type:'bar', x:['A','B','C'], y:[3,6,4] }]
        : [{ type:'scatter', mode:'lines+markers', x:[0,1,1.5,2,3,4], y:[0,1,1.4,1.8,2.1,3.2] }];
    }
    if (src[0] === '[' || src[0] === '{') { try { return JSON.parse(src); } catch {} }
    try {
      const r = await fetch(src, { cache:'no-cache' }); if (!r.ok) throw new Error(r.status);
      return await r.json();
    } catch {
      return [{ type:'scatter', mode:'lines', x:[0,1,2], y:[0,1,0.6] }];
    }
  }

  // ---------- initial render
  async function render(el){
    const { tint } = tokens(el);
    const data = await getData(el);
    differentiateTraces(data, tint);

    const base = layoutFor(el);
    const over = layoutOverrides(el);           // <- read per-chart layout
    const layout = merge(base, over);           // <- merge with base
    await Plotly.newPlot(el, data, layout, configFor(el));
  }

  // ---------- live restyle on theme or resize
  function refresh(el){
    if (!el || !el._fullLayout) return;
    const t = tokens(el);
    const base = layoutFor(el);
    const over = layoutOverrides(el);
    const L = merge(base, over);

    Plotly.relayout(el, {
      'font.family': t.font, 'font.color': t.axis,
      'xaxis.linecolor': t.axis, 'xaxis.gridcolor': t.grid, 'xaxis.tickfont.color': t.axis,
      'yaxis.linecolor': t.axis, 'yaxis.gridcolor': t.grid, 'yaxis.tickfont.color': t.axis,
      width: L.width, height: L.height,
      margin: L.margin,
      'yaxis.automargin': true
    });

    const N = (el.data || []).length;
    if (N) Plotly.restyle(el, { 'line.color': t.tint, 'marker.color': t.tint }, [...Array(N).keys()]);
  }

  const refreshAll = () => document.querySelectorAll('.plotly').forEach(refresh);

  let r1=0, r2=0;
  const schedule = () => { cancelAnimationFrame(r1); cancelAnimationFrame(r2);
    r1 = requestAnimationFrame(() => { r2 = requestAnimationFrame(refreshAll); });
  };

  const boot = () => document.querySelectorAll('.plotly').forEach(render);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();

  new MutationObserver(m => { if (m.some(x => x.attributeName === 'data-theme')) schedule(); })
    .observe(document.documentElement, { attributes:true, attributeFilter:['data-theme'] });
  new MutationObserver(m => { if (m.some(x => x.attributeName === 'data-theme')) schedule(); })
    .observe(document.body, { attributes:true, attributeFilter:['data-theme'] });
  window.addEventListener('themechange', schedule);

  let tmr; window.addEventListener('resize', () => { clearTimeout(tmr); tmr = setTimeout(schedule, 120); });
})();
