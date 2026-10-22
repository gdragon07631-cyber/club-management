# Hệ thống quản lý Câu lạc bộ

Ứng dụng Node.js + Express + MySQL chạy bằng Docker Compose.

## Chạy ứng dụng

```bash
docker compose up -d --build
docker compose ps
```

Mở giao diện: http://localhost:3001

Kiểm tra dịch vụ: http://localhost:3001/health

Prometheus metrics: http://localhost:3001/metrics

## API

- `GET /api/clubs`, `POST /api/clubs`
- `GET /api/members`, `POST /api/members`
- `GET /api/activities`, `POST /api/activities`

Cơ sở dữ liệu được lưu trong volume `club_db_data`.
Không dùng `docker compose down -v` nếu muốn giữ dữ liệu.
