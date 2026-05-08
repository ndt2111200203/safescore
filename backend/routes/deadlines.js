const router = require('express').Router();
const pool = require('../db/pool');
const auth = require('../middleware/auth');

// GET /api/deadlines
router.get('/', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM deadlines WHERE user_id=$1 ORDER BY due_date ASC',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// POST /api/deadlines
router.post('/', auth, async (req, res) => {
  const { title, subject, type, due_date, priority } = req.body;
  if (!title || !due_date)
    return res.status(400).json({ error: 'Tiêu đề và ngày hết hạn là bắt buộc' });

  try {
    const { rows } = await pool.query(
      `INSERT INTO deadlines (user_id, title, subject, type, due_date, priority)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.user.id, title, subject || null, type || 'bài tập', due_date, priority || 2]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// PUT /api/deadlines/:id
router.put('/:id', auth, async (req, res) => {
  const { title, subject, type, due_date, priority, progress, done } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE deadlines SET
        title=COALESCE($1,title), subject=COALESCE($2,subject),
        type=COALESCE($3,type), due_date=COALESCE($4,due_date),
        priority=COALESCE($5,priority), progress=COALESCE($6,progress),
        done=COALESCE($7,done)
       WHERE id=$8 AND user_id=$9 RETURNING *`,
      [title, subject, type, due_date, priority, progress, done, req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Không tìm thấy deadline' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// DELETE /api/deadlines/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM deadlines WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]
    );
    if (!rowCount) return res.status(404).json({ error: 'Không tìm thấy deadline' });
    res.json({ message: 'Đã xóa thành công' });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

module.exports = router;
