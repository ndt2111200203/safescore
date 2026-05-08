/* ═══════════════════════════════════════════════════════════════
   SafeScore – Dashboard Page
   ═══════════════════════════════════════════════════════════════ */

const DashboardPage = {
  async render() {
    const user = Api.getUser();
    const hour = new Date().getHours();
    const greet = hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';

    document.getElementById('main-content').innerHTML = `
      <div class="page">
        <div class="page-header">
          <h1 class="page-title">${greet}, ${user?.name?.split(' ').pop() || 'bạn'} 👋</h1>
          <p class="page-subtitle">Hôm nay bạn cảm thấy thế nào?</p>
        </div>

        <!-- Quick mood check-in banner -->
        <div id="mood-banner" class="glass-card" style="padding:var(--sp-5);margin-bottom:var(--sp-6);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:var(--sp-3);">
          <div>
            <div style="font-weight:700;margin-bottom:4px;">😊 Check-in cảm xúc hôm nay</div>
            <div style="font-size:0.82rem;color:var(--text-muted);" id="checkin-status">Đang tải...</div>
          </div>
          <button id="quick-checkin-btn" class="btn btn-primary btn-sm">Check-in ngay</button>
        </div>

        <!-- Stats row -->
        <div class="grid-4 stagger-children" style="margin-bottom:var(--sp-6);">
          <div class="card stat-card hover-lift">
            <div class="stat-icon">📊</div>
            <div class="stat-number" id="dash-stress-score"><span class="skeleton" style="width:60px;height:2rem;display:inline-block;"></span></div>
            <div class="stat-label">Stress Score</div>
          </div>
          <div class="card stat-card hover-lift">
            <div class="stat-icon">📅</div>
            <div class="stat-number" id="dash-deadline-count"><span class="skeleton" style="width:40px;height:2rem;display:inline-block;"></span></div>
            <div class="stat-label">Deadline trong 7 ngày</div>
          </div>
          <div class="card stat-card hover-lift">
            <div class="stat-icon">⚠️</div>
            <div class="stat-number" id="dash-overdue-count"><span class="skeleton" style="width:40px;height:2rem;display:inline-block;"></span></div>
            <div class="stat-label">Quá hạn</div>
          </div>
          <div class="card stat-card hover-lift">
            <div class="stat-icon">🔥</div>
            <div class="stat-number" id="dash-streak"><span class="skeleton" style="width:40px;height:2rem;display:inline-block;"></span></div>
            <div class="stat-label">Ngày check-in liên tiếp</div>
          </div>
        </div>

        <!-- Main grid -->
        <div style="display:grid;grid-template-columns:1fr 340px;gap:var(--sp-6);" id="dash-main-grid">

          <!-- Left: upcoming deadlines + mood chart -->
          <div style="display:flex;flex-direction:column;gap:var(--sp-6);">

            <div class="card">
              <div class="section-heading">📅 Deadline sắp tới</div>
              <div id="dash-deadlines-list">
                <div class="skeleton" style="height:60px;border-radius:var(--r-md);margin-bottom:8px;"></div>
                <div class="skeleton" style="height:60px;border-radius:var(--r-md);margin-bottom:8px;"></div>
                <div class="skeleton" style="height:60px;border-radius:var(--r-md);"></div>
              </div>
            </div>

            <div class="card">
              <div class="section-heading">📈 Cảm xúc 7 ngày qua</div>
              <div style="height:160px;position:relative;">
                <canvas id="mood-sparkline-chart"></canvas>
              </div>
            </div>

          </div>

          <!-- Right: stress gauge + AI tip -->
          <div style="display:flex;flex-direction:column;gap:var(--sp-6);">

            <div class="card" style="text-align:center;">
              <div class="section-heading" style="justify-content:center;">📊 Stress Meter</div>
              <div class="stress-gauge-wrap" id="dash-gauge">
                <svg class="gauge-svg" width="180" height="100" viewBox="0 0 180 100">
                  <path class="gauge-track"
                    d="M 20 90 A 70 70 0 0 1 160 90"
                    stroke-linecap="round"/>
                  <path class="gauge-fill" id="dash-gauge-fill"
                    d="M 20 90 A 70 70 0 0 1 160 90"
                    stroke="#6c63ff"
                    stroke-dasharray="220"
                    stroke-dashoffset="220"/>
                </svg>
                <div class="gauge-center" style="margin-top:-40px;">
                  <div class="gauge-score" id="dash-gauge-score">—</div>
                  <div class="gauge-label" id="dash-gauge-label" style="color:var(--text-muted);">Đang tính...</div>
                </div>
              </div>
            </div>

            <div class="ai-card" id="dash-ai-tip">
              <div class="ai-icon">🤖</div>
              <div class="ai-title">Gợi ý hôm nay</div>
              <div class="ai-body" id="dash-ai-body">Đang tải gợi ý...</div>
              <a href="#ai" class="ai-action">Xem tất cả gợi ý →</a>
            </div>

          </div>
        </div>
      </div>
    `;

    // Responsive: stack on mobile
    const mq = window.matchMedia('(max-width:768px)');
    if (mq.matches) {
      document.getElementById('dash-main-grid').style.gridTemplateColumns = '1fr';
    }

    await this.loadData();
  },

  async loadData() {
    try {
      const [stress, deadlines, moods] = await Promise.all([
        Api.get('/stress'),
        Api.get('/deadlines'),
        Api.get('/mood?days=7'),
      ]);

      // Stress score
      this.renderStressGauge(stress.score, stress.level);
      document.getElementById('dash-stress-score').textContent = stress.score;
      document.getElementById('dash-deadline-count').textContent = stress.factors.deadlines7d;
      document.getElementById('dash-overdue-count').textContent = stress.factors.overdue;

      // Streak
      const streak = this.calcStreak(moods);
      document.getElementById('dash-streak').textContent = streak + ' 🔥';

      // Deadlines
      this.renderDeadlines(deadlines);

      // Mood chart
      const last7 = this.buildLast7(moods);
      Charts.sparkline('mood-sparkline-chart', last7.scores);

      // Checkin banner
      const today = await Api.get('/mood/today');
      if (today) {
        const labels = ['','😔 Rất tệ','😟 Tệ','😐 Bình thường','😊 Tốt','😄 Tuyệt vời'];
        document.getElementById('checkin-status').textContent = `Hôm nay: ${labels[today.score]}`;
        document.getElementById('quick-checkin-btn').textContent = 'Cập nhật';
      } else {
        document.getElementById('checkin-status').textContent = 'Bạn chưa check-in hôm nay';
      }

      // AI tip
      const tip = AiPage.getOneTip(stress.score, stress.factors.avgMood);
      document.getElementById('dash-ai-body').textContent = tip;

    } catch (err) {
      console.error(err);
    }

    document.getElementById('quick-checkin-btn').addEventListener('click', () => {
      window.App.navigateTo('mood');
    });
  },

  renderStressGauge(score, level) {
    const el = document.getElementById('dash-gauge-score');
    const labelEl = document.getElementById('dash-gauge-label');
    const fillEl  = document.getElementById('dash-gauge-fill');
    if (!el) return;

    const colors = { normal:'#00d4aa', moderate:'#ffb347', high:'#ff8c42', burnout:'#ff5252' };
    const labels = { normal:'Bình thường', moderate:'Cần chú ý', high:'Áp lực cao', burnout:'⚠️ Burnout!' };

    const color = colors[level] || '#6c63ff';
    const offset = 220 - (score / 100) * 220;

    el.textContent = score;
    el.style.color = color;
    labelEl.textContent = labels[level] || '';
    labelEl.style.color = color;
    fillEl.style.stroke = color;
    fillEl.style.strokeDashoffset = offset;
  },

  renderDeadlines(deadlines) {
    const el = document.getElementById('dash-deadlines-list');
    const upcoming = deadlines
      .filter(d => !d.done && new Date(d.due_date) >= new Date())
      .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
      .slice(0, 4);

    if (!upcoming.length) {
      el.innerHTML = `<div class="empty-state" style="padding:var(--sp-6);">
        <div class="empty-state-icon">🎉</div>
        <div class="empty-state-title">Không có deadline nào sắp tới!</div>
      </div>`;
      return;
    }

    el.innerHTML = upcoming.map(d => {
      const due     = new Date(d.due_date);
      const daysLeft = Math.ceil((due - Date.now()) / 86400000);
      const urgency  = daysLeft <= 1 ? 'coral' : daysLeft <= 3 ? 'amber' : 'mint';
      const dueStr   = daysLeft === 0 ? 'Hôm nay!' : daysLeft === 1 ? 'Ngày mai' : `${daysLeft} ngày nữa`;

      return `<div style="display:flex;align-items:center;gap:var(--sp-3);padding:var(--sp-3) 0;border-bottom:1px solid var(--glass-border);">
        <div style="flex:1;min-width:0;">
          <div style="font-weight:700;font-size:0.875rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${d.title}</div>
          <div style="font-size:0.75rem;color:var(--text-muted);">${d.subject || 'Không rõ môn'}</div>
        </div>
        <span class="badge badge-${urgency}" style="flex-shrink:0;">${dueStr}</span>
      </div>`;
    }).join('');
  },

  buildLast7(moods) {
    const today = new Date();
    const scores = [];
    const labels = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const entry   = moods.find(m => m.created_at.slice(0, 10) === dateStr);
      scores.push(entry ? entry.score : 0);
      labels.push(dateStr.slice(5));
    }
    return { scores, labels };
  },

  calcStreak(moods) {
    if (!moods.length) return 0;
    let streak = 0;
    const today = new Date().toISOString().slice(0, 10);
    let check   = today;
    const dates = new Set(moods.map(m => m.created_at.slice(0, 10)));
    while (dates.has(check)) {
      streak++;
      const d = new Date(check);
      d.setDate(d.getDate() - 1);
      check = d.toISOString().slice(0, 10);
    }
    return streak;
  },
};

window.DashboardPage = DashboardPage;
