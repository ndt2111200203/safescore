/* ═══════════════════════════════════════════════════════════════
   SafeScore – Stress Meter Page
   ═══════════════════════════════════════════════════════════════ */

const StressPage = {
  async render() {
    document.getElementById('main-content').innerHTML = `
      <div class="page">
        <div class="page-header">
          <h1 class="page-title">📊 Stress Meter</h1>
          <p class="page-subtitle">Hiểu rõ mức độ áp lực để có hành động phù hợp</p>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-6);align-items:start;" id="stress-grid">

          <!-- Gauge -->
          <div class="card" style="text-align:center;padding:var(--sp-8);" id="stress-gauge-card">
            <div class="section-heading" style="justify-content:center;">Mức độ áp lực hiện tại</div>
            <div class="stress-gauge-wrap">
              <svg class="gauge-svg" width="220" height="130" viewBox="0 0 220 130">
                <path class="gauge-track" d="M 25 110 A 85 85 0 0 1 195 110" stroke-linecap="round"/>
                <path class="gauge-fill" id="stress-gauge-fill"
                  d="M 25 110 A 85 85 0 0 1 195 110"
                  stroke="#6c63ff"
                  stroke-dasharray="267"
                  stroke-dashoffset="267"/>
              </svg>
              <div class="gauge-center" style="margin-top:-50px;">
                <div class="gauge-score" id="stress-score">—</div>
                <div class="gauge-label" id="stress-level">Đang tính...</div>
              </div>
            </div>

            <!-- Level bar -->
            <div style="margin-top:var(--sp-6);">
              <div style="display:flex;justify-content:space-between;font-size:0.72rem;color:var(--text-muted);margin-bottom:var(--sp-2);">
                <span>0</span><span>40</span><span>60</span><span>80</span><span>100</span>
              </div>
              <div style="height:8px;border-radius:var(--r-full);background:linear-gradient(90deg,#00d4aa 0%,#ffb347 40%,#ff8c42 60%,#ff5252 80%);"></div>
              <div style="display:flex;justify-content:space-between;font-size:0.68rem;margin-top:4px;color:var(--text-muted);">
                <span>Bình thường</span><span>Chú ý</span><span>Cao</span><span>Burnout</span>
              </div>
            </div>
          </div>

          <!-- Factors -->
          <div style="display:flex;flex-direction:column;gap:var(--sp-4);">
            <div class="section-heading">🔍 Các yếu tố ảnh hưởng</div>
            <div class="card" id="factor-deadlines">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--sp-2);">
                <span style="font-weight:700;">📅 Deadline 7 ngày tới</span>
                <span id="f-deadlines" class="badge badge-amber">—</span>
              </div>
              <div class="progress-bar"><div class="progress-fill" id="fp-deadlines" style="width:0%;"></div></div>
              <div style="font-size:0.75rem;color:var(--text-muted);margin-top:var(--sp-2);">Mỗi deadline tính 8 điểm</div>
            </div>

            <div class="card">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--sp-2);">
                <span style="font-weight:700;">⚠️ Deadline quá hạn</span>
                <span id="f-overdue" class="badge badge-coral">—</span>
              </div>
              <div class="progress-bar"><div class="progress-fill" id="fp-overdue" style="width:0%;background:linear-gradient(90deg,var(--coral),#ff8c42);"></div></div>
              <div style="font-size:0.75rem;color:var(--text-muted);margin-top:var(--sp-2);">Mỗi deadline quá hạn tính 15 điểm</div>
            </div>

            <div class="card">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--sp-2);">
                <span style="font-weight:700;">😊 Mood trung bình (3 ngày)</span>
                <span id="f-mood" class="badge badge-purple">—</span>
              </div>
              <div class="progress-bar"><div class="progress-fill" id="fp-mood" style="width:0%;background:linear-gradient(90deg,var(--purple-light),var(--mint));"></div></div>
              <div style="font-size:0.75rem;color:var(--text-muted);margin-top:var(--sp-2);">Mood thấp = tăng điểm stress</div>
            </div>

            <div class="card">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--sp-2);">
                <span style="font-weight:700;">📆 Ngày chưa check-in</span>
                <span id="f-checkin" class="badge badge-mint">—</span>
              </div>
              <div class="progress-bar"><div class="progress-fill" id="fp-checkin" style="width:0%;background:linear-gradient(90deg,var(--mint),var(--amber));"></div></div>
              <div style="font-size:0.75rem;color:var(--text-muted);margin-top:var(--sp-2);">Mỗi ngày bỏ check-in tính 3 điểm (tối đa 7 ngày)</div>
            </div>
          </div>
        </div>

        <!-- Alert banner -->
        <div id="stress-alert" class="hidden" style="margin-top:var(--sp-6);padding:var(--sp-5);border-radius:var(--r-lg);border:1px solid;"></div>

        <div style="text-align:center;margin-top:var(--sp-8);">
          <button onclick="App.navigateTo('ai')" class="btn btn-primary btn-lg">
            🤖 Xem gợi ý cải thiện
          </button>
        </div>
      </div>
    `;

    // Responsive
    if (window.matchMedia('(max-width:768px)').matches) {
      document.getElementById('stress-grid').style.gridTemplateColumns = '1fr';
    }

    await this.loadData();
  },

  async loadData() {
    try {
      const data = await Api.get('/stress');
      this.renderGauge(data.score, data.level);
      this.renderFactors(data.factors);
      this.renderAlert(data.score, data.level);
    } catch { window.App.showToast('Không thể tải dữ liệu stress', 'error'); }
  },

  renderGauge(score, level) {
    const colors  = { normal:'#00d4aa', moderate:'#ffb347', high:'#ff8c42', burnout:'#ff5252' };
    const labels  = { normal:'🟢 Bình thường', moderate:'🟡 Cần chú ý', high:'🟠 Áp lực cao', burnout:'🔴 Burnout!' };
    const color   = colors[level] || '#6c63ff';
    const offset  = 267 - (score / 100) * 267;

    const scoreEl = document.getElementById('stress-score');
    const levelEl = document.getElementById('stress-level');
    const fillEl  = document.getElementById('stress-gauge-fill');

    if (!scoreEl) return;
    scoreEl.textContent = score;
    scoreEl.style.color = color;
    levelEl.textContent = labels[level] || '';
    levelEl.style.color = color;
    fillEl.style.stroke = color;
    fillEl.style.strokeDashoffset = offset;
  },

  renderFactors(f) {
    document.getElementById('f-deadlines').textContent = f.deadlines7d + ' deadline';
    document.getElementById('f-overdue').textContent   = f.overdue    + ' deadline';
    document.getElementById('f-mood').textContent      = f.avgMood ? f.avgMood.toFixed(1) + '/5' : 'Chưa có';
    document.getElementById('f-checkin').textContent   = f.daysSinceCheckin + ' ngày';

    document.getElementById('fp-deadlines').style.width = Math.min(f.deadlines7d * 10, 100) + '%';
    document.getElementById('fp-overdue').style.width   = Math.min(f.overdue * 15,    100) + '%';
    document.getElementById('fp-mood').style.width      = f.avgMood ? ((f.avgMood / 5) * 100) + '%' : '0%';
    document.getElementById('fp-checkin').style.width   = Math.min(f.daysSinceCheckin * 14, 100) + '%';
  },

  renderAlert(score, level) {
    const el = document.getElementById('stress-alert');
    if (!el) return;

    const alerts = {
      burnout: {
        bg:   'rgba(255,82,82,0.10)',
        border:'rgba(255,82,82,0.35)',
        msg:  '🚨 <strong>Cảnh báo Burnout!</strong> Mức stress của bạn rất cao. Hãy tạm dừng và nghỉ ngơi ngay. Cân nhắc chia sẻ với giảng viên hoặc chuyên viên tư vấn tâm lý.',
      },
      high: {
        bg:   'rgba(255,140,66,0.10)',
        border:'rgba(255,140,66,0.35)',
        msg:  '⚠️ <strong>Áp lực cao!</strong> Hãy sắp xếp lại thứ tự ưu tiên, thử kỹ thuật Pomodoro và đảm bảo ngủ đủ giấc.',
      },
      moderate: {
        bg:   'rgba(255,179,71,0.10)',
        border:'rgba(255,179,71,0.30)',
        msg:  '💛 <strong>Cần chú ý.</strong> Áp lực đang tăng nhẹ. Hãy kiểm tra lịch deadline và đừng quên check-in cảm xúc mỗi ngày.',
      },
    };

    const a = alerts[level];
    if (!a) return;

    el.style.background    = a.bg;
    el.style.borderColor   = a.border;
    el.style.color         = 'var(--text-secondary)';
    el.innerHTML           = a.msg;
    el.classList.remove('hidden');
  },
};

window.StressPage = StressPage;
