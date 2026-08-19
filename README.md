# HalfLife Water Ledger

Ứng dụng Next.js ghi kết quả đánh đôi, derive leaderboard và tự động tính ai phải trả nước cho ai. PostgreSQL là source of truth; ứng dụng không phụ thuộc Vercel, Supabase hoặc Firebase.

## Kiến trúc

- Next.js + TypeScript + Tailwind CSS và các UI primitive theo phong cách shadcn/ui.
- PostgreSQL + Prisma ORM.
- Auth.js/NextAuth.js với Google OAuth; chỉ email trong `ADMIN_EMAILS` được đăng nhập.
- Docker Compose chạy `app`, `postgres` và Caddy reverse proxy.
- Điểm không được lưu trên `Player`. Mỗi `MatchPlayer.WIN` là `+1`, mỗi `LOSS` là `-1`; leaderboard và settlement luôn derive lại từ lịch sử trận.
- Volume `postgres_data` giữ dữ liệu qua restart, rebuild và nâng cấp container.

## Chạy local

Yêu cầu Node.js 20+ và Docker. Script dưới đây chỉ chạy PostgreSQL bằng Docker; Next.js chạy trực tiếp trên máy ở port 3000.

```bash
./start.sh
```

Script tự khởi động PostgreSQL, chờ healthcheck, chạy Prisma migration, build khi source thay đổi và start Next.js. Muốn ép build lại:

```bash
./start.sh --build
```

Dừng Next.js nhưng giữ PostgreSQL:

```bash
./stop.sh
```

Dừng cả Next.js và PostgreSQL, vẫn giữ nguyên volume dữ liệu:

```bash
./stop.sh --with-db
```

Thiết lập thủ công nếu không dùng script:

```bash
cp .env.example .env
npm ci
npm run db:generate
npm run db:migrate:dev
npm run dev
```

Mở `http://localhost:3000`. Healthcheck ở `http://localhost:3000/api/health`.

## Cấu hình Google One Tap

Trong Google Cloud Console, tạo OAuth client loại Web application. Với môi trường local, thêm Authorized JavaScript origin:

```text
http://localhost:3000
```

Production cần thêm origin thật, ví dụ `https://halflife.example.com`. One Tap gửi Google ID token cho Auth.js xác minh server-side, sau đó ứng dụng kiểm tra email trong `ADMIN_EMAILS`.

Đặt client ID vào `.env`. `GOOGLE_CLIENT_SECRET` vẫn được giữ trong cấu hình để tương thích nếu sau này bật lại OAuth redirect. Tạo Auth.js secret bằng:

```bash
openssl rand -base64 32
```

`NEXTAUTH_URL` phải là URL public chính xác, có `https://`. `ADMIN_EMAILS` là danh sách email phân cách bằng dấu phẩy.

## Deploy VPS Ubuntu

### 1. Chuẩn bị VPS

Trỏ DNS A/AAAA của domain về VPS. Mở TCP 80/443 và UDP 443. Cài Docker Engine cùng Docker Compose plugin theo tài liệu chính thức của Docker.

```bash
git clone <repository-url> /opt/halflife
cd /opt/halflife
cp .env.example .env
```

Sửa `.env` bằng secret thật. Không commit file này. PostgreSQL không publish port ra ngoài; chỉ `app` truy cập qua mạng nội bộ Compose.

### 2. Build và khởi động

```bash
docker compose build
docker compose up -d
docker compose ps
docker compose logs -f app
```

Container `app` chạy `prisma migrate deploy` trước khi start Next.js. Có thể chạy migration production thủ công, an toàn và idempotent, bằng:

```bash
docker compose run --rm app npm run db:migrate:deploy
```

### 3. Quy trình cập nhật

```bash
cd /opt/halflife
git pull --ff-only
docker compose build app
docker compose up -d
docker compose ps
```

`restart: unless-stopped` tự khởi động lại service sau reboot/crash. `depends_on` và healthcheck đảm bảo app chỉ start sau khi PostgreSQL sẵn sàng. Dữ liệu nằm trong named volume `postgres_data`, không bị xóa bởi `docker compose down` hoặc rebuild. Không chạy `docker compose down -v` trên production vì lệnh đó xóa volume dữ liệu.

## Backup và restore PostgreSQL

Backup:

```bash
docker compose exec -T postgres pg_dump -U halflife -d halflife -Fc > halflife.dump
```

Restore vào database trống:

```bash
docker compose exec -T postgres pg_restore -U halflife -d halflife --clean --if-exists < halflife.dump
```

Nên tự động hóa backup định kỳ và sao chép file ra một máy/object storage khác VPS.

## Các trang chính

- `/`: session hiện tại và khoản cần thanh toán.
- `/sessions/:id`: public leaderboard, lịch sử trận và tiền nước của một session.
- `/leaderboard`: leaderboard all-time.
- `/water`: settlement current session hoặc all-time.
- `/admin`: tạo người chơi/session, nhập, sửa hoặc xóa kết quả; yêu cầu admin Google OAuth.

Schema đã có `SettlementPeriod` và `SettlementPayment` để mở rộng chức năng chốt sổ/đánh dấu đã trả. MVP hiện tại chỉ tính settlement động từ match history.

## Kiểm thử

```bash
npm test
npm run build
```

Test bao gồm invariant tổng balance bằng 0, các ví dụ settlement bắt buộc, ba rotation A/B/C/D và việc sửa kết quả không cộng điểm hai lần.
