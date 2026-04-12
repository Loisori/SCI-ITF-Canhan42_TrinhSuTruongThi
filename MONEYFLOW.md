# InvestPro - Hệ thống Luồng Tiền (Money Flow)

Tài liệu này mô tả chi tiết cách dòng tiền di chuyển giữa Nhà đầu tư (Investor), Chủ dự án (Owner) và Hệ thống (Platform) trong nền tảng InvestPro.

---

## 1. Các Quy ước Cơ bản
- **Ví người dùng (User Balance)**: Mọi người dùng (Investor/Owner) đều có một số dư ví điện tử trên nền tảng.
- **Đơn vị tiền tệ**: VNĐ (Vietnam Dong).
- **Trạng thái Giao dịch**: Mọi sự biến động số dư đều được lưu vết trong bảng `transactions` với các trạng thái `pending`, `success`, `failed`.

---

## 2. Các Luồng Tiền Chi tiết

### A. Nạp tiền (Deposit)
**Luồng**: Tiền thật (Ngân hàng/Ví điện tử) → Ví InvestPro.
1. Người dùng thực hiện thanh toán qua **VNPay** hoặc **MoMo**.
2. Hệ thống nhận callback thành công từ cổng thanh toán.
3. Cộng số dư vào `user.balance`.
4. Tạo bản ghi `TransactionType.DEPOSIT` với trạng thái `success`.

### B. Đầu tư (Investment)
**Luồng**: Ví Investor → Vốn Dự án.
1. Investor chọn dự án và số tiền muốn đầu tư.
2. Hệ thống kiểm tra số dư ví (`balance >= amount`).
3. **Trừ tiền** từ ví người dùng.
4. **Cộng tiền** vào `project.current_amount`.
5. Tạo bản ghi `TransactionType.INVEST`.
6. Tự động tính toán và tạo lịch trả lãi (`payment_schedules`) cho tương lai.

### C. Giải ngân cho Chủ dự án (Disbursement)
**Luồng**: Vốn Dự án → Ví Owner (Sau khi trừ phí).
1. Khi dự án huy động vốn thành công hoặc đến giai đoạn giải ngân.
2. Hệ thống tính toán **Phí nền tảng (Commission Fee)**: `Total Invested * Commission Rate`.
3. Số tiền thực nhận: `Net Received = Total Invested - Commission Fee`.
4. Hệ thống giải ngân theo giai đoạn (Ví dụ: Đợt 1 nhận 20%).
5. **Cộng tiền** vào `owner.balance`.
6. Tạo bản ghi `TransactionType.DISBURSEMENT`.

### D. Trả lãi định kỳ/Linh hoạt (ROI - Interest Receive)
**Luồng**: Hệ thống → Ví Investor.
1. Khi dự án đến kỳ hạn trả lãi hoặc kết thúc huy động vốn (tùy cấu hình).
2. Hệ thống quét qua các lịch trả lãi (`payment_schedules`) có trạng thái `unpaid`.
3. Tính tổng số tiền lãi Investor được nhận.
4. **Cộng tiền** vào `investor.balance`.
5. Tạo bản ghi `TransactionType.INTEREST_RECEIVE`.
6. Cập nhật trạng thái lịch trả lãi sang `paid`.

### E. Hoàn tiền (Refund)
**Luồng**: Vốn Dự án → Ví Investor (Khi dự án thất bại/hết hạn).
1. Nếu dự án không đạt 100% mục tiêu sau khi hết hạn huy động vốn (`endDate`).
2. Hệ thống chuyển trạng thái dự án sang `FAILED`.
3. Quét tất cả các khoản đầu tư (`investments`) của dự án đó.
4. **Cộng trả lại tiền** vào ví cho từng Investor.
5. Tạo bản ghi `TransactionType.REFUND`.

### F. Rút tiền (Withdraw)
**Luồng**: Ví InvestPro → Tiền thật (Ngân hàng).
1. Người dùng tạo yêu cầu rút tiền.
2. Hệ thống kiểm tra số dư và trừ tiền ví người dùng.
3. Tạo giao dịch `TransactionType.WITHDRAW` trạng thái `pending`.
4. Sau khi Admin phê duyệt và chuyển khoản thủ công/tự động, trạng thái chuyển sang `success`.

---

## 3. Bảng Tham chiếu Transaction Types

| Type | Tên gọi | Mô tả | Di chuyển tiền |
| :--- | :--- | :--- | :--- |
| `deposit` | Nạp tiền | User nạp tiền từ bên ngoài vào hệ thống. | External -> Wallet (+) |
| `withdraw` | Rút tiền | User rút tiền từ hệ thống về ngân hàng. | Wallet -> External (-) |
| `invest` | Đầu tư | User dùng số dư ví để góp vốn vào dự án. | Wallet (-) -> Project (+) |
| `interest_receive` | Nhận lãi | User nhận được tiền lãi ROI từ các dự án. | Platform -> Wallet (+) |
| `refund` | Hoàn tiền | User nhận lại tiền khi dự án huy động vốn thất bại. | Project (-) -> Wallet (+) |
| `disbursement` | Giải ngân | Chủ dự án nhận được vốn từ nền tảng. | Platform -> Owner Wallet (+) |

---

## 4. Công thức Tính toán Quan trọng

- **Số dư khả dụng**: `balance` (lưu trong bảng `users`).
- **Phần trăm tiến độ dự án**: `(current_amount / goal_amount) * 100`.
- **Số tiền nhận thực tế của Owner**: `Total_Invested * (1 - Commission_Rate)`.
- **Lợi nhuận Investor**: Theo `interest_rate` và `duration_months` quy định trong bảng `projects`.

---

> [!NOTE]
> Mọi giao dịch tiền tệ đều được bọc trong **Database Transaction** (TypeORM Manager Transaction) để đảm bảo tính toàn vẹn dữ liệu: Nếu một bước thất bại (như lưu thông báo bị lỗi), toàn bộ quá trình chuyển tiền sẽ được Rollback lại trạng thái ban đầu (trừ phi đã được tách luồng như hệ thống Notification mới).
