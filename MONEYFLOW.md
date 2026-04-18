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
**Luồng**: Vốn Dự án → Ví Owner (Sau khi trừ phí lúc đầu tư).
1. Khi dự án huy động vốn thành công, chuyển trạng thái sang `PENDING_ADMIN_REVIEW` và **tính toán tổng nợ (Total Debt)**.
2. Giai đoạn 1 (Stage 1 - 20%) chờ **Admin phê duyệt thủ công**.
3. Hệ thống tính toán **Phí nền tảng (Commission Fee)** trên tổng vốn: `Total Invested * Commission Rate`.
4. Số tiền thực nhận: `Net Received = Total Invested - Commission Fee`.
5. Admin click giải ngân, **cộng tiền** vào `owner.balance`.
6. Tạo bản ghi `TransactionType.DISBURSEMENT`.

### D. Trả lãi định kỳ/Linh hoạt (ROI - Interest Repayment)
**Luồng**: Ví Owner → Hệ thống → Ví Investor (Có thu phí nền tảng trên Lãi).
1. Owner thực hiện trả lãi cho một kỳ hạn (`Payment Schedule`).
2. Hệ thống trừ tiền từ ví Owner. Thiết lập giao dịch `TransactionType.REPAY_INTEREST`.
3. Hệ thống tính **Phí nền tảng trên phần Lãi**: `Total Interest * Tier Fee Rate`.
4. Quét qua các lịch trả lãi của Investor trong cùng ngày (`unpaid`).
5. **Cộng tiền** (sau phí) phân bổ theo tỷ lệ cho từng Investor. Thiết lập `TransactionType.INTEREST_RECEIVE`.
6. Trừ bớt khoản trả này khỏi `totalDebt` của dự án và cập nhật `paid` cho các Schedule.

### E. Trả Nợ Gốc (Principal Repayment)
**Luồng**: Ví Owner → Vốn Dự án → Ví Investor (Không thu phí nền tảng trên Gốc).
1. Khi đến cuối dự án, Owner trả nốt phần nợ gốc bằng chức năng Trả nợ `repayProjectDebt`.
2. Tiền bị trừ khỏi ví Owner. Tạo giao dịch `TransactionType.REPAY_PRINCIPAL`.
3. Investor nhận lại gốc theo tỷ lệ vốn ban đầu.
4. Trừ khoản trả khỏi `totalDebt` của dự án đến khi bằng 0. Cập nhật trạng thái nếu xong nợ.

### F. Hoàn tiền (Refund)
**Luồng**: Vốn Dự án → Ví Investor (Khi dự án thất bại/hết hạn).
1. Nếu dự án không đạt 100% mục tiêu sau khi hết hạn huy động vốn (`endDate`).
2. Hệ thống chuyển trạng thái dự án sang `FAILED`.
3. Quét tất cả các khoản đầu tư (`investments`) của dự án đó.
4. **Cộng trả lại tiền** vào ví cho từng Investor.
5. Tạo bản ghi `TransactionType.REFUND`.

### G. Rút tiền (Withdraw)
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
| `disbursement` | Giải ngân | Chủ dự án nhận được vốn từ nền tảng. | Platform -> Owner Wallet (+) |
| `repay_interest` | Trả lãi | Chủ dự án đóng tiền lãi định kỳ (có tính phí). | Owner Wallet (-) -> Platform |
| `repay_principal`| Trả gốc | Chủ dự án đóng tiền gốc trả lại. | Owner Wallet (-) -> Platform |
| `interest_receive` | Nhận tiền | User nhận được tiền lãi/gốc từ Owner trả. | Platform -> Wallet (+) |
| `refund` | Hoàn tiền | User nhận lại tiền khi dự án huy động vốn thất bại. | Project (-) -> Wallet (+) |

---

## 4. Công thức Tính toán Quan trọng

- **Số dư khả dụng**: `balance` (lưu trong bảng `users`).
- **Tổng Nợ Dự Án (Total Debt)**: `Principal + (Principal * InterestRate * (DurationMonths / 12))`
- **Tiền nhận thực tế qua Giải ngây (Owner Net)**: `Total_Invested * (1 - Commission_Rate)`.
- **Phí thu lợi nhuận**: Owner trả lãi -> Nền tảng cắt X% phí dựa trên Tier dự án -> Investor nhận Net.

---

> [!NOTE]
> Mọi giao dịch chuyển nguồn có liên kết nhiều User (như Trả Lãi hàng loạt) đều được bọc trong **Database Transaction** và **Pessimistic Locking** (`QueryBuilder`) để bảo mật tuyệt đối, tránh race condition trong SQL.
