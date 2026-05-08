/* ═══════════════════════════════════════════════════════════════
   SafeScore – Auth Page (Login / Register)
   ═══════════════════════════════════════════════════════════════ */

const AuthPage = {
  init() {
    // Toggle forms
    document.getElementById('go-register').addEventListener('click', e => {
      e.preventDefault(); this.showRegister();
    });
    document.getElementById('go-login').addEventListener('click', e => {
      e.preventDefault(); this.showLogin();
    });

    // Login submit
    document.getElementById('login-form').addEventListener('submit', async e => {
      e.preventDefault();
      const email    = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      const btn      = document.getElementById('login-btn');
      const errEl    = document.getElementById('login-error');

      errEl.classList.add('hidden');
      btn.disabled = true;
      btn.textContent = 'Đang đăng nhập...';

      try {
        await Api.login(email, password);
        window.App.navigateTo('dashboard');
      } catch (err) {
        errEl.textContent = err.message;
        errEl.classList.remove('hidden');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Đăng nhập';
      }
    });

    // Register submit
    document.getElementById('register-form').addEventListener('submit', async e => {
      e.preventDefault();
      const name     = document.getElementById('reg-name').value.trim();
      const email    = document.getElementById('reg-email').value.trim();
      const password = document.getElementById('reg-password').value;
      const btn      = document.getElementById('register-btn');
      const errEl    = document.getElementById('reg-error');

      errEl.classList.add('hidden');
      btn.disabled = true;
      btn.textContent = 'Đang tạo tài khoản...';

      try {
        await Api.register(name, email, password);
        window.App.showToast('Chào mừng ' + name + '! 🎉', 'success');
        window.App.navigateTo('dashboard');
      } catch (err) {
        errEl.textContent = err.message;
        errEl.classList.remove('hidden');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Tạo tài khoản';
      }
    });
  },

  showLogin() {
    document.getElementById('login-form-wrap').classList.remove('hidden');
    document.getElementById('register-form-wrap').classList.add('hidden');
  },

  showRegister() {
    document.getElementById('login-form-wrap').classList.add('hidden');
    document.getElementById('register-form-wrap').classList.remove('hidden');
  },
};

window.AuthPage = AuthPage;
