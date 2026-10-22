const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
app.disable('x-powered-by');
const PORT = Number(process.env.PORT || 3000);

app.use(express.json());
app.use((req, res, next) => {
  const json = res.json.bind(res);
  res.json = (body) => {
    res.set('Content-Type', 'application/json; charset=utf-8');
    return json(body);
  };
  next();
});
app.use(express.static('public'));

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'db',
  user: process.env.DB_USER || 'club_user',
  password: process.env.DB_PASSWORD || 'club_password',
  database: process.env.DB_NAME || 'club_db',
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 5
});

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(503).json({ status: 'error', database: 'disconnected' });
  }
});

app.get('/api/clubs', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.id, c.name, c.description, c.created_at,
       COUNT(DISTINCT m.id) AS member_count,
       COUNT(DISTINCT a.id) AS activity_count
       FROM clubs c
       LEFT JOIN members m ON m.club_id = c.id
       LEFT JOIN activities a ON a.club_id = c.id
       GROUP BY c.id
       ORDER BY c.id DESC`
    );
    res.json(rows);
  } catch (error) {
    console.error('GET /api/clubs failed:', error.message);
    res.status(500).json({ error: 'Không thể tải danh sách câu lạc bộ.' });
  }
});

app.post('/api/clubs', async (req, res) => {
  const name = String(req.body.name || '').trim();
  const description = String(req.body.description || '').trim();

  if (!name) {
    return res.status(400).json({ error: 'Tên câu lạc bộ là bắt buộc.' });
  }

  try {
    const [result] = await pool.execute(
      'INSERT INTO clubs (name, description) VALUES (?, ?)',
      [name, description || null]
    );
    res.status(201).json({
      id: result.insertId,
      name,
      description: description || null
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Tên câu lạc bộ đã tồn tại.' });
    }
    console.error('POST /api/clubs failed:', error.message);
    res.status(500).json({ error: 'Không thể tạo câu lạc bộ.' });
  }
});

app.get('/api/members', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT m.id, m.full_name, m.email, m.phone, m.status,
       c.name AS club_name
       FROM members m JOIN clubs c ON c.id = m.club_id
       ORDER BY m.id DESC`
    );
    res.json(rows);
  } catch (error) {
    console.error('GET /api/members failed:', error.message);
    res.status(500).json({ error: 'Không thể tải danh sách thành viên.' });
  }
});

app.post('/api/members', async (req, res) => {
  const fullName = String(req.body.full_name || '').trim();
  const email = String(req.body.email || '').trim();
  const phone = String(req.body.phone || '').trim();
  const clubId = Number(req.body.club_id);

  if (!fullName || !email || !Number.isInteger(clubId) || clubId < 1) {
    return res.status(400).json({
      error: 'Cần nhập họ tên, email hợp lệ và chọn câu lạc bộ.'
    });
  }

  try {
    const [result] = await pool.execute(
      `INSERT INTO members (full_name, email, phone, club_id)
       VALUES (?, ?, ?, ?)`,
      [fullName, email, phone || null, clubId]
    );
    res.status(201).json({ id: result.insertId, full_name: fullName });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Email này đã được sử dụng.' });
    }
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ error: 'Câu lạc bộ không tồn tại.' });
    }
    console.error('POST /api/members failed:', error.message);
    res.status(500).json({ error: 'Không thể thêm thành viên.' });
  }
});

app.get('/api/activities', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT a.id, a.title, a.description, a.activity_date,
       a.location, c.name AS club_name
       FROM activities a JOIN clubs c ON c.id = a.club_id
       ORDER BY a.activity_date DESC`
    );
    res.json(rows);
  } catch (error) {
    console.error('GET /api/activities failed:', error.message);
    res.status(500).json({ error: 'Không thể tải danh sách hoạt động.' });
  }
});

app.post('/api/activities', async (req, res) => {
  const title = String(req.body.title || '').trim();
  const description = String(req.body.description || '').trim();
  const activityDate = String(req.body.activity_date || '').trim();
  const location = String(req.body.location || '').trim();
  const clubId = Number(req.body.club_id);

  if (!title || !activityDate || !Number.isInteger(clubId) || clubId < 1) {
    return res.status(400).json({
      error: 'Cần nhập tên hoạt động, ngày tổ chức và câu lạc bộ.'
    });
  }

  try {
    const [result] = await pool.execute(
      `INSERT INTO activities
       (title, description, activity_date, location, club_id)
       VALUES (?, ?, ?, ?, ?)`,
      [title, description || null, activityDate, location || null, clubId]
    );
    res.status(201).json({ id: result.insertId, title });
  } catch (error) {
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ error: 'Câu lạc bộ không tồn tại.' });
    }
    console.error('POST /api/activities failed:', error.message);
    res.status(500).json({ error: 'Không thể tạo hoạt động.' });
  }
});

app.get('/metrics', async (req, res) => {
  try {
    const [[clubs]] = await pool.query('SELECT COUNT(*) AS total FROM clubs');
    const [[members]] = await pool.query('SELECT COUNT(*) AS total FROM members');
    const [[activities]] = await pool.query('SELECT COUNT(*) AS total FROM activities');

    res.type('text/plain').send(
      '# HELP club_clubs_total Number of clubs\n' +
      '# TYPE club_clubs_total gauge\n' +
      `club_clubs_total ${clubs.total}\n` +
      '# HELP club_members_total Number of members\n' +
      '# TYPE club_members_total gauge\n' +
      `club_members_total ${members.total}\n` +
      '# HELP club_activities_total Number of activities\n' +
      '# TYPE club_activities_total gauge\n' +
      `club_activities_total ${activities.total}\n`
    );
  } catch (error) {
    res.status(503).type('text/plain').send('# Database unavailable\n');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Club management server listening on port ${PORT}`);
});
