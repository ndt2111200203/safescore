/* ═══════════════════════════════════════════════════════════════
   SafeScore – Community Anonymous Sharing Wall
   ═══════════════════════════════════════════════════════════════ */

const CommunityPage = {
  posts: [],
  page: 1,

  async render() {
    document.getElementById('main-content').innerHTML = `
      <div class="page">
        <div class="page-header">
          <h1 class="page-title">💬 Tường Tâm Sự</h1>
          <p class="page-subtitle">Chia sẻ ẩn danh – Không ai biết đó là bạn. Chỉ có sự đồng cảm.</p>
        </div>

        <!-- Post box -->
        <div class="card" style="margin-bottom:var(--sp-6);">
          <div style="font-weight:800;margin-bottom:var(--sp-4);font-size:1rem;">✍️ Chia sẻ cảm xúc của bạn</div>
          <textarea id="post-content" placeholder="Hôm nay mình cảm thấy... / Mình đang gặp khó khăn với... / Mình muốn chia sẻ..."
            rows="4" maxlength="500"></textarea>
          <div style="display:flex;align-items:center;justify-content:space-between;margin-top:var(--sp-3);">
            <div style="font-size:0.75rem;color:var(--text-muted);">
              🔒 Ẩn danh hoàn toàn · <span id="post-char-count">0</span>/500
            </div>
            <button id="post-submit-btn" class="btn btn-primary btn-sm" disabled>Đăng chia sẻ</button>
          </div>
          <div id="post-error" class="form-error hidden" style="margin-top:var(--sp-2);"></div>
        </div>

        <!-- Reaction legend -->
        <div style="display:flex;gap:var(--sp-4);margin-bottom:var(--sp-5);flex-wrap:wrap;">
          <div style="font-size:0.8rem;color:var(--text-muted);">Phản hồi bằng:</div>
          <span style="font-size:0.8rem;">💙 Đồng cảm</span>
          <span style="font-size:0.8rem;">🤗 Ôm tinh thần</span>
          <span style="font-size:0.8rem;">✨ Cổ vũ</span>
        </div>

        <!-- Posts list -->
        <div id="posts-list" class="stagger-children" style="display:flex;flex-direction:column;gap:var(--sp-4);">
          ${[1,2,3].map(() => `<div class="skeleton" style="height:120px;border-radius:var(--r-lg);"></div>`).join('')}
        </div>

        <!-- Load more -->
        <div style="text-align:center;margin-top:var(--sp-8);">
          <button id="load-more-btn" class="btn btn-secondary hidden">Xem thêm</button>
        </div>
      </div>
    `;

    this.bindEvents();
    await this.loadPosts();
  },

  bindEvents() {
    const textarea = document.getElementById('post-content');
    const submitBtn = document.getElementById('post-submit-btn');
    const charCount = document.getElementById('post-char-count');

    textarea.addEventListener('input', () => {
      const len = textarea.value.length;
      charCount.textContent = len;
      submitBtn.disabled = len < 5;
    });

    submitBtn.addEventListener('click', () => this.submitPost());

    document.getElementById('load-more-btn').addEventListener('click', () => {
      this.page++;
      this.loadPosts(true);
    });
  },

  async loadPosts(append = false) {
    try {
      const data = await Api.get(`/community?page=${this.page}`);
      if (!append) this.posts = data;
      else this.posts = [...this.posts, ...data];

      this.renderPosts();

      const loadMoreBtn = document.getElementById('load-more-btn');
      if (data.length === 20) loadMoreBtn.classList.remove('hidden');
      else loadMoreBtn.classList.add('hidden');
    } catch {
      document.getElementById('posts-list').innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">💬</div>
          <div class="empty-state-title">Không thể tải bài chia sẻ</div>
        </div>`;
    }
  },

  renderPosts() {
    const el = document.getElementById('posts-list');
    if (!el) return;

    if (!this.posts.length) {
      el.innerHTML = `<div class="empty-state">
        <div class="empty-state-icon">💬</div>
        <div class="empty-state-title">Chưa có chia sẻ nào</div>
        <div class="empty-state-desc">Hãy là người đầu tiên chia sẻ cảm xúc của mình!</div>
      </div>`;
      return;
    }

    el.innerHTML = this.posts.map(p => this.postHTML(p)).join('');

    // Bind reaction buttons
    el.querySelectorAll('.react-btn').forEach(btn => {
      btn.addEventListener('click', () => this.handleReact(btn.dataset.postId, btn.dataset.emoji, btn));
    });
  },

  postHTML(p) {
    const timeAgo = this.timeAgo(new Date(p.created_at));
    const counts  = this.countReactions(p.reactions);
    const myReact = p.myReaction;

    const reacts = ['💙','🤗','✨'].map(emoji => {
      const count   = counts[emoji] || 0;
      const reacted = myReact === emoji;
      return `<button class="react-btn ${reacted ? 'reacted' : ''}"
                data-post-id="${p.id}" data-emoji="${emoji}">
        ${emoji} ${count || ''}
      </button>`;
    }).join('');

    return `<div class="post-card" id="post-${p.id}">
      <p class="post-content">${this.escapeHtml(p.content)}</p>
      <div class="post-time">🕐 ${timeAgo} · Ẩn danh</div>
      <div class="post-reactions">${reacts}</div>
    </div>`;
  },

  async handleReact(postId, emoji, btn) {
    const post = this.posts.find(p => p.id == postId);
    if (!post) return;

    try {
      if (post.myReaction === emoji) {
        await Api.del(`/community/${postId}/react`);
        post.myReaction = null;
      } else {
        await Api.post(`/community/${postId}/react`, { emoji });
        post.myReaction = emoji;
      }
      // Re-render reactions for this post
      const postEl = document.getElementById(`post-${postId}`);
      if (postEl) {
        // Refresh post reactions from server
        const updated = await Api.get(`/community?page=1`);
        const fresh   = updated.find(p => p.id == postId);
        if (fresh) {
          this.posts = this.posts.map(p => p.id == postId ? fresh : p);
          const reactsEl = postEl.querySelector('.post-reactions');
          const counts   = this.countReactions(fresh.reactions);
          reactsEl.innerHTML = ['💙','🤗','✨'].map(e => {
            const reacted = fresh.myReaction === e;
            return `<button class="react-btn ${reacted?'reacted':''}"
              data-post-id="${postId}" data-emoji="${e}">
              ${e} ${counts[e]||''}
            </button>`;
          }).join('');
          reactsEl.querySelectorAll('.react-btn').forEach(b => {
            b.addEventListener('click', () => this.handleReact(b.dataset.postId, b.dataset.emoji, b));
          });
        }
      }
    } catch { window.App.showToast('Không thể react', 'error'); }
  },

  async submitPost() {
    const content = document.getElementById('post-content').value.trim();
    const btn     = document.getElementById('post-submit-btn');
    const errEl   = document.getElementById('post-error');

    btn.disabled = true;
    btn.textContent = 'Đang đăng...';
    errEl.classList.add('hidden');

    try {
      const post = await Api.post('/community', { content });
      this.posts.unshift(post);
      this.renderPosts();
      document.getElementById('post-content').value = '';
      document.getElementById('post-char-count').textContent = '0';
      window.App.showToast('✅ Đã đăng chia sẻ', 'success');
    } catch (err) {
      errEl.textContent = err.message;
      errEl.classList.remove('hidden');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Đăng chia sẻ';
    }
  },

  countReactions(reactions) {
    const c = {};
    (reactions || []).forEach(r => { c[r.emoji] = (c[r.emoji] || 0) + 1; });
    return c;
  },

  timeAgo(date) {
    const sec = Math.floor((Date.now() - date) / 1000);
    if (sec < 60)   return 'Vừa xong';
    if (sec < 3600) return Math.floor(sec/60) + ' phút trước';
    if (sec < 86400)return Math.floor(sec/3600) + ' giờ trước';
    return Math.floor(sec/86400) + ' ngày trước';
  },

  escapeHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  },
};

window.CommunityPage = CommunityPage;
