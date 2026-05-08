const router = require('express').Router();
const pool = require('../db/pool');
const auth = require('../middleware/auth');

// POST /api/mood – Tạo check-in mới
router.post('/', auth, async (req, res) => {
  const { score, tags, note } = req.body;
  if (!score || score < 1 || score > 5)
    return res.status(400).json({ error: 'Score phải từ 1 đến 5' });

  try {
    const { rows } = await pool.query(
      'INSERT INTO moods (user_id, score, tags, note) VALUES ($1,$2,$3,$4) RETURNING *',
      [req.user.id, score, tags || [], note || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// GET /api/mood?days=30 – Lịch sử mood
router.get('/', auth, async (req, res) => {
  const days = Math.min(parseInt(req.query.days) || 30, 90);
  try {
    const { rows } = await pool.query(
      `SELECT id, score, tags, note, created_at
       FROM moods WHERE user_id=$1 AND created_at >= NOW() - INTERVAL '${days} days'
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// GET /api/mood/today – Check-in hôm nay
router.get('/today', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM moods WHERE user_id=$1 AND created_at >= CURRENT_DATE ORDER BY created_at DESC LIMIT 1`,
      [req.user.id]
    );
    res.json(rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

module.exports = router;
