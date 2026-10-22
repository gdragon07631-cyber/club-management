CREATE DATABASE IF NOT EXISTS club_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE club_db;

CREATE TABLE IF NOT EXISTS clubs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  phone VARCHAR(30),
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  club_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_members_club FOREIGN KEY (club_id)
    REFERENCES clubs(id)
);

CREATE TABLE IF NOT EXISTS activities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  activity_date DATE NOT NULL,
  location VARCHAR(200),
  club_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_activities_club FOREIGN KEY (club_id)
    REFERENCES clubs(id)
);

INSERT IGNORE INTO clubs (name, description) VALUES
('Lập trình', 'Học lập trình và phát triển phần mềm'),
('Truyền thông', 'Tổ chức truyền thông và sự kiện sinh viên'),
('Tình nguyện', 'Tham gia các hoạt động vì cộng đồng');

INSERT IGNORE INTO members (full_name, email, phone, club_id) VALUES
('Nguyễn Minh Anh', 'minhanh@example.com', '0900000001', 1),
('Trần Quốc Bảo', 'quocbao@example.com', '0900000002', 1),
('Lê Thu Hà', 'thuha@example.com', '0900000003', 2);

INSERT INTO activities (title, description, activity_date, location, club_id)
SELECT 'Buổi sinh hoạt lập trình', 'Làm quen với Git và GitHub',
       '2026-11-05', 'Phòng máy 1', 1
WHERE NOT EXISTS (
  SELECT 1 FROM activities WHERE title = 'Buổi sinh hoạt lập trình'
);
