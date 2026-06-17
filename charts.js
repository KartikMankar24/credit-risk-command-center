window.Charts = (function () {
  const SERIES = ['#6366f1','#06b6d4','#16a34a','#d97706','#dc2626','#8b5cf6','#0ea5e9','#65a30d','#ea580c','#ec4899'];

  function palette() {
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    return {
      text: dark ? '#94a3b8' : '#64748b',
      grid: dark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)',
    };
  }

  function baseOpts() {
    const P = palette();
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 400 },
      plugins: {
        legend: { labels: { color: P.text, boxWidth: 12, font: { size: 12 } } },
        tooltip: { mode: 'index', intersect: false },
      },
    };
  }

  function withZoom(opts) {
    opts.plugins = opts.plugins || {};
    opts.plugins.zoom = {
      zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'x' },
      pan: { enabled: true, mode: 'x' },
    };
    return opts;
  }

  const _instances = {};

  function make(id, config) {
    const canvas = document.getElementById(id);
    if (!canvas) return null;
    if (_instances[id]) { _instances[id].destroy(); delete _instances[id]; }
    const chart = new Chart(canvas, config);
    _instances[id] = chart;
    return chart;
  }

  function doughnut(id, labels, data, colors, opts = {}) {
    const P = palette();
    return make(id, {
      type: 'doughnut',
      data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 0, hoverOffset: 6 }] },
      options: Object.assign(baseOpts(), {
        cutout: '62%',
        plugins: {
          legend: {
            position: opts.legend || 'right',
            labels: { color: P.text, boxWidth: 12, font: { size: 12 } },
          },
          tooltip: { callbacks: { label: (c) => ` ${c.label}: ${c.raw.toLocaleString('en-IN')}` } },
        },
      }),
    });
  }

  function resetZoom(id) { if (_instances[id]) _instances[id].resetZoom?.(); }

  function exportPng(id, title) {
    const chart = _instances[id];
    if (!chart) return;
    const a = document.createElement('a');
    a.href = chart.toBase64Image();
    a.download = (title || id) + '.png';
    a.click();
  }

  return { make, doughnut, baseOpts, withZoom, palette, resetZoom, exportPng, SERIES };
})();
