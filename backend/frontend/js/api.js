/* ═══════════════════════════════════════════════════════════════
   SafeScore – API Client (fetch wrapper + JWT)
   ═══════════════════════════════════════════════════════════════ */

const API_BASE = '/api';

const ApiClient = {
  getToken() { return localStorage.getItem('ss_token'); },
  setToken(t) { localStorage.setItem('ss_token', t); },
  clearToken() { localStorage.removeItem('ss_token'); localStorage.removeItem('ss_user'); },

  getUser() {
    try { return JSON.parse(localStorage.getItem('ss_user')); } catch { return null; }
  },
  setUser(u) { localStorage.setItem('ss_user', JSON.stringify(u)); },

  async request(method, path, body = null) {
    const headers = { 'Content-Type': 'application/json' };
    const token = this.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(`${API_BASE}${path}`, opts);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const err = new Error(data.error || `HTTP ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return data;
  },

  get(path)         { return this.request('GET',    path); },
  post(path, body)  { return this.request('POST',   path, body); },
  put(path, body)   { return this.request('PUT',    path, body); },
  del(path)         { return this.request('DELETE', path); },

  // Auth shortcuts
  async login(email, password) {
    const data = await this.post('/auth/login', { email, password });
    this.setToken(data.token);
    this.setUser(data.user);
    return data.user;
  },

  async register(name, email, password) {
    const data = await this.post('/auth/register', { name, email, password });
    this.setToken(data.token);
    this.setUser(data.user);
    return data.user;
  },

  logout() { this.clearToken(); },
  isLoggedIn() { return !!this.getToken(); },
};

window.Api = ApiClient;
