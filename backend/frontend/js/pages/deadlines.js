/* ═══════════════════════════════════════════════════════════════
   SafeScore – Deadline Tracker Page
   ═══════════════════════════════════════════════════════════════ */

const DeadlinesPage = {
  deadlines: [],

  TYPES: ['Bài tập','Bài kiểm tra','Thi cuối kỳ','Project','Báo cáo','Thuyết trình','Khác'],

  async render() {
    document.getElementById('main-content').innerHTML = `
      <div class="page">
        <div class="page-header" style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:var(--sp-3);">
          <div>
            <h1 class="page-title">📅 Deadline Tracker</h1>
            <p class="page-subtitle">Quản lý lịch học và bài tập một cách trực quan</p>
          </div>
          <button id="add-deadline-btn" class="btn btn-primary">
            + Thêm deadline
          </button>
        </div>

        <!-- Filter bar -->
        <div style="display:flex;gap:var(--sp-3);margin-bottom:var(--sp-6);flex-wrap:wrap;">
          <select id="dl-filter-type" style="width:auto;">
            <option value="">Tất cả loại</option>
            ${this.TYPES.map(t => `<option value="${t}">${t}</option>`).join('')}
          </select>
          <label style="display:flex;align-items:center;gap:var(--sp-2);font-size:0.85rem;color:var(--text-secondary);cursor:pointer;">
            <input type="checkbox" id="dl-show-done" style="width:auto;"/> Hiện đã hoàn thành
          </label>
        </div>

        <!-- Kanban board -->
        <div class="kanban-board" id="kanban-board">
          ${this.kanbanColHTML('today',    '🔴 Hôm nay',    'coral')}
          ${this.kanbanColHTML('week',     '🟡 Tuần này',   'amber')}
          ${this.kanbanColHTML('upcoming', '🟢 Sắp tới',    'mint')}
          ${this.kanbanColHTML('overdue',  '⚠️ Quá hạn',   'purple')}
        </div>
      </div>

      <!-- Add/Edit Modal -->
      <div id="deadline-modal" class="modal-overlay hidden">
        <div class="modal">
          <div class="modal-header">
            <h2 class="modal-title" id="modal-title">Thêm deadline mới</h2>
            <button class="modal-close" id="modal-close-btn">✕</button>
          </div>
          <form id="deadline-form" novalidate>
            <div class="form-group">
              <label for="dl-title">Tên bài / Tiêu đề *</label>
              <input id="dl-title" type="text" placeholder="VD: Bài tập lớn CTDL" required />
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-3);">
              <div class="form-group">
                <label for="dl-subject">Môn học</label>
                <input id="dl-subject" type="text" placeholder="VD: CTDL&amp;GT" />
              </div>
              <div class="form-group">
                <label for="dl-type">Loại</label>
                <select id="dl-type">
                  ${this.TYPES.map(t => `<option value="${t}">${t}</option>`).join('')}
                </select>
              </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-3);">
              <div class="form-group">
                <label for="dl-due">Hạn nộp *</label>
                <input id="dl-due" type="datetime-local" required />
              </div>
              <div class="form-group">
                <label for="dl-priority">Độ ưu tiên</label>
                <select id="dl-priority">
                  <option value="1">🟢 Thấp</option>
                  <option value="2" selected>🟡 Trung bình</option>
                  <option value="3">🔴 Cao</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label for="dl-progress">Tiến độ: <span id="dl-progress-val">0</span>%</label>
              <input id="dl-progress" type="range" min="0" max="100" value="0" />
            </div>
            <div id="deadline-form-error" class="form-error hidden"></div>
            <div style="display:flex;gap:var(--sp-3);margin-top:var(--sp-4);">
              <button type="submit" class="btn btn-primary" id="dl-save-btn">Lưu</button>
              <button type="button" class="btn btn-secondary" id="modal-cancel-btn">Huỷ</button>
            </div>
          </form>
        </div>
      </div>
    `;

    this.bindEvents();
    await this.loadDeadlines();
  },

  kanbanColHTML(id, title, color) {
    return `
      <div class="kanban-col" id="col-${id}">
        <div class="kanban-col-header">
          <span class="kanban-col-title" style="color:var(--${color});">${title}</span>
          <span class="kanban-count" id="count-${id}">0</span>
        </div>
        <div id="list-${id}"></div>
      </div>
    `;
  },

  bindEvents() {
    // Add button
    document.getElementById('add-deadline-btn').addEventListener('click', () => this.openModal());

    // Modal close
    document.getElementById('modal-close-btn').addEventListener('click',  () => this.closeModal());
    document.getElementById('modal-cancel-btn').addEventListener('click', () => this.closeModal());
    document.getElementById('deadline-modal').addEventListener('click', e => {
      if (e.target.id === 'deadline-modal') this.closeModal();
    });

    // Progress display
    const prog = document.getElementById('dl-progress');
    prog.addEventListener('input', () => {
      document.getElementById('dl-progress-val').textContent = prog.value;
    });

    // Form submit
    document.getElementById('deadline-form').addEventListener('submit', e => {
      e.preventDefault(); this.saveDeadline();
    });

    // Filter
    document.getElementById('dl-filter-type').addEventListener('change', () => this.renderBoard());
    document.getElementById('dl-show-done').addEventListener('change',  () => this.renderBoard());
  },

  async loadDeadlines() {
    try {
      this.deadlines = await Api.get('/deadlines');
      this.renderBoard();
    } catch { window.App.showToast('Không thể tải deadline', 'error'); }
  },

  renderBoard() {
    const filterType = document.getElementById('dl-filter-type').value;
    const showDone   = document.getElementById('dl-show-done').checked;

    let list = [...this.deadlines];
    if (filterType) list = list.filter(d => d.type === filterType);
    if (!showDone)  list = list.filter(d => !d.done);

    const now    = new Date();
    const todayEnd = new Date(now); todayEnd.setHours(23,59,59,999);
    const weekEnd  = new Date(now); weekEnd.setDate(weekEnd.getDate() + 7);

    const buckets = { today: [], week: [], upcoming: [], overdue: [] };

    list.forEach(d => {
      const due = new Date(d.due_date);
      if (d.done) return; // skip done items unless checkbox is on
      if (due < now)          buckets.overdue.push(d);
      else if (due <= todayEnd) buckets.today.push(d);
      else if (due <= weekEnd)  buckets.week.push(d);
      else                      buckets.upcoming.push(d);
    });

    // If show done, add done items to upcoming
    if (showDone) {
      const done = this.deadlines.filter(d => d.done);
      buckets.upcoming.push(...done);
    }

    Object.keys(buckets).forEach(key => {
      document.getElementById(`count-${key}`).textContent = buckets[key].length;
      document.getElementById(`list-${key}`).innerHTML =
        buckets[key].length
          ? buckets[key].map(d => this.deadlineCardHTML(d)).join('')
          : `<div style="text-align:center;color:var(--text-muted);font-size:0.8rem;padding:var(--sp-6) 0;">Trống</div>`;
    });

    // Bind card actions
    document.querySelectorAll('.dl-edit-btn').forEach(btn => {
      btn.addEventListener('click', () => this.openModal(btn.dataset.id));
    });
    document.querySelectorAll('.dl-done-btn').forEach(btn => {
      btn.addEventListener('click', () => this.toggleDone(btn.dataset.id));
    });
    document.querySelectorAll('.dl-del-btn').forEach(btn => {
      btn.addEventListener('click', () => this.deleteDeadline(btn.dataset.id));
    });
    document.querySelectorAll('.dl-progress-inline').forEach(inp => {
      inp.addEventListener('change', () => this.updateProgress(inp.dataset.id, inp.value));
    });
  },

  deadlineCardHTML(d) {
    const due      = new Date(d.due_date);
    const dueStr   = due.toLocaleDateString('vi-VN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
    const pClass   = `priority-${d.priority}`;
    const doneStyle = d.done ? 'opacity:0.55;' : '';

    return `
      <div class="deadline-card ${pClass}" style="${doneStyle}">
        <div class="deadline-title" style="${d.done ? 'text-decoration:line-through;' : ''}">${d.title}</div>
        <div class="deadline-meta">
          ${d.subject ? `<span>📚 ${d.subject}</span>` : ''}
          <span>🗂 ${d.type}</span>
          <span>⏰ ${dueStr}</span>
        </div>
        <div class="progress-bar" style="margin-bottom:var(--sp-2);">
          <div class="progress-fill" style="width:${d.progress}%;"></div>
        </div>
        <div style="display:flex;align-items:center;gap:4px;margin-bottom:var(--sp-2);">
          <input type="range" class="dl-progress-inline" data-id="${d.id}"
            min="0" max="100" value="${d.progress}" style="flex:1;height:4px;" />
          <span style="font-size:0.7rem;color:var(--text-muted);width:28px;">${d.progress}%</span>
        </div>
        <div class="deadline-actions">
          <button class="btn-icon dl-done-btn" data-id="${d.id}" title="${d.done?'Bỏ hoàn thành':'Đánh dấu xong'}">${d.done?'↩':'✓'}</button>
          <button class="btn-icon dl-edit-btn" data-id="${d.id}" title="Chỉnh sửa">✏️</button>
          <button class="btn-icon dl-del-btn" data-id="${d.id}" title="Xóa" style="color:var(--coral);">🗑</button>
        </div>
      </div>
    `;
  },

  openModal(id = null) {
    const modal  = document.getElementById('deadline-modal');
    const title  = document.getElementById('modal-title');
    const form   = document.getElementById('deadline-form');

    form.reset();
    document.getElementById('dl-progress-val').textContent = '0';
    document.getElementById('deadline-form-error').classList.add('hidden');
    form.dataset.editId = id || '';

    if (id) {
      const d = this.deadlines.find(x => x.id == id);
      if (!d) return;
      title.textContent = 'Chỉnh sửa deadline';
      document.getElementById('dl-title').value    = d.title;
      document.getElementById('dl-subject').value  = d.subject || '';
      document.getElementById('dl-type').value     = d.type;
      document.getElementById('dl-due').value      = new Date(d.due_date).toISOString().slice(0,16);
      document.getElementById('dl-priority').value = d.priority;
      document.getElementById('dl-progress').value = d.progress;
      document.getElementById('dl-progress-val').textContent = d.progress;
    } else {
      title.textContent = 'Thêm deadline mới';
    }

    modal.classList.remove('hidden');
  },

  closeModal() { document.getElementById('deadline-modal').classList.add('hidden'); },

  async saveDeadline() {
    const id       = document.getElementById('deadline-form').dataset.editId;
    const title    = document.getElementById('dl-title').value.trim();
    const subject  = document.getElementById('dl-subject').value.trim();
    const type     = document.getElementById('dl-type').value;
    const due_date = document.getElementById('dl-due').value;
    const priority = parseInt(document.getElementById('dl-priority').value);
    const progress = parseInt(document.getElementById('dl-progress').value);
    const errEl    = document.getElementById('deadline-form-error');
    const btn      = document.getElementById('dl-save-btn');

    if (!title || !due_date) {
      errEl.textContent = 'Vui lòng điền tiêu đề và ngày hết hạn';
      errEl.classList.remove('hidden');
      return;
    }

    btn.disabled = true; btn.textContent = 'Đang lưu...';
    try {
      const body = { title, subject, type, due_date, priority, progress };
      if (id) {
        const updated = await Api.put(`/deadlines/${id}`, body);
        this.deadlines = this.deadlines.map(d => d.id == id ? updated : d);
      } else {
        const created = await Api.post('/deadlines', body);
        this.deadlines.push(created);
      }
      this.closeModal();
      this.renderBoard();
      window.App.showToast(id ? '✅ Đã cập nhật deadline' : '✅ Đã thêm deadline mới', 'success');
    } catch (err) {
      errEl.textContent = err.message;
      errEl.classList.remove('hidden');
    } finally {
      btn.disabled = false; btn.textContent = 'Lưu';
    }
  },

  async toggleDone(id) {
    const d = this.deadlines.find(x => x.id == id);
    if (!d) return;
    try {
      const updated = await Api.put(`/deadlines/${id}`, { done: !d.done, progress: !d.done ? 100 : d.progress });
      this.deadlines = this.deadlines.map(x => x.id == id ? updated : x);
      this.renderBoard();
    } catch { window.App.showToast('Không thể cập nhật', 'error'); }
  },

  async updateProgress(id, value) {
    try {
      const updated = await Api.put(`/deadlines/${id}`, { progress: parseInt(value) });
      this.deadlines = this.deadlines.map(x => x.id == id ? updated : x);
    } catch { /* silent */ }
  },

  async deleteDeadline(id) {
    if (!confirm('Bạn có chắc muốn xóa deadline này?')) return;
    try {
      await Api.del(`/deadlines/${id}`);
      this.deadlines = this.deadlines.filter(x => x.id != id);
      this.renderBoard();
      window.App.showToast('🗑 Đã xóa deadline', 'info');
    } catch { window.App.showToast('Không thể xóa', 'error'); }
  },
};

window.DeadlinesPage = DeadlinesPage;
