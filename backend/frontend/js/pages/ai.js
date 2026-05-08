/* ═══════════════════════════════════════════════════════════════
   SafeScore – AI Suggestions Page
   ═══════════════════════════════════════════════════════════════ */

const AiPage = {
  async render() {
    document.getElementById('main-content').innerHTML = `
      <div class="page">
        <div class="page-header">
          <h1 class="page-title">🤖 AI Gợi ý</h1>
          <p class="page-subtitle">Gợi ý cá nhân hoá dựa trên tình trạng học tập và cảm xúc của bạn</p>
        </div>
        <div id="ai-cards-container" class="stagger-children" style="display:flex;flex-direction:column;gap:var(--sp-5);">
          <div class="skeleton" style="height:140px;border-radius:var(--r-xl);"></div>
          <div class="skeleton" style="height:140px;border-radius:var(--r-xl);"></div>
          <div class="skeleton" style="height:140px;border-radius:var(--r-xl);"></div>
        </div>

        <!-- Tips section -->
        <div style="margin-top:var(--sp-10);">
          <div class="section-heading">📚 Mẹo học tập bền vững</div>
          <div class="grid-2" id="tips-grid">
            ${this.staticTips().map(t => `
              <div class="card hover-lift">
                <div style="font-size:1.5rem;margin-bottom:var(--sp-3);">${t.icon}</div>
                <div style="font-weight:800;margin-bottom:var(--sp-2);font-size:0.95rem;">${t.title}</div>
                <div style="font-size:0.82rem;color:var(--text-muted);line-height:1.6;">${t.body}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    await this.loadSuggestions();
  },

  async loadSuggestions() {
    try {
      const [stress, moods] = await Promise.all([
        Api.get('/stress'),
        Api.get('/mood?days=3'),
      ]);

      const avgMood = moods.length
        ? moods.reduce((s, m) => s + m.score, 0) / moods.length
        : null;

      const suggestions = this.getSuggestions(stress.score, avgMood, stress.factors);
      const container   = document.getElementById('ai-cards-container');

      if (!suggestions.length) {
        container.innerHTML = `<div class="empty-state">
          <div class="empty-state-icon">🌟</div>
          <div class="empty-state-title">Bạn đang rất ổn!</div>
          <div class="empty-state-desc">Tiếp tục duy trì thói quen tốt nhé.</div>
        </div>`;
        return;
      }

      container.innerHTML = suggestions.map(s => `
        <div class="ai-card">
          <div class="ai-icon">${s.icon}</div>
          <div class="ai-title">${s.title}</div>
          <div class="ai-body">${s.body}</div>
          <span class="ai-action">💡 ${s.action}</span>
        </div>
      `).join('');

    } catch { window.App.showToast('Không thể tải gợi ý', 'error'); }
  },

  getSuggestions(score, moodAvg, factors) {
    const tips = [];

    if (score >= 80) {
      tips.push({
        icon: '🛑',
        title: 'Dừng lại và nghỉ ngơi ngay',
        body: 'Mức độ áp lực của bạn đang rất cao (burnout). Hãy cho phép bản thân nghỉ ngơi hoàn toàn ít nhất 2 tiếng trước khi tiếp tục học.',
        action: 'Thực hành thở sâu 5-7-8 trong 5 phút',
      });
      if (factors.overdue > 0) {
        tips.push({
          icon: '📞',
          title: 'Liên hệ với giảng viên',
          body: `Bạn có ${factors.overdue} deadline đã quá hạn. Hãy email giảng viên sớm để giải thích và xin gia hạn nếu cần.`,
          action: 'Soạn email cho giảng viên ngay hôm nay',
        });
      }
    } else if (score >= 60) {
      tips.push({
        icon: '🍅',
        title: 'Thử kỹ thuật Pomodoro',
        body: 'Chia công việc thành các block 25 phút + nghỉ 5 phút. Sau 4 block thì nghỉ dài 20-30 phút. Cách này giúp duy trì tập trung mà không kiệt sức.',
        action: 'Bắt đầu 1 pomodoro ngay bây giờ',
      });
      tips.push({
        icon: '📋',
        title: 'Ưu tiên hoá với ma trận Eisenhower',
        body: 'Phân loại công việc: Khẩn cấp & Quan trọng làm ngay, Quan trọng nhưng không khẩn thì lên lịch, còn lại có thể bỏ qua.',
        action: 'Chọn 3 task ưu tiên nhất cho hôm nay',
      });
    } else if (score >= 40) {
      tips.push({
        icon: '🚶',
        title: 'Đi bộ 15 phút',
        body: 'Một buổi đi bộ ngắn giúp tăng endorphin và cải thiện khả năng tập trung đáng kể. Đừng dùng điện thoại trong lúc đi.',
        action: 'Đi bộ sau bữa ăn tiếp theo',
      });
    } else {
      tips.push({
        icon: '📚',
        title: 'Tận dụng giai đoạn ổn định',
        body: 'Áp lực của bạn đang ở mức thấp. Đây là thời điểm lý tưởng để đọc trước bài, ôn tập hoặc bắt đầu sớm các project lớn.',
        action: 'Lên kế hoạch học tập cho tuần này',
      });
    }

    if (moodAvg !== null && moodAvg < 2.5) {
      tips.push({
        icon: '💙',
        title: 'Kết nối với bạn bè',
        body: 'Tâm trạng thấp kéo dài có thể do cô lập xã hội. Hãy nhắn tin hoặc gặp gỡ 1-2 người bạn thân.',
        action: 'Nhắn tin cho một người bạn ngay hôm nay',
      });
    }

    if (moodAvg !== null && moodAvg < 1.8) {
      tips.push({
        icon: '🏥',
        title: 'Cân nhắc gặp chuyên viên tư vấn',
        body: 'Nếu cảm giác này kéo dài nhiều ngày, hãy tìm đến phòng tư vấn tâm lý sinh viên của trường. Việc tìm kiếm hỗ trợ là dũng cảm.',
        action: 'Tìm số điện thoại phòng tư vấn tâm lý trường',
      });
    }

    if (factors.daysSinceCheckin >= 3) {
      tips.push({
        icon: '📝',
        title: 'Check-in cảm xúc mỗi ngày',
        body: `Bạn đã ${factors.daysSinceCheckin} ngày chưa check-in. Chỉ cần 30 giây mỗi tối để ghi lại cảm xúc giúp bạn nhận ra xu hướng sớm hơn.`,
        action: 'Check-in ngay bây giờ',
      });
    }

    return tips;
  },

  // Used by dashboard for quick one-liner tip
  getOneTip(score, moodAvg) {
    if (score >= 80) return '🛑 Hãy nghỉ ngơi ngay – bạn đang ở mức burnout.';
    if (score >= 60) return '🍅 Thử Pomodoro để tránh kiệt sức nhé!';
    if (score >= 40) return '🚶 Đi bộ 15 phút sẽ giúp bạn tập trung hơn.';
    if (moodAvg && moodAvg < 3) return '💙 Tâm trạng chưa tốt – hãy nói chuyện với ai đó.';
    return '🌟 Bạn đang ổn! Hãy tận dụng thời gian này để học trước.';
  },

  staticTips() {
    return [
      { icon:'😴', title:'Ngủ đủ 7-8 tiếng', body:'Thiếu ngủ giảm 40% khả năng ghi nhớ. Ưu tiên giấc ngủ như một buổi học quan trọng.' },
      { icon:'🥗', title:'Ăn uống lành mạnh', body:'Não cần glucose ổn định. Tránh ăn nhiều đường, bổ sung omega-3 từ cá và hạt.' },
      { icon:'💧', title:'Uống đủ nước', body:'Mất nước 2% đã làm giảm hiệu suất nhận thức. Để chai nước cạnh bàn học.' },
      { icon:'🧘', title:'5 phút thiền mỗi ngày', body:'Thiền ngắn giúp giảm cortisol, tăng khả năng tập trung và quản lý cảm xúc.' },
      { icon:'📵', title:'Tắt thông báo khi học', body:'Mỗi lần bị ngắt quãng mất 23 phút để lấy lại tập trung hoàn toàn.' },
      { icon:'🤝', title:'Học nhóm hiệu quả', body:'Giải thích bài cho người khác là cách học hiệu quả nhất (Feynman Technique).' },
    ];
  },
};

window.AiPage = AiPage;
