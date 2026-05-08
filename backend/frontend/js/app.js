/* ═══════════════════════════════════════════════════════════════
   SafeScore – App Router & Shell
   ═══════════════════════════════════════════════════════════════ */

const App = {
  currentPage: null,

  PAGE_MAP: {
    dashboard:  DashboardPage,
    mood:       MoodPage,
    deadlines:  DeadlinesPage,
    stress:     StressPage,
    ai:         AiPage,
    community:  CommunityPage,
  },

  init() {
    AuthPage.init();

    // Mobile menu toggle
    document.getElementById('menu-toggle')?.addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('open');
    });

    // Close sidebar on nav click (mobile)
    document.querySelectorAll('.nav-item, .mob-nav-item').forEach(el => {
      el.addEventListener('click', () => {
        document.getElementById('sidebar')?.classList.remove('open');
      });
    });

    // Logout
    document.getElementById('logout-btn').addEventListener('click', () => {
      Api.logout();
      this.showAuth();
      AuthPage.showLogin();
      this.showToast('Đã đăng xuất', 'info');
    });

    // Hash-based routing
    window.addEventListener('hashchange', () => this.route());

    if (Api.isLoggedIn()) {
      this.showApp();
      this.route();
    } else {
      this.showAuth();
    }
  },

  route() {
    const hash = window.location.hash.replace('#', '').trim() || 'dashboard';
    const page = this.PAGE_MAP[hash] ? hash : 'dashboard';

    if (!Api.isLoggedIn()) { this.showAuth(); return; }

    this.navigateTo(page);
  },

  async navigateTo(page) {
    if (!this.PAGE_MAP[page]) page = 'dashboard';
    if (!Api.isLoggedIn()) { this.showAuth(); return; }

    // Update URL
    window.location.hash = page;

    // Update nav active state
    document.querySelectorAll('.nav-item, .mob-nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.page === page);
    });

    this.currentPage = page;
    this.showLoader(true);

    try {
      await this.PAGE_MAP[page].render();
    } catch (err) {
      console.error('Page render error:', err);
      document.getElementById('main-content').innerHTML = `
        <div class="page">
          <div class="empty-state" style="padding:var(--sp-12);">
            <div class="empty-state-icon">⚠️</div>
            <div class="empty-state-title">Đã xảy ra lỗi</div>
            <div class="empty-state-desc">${err.message}</div>
            <button onclick="App.navigateTo('dashboard')" class="btn btn-primary" style="margin-top:var(--sp-4);">Về Dashboard</button>
          </div>
        </div>`;
    } finally {
      this.showLoader(false);
    }
  },

  showApp() {
    document.getElementById('auth-shell').classList.add('hidden');
    document.getElementById('app-shell').classList.remove('hidden');

    const user = Api.getUser();
    if (user) {
      const initial = (user.name || '?')[0].toUpperCase();
      document.getElementById('user-avatar').textContent    = initial;
      document.getElementById('mobile-avatar').textContent  = initial;
      document.getElementById('user-name-sidebar').textContent = user.name;
    }
  },

  showAuth() {
    document.getElementById('app-shell').classList.add('hidden');
    document.getElementById('auth-shell').classList.remove('hidden');
    window.location.hash = '';
  },

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  },

  showLoader(show) {
    document.getElementById('global-loader').classList.toggle('hidden', !show);
  },
};

window.App = App;
document.addEventListener('DOMContentLoaded', () => App.init());
