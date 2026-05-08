/* ═══════════════════════════════════════════════════════════════
   SafeScore – Mood Check-in Page
   ═══════════════════════════════════════════════════════════════ */

const MoodPage = {
  selectedScore: null,
  selectedTags:  new Set(),

  MOODS: [
    { score: 5, emoji: '😄', label: 'Tuyệt vời' },
    { score: 4, emoji: '😊', label: 'Tốt' },
    { score: 3, emoji: '😐', label: 'Bình thường' },
    { score: 2, emoji: '😟', label: 'Tệ' },
    { score: 1, emoji: '😔', label: 'Rất tệ' },
  ],

  TAGS: ['Mệt mỏi','Căng thẳng thi','Deadline dồn','Áp lực điểm số','Khó ngủ','Không tập trung','Thiếu động lực','Cô đơn','Ổn lắm','Vui vẻ','Đã hoàn thành task','Được nghỉ ngơi'],

  async render() {
    const moods = await Api.get('/mood?days=30').catch(() => []);
    const today = await Api.get('/mood/today').catch(() => null);

    document.getElementById('main-content').innerHTML = `
      <div class="page">
        <div class="page-header">
          <h1 class="page-title">😊 Mood Check-in</h1>
          <p class="page-subtitle">Theo dõi cảm xúc mỗi ngày để hiểu bản thân hơn</p>
        </div>

        <!-- Check-in form -->
        <div class="card" style="margin-bottom:var(--sp-6);">
          <h2 style="font-size:1rem;margin-bottom:var(--sp-5);">
            ${today ? '✏️ Cập nhật cảm xúc hôm nay' : '✨ Hôm nay bạn cảm thấy thế nào?'}
          </h2>

          <div class="mood-selector" id="mood-selector">
            ${this.MOODS.map(m => `
              <button class="mood-btn ${today?.score === m.score ? 'selected' : ''}"
                      data-score="${m.score}" type="button">
                <span class="mood-emoji">${m.emoji}</span>
                <span class="mood-label">${m.label}</span>
              </button>
            `).join('')}
          </div>

          <div style="margin-top:var(--sp-5);">
            <div class="section-heading">🏷️ Tag cảm xúc (tuỳ chọn)</div>
            <div class="tag-list" id="tag-list">
              ${this.TAGS.map(t => `
                <span class="tag-chip" data-tag="${t}">${t}</span>
              `).join('')}
            </div>
          </div>

          <div class="form-group" style="margin-top:var(--sp-5);">
            <label for="mood-note">📝 Ghi chú (tuỳ chọn)</label>
            <textarea id="mood-note" placeholder="Hôm nay tôi cảm thấy... / Điều tôi biết ơn hôm nay là..."
              rows="3" maxlength="300">${today?.note || ''}</textarea>
            <div class="char-counter"><span id="note-count">0</span>/300</div>
          </div>

          <div id="mood-submit-error" class="form-error hidden"></div>
          <button id="mood-submit-btn" class="btn btn-primary" disabled>
            ${today ? 'Cập nhật cảm xúc' : 'Lưu check-in'}
          </button>
        </div>

        <!-- Heatmap -->
        <div class="card" style="margin-bottom:var(--sp-6);">
          <div class="section-heading">📆 Lịch check-in 30 ngày</div>
          <div class="heatmap" id="mood-heatmap" style="gap:4px;"></div>
          <div style="display:flex;align-items:center;gap:var(--sp-3);margin-top:var(--sp-4);font-size:0.75rem;color:var(--text-muted);">
            <span>Ít</span>
            <div style="display:flex;gap:3px;">
              <div style="width:12px;height:12px;border-radius:2px;background:var(--bg-tertiary);"></div>
              <div style="width:12px;height:12px;border-radius:2px;background:#ff5252;"></div>
              <div style="width:12px;height:12px;border-radius:2px;background:#ffb347;"></div>
              <div style="width:12px;height:12px;border-radius:2px;background:#5ad8a6;"></div>
              <div style="width:12px;height:12px;border-radius:2px;background:#00d4aa;"></div>
            </div>
            <span>Tốt</span>
          </div>
        </div>

        <!-- Trend chart -->
        <div class="card">
          <div class="section-heading">📈 Xu hướng cảm xúc 30 ngày</div>
          <div style="height:220px;position:relative;">
            <canvas id="mood-trend-chart"></canvas>
          </div>
        </div>
      </div>
    `;

    this.selectedScore = today?.score || null;
    this.selectedTags  = new Set(today?.tags || []);

    // Pre-select tags from today
    if (today?.tags?.length) {
      today.tags.forEach(t => {
        document.querySelector(`.tag-chip[data-tag="${t}"]`)?.classList.add('selected');
      });
    }

    this.bindEvents();
    this.renderHeatmap(moods);
    this.renderTrendChart(moods);
    this.updateSubmitBtn();
  },

  bindEvents() {
    // Mood buttons
    document.getElementById('mood-selector').addEventListener('click', e => {
      const btn = e.target.closest('.mood-btn');
      if (!btn) return;
      document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      this.selectedScore = parseInt(btn.dataset.score);
      this.updateSubmitBtn();
    });

    // Tags
    document.getElementById('tag-list').addEventListener('click', e => {
      const chip = e.target.closest('.tag-chip');
      if (!chip) return;
      const tag = chip.dataset.tag;
      if (this.selectedTags.has(tag)) {
        this.selectedTags.delete(tag);
        chip.classList.remove('selected');
      } else {
        this.selectedTags.add(tag);
        chip.classList.add('selected');
      }
    });

    // Note counter
    const noteEl = document.getElementById('mood-note');
    noteEl.addEventListener('input', () => {
      document.getElementById('note-count').textContent = noteEl.value.length;
    });
    document.getElementById('note-count').textContent = noteEl.value.length;

    // Submit
    document.getElementById('mood-submit-btn').addEventListener('click', async () => {
      if (!this.selectedScore) return;
      const btn    = document.getElementById('mood-submit-btn');
      const errEl  = document.getElementById('mood-submit-error');
      const note   = document.getElementById('mood-note').value.trim();

      btn.disabled = true;
      btn.textContent = 'Đang lưu...';
      errEl.classList.add('hidden');

      try {
        await Api.post('/mood', {
          score: this.selectedScore,
          tags: [...this.selectedTags],
          note: note || null,
        });
        window.App.showToast('✅ Đã lưu cảm xúc hôm nay!', 'success');
        this.render();
      } catch (err) {
        errEl.textContent = err.message;
        errEl.classList.remove('hidden');
        btn.disabled = false;
        btn.textContent = 'Lưu check-in';
      }
    });
  },

  updateSubmitBtn() {
    const btn = document.getElementById('mood-submit-btn');
    if (btn) btn.disabled = !this.selectedScore;
  },

  renderHeatmap(moods) {
    const el = document.getElementById('mood-heatmap');
    if (!el) return;
    const moodMap = {};
    moods.forEach(m => { moodMap[m.created_at.slice(0, 10)] = m.score; });

    const today = new Date();
    let html = '';
    for (let i = 29; i >= 0; i--) {
      const d   = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const score = moodMap[key] || '';
      const label = d.toLocaleDateString('vi-VN', { day:'numeric', month:'short' });
      html += `<div class="heatmap-day" ${score ? `data-score="${score}"` : ''} title="${label}${score ? ' – ' + ['','Rất tệ','Tệ','Bình thường','Tốt','Tuyệt vời'][score] : ''}"></div>`;
    }
    el.innerHTML = html;
  },

  renderTrendChart(moods) {
    const sorted = [...moods].sort((a,b) => new Date(a.created_at)-new Date(b.created_at));
    Charts.moodLine(
      'mood-trend-chart',
      sorted.map(m => new Date(m.created_at).toLocaleDateString('vi-VN',{day:'numeric',month:'short'})),
      sorted.map(m => m.score)
    );
  },
};

window.MoodPage = MoodPage;
