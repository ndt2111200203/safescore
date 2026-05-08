/* ═══════════════════════════════════════════════════════════════
   SafeScore – Chart.js Helpers
   ═══════════════════════════════════════════════════════════════ */

// Global Chart defaults
Chart.defaults.color = '#8a94b0';
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.plugins.legend.display = false;
Chart.defaults.plugins.tooltip.backgroundColor = '#1e2235';
Chart.defaults.plugins.tooltip.borderColor = 'rgba(255,255,255,0.10)';
Chart.defaults.plugins.tooltip.borderWidth = 1;
Chart.defaults.plugins.tooltip.padding = 10;
Chart.defaults.plugins.tooltip.cornerRadius = 8;

const ChartHelper = {
  instances: {},

  destroy(id) {
    if (this.instances[id]) { this.instances[id].destroy(); delete this.instances[id]; }
  },

  /**
   * Line chart for mood trend
   * @param {string} canvasId
   * @param {Array}  labels  - date strings
   * @param {Array}  scores  - 1-5 values
   */
  moodLine(canvasId, labels, scores) {
    this.destroy(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0, 'rgba(108,99,255,0.25)');
    gradient.addColorStop(1, 'rgba(108,99,255,0)');

    this.instances[canvasId] = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          data: scores,
          borderColor: '#6c63ff',
          backgroundColor: gradient,
          borderWidth: 2.5,
          pointBackgroundColor: '#6c63ff',
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true,
          tension: 0.4,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            min: 1, max: 5, stepSize: 1,
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { callback: v => ['','😔','😟','😐','😊','😄'][v] },
          },
          x: { grid: { display: false } },
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: ctx => {
                const labels = ['','Rất tệ','Tệ','Bình thường','Tốt','Tuyệt vời'];
                return labels[ctx.parsed.y] || ctx.parsed.y;
              },
            },
          },
        },
      },
    });
  },

  /**
   * Mini sparkline (no axes, no grid)
   */
  sparkline(canvasId, scores) {
    this.destroy(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const colors = scores.map(s =>
      s >= 4 ? '#00d4aa' : s === 3 ? '#6c63ff' : s === 2 ? '#ffb347' : '#ff5252'
    );

    this.instances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: scores.map((_, i) => i),
        datasets: [{ data: scores, backgroundColor: colors, borderRadius: 3, borderWidth: 0 }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: { x: { display: false }, y: { display: false, min: 0, max: 5 } },
        plugins: { tooltip: { enabled: false } },
        animation: { duration: 600 },
      },
    });
  },
};

window.Charts = ChartHelper;
