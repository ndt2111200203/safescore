const router = require('express').Router();
const pool = require('../db/pool');
const auth = require('../middleware/auth');

// GET /api/stress
router.get('/', auth, async (req, res) => {
  const uid = req.user.id;
  try {
    const [d7, od, avgMood, lastCheckin] = await Promise.all([
      pool.query(
        `SELECT COUNT(*) FROM deadlines WHERE user_id=$1 AND done=false
         AND due_date BETWEEN NOW() AND NOW() + INTERVAL '7 days'`, [uid]
      ),
      pool.query(
        `SELECT COUNT(*) FROM deadlines WHERE user_id=$1 AND done=false AND due_date < NOW()`, [uid]
      ),
      pool.query(
        `SELECT AVG(score) FROM moods WHERE user_id=$1 AND created_at >= NOW() - INTERVAL '3 days'`, [uid]
      ),
      pool.query(
        `SELECT MAX(created_at) AS last FROM moods WHERE user_id=$1`, [uid]
      ),
    ]);

    const deadlines7d  = parseInt(d7.rows[0].count)   || 0;
    const overdue      = parseInt(od.rows[0].count)    || 0;
    const mood         = parseFloat(avgMood.rows[0].avg) || 3;
    const lastDate     = lastCheckin.rows[0].last;
    const daysSince    = lastDate
      ? Math.floor((Date.now() - new Date(lastDate)) / 86400000)
      : 7;

    const score = Math.min(100, Math.round(
      deadlines7d * 8 + overdue * 15 + (5 - mood) * 8 + Math.min(daysSince, 7) * 3
    ));

    const level = score >= 80 ? 'burnout'
                : score >= 60 ? 'high'
                : score >= 40 ? 'moderate'
                : 'normal';

    res.json({ score, level, factors: { deadlines7d, overdue, avgMood: mood, daysSinceCheckin: daysSince } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

module.exports = router;
