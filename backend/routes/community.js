const router = require('express').Router();
const pool = require('../db/pool');
const auth = require('../middleware/auth');

const BANNED_WORDS = ['tự tử', 'tự sát', 'chết đi', 'muốn chết'];

function moderateContent(text) {
  return BANNED_WORDS.some(w => text.toLowerCase().includes(w));
}

// GET /api/community?page=1
router.get('/', auth, async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page) || 1);
  const limit = 20;
  const offset = (page - 1) * limit;

  try {
    const { rows } = await pool.query(
      `SELECT p.id, p.content, p.created_at,
        COALESCE(json_agg(r ORDER BY r.emoji) FILTER (WHERE r.id IS NOT NULL), '[]') AS reactions
       FROM posts p LEFT JOIN reactions r ON r.post_id = p.id
       GROUP BY p.id ORDER BY p.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    // Thêm flag xem user đã react chưa
    const userReactions = await pool.query(
      'SELECT post_id, emoji FROM reactions WHERE user_id=$1', [req.user.id]
    );
    const myReacts = {};
    userReactions.rows.forEach(r => { myReacts[r.post_id] = r.emoji; });

    const posts = rows.map(p => ({ ...p, myReaction: myReacts[p.id] || null }));
    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// POST /api/community
router.post('/', auth, async (req, res) => {
  const { content } = req.body;
  if (!content || content.trim().length < 5)
    return res.status(400).json({ error: 'Nội dung quá ngắn (tối thiểu 5 ký tự)' });
  if (content.length > 500)
    return res.status(400).json({ error: 'Nội dung quá dài (tối đa 500 ký tự)' });
  if (moderateContent(content))
    return res.status(400).json({ error: 'Nội dung vi phạm quy tắc cộng đồng' });

  try {
    const { rows } = await pool.query(
      'INSERT INTO posts (user_id, content) VALUES ($1,$2) RETURNING id, content, created_at',
      [req.user.id, content.trim()]
    );
    res.status(201).json({ ...rows[0], reactions: [], myReaction: null });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// POST /api/community/:id/react
router.post('/:id/react', auth, async (req, res) => {
  const { emoji } = req.body;
  const allowed = ['💙', '🤗', '✨'];
  if (!allowed.includes(emoji))
    return res.status(400).json({ error: 'Emoji không hợp lệ' });

  try {
    await pool.query(
      `INSERT INTO reactions (post_id, user_id, emoji) VALUES ($1,$2,$3)
       ON CONFLICT (post_id, user_id) DO UPDATE SET emoji=$3`,
      [req.params.id, req.user.id, emoji]
    );
    res.json({ message: 'OK' });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// DELETE /api/community/:id/react
router.delete('/:id/react', auth, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM reactions WHERE post_id=$1 AND user_id=$2', [req.params.id, req.user.id]
    );
    res.json({ message: 'OK' });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

module.exports = router;
