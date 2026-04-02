# InvestPro (AI-vest)

<p align="center">
  <em>Nền tảng kết nối gọi vốn cộng đồng hiện đại, tích hợp hợp đồng ràng buộc và giải ngân thông minh.</em>
</p>

## 🚀 Giới thiệu
**InvestPro** là một giải pháp Fintech cung cấp nền tảng **gọi vốn cộng đồng (Crowdfunding) & đầu tư vi mô (Micro-investing)**. 
Khác với các nền tảng Donate thông thường, InvestPro được thiết kế với cơ chế sinh lời có kỳ hạn dài hạn, bảo mật rủi ro nhờ **Hợp đồng thông minh (Escrow-like Milestones)**, và hệ thống nhắc nhở cá nhân hoá bằng công nghệ gợi ý tương tự AI.

Dự án này là minh chứng cho việc thiết kế kiến trúc hệ thống bài bản, tối ưu hóa CSDL khắt khe và các tính năng Real-time tương tác trực tiếp.

---

## 🔥 Các Tính Năng Cốt Lõi (Key Features)

### 1. 🛡️ Cơ chế Giải Ngân Theo Giai Đoạn (Milestone Disbursement)
Nhằm bảo vệ số tiền của nhà đầu tư, tiền không được đẩy thẳng 100% cho Start-up ngay lập tức:
- **5 Giai đoạn khắt khe**: Hệ thống tự động băm nhỏ quỹ gọi vốn làm 5 giai đoạn (20% mỗi phần). Đợt đầu được chuyển làm tiền đề. 
- **Minh chứng sống (Proof Upload)**: Chủ dự án bắt buộc phải nộp tài liệu/hình ảnh chứng minh tiến độ làm việc mới được Admin duyệt mở khóa vốn bước tiếp theo.

### 2. ⚖️ Hệ thống Tranh Chấp & Đóng Băng Tự Động (Auto-Freeze & Dispute)
Dân chủ hóa quá trình giám sát dòng tiền:
- Nhà đầu tư có quyền bấm nút **Khiếu nại** nếu phát hiện dấu hiệu lừa đảo.
- **Auto-Freeze Logic**: Nếu >50% số nhà đầu tư cùng gửi khiếu nại, hệ thống sẽ chốt cắm cờ `isFrozen = true`, lập tức đóng băng lệnh giải ngân.
- Admin sẽ là Quan tòa đứng ra dàn xếp bằng **Admin Dashboard**, với uy quyền 1 click để "Bỏ qua khiếu nại" hoặc lập tức "Thu hồi & Hoàn tiền gốc" phần % vốn còn lại cho Users.

### 3. 🔔 Hệ Thống Thông Báo Thời Gian Thực (Socket.IO Real-time)
Cơ sở hạ tầng Socket.IO Notification đập tan ranh giới chờ đợi của F5 truyền thống:
- Nhận thông báo POPUP tức thì khi: *Dự án bạn đầu tư có lãi*, *Dự án đã đạt mốc 100%*, *Dự án bị đóng băng*.

### 4. 💳 Tích Hợp Thanh Toán VNPay & Vận hành Ví Xuyên Suốt (Wallet Core)
- Đầu tư không gặp rào cản thông qua Sandbox trực tiếp nối cổng VNPAY.
- Quản trị số dư (Balance) bằng TypeORM Transaction, ngắt mọi khả năng "đúp" tiền trong giao dịch mạng yếu.

### 5. 🎨 Cá Nhân Hóa (User Preferences)
Thuật toán phân tích thói quen đầu tư, hiển thị nhãn mục yêu thích vào Homepage và ngầm loại bỏ các dự án bị đưa vào danh sách đen (Blacklist).

---

## 🛠️ Công Nghệ & Kiến Trúc (Tech Stack)

### **Frontend (Khách hàng & Trải nghiệm)**
- **Framework**: `Next.js 14` (App Router) 
- **Styling**: `TailwindCSS`
- **UX/UI**: Giao diện Light/Dark Mode tinh tế, Micro-animations. 

### **Backend (Xử lý Core Logic)**
- **Framework**: `NestJS` (TypeScript siêu định hình)
- **Database**: `MySQL` - Liên kết truy vấn với `TypeORM`. 
- **Bảo mật**: `JWT (JSON Web Token)`, Guard bảo vệ API phân quyền (Admin / Investor / Owner).
- **Network**: `Socket.io` Gateway. 

### **Cơ chế Tối Ưu (Optimization)**
- Phủ kín chỉ mục **`@Index()`** trong MySQL (InvestmentEntity, ProjectsEntity) nhằm tăng tốc độ truy vấn `JOIN` tại các tính năng Report lớn.
- **Unit Test phủ sóng**: Logic kế toán (Tính lãi, chia mốc Milestone) vượt bài kiểm tra Mock Database nghiêm ngặt bằng **Jest**.

---

## 💻 Hướng Dẫn Cài Đặt (Local Development)

### 1. Khởi động Backend (NestJS API)
Đảm bảo bạn có MySQL chạy local, và file `.env` đã được set url kết nối (Tham khảo `.env.example`).
```bash
cd server
npm install

# Khởi chạy TypeORM Sinh cấu trúc bảng Database
npm run start:dev
```

### 2. Khởi động Frontend (Next.js)
```bash
cd client
npm install

# Bật máy chủ giao diện
npm run dev
```

Truy cập `http://localhost:3000` để trải nghiệm hệ thống!

---

## 📂 Kiến Trúc Mã Cuồn (Folder Structure)

Khối **`server`** được kiến trúc theo Module Pattern bóc tách mạnh:
- `auth`: Logic đăng nhập / đăng ký
- `investments`: Các thuật toán Transaction & Cron Jobs kiểm tra tính lãi.
- `projects`: Lõi Milestone, Dispute, Media uploading.
- `notifications`: Websocket Gateway.

Khối **`client`** áp dụng Next App Router ưu việt:
- `(main)`: Luồng Public, trang chủ, chi tiết dự án.
- `(admin)`: Dashboard kín của kiểm duyệt viên.

---
> *Đây là dự án tâm huyết đề cao thiết kế phần mềm linh hoạt, an toàn dòng tiền (ACID Database rule) và giao diện định hướng người dùng.*
