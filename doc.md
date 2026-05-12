# Use Case Giao Diện Cho Investor Và Owner

## Tổng quan

- Tổng số use case giao diện: 28
- Investor-only: 4
- Owner-only: 6
- Dùng chung Investor và Owner: 15
- Blog/public/admin: 3
- Phạm vi: chỉ các thao tác thực tế trên frontend (client/app, client/components).

## Danh mục use case

| ID     | Tên use case                               | Tác nhân                         |
| ------ | ------------------------------------------ | -------------------------------- |
| UI-001 | Đăng ký tài khoản                          | Investor, Owner (người dùng mới) |
| UI-002 | Đăng nhập hệ thống                         | Investor, Owner                  |
| UI-003 | Xem hồ sơ cá nhân và thông tin tài khoản   | Investor, Owner                  |
| UI-004 | Cập nhật hồ sơ và ảnh đại diện             | Investor, Owner                  |
| UI-005 | Đổi mật khẩu tài khoản                     | Investor, Owner                  |
| UI-006 | Cài đặt thông báo và sở thích danh mục     | Investor, Owner                  |
| UI-007 | Nộp KYC và theo dõi trạng thái xác minh    | Investor, Owner                  |
| UI-008 | Nạp tiền vào ví (VNPAY/MoMo)               | Investor, Owner                  |
| UI-009 | Rút tiền khỏi ví                           | Investor, Owner                  |
| UI-010 | Xem lịch sử giao dịch cá nhân              | Investor, Owner                  |
| UI-011 | Quản lý thông báo trong ứng dụng           | Investor, Owner                  |
| UI-012 | Sử dụng AI Chatbox hỗ trợ phân tích        | Investor, Owner                  |
| UI-013 | Quản lý thư viện media trên giao diện      | Investor, Owner                  |
| UI-014 | Tìm kiếm và xem danh sách dự án            | Investor, Owner                  |
| UI-015 | Xem chi tiết dự án và hồ sơ công khai      | Investor, Owner                  |
| UI-016 | Đầu tư vào dự án                           | Investor                         |
| UI-017 | Theo dõi danh mục đầu tư và chỉ số cá nhân | Investor                         |
| UI-018 | Tạo khiếu nại dự án                        | Investor                         |
| UI-019 | Tham gia voting milestone và xem thảo luận | Investor                         |
| UI-020 | Tạo dự án mới                              | Owner                            |
| UI-021 | Cập nhật thông tin dự án                   | Owner                            |
| UI-022 | Quản lý milestones của dự án               | Owner                            |
| UI-023 | Dừng huy động vốn sớm                      | Owner                            |
| UI-024 | Theo dõi danh sách dự án của tôi           | Owner                            |
| UI-025 | Thanh toán nợ dự án (repay)                | Owner                            |
| UI-026 | Xem danh sách blog công khai               | Investor, Owner, Guest           |
| UI-027 | Xem chi tiết bài blog                      | Investor, Owner, Guest           |
| UI-028 | Quản lý bài viết blog                      | Admin                            |

## Chi tiết use case (mẫu giao diện)

### 2.2.1. Use case Đăng ký tài khoản

Mục đích: Cho phép người dùng tạo tài khoản để bắt đầu sử dụng nền tảng với vai trò Investor hoặc Owner.

Tác nhân, mô tả chung:

- Tác nhân: Investor, Owner (người dùng mới).
- Mô tả chung: Người dùng điền thông tin ở màn hình đăng ký, hệ thống tạo tài khoản nếu dữ liệu hợp lệ.

Luồng sự kiện chính
Bảng 1. Luồng sự kiện chính use case Đăng ký tài khoản

| Hành động của tác nhân                               | Phản ứng của hệ thống                         |
| ---------------------------------------------------- | --------------------------------------------- |
| 1. Người dùng mở màn hình Đăng ký và nhập thông tin. | 2. Hệ thống kiểm tra tính hợp lệ của dữ liệu. |
| -                                                    | 3. Hệ thống gọi API tạo tài khoản mới.        |
| -                                                    | 4. Giao diện thông báo đăng ký thành công.    |

Luồng thay thế:

- 1. Email đã tồn tại hoặc dữ liệu không hợp lệ -> hệ thống trả lỗi và yêu cầu nhập lại.

Các yêu cầu cụ thể:

- API: POST /api/auth/register
- Frontend: client/app/(main)/(auth)/register/page.tsx

Điều kiện trước:

- Người dùng chưa có tài khoản.

Điều kiện sau:

- Tài khoản mới được tạo thành công.

---

### 2.2.2. Use case Đăng nhập hệ thống

Mục đích: Xác thực người dùng để truy cập dashboard theo vai trò.

Tác nhân, mô tả chung:

- Tác nhân: Investor, Owner.
- Mô tả chung: Người dùng nhập thông tin đăng nhập, hệ thống cấp phiên truy cập hợp lệ.

Luồng sự kiện chính
Bảng 2. Luồng sự kiện chính use case Đăng nhập hệ thống

| Hành động của tác nhân                | Phản ứng của hệ thống                        |
| ------------------------------------- | -------------------------------------------- |
| 1. Người dùng nhập email và mật khẩu. | 2. Hệ thống xác thực thông tin đăng nhập.    |
| -                                     | 3. Hệ thống trả token và hồ sơ người dùng.   |
| -                                     | 4. Giao diện chuyển đến dashboard tương ứng. |

Luồng thay thế:

- 1. Sai tài khoản hoặc mật khẩu -> hiển thị thông báo lỗi đăng nhập.

Các yêu cầu cụ thể:

- API: POST /api/auth/login, GET /api/auth/profile
- Frontend: client/app/(main)/(auth)/login/page.tsx

Điều kiện trước:

- Tài khoản đã được tạo và chưa bị khóa.

Điều kiện sau:

- Người dùng đăng nhập thành công, có token hợp lệ.

---

### 2.2.3. Use case Xem hồ sơ cá nhân và thông tin tài khoản

Mục đích: Giúp người dùng theo dõi thông tin tài khoản, vai trò và số dư hiện tại.

Tác nhân, mô tả chung:

- Tác nhân: Investor, Owner.
- Mô tả chung: Người dùng mở dashboard hoặc trang profile để xem thông tin cá nhân.

Luồng sự kiện chính
Bảng 3. Luồng sự kiện chính use case Xem hồ sơ cá nhân và thông tin tài khoản

| Hành động của tác nhân                    | Phản ứng của hệ thống                               |
| ----------------------------------------- | --------------------------------------------------- |
| 1. Người dùng truy cập dashboard/profile. | 2. Hệ thống lấy dữ liệu hồ sơ từ backend.           |
| -                                         | 3. Hệ thống hiển thị thông tin cá nhân và số dư ví. |
| -                                         | 4. Người dùng theo dõi thông tin hiện tại.          |

Luồng thay thế:

- 1. Phiên đăng nhập hết hạn -> yêu cầu người dùng đăng nhập lại.

Các yêu cầu cụ thể:

- API: GET /api/auth/profile, GET /api/users/profile
- Frontend: DashboardLayout, ProfileView, Navbar

Điều kiện trước:

- Người dùng đã đăng nhập.

Điều kiện sau:

- Thông tin cá nhân được hiển thị đầy đủ trên giao diện.

---

### 2.2.4. Use case Cập nhật hồ sơ và ảnh đại diện

Mục đích: Cho phép người dùng chỉnh sửa thông tin cá nhân và ảnh đại diện.

Tác nhân, mô tả chung:

- Tác nhân: Investor, Owner.
- Mô tả chung: Người dùng cập nhật dữ liệu trong màn hình cài đặt tài khoản.

Luồng sự kiện chính
Bảng 4. Luồng sự kiện chính use case Cập nhật hồ sơ và ảnh đại diện

| Hành động của tác nhân             | Phản ứng của hệ thống                                |
| ---------------------------------- | ---------------------------------------------------- |
| 1. Người dùng mở màn hình Cài đặt. | 2. Người dùng chỉnh sửa thông tin hoặc chọn ảnh mới. |
| -                                  | 3. Hệ thống gửi yêu cầu cập nhật đến backend.        |
| -                                  | 4. Giao diện hiển thị dữ liệu đã cập nhật.           |

Luồng thay thế:

- 1. Ảnh không hợp lệ hoặc dữ liệu sai định dạng -> thông báo lỗi.

Các yêu cầu cụ thể:

- API: PATCH /api/users/profile, PATCH /api/users/avatar
- Frontend: client/components/dashboard/views/SettingsView.tsx

Điều kiện trước:

- Người dùng đã đăng nhập.

Điều kiện sau:

- Hồ sơ người dùng được cập nhật thành công.

---

### 2.2.5. Use case Đổi mật khẩu tài khoản

Mục đích: Nâng cao bảo mật tài khoản bằng cách thay đổi mật khẩu.

Tác nhân, mô tả chung:

- Tác nhân: Investor, Owner.
- Mô tả chung: Người dùng cung cấp mật khẩu cũ và mật khẩu mới trong trang cài đặt.

Luồng sự kiện chính
Bảng 5. Luồng sự kiện chính use case Đổi mật khẩu tài khoản

| Hành động của tác nhân                     | Phản ứng của hệ thống                                 |
| ------------------------------------------ | ----------------------------------------------------- |
| 1. Người dùng chọn chức năng Đổi mật khẩu. | 2. Người dùng nhập mật khẩu cũ và mật khẩu mới.       |
| -                                          | 3. Hệ thống xác thực mật khẩu cũ và lưu mật khẩu mới. |
| -                                          | 4. Giao diện thông báo cập nhật thành công.           |

Luồng thay thế:

- 1. Mật khẩu cũ không đúng hoặc mật khẩu mới không đạt yêu cầu -> thông báo lỗi.

Các yêu cầu cụ thể:

- API: PATCH /api/users/change-password
- Frontend: client/components/dashboard/views/SettingsView.tsx

Điều kiện trước:

- Người dùng đã đăng nhập.

Điều kiện sau:

- Mật khẩu mới có hiệu lực.

---

### 2.2.6. Use case Cài đặt thông báo và sở thích danh mục

Mục đích: Cá nhân hóa trải nghiệm nhận thông báo và danh mục quan tâm.

Tác nhân, mô tả chung:

- Tác nhân: Investor, Owner.
- Mô tả chung: Người dùng bật/tắt thông báo và cập nhật danh mục quan tâm trong cài đặt.

Luồng sự kiện chính
Bảng 6. Luồng sự kiện chính use case Cài đặt thông báo và sở thích danh mục

| Hành động của tác nhân                    | Phản ứng của hệ thống                        |
| ----------------------------------------- | -------------------------------------------- |
| 1. Người dùng mở phần Thông báo/Sở thích. | 2. Người dùng thay đổi các tùy chọn cá nhân. |
| -                                         | 3. Hệ thống cập nhật cấu hình lên backend.   |
| -                                         | 4. Giao diện đồng bộ trạng thái mới.         |

Luồng thay thế:

- 1. Dữ liệu tùy chọn không hợp lệ -> hệ thống từ chối và báo lỗi.

Các yêu cầu cụ thể:

- API: PATCH /api/users/notification-settings, PATCH /api/users/preferences/category/:categoryId/toggle
- Frontend: client/components/dashboard/views/SettingsView.tsx

Điều kiện trước:

- Người dùng đã đăng nhập.

Điều kiện sau:

- Cấu hình cá nhân được lưu thành công.

---

### 2.2.7. Use case Nộp KYC và theo dõi trạng thái xác minh

Mục đích: Xác minh danh tính để mở khóa các tính năng tài chính.

Tác nhân, mô tả chung:

- Tác nhân: Investor, Owner.
- Mô tả chung: Người dùng tải giấy tờ KYC và theo dõi trạng thái xử lý hồ sơ.

Luồng sự kiện chính
Bảng 7. Luồng sự kiện chính use case Nộp KYC và theo dõi trạng thái xác minh

| Hành động của tác nhân         | Phản ứng của hệ thống                                        |
| ------------------------------ | ------------------------------------------------------------ |
| 1. Người dùng mở màn hình KYC. | 2. Người dùng tải ảnh giấy tờ và nhập dữ liệu xác minh.      |
| -                              | 3. Hệ thống ghi nhận hồ sơ KYC.                              |
| -                              | 4. Giao diện hiển thị trạng thái chờ duyệt/đã duyệt/từ chối. |

Luồng thay thế:

- 1. Thiếu ảnh hoặc dữ liệu sai định dạng -> hệ thống từ chối nộp hồ sơ.

Các yêu cầu cụ thể:

- API: GET /api/users/kyc/status, POST /api/users/kyc/upload, POST /api/users/kyc
- Frontend: client/components/dashboard/views/KycView.tsx

Điều kiện trước:

- Người dùng đã đăng nhập.

Điều kiện sau:

- Hồ sơ KYC được ghi nhận và có trạng thái xử lý.

---

### 2.2.8. Use case Nạp tiền vào ví (VNPAY/MoMo)

Mục đích: Nạp số dư vào ví để phục vụ đầu tư và thanh toán.

Tác nhân, mô tả chung:

- Tác nhân: Investor, Owner.
- Mô tả chung: Người dùng tạo giao dịch nạp tiền và thanh toán qua cổng VNPAY hoặc MoMo.

Luồng sự kiện chính
Bảng 8. Luồng sự kiện chính use case Nạp tiền vào ví (VNPAY/MoMo)

| Hành động của tác nhân              | Phản ứng của hệ thống                               |
| ----------------------------------- | --------------------------------------------------- |
| 1. Người dùng nhập số tiền cần nạp. | 2. Hệ thống tạo yêu cầu nạp tiền vào ví.            |
| -                                   | 3. Hệ thống tạo URL thanh toán theo cổng được chọn. |
| -                                   | 4. Giao diện chuyển hướng sang cổng thanh toán.     |

Luồng thay thế:

- 1. Số tiền không hợp lệ hoặc cổng thanh toán lỗi -> không tạo được URL thanh toán.

Các yêu cầu cụ thể:

- API: POST /api/wallets/deposit, POST /api/payment/create-url, POST /api/payment/create-momo-url
- Frontend: client/components/dashboard/modals/FintechModals.tsx, client/app/(main)/dashboard/deposit/page.tsx, client/app/(main)/dashboard/deposit/success/page.tsx

Điều kiện trước:

- Người dùng đã đăng nhập.

Điều kiện sau:

- Giao dịch nạp tiền được tạo và chờ callback xác nhận.

---

### 2.2.9. Use case Rút tiền khỏi ví

Mục đích: Cho phép người dùng rút số dư ví về tài khoản ngân hàng.

Tác nhân, mô tả chung:

- Tác nhân: Investor, Owner.
- Mô tả chung: Người dùng gửi yêu cầu rút tiền từ dashboard tài chính.

Luồng sự kiện chính
Bảng 9. Luồng sự kiện chính use case Rút tiền khỏi ví

| Hành động của tác nhân               | Phản ứng của hệ thống                               |
| ------------------------------------ | --------------------------------------------------- |
| 1. Người dùng mở chức năng Rút tiền. | 2. Người dùng nhập số tiền và thông tin ngân hàng.  |
| -                                    | 3. Hệ thống kiểm tra số dư và điều kiện rút.        |
| -                                    | 4. Hệ thống tạo giao dịch rút ở trạng thái pending. |

Luồng thay thế:

- 1. Số dư không đủ hoặc tài khoản bị ràng buộc -> từ chối rút tiền.

Các yêu cầu cụ thể:

- API: POST /api/wallets/withdraw
- Frontend: client/components/dashboard/modals/FintechModals.tsx

Điều kiện trước:

- Người dùng đã đăng nhập, có số dư khả dụng.

Điều kiện sau:

- Yêu cầu rút tiền được tạo thành công.

---

### 2.2.10. Use case Xem lịch sử giao dịch cá nhân

Mục đích: Giúp người dùng theo dõi biến động ví và các giao dịch đã thực hiện.

Tác nhân, mô tả chung:

- Tác nhân: Investor, Owner.
- Mô tả chung: Người dùng xem danh sách giao dịch trong dashboard.

Luồng sự kiện chính
Bảng 10. Luồng sự kiện chính use case Xem lịch sử giao dịch cá nhân

| Hành động của tác nhân                  | Phản ứng của hệ thống                           |
| --------------------------------------- | ----------------------------------------------- |
| 1. Người dùng mở mục lịch sử giao dịch. | 2. Hệ thống tải dữ liệu giao dịch từ backend.   |
| -                                       | 3. Hệ thống hiển thị danh sách theo thời gian.  |
| -                                       | 4. Người dùng lọc và tra cứu giao dịch cần xem. |

Luồng thay thế:

- 1. Không tải được dữ liệu -> hiển thị trạng thái lỗi hoặc rỗng.

Các yêu cầu cụ thể:

- API: GET /api/wallets/history, GET /api/transactions
- Frontend: client/components/dashboard/views/Overview.tsx, client/components/dashboard/views/WalletView.tsx, client/components/dashboard/views/TransactionsView.tsx

Điều kiện trước:

- Người dùng đã đăng nhập.

Điều kiện sau:

- Người dùng quan sát được lịch sử biến động tài chính.

---

### 2.2.11. Use case Quản lý thông báo trong ứng dụng

Mục đích: Giúp người dùng theo dõi sự kiện quan trọng và quản lý trạng thái đã đọc.

Tác nhân, mô tả chung:

- Tác nhân: Investor, Owner.
- Mô tả chung: Người dùng xem danh sách thông báo và đánh dấu đã đọc.

Luồng sự kiện chính
Bảng 11. Luồng sự kiện chính use case Quản lý thông báo trong ứng dụng

| Hành động của tác nhân                | Phản ứng của hệ thống                                |
| ------------------------------------- | ---------------------------------------------------- |
| 1. Người dùng mở trung tâm thông báo. | 2. Hệ thống tải danh sách thông báo.                 |
| -                                     | 3. Người dùng đánh dấu từng thông báo hoặc toàn bộ.  |
| -                                     | 4. Hệ thống cập nhật trạng thái đã đọc trên backend. |

Luồng thay thế:

- 1. Thông báo không tồn tại hoặc lỗi cập nhật -> thông báo thất bại.

Các yêu cầu cụ thể:

- API: GET /api/notifications, PATCH /api/notifications/:id/read, PATCH /api/notifications/read-all
- Frontend: client/providers/NotificationProvider.tsx

Điều kiện trước:

- Người dùng đã đăng nhập.

Điều kiện sau:

- Trạng thái đọc/chưa đọc được đồng bộ.

---

### 2.2.12. Use case Sử dụng AI Chatbox hỗ trợ phân tích

Mục đích: Hỗ trợ người dùng đặt câu hỏi nhanh về dự án, rủi ro và dòng tiền.

Tác nhân, mô tả chung:

- Tác nhân: Investor, Owner.
- Mô tả chung: Người dùng nhắn tin trong AI Chatbox để nhận phản hồi và lưu lịch sử hội thoại.

Luồng sự kiện chính
Bảng 12. Luồng sự kiện chính use case Sử dụng AI Chatbox hỗ trợ phân tích

| Hành động của tác nhân       | Phản ứng của hệ thống                                |
| ---------------------------- | ---------------------------------------------------- |
| 1. Người dùng mở AI Chatbox. | 2. Hệ thống tải lịch sử chat trước đó.               |
| -                            | 3. Người dùng gửi câu hỏi mới.                       |
| -                            | 4. Hệ thống trả lời và cập nhật giao diện hội thoại. |

Luồng thay thế:

- 1. Chưa đăng nhập hoặc AI service lỗi -> hiển thị thông điệp fallback.

Các yêu cầu cụ thể:

- API: GET /api/ai-chat/history, POST /api/ai-chat/message, DELETE /api/ai-chat/history
- Frontend: client/components/client/AIChatbox.tsx

Điều kiện trước:

- Người dùng đã đăng nhập.

Điều kiện sau:

- Phiên hội thoại được cập nhật thêm tin nhắn mới.

---

### 2.2.13. Use case Quản lý thư viện media trên giao diện

Mục đích: Quản lý tài nguyên ảnh/video dùng cho nội dung dự án.

Tác nhân, mô tả chung:

- Tác nhân: Investor, Owner.
- Mô tả chung: Người dùng mở media modal để tải lên, chọn hoặc xóa tài nguyên.

Luồng sự kiện chính
Bảng 13. Luồng sự kiện chính use case Quản lý thư viện media trên giao diện

| Hành động của tác nhân                | Phản ứng của hệ thống                     |
| ------------------------------------- | ----------------------------------------- |
| 1. Người dùng mở Media Library Modal. | 2. Hệ thống tải danh sách media hiện có.  |
| -                                     | 3. Người dùng tải lên hoặc xóa media.     |
| -                                     | 4. Hệ thống cập nhật danh sách media mới. |

Luồng thay thế:

- 1. Upload thất bại hoặc file không hợp lệ -> thông báo lỗi.

Các yêu cầu cụ thể:

- API: GET /api/media, POST /api/media/upload, DELETE /api/media/:id
- Frontend: client/components/client/MediaLibraryModal.tsx

Điều kiện trước:

- Người dùng đã đăng nhập.

Điều kiện sau:

- Dữ liệu media được đồng bộ theo thao tác mới nhất.

---

### 2.2.14. Use case Tìm kiếm và xem danh sách dự án

Mục đích: Giúp người dùng tìm nhanh dự án theo từ khóa và bộ lọc.

Tác nhân, mô tả chung:

- Tác nhân: Investor, Owner.
- Mô tả chung: Người dùng tìm dự án ở thanh tìm kiếm hoặc trang danh sách dự án.

Luồng sự kiện chính
Bảng 14. Luồng sự kiện chính use case Tìm kiếm và xem danh sách dự án

| Hành động của tác nhân               | Phản ứng của hệ thống                         |
| ------------------------------------ | --------------------------------------------- |
| 1. Người dùng nhập từ khóa tìm kiếm. | 2. Hệ thống tải gợi ý và kết quả theo bộ lọc. |
| -                                    | 3. Người dùng chọn dự án quan tâm.            |
| -                                    | 4. Giao diện chuyển tới trang chi tiết dự án. |

Luồng thay thế:

- 1. Không có kết quả -> hiển thị trạng thái rỗng kèm gợi ý.

Các yêu cầu cụ thể:

- API: GET /api/projects, GET /api/projects/suggestions, GET /api/projects/stats/homepage, GET /api/project-categories
- Frontend: client/components/client/HeaderSearch.tsx, client/app/(main)/projects/page.tsx

Điều kiện trước:

- Không bắt buộc đăng nhập để xem danh sách dự án.

Điều kiện sau:

- Người dùng xác định được dự án cần phân tích.

---

### 2.2.15. Use case Xem chi tiết dự án và hồ sơ công khai

Mục đích: Cung cấp thông tin tham chiếu trước khi đầu tư hoặc hợp tác.

Tác nhân, mô tả chung:

- Tác nhân: Investor, Owner.
- Mô tả chung: Người dùng xem trang chi tiết dự án và hồ sơ công khai của chủ thể liên quan.

Luồng sự kiện chính
Bảng 15. Luồng sự kiện chính use case Xem chi tiết dự án và hồ sơ công khai

| Hành động của tác nhân                 | Phản ứng của hệ thống                                     |
| -------------------------------------- | --------------------------------------------------------- |
| 1. Người dùng mở trang chi tiết dự án. | 2. Hệ thống tải thông tin dự án, milestones và chủ dự án. |
| -                                      | 3. Người dùng mở hồ sơ công khai của owner/investor.      |
| -                                      | 4. Hệ thống hiển thị danh sách dự án đã tạo/đã đầu tư.    |

Luồng thay thế:

- 1. Không tìm thấy dự án hoặc hồ sơ công khai -> hiển thị trạng thái không tồn tại.

Các yêu cầu cụ thể:

- API: GET /api/projects/:identifier, GET /api/users/:identifier/public, GET /api/users/slug/:slug/public, GET /api/projects/user/:userIdentifier/created, GET /api/projects/user/slug/:slug/created, GET /api/projects/user/:userIdentifier/invested, GET /api/projects/user/slug/:slug/invested
- Frontend: client/app/(main)/projects/[slug]/page.tsx, client/app/(main)/profile/[slug]/page.tsx

Điều kiện trước:

- Người dùng truy cập bằng slug/id hợp lệ.

Điều kiện sau:

- Bộ dữ liệu tham chiếu được hiển thị đầy đủ.

---

### 2.2.16. Use case Đầu tư vào dự án

Mục đích: Cho phép Investor góp vốn vào dự án đang mở huy động.

Tác nhân, mô tả chung:

- Tác nhân: Investor.
- Mô tả chung: Investor nhập số tiền đầu tư từ trang chi tiết dự án.

Luồng sự kiện chính
Bảng 16. Luồng sự kiện chính use case Đầu tư vào dự án

| Hành động của tác nhân                         | Phản ứng của hệ thống                                         |
| ---------------------------------------------- | ------------------------------------------------------------- |
| 1. Investor chọn dự án và nhập số tiền đầu tư. | 2. Hệ thống kiểm tra quyền, mức đầu tư tối thiểu và số dư ví. |
| -                                              | 3. Hệ thống tạo bản ghi đầu tư và trừ số dư ví.               |
| -                                              | 4. Giao diện cập nhật tiến độ huy động của dự án.             |

Luồng thay thế:

- 1. Không đủ số dư hoặc dự án không còn trạng thái funding -> từ chối đầu tư.

Các yêu cầu cụ thể:

- API: POST /api/investments
- Frontend: client/app/(main)/projects/[slug]/page.tsx

Điều kiện trước:

- Người dùng có vai trò Investor, đã đăng nhập.

Điều kiện sau:

- Khoản đầu tư mới được ghi nhận thành công.

---

### 2.2.17. Use case Theo dõi danh mục đầu tư và chỉ số cá nhân

Mục đích: Giúp Investor theo dõi hiệu quả danh mục theo thời gian.

Tác nhân, mô tả chung:

- Tác nhân: Investor.
- Mô tả chung: Investor xem My Portfolio, Overview và Analytics để theo dõi hiệu suất đầu tư.

Luồng sự kiện chính
Bảng 17. Luồng sự kiện chính use case Theo dõi danh mục đầu tư và chỉ số cá nhân

| Hành động của tác nhân                                   | Phản ứng của hệ thống                               |
| -------------------------------------------------------- | --------------------------------------------------- |
| 1. Investor mở các màn hình danh mục/overview/analytics. | 2. Hệ thống tải dữ liệu đầu tư và số liệu tổng hợp. |
| -                                                        | 3. Hệ thống hiển thị biểu đồ và chỉ số hiệu suất.   |
| -                                                        | 4. Investor dựa vào dữ liệu để đánh giá danh mục.   |

Luồng thay thế:

- 1. Chưa có khoản đầu tư -> hiển thị trạng thái rỗng.

Các yêu cầu cụ thể:

- API: GET /api/investments/my-investments, GET /api/investments/analytics, GET /api/projects/user/:userIdentifier/invested
- Frontend: client/components/dashboard/views/MyPortfolio.tsx, client/components/dashboard/views/Overview.tsx, client/components/dashboard/views/AnalyticsView.tsx

Điều kiện trước:

- Investor đã đăng nhập.

Điều kiện sau:

- Investor nắm được tình trạng danh mục hiện tại.

---

### 2.2.18. Use case Tạo khiếu nại dự án

Mục đích: Cho phép Investor phản ánh vấn đề dự án để khởi tạo quy trình xử lý tranh chấp.

Tác nhân, mô tả chung:

- Tác nhân: Investor.
- Mô tả chung: Investor gửi nội dung khiếu nại liên quan đến dự án đã tham gia.

Luồng sự kiện chính
Bảng 18. Luồng sự kiện chính use case Tạo khiếu nại dự án

| Hành động của tác nhân                    | Phản ứng của hệ thống                                |
| ----------------------------------------- | ---------------------------------------------------- |
| 1. Investor mở tính năng Khiếu nại dự án. | 2. Investor nhập lý do khiếu nại và xác nhận gửi.    |
| -                                         | 3. Hệ thống tạo bản ghi dispute.                     |
| -                                         | 4. Hệ thống cập nhật danh sách tranh chấp liên quan. |

Luồng thay thế:

- 1. Người gửi không đủ điều kiện hoặc dữ liệu không hợp lệ -> từ chối tạo khiếu nại.

Các yêu cầu cụ thể:

- API: POST /api/projects/:id/disputes
- Frontend: client/components/dashboard/views/MyPortfolio.tsx

Điều kiện trước:

- Investor đã đăng nhập và có liên quan đến dự án.

Điều kiện sau:

- Khiếu nại được tạo ở trạng thái mở.

---

### 2.2.19. Use case Tham gia voting milestone và xem thảo luận

Mục đích: Cho phép Investor bỏ phiếu ở milestone đang mở voting.

Tác nhân, mô tả chung:

- Tác nhân: Investor.
- Mô tả chung: Investor xem thảo luận milestone và gửi phiếu biểu quyết từ giao diện dự án.

Luồng sự kiện chính
Bảng 19. Luồng sự kiện chính use case Tham gia voting milestone và xem thảo luận

| Hành động của tác nhân                              | Phản ứng của hệ thống                                      |
| --------------------------------------------------- | ---------------------------------------------------------- |
| 1. Investor mở khu vực milestone trong trang dự án. | 2. Hệ thống tải nội dung thảo luận của milestone.          |
| -                                                   | 3. Investor gửi phiếu vote và bình luận (nếu có).          |
| -                                                   | 4. Hệ thống ghi nhận vote và cập nhật trạng thái hiển thị. |

Luồng thay thế:

- 1. Hết hạn vote hoặc người dùng không có quyền vote -> từ chối thao tác.

Các yêu cầu cụ thể:

- API: GET /api/projects/milestones/:mId/discussions, GET /api/projects/milestones/:mId/votes, POST /api/projects/milestones/:mId/vote
- Frontend: client/components/client/ProjectMilestones.tsx, client/app/(main)/projects/[slug]/page.tsx

Điều kiện trước:

- Investor đã đăng nhập, milestone ở trạng thái voting hợp lệ.

Điều kiện sau:

- Phiếu bầu của investor được lưu thành công.

---

### 2.2.20. Use case Tạo dự án mới

Mục đích: Cho phép Owner tạo dự án mới để kêu gọi vốn.

Tác nhân, mô tả chung:

- Tác nhân: Owner.
- Mô tả chung: Owner nhập thông tin dự án và gửi form tạo dự án.

Luồng sự kiện chính
Bảng 20. Luồng sự kiện chính use case Tạo dự án mới

| Hành động của tác nhân          | Phản ứng của hệ thống                                        |
| ------------------------------- | ------------------------------------------------------------ |
| 1. Owner mở màn hình Tạo dự án. | 2. Owner nhập thông tin dự án, chọn danh mục, upload media.  |
| -                               | 3. Hệ thống kiểm tra điều kiện dữ liệu và KYC.               |
| -                               | 4. Hệ thống tạo dự án và hiển thị trong danh sách của owner. |

Luồng thay thế:

- 1. Chưa KYC hoặc thiếu dữ liệu bắt buộc -> từ chối tạo dự án.

Các yêu cầu cụ thể:

- API: POST /api/projects, GET /api/project-categories
- Frontend: client/app/(main)/projects/create/page.tsx, client/components/dashboard/views/MyProjects.tsx

Điều kiện trước:

- Owner đã đăng nhập, đáp ứng điều kiện KYC.

Điều kiện sau:

- Dự án mới được tạo thành công.

---

### 2.2.21. Use case Cập nhật thông tin dự án

Mục đích: Cho phép Owner chỉnh sửa nội dung dự án khi dự án còn ở trạng thái cho phép.

Tác nhân, mô tả chung:

- Tác nhân: Owner.
- Mô tả chung: Owner mở trang chỉnh sửa và cập nhật thông tin dự án.

Luồng sự kiện chính
Bảng 21. Luồng sự kiện chính use case Cập nhật thông tin dự án

| Hành động của tác nhân        | Phản ứng của hệ thống                               |
| ----------------------------- | --------------------------------------------------- |
| 1. Owner mở trang Edit dự án. | 2. Owner chỉnh sửa mô tả, media, danh mục, tham số. |
| -                             | 3. Hệ thống gửi yêu cầu cập nhật lên backend.       |
| -                             | 4. Hệ thống lưu thay đổi và trả dữ liệu mới.        |

Luồng thay thế:

- 1. Owner không có quyền hoặc dự án không cho phép sửa -> từ chối cập nhật.

Các yêu cầu cụ thể:

- API: PUT /api/projects/:id
- Frontend: client/app/(main)/dashboard/my-projects/[id]/edit/page.tsx

Điều kiện trước:

- Owner đã đăng nhập và là chủ dự án.

Điều kiện sau:

- Dữ liệu dự án được cập nhật thành công.

---

### 2.2.22. Use case Quản lý milestones của dự án

Mục đích: Cho phép Owner quản lý tiến độ milestone và thao tác vận hành liên quan.

Tác nhân, mô tả chung:

- Tác nhân: Owner.
- Mô tả chung: Owner cập nhật milestones, upload bằng chứng, bắt đầu voting và phản hồi thảo luận.

Luồng sự kiện chính
Bảng 22. Luồng sự kiện chính use case Quản lý milestones của dự án

| Hành động của tác nhân                         | Phản ứng của hệ thống                              |
| ---------------------------------------------- | -------------------------------------------------- |
| 1. Owner mở trang quản lý milestone của dự án. | 2. Owner cập nhật danh sách milestone khi cần.     |
| -                                              | 3. Owner tải bằng chứng cho milestone đến hạn.     |
| -                                              | 4. Owner bắt đầu voting và gửi phản hồi thảo luận. |

Luồng thay thế:

- 1. Milestone sai trạng thái hoặc owner không đủ quyền -> từ chối thao tác.

Các yêu cầu cụ thể:

- API: PUT /api/projects/:id/milestones, PATCH /api/projects/:id/milestones/:mId/proof, POST /api/projects/milestones/:mId/start-voting, POST /api/projects/milestones/:mId/response, GET /api/projects/milestones/:mId/discussions
- Frontend: client/app/(main)/dashboard/my-projects/[id]/page.tsx, client/components/client/ProjectMilestones.tsx, client/components/dashboard/views/MyProjects.tsx

Điều kiện trước:

- Owner đã đăng nhập và là chủ dự án.

Điều kiện sau:

- Tiến độ milestone được cập nhật theo thao tác mới nhất.

---

### 2.2.23. Use case Dừng huy động vốn sớm

Mục đích: Cho phép Owner kết thúc sớm đợt huy động của dự án.

Tác nhân, mô tả chung:

- Tác nhân: Owner.
- Mô tả chung: Owner chọn thao tác dừng huy động từ danh sách dự án của mình.

Luồng sự kiện chính
Bảng 23. Luồng sự kiện chính use case Dừng huy động vốn sớm

| Hành động của tác nhân                            | Phản ứng của hệ thống                                              |
| ------------------------------------------------- | ------------------------------------------------------------------ |
| 1. Owner chọn dự án đang funding trong dashboard. | 2. Owner xác nhận thao tác dừng huy động.                          |
| -                                                 | 3. Hệ thống cập nhật trạng thái dự án và kích hoạt bước tiếp theo. |
| -                                                 | 4. Giao diện hiển thị trạng thái mới của dự án.                    |

Luồng thay thế:

- 1. Dự án không còn ở trạng thái funding hoặc không thuộc owner -> từ chối thao tác.

Các yêu cầu cụ thể:

- API: PUT /api/projects/:id/stop-funding
- Frontend: client/components/dashboard/views/MyProjects.tsx, client/app/(main)/dashboard/my-projects/[id]/edit/page.tsx

Điều kiện trước:

- Owner đã đăng nhập và là chủ dự án.

Điều kiện sau:

- Dự án dừng huy động thành công.

---

### 2.2.24. Use case Theo dõi danh sách dự án của tôi

Mục đích: Giúp Owner theo dõi tổng quan tiến độ và trạng thái tất cả dự án của mình.

Tác nhân, mô tả chung:

- Tác nhân: Owner.
- Mô tả chung: Owner mở màn hình My Projects để xem danh sách dự án đang sở hữu.

Luồng sự kiện chính
Bảng 24. Luồng sự kiện chính use case Theo dõi danh sách dự án của tôi

| Hành động của tác nhân            | Phản ứng của hệ thống                                            |
| --------------------------------- | ---------------------------------------------------------------- |
| 1. Owner mở màn hình My Projects. | 2. Hệ thống tải danh sách dự án thuộc owner.                     |
| -                                 | 3. Hệ thống hiển thị tiến độ vốn, trạng thái và số nhà đầu tư.   |
| -                                 | 4. Owner điều hướng đến các thao tác sửa/milestone/stop funding. |

Luồng thay thế:

- 1. Chưa có dự án -> hiển thị trạng thái rỗng và hướng dẫn tạo dự án.

Các yêu cầu cụ thể:

- API: GET /api/projects/owner
- Frontend: client/components/dashboard/views/MyProjects.tsx, client/app/(main)/dashboard/my-projects/[id]/page.tsx

Điều kiện trước:

- Owner đã đăng nhập.

Điều kiện sau:

- Owner theo dõi được toàn bộ danh sách dự án của mình.

---

### 2.2.25. Use case Thanh toán nợ dự án (repay)

Mục đích: Cho phép Owner thanh toán nợ dự án theo tổng nợ hoặc theo kỳ hạn milestone.

Tác nhân, mô tả chung:

- Tác nhân: Owner.
- Mô tả chung: Owner mở màn hình Repayment để xem lịch trả nợ và thực hiện thanh toán.

Luồng sự kiện chính
Bảng 25. Luồng sự kiện chính use case Thanh toán nợ dự án (repay)

| Hành động của tác nhân          | Phản ứng của hệ thống                                    |
| ------------------------------- | -------------------------------------------------------- |
| 1. Owner mở màn hình Repayment. | 2. Hệ thống tải debt projects và repayment schedules.    |
| -                               | 3. Owner chọn thanh toán tổng nợ hoặc theo kỳ hạn.       |
| -                               | 4. Hệ thống trừ ví, phân bổ tiền và cập nhật nợ còn lại. |

Luồng thay thế:

- 1. Số dư không đủ hoặc schedule không hợp lệ -> từ chối thanh toán.

Các yêu cầu cụ thể:

- API: GET /api/wallets/repayments/schedules, POST /api/wallets/repay, POST /api/wallets/repay-milestone-interest, GET /api/projects/owner?status=completed
- Frontend: client/components/dashboard/views/RepaymentView.tsx

Điều kiện trước:

- Owner đã đăng nhập, có dự án còn nợ.

Điều kiện sau:

- Nợ dự án giảm theo khoản thanh toán đã thực hiện.

---

### 2.2.26. Use case Xem danh sách blog công khai

Mục đích: Cho phép người dùng xem danh sách bài viết blog đã xuất bản để theo dõi tin tức và nội dung phân tích.

Tác nhân, mô tả chung:

- Tác nhân: Investor, Owner, Guest.
- Mô tả chung: Người dùng mở trang blog và duyệt danh sách bài viết theo từ khóa.

Luồng sự kiện chính
Bảng 26. Luồng sự kiện chính use case Xem danh sách blog công khai

| Hành động của tác nhân       | Phản ứng của hệ thống                           |
| ---------------------------- | ----------------------------------------------- |
| 1. Người dùng mở trang Blog. | 2. Hệ thống tải danh sách bài viết đã xuất bản. |
| -                            | 3. Người dùng nhập từ khóa tìm kiếm nếu cần.    |
| -                            | 4. Giao diện hiển thị các bài viết phù hợp.     |

Luồng thay thế:

- 1. Không có bài viết hoặc từ khóa không khớp -> hiển thị trạng thái rỗng.

Các yêu cầu cụ thể:

- API: GET /api/blogs
- Frontend: client/app/(main)/blogs/page.tsx

Điều kiện trước:

- Không bắt buộc đăng nhập.

Điều kiện sau:

- Người dùng xem được danh sách bài blog công khai.

---

### 2.2.27. Use case Xem chi tiết bài blog

Mục đích: Cho phép người dùng đọc đầy đủ nội dung của một bài blog theo slug.

Tác nhân, mô tả chung:

- Tác nhân: Investor, Owner, Guest.
- Mô tả chung: Người dùng chọn một bài viết từ danh sách blog và xem nội dung chi tiết.

Luồng sự kiện chính
Bảng 27. Luồng sự kiện chính use case Xem chi tiết bài blog

| Hành động của tác nhân           | Phản ứng của hệ thống                                   |
| -------------------------------- | ------------------------------------------------------- |
| 1. Người dùng chọn một bài blog. | 2. Hệ thống tải bài viết theo slug.                     |
| -                                | 3. Hệ thống hiển thị tiêu đề, ảnh đại diện và nội dung. |
| -                                | 4. Người dùng đọc nội dung bài viết.                    |

Luồng thay thế:

- 1. Blog không tồn tại hoặc chưa xuất bản -> hiển thị trạng thái không tìm thấy.

Các yêu cầu cụ thể:

- API: GET /api/blogs/:slug
- Frontend: client/app/(main)/blogs/[slug]/page.tsx

Điều kiện trước:

- Không bắt buộc đăng nhập.

Điều kiện sau:

- Người dùng xem được nội dung chi tiết của bài viết.

---

### 2.2.28. Use case Quản lý bài viết blog

Mục đích: Cho phép Admin tạo, cập nhật, tìm kiếm và xóa bài viết blog trong khu vực quản trị.

Tác nhân, mô tả chung:

- Tác nhân: Admin.
- Mô tả chung: Admin mở trang quản lý blog, soạn nội dung và xuất bản bài viết.

Luồng sự kiện chính
Bảng 28. Luồng sự kiện chính use case Quản lý bài viết blog

| Hành động của tác nhân          | Phản ứng của hệ thống                             |
| ------------------------------- | ------------------------------------------------- |
| 1. Admin mở trang quản lý blog. | 2. Hệ thống tải danh sách bài viết và trạng thái. |
| -                               | 3. Admin tạo mới, chỉnh sửa hoặc xóa bài viết.    |
| -                               | 4. Hệ thống lưu thay đổi và cập nhật danh sách.   |

Luồng thay thế:

- 1. Dữ liệu không hợp lệ hoặc không có quyền admin -> từ chối thao tác.

Các yêu cầu cụ thể:

- API: GET /api/admin/blogs, GET /api/admin/blogs/:id, POST /api/admin/blogs, PATCH /api/admin/blogs/:id, DELETE /api/admin/blogs/:id
- Frontend: client/components/dashboard/views/admin/BlogManagement.tsx

Điều kiện trước:

- Admin đã đăng nhập.

Điều kiện sau:

- Bài viết blog được tạo, cập nhật hoặc xóa thành công.

## Sequence Diagrams (As Code)

### Diagram UI-001: Đăng ký tài khoản

```mermaid
sequenceDiagram
    autonumber
    participant U as Người dùng (Frontend)
    participant S as Server (NestJS)
    participant D as Database (TiDB)

    U->>S: Gửi thông tin đăng ký (email, password,...)
    S->>D: Kiểm tra Email đã tồn tại chưa?
    D-->>S: Kết quả (Chưa tồn tại)
    
    Note over S: Server thực hiện Hash mật khẩu (bcrypt)
    
    S->>D: Lưu thông tin người dùng mới vào DB
    D-->>S: Xác nhận lưu thành công (ID người dùng)
    
    S-->>U: Trả về mã lỗi 201 & Thông báo thành công
```

### Diagram UI-002: Đăng nhập hệ thống


sequenceDiagram
    autonumber
    participant U as Người dùng (Frontend)
    participant S as Server (NestJS)
    participant D as Database (TiDB)

    U->>S: Nhập Email & Mật khẩu
    S->>D: Truy vấn User theo Email
    alt Email không tồn tại
        D-->>S: Trả về Null/Empty
        S-->>U: Trả về lỗi 401 (Unauthorized)
    else Email hợp lệ
        D-->>S: Trả về thông tin User (đã hash password)
        
        Note over S: So khớp mật khẩu (bcrypt.compare)
        
        alt Mật khẩu sai
            S-->>U: Trả về lỗi 401 (Mật khẩu không khớp)
        else Mật khẩu đúng
            Note over S: Tạo JWT Token (Sign payload)
            S-->>U: Trả về 200 OK (JWT Token & Profile)
        end
    end



```mermaid
sequenceDiagram
    autonumber
    participant U as Người dùng (Frontend)
    participant S as Server (NestJS)
    participant D as Database (TiDB)

    U->>S: Gửi Email & Mật khẩu
    S->>D: Truy vấn thông tin người dùng theo Email
    D-->>S: Trả về dữ liệu người dùng (Hashed Password)
    
    Note over S: Server thực hiện so khớp mật khẩu (bcrypt.compare)
    Note over S: Server khởi tạo JWT Token (JwtService)
    
    S-->>U: Trả về JWT Token & Thông tin Profile (Status 200)
```

### Diagram UI-003: Xem hồ sơ cá nhân

```mermaid
sequenceDiagram
    autonumber
    participant U as Người dùng (Frontend)
    participant S as Server (NestJS)
    participant D as Database (TiDB)

    U->>S: Gửi Yêu cầu lấy Profile (kèm JWT Token trong Header)
    
    Note over S: Server xác thực (Verify) tính hợp lệ của Token
    
    S->>D: Truy vấn chi tiết hồ sơ & Số dư ví theo UserID
    D-->>S: Trả về dữ liệu hồ sơ (Email, Name, Balance,...)
    
    S-->>U: Trả về thông tin Profile & Hiển thị trên UI (Status 200)
```

### Diagram UI-004: Cập nhật hồ sơ

```mermaid
sequenceDiagram
    autonumber
    participant U as Người dùng (Frontend)
    participant S as Server (NestJS)
    participant D as Database (TiDB)

    U->>S: Gửi thông tin cần cập nhật (Tên/Avatar + JWT Token)
    
    Note over S: Server xác thực Token & Kiểm tra tính hợp lệ của dữ liệu
    
    S->>D: Thực hiện cập nhật bản ghi người dùng (Update query)
    D-->>S: Xác nhận cập nhật thành công
    
    S-->>U: Trả về trạng thái 200 & Thông báo cập nhật hoàn tất
```

### Diagram UI-005: Đổi mật khẩu

```mermaid
sequenceDiagram
    autonumber
    participant U as Người dùng (Frontend)
    participant S as Server (NestJS)
    participant D as Database (TiDB)

    U->>S: Gửi Mật khẩu cũ & Mật khẩu mới (kèm JWT Token)
    
    Note over S: Server xác thực tính hợp lệ của Token
    
    S->>D: Truy vấn mật khẩu hiện tại của người dùng
    D-->>S: Trả về Mật khẩu cũ đang lưu trữ (Hashed)
    
    Note over S: Server so khớp Mật khẩu cũ với DB (bcrypt.compare)
    Note over S: Server thực hiện Hash mật khẩu mới (bcrypt.hash)
    
    S->>D: Cập nhật mật khẩu mới (Hashed) vào Database
    D-->>S: Xác nhận cập nhật thành công
    
    S-->>U: Trả về trạng thái 200 & Thông báo đổi mật khẩu thành công
```

### Diagram UI-006: Cài đặt thông báo

```mermaid
sequenceDiagram
    autonumber
    participant U as Người dùng (Frontend)
    participant S as Server (NestJS)
    participant D as Database (TiDB)

    U->>S: Thay đổi tùy chọn sở thích (JSON)
    Note over S: Server xác thực Token & Validate cấu hình
    S->>D: Lưu notification_settings mới vào bản ghi User
    D-->>S: Xác nhận cập nhật thành công
    S-->>U: Cập nhật thành công & Refresh UI
```

### Diagram UI-007: Nộp KYC

```mermaid
sequenceDiagram
    autonumber
    participant U as Người dùng (Frontend)
    participant S as Server (NestJS)
    participant D as Database (TiDB)

    U->>S: Tải ảnh CCCD & Thông tin định danh
    Note over S: Server kiểm tra định dạng ảnh & Dữ liệu đầu vào
    S->>D: Lưu hồ sơ KYC với trạng thái PENDING
    D-->>S: Lưu thành công (ID KYC)
    S-->>U: Thông báo hồ sơ đang chờ Admin phê duyệt
```

### Diagram UI-008: Nạp tiền (VNPAY)

```mermaid
sequenceDiagram
    autonumber
    participant U as Người dùng (Frontend)
    participant S as Server (NestJS)
    participant V as Cổng VNPAY
    participant D as Database (TiDB)

    U->>S: Yêu cầu nạp số tiền X
    S->>D: Tạo Transaction nạp tiền (Status: Pending)
    Note over S: Server khởi tạo chuỗi Hash & Build URL VNPAY
    S-->>U: Trả về URL thanh toán & Chuyển hướng
    V-->>S: Gửi Webhook/IPN thông báo kết quả thanh toán
    Note over S: Server kiểm tra chữ ký (Checksum) & Số tiền
    S->>D: Cập nhật Balance người dùng & Success Transaction
    S-->>U: Thông báo nạp tiền thành công qua Socket/UI
```

### Diagram UI-009: Rút tiền

```mermaid
sequenceDiagram
    autonumber
    participant U as Người dùng (Frontend)
    participant S as Server (NestJS)
    participant D as Database (TiDB)

    U->>S: Nhập số tiền & Thông tin ngân hàng nhận
    Note over S: Server kiểm tra số dư khả dụng (Balance >= X)
    S->>D: Khấu trừ số dư & Lưu yêu cầu rút (Status: Pending Admin)
    D-->>S: Cập nhật thành công
    S-->>U: Thông báo yêu cầu rút tiền đã được gửi tới Admin
```

### Diagram UI-010: Xem lịch sử giao dịch

```mermaid
sequenceDiagram
    autonumber
    participant U as Người dùng (Frontend)
    participant S as Server (NestJS)
    participant D as Database (TiDB)

    U->>S: Truy cập mục Lịch sử tài chính
    S->>D: Truy vấn danh sách Transactions theo UserID
    D-->>S: Trả về mảng dữ liệu giao dịch
    Note over S: Server định dạng tiền tệ & Phân loại giao dịch
    S-->>U: Hiển thị bảng lịch sử giao dịch (Pagination)
```

### Diagram UI-011: Quản lý thông báo

```mermaid
sequenceDiagram
    autonumber
    participant U as Người dùng (Frontend)
    participant S as Server (NestJS)
    participant D as Database (TiDB)

    U->>S: Nhấn "Đánh dấu đã đọc" (ID Notification)
    S->>D: Cập nhật is_read = true cho Notification
    D-->>S: Cập nhật thành công
    S-->>U: Cập nhật Badge số lượng thông báo chưa đọc trên giao diện
```

### Diagram UI-012: AI Chatbox

```mermaid
sequenceDiagram
    autonumber
    participant U as Người dùng (Frontend)
    participant S as Server (NestJS)
    participant AI as Google Gemini API
    participant D as Database (TiDB)

    U->>S: Gửi câu hỏi về dự án X
    S->>D: Lấy thông tin chi tiết dự án (Context)
    Note over S: Server xây dựng Prompt kèm ngữ cảnh dự án
    S->>AI: Gửi Context & Câu hỏi của User
    AI-->>S: Trả về nội dung phản hồi (Text/Markdown)
    S->>D: Lưu câu hỏi & câu trả lời vào chat_history
    S-->>U: Hiển thị câu trả lời của AI trên Box Chat
```

### Diagram UI-013: Thư viện Media

```mermaid
sequenceDiagram
    autonumber
    participant U as Người dùng (Frontend)
    participant S as Server (NestJS)
    participant St as Cloudinary Storage
    participant D as Database (TiDB)

    U->>S: Upload hình ảnh/video mới
    Note over S: Server nén ảnh & Xử lý định dạng
    S->>St: Đẩy file vật lý lên Cloud
    St-->>S: Trả về URL & PublicID
    S->>D: Lưu thông tin Metadata vào bảng user_media
    S-->>U: Hiển thị file vừa upload trong Thư viện Media
```

### Diagram UI-014: Tìm kiếm dự án

```mermaid
sequenceDiagram
    autonumber
    participant U as Người dùng (Frontend)
    participant S as Server (NestJS)
    participant D as Database (TiDB)

    U->>S: Nhập từ khóa/Chọn Category lọc
    Note over S: Server chuẩn hóa chuỗi tìm kiếm (Sanitize)
    S->>D: Query bảng Projects (LIKE/Full-text search)
    D-->>S: Trả về danh sách dự án phù hợp
    S-->>U: Render danh sách Project Cards
```

### Diagram UI-015: Xem chi tiết dự án

```mermaid
sequenceDiagram
    autonumber
    participant U as Người dùng (Frontend)
    participant S as Server (NestJS)
    participant D as Database (TiDB)

    U->>S: Nhấn xem chi tiết dự án X (Slug)
    S->>D: Lấy Project, Media, Milestones & Owner Info
    D-->>S: Trả về JSON dữ liệu phức hợp
    Note over S: Server tính toán tỷ lệ huy động & Thời gian còn lại
    S-->>U: Hiển thị Project Detail Page
```

### Diagram UI-016: Đầu tư dự án (Sequence)

```mermaid
sequenceDiagram
    autonumber
    participant I as Nhà đầu tư (Investor)
    participant S as Server (NestJS)
    participant D as Database (TiDB)

    I->>S: Gửi yêu cầu đầu tư số tiền X
    Note over S: Kiểm tra ví Investor & Trạng thái dự án
    S->>D: Khởi tạo Transaction & Dùng Pessimistic Lock (Lock Project)
    Note over S: Tính toán lãi suất & Khởi tạo Payment Schedules
    S->>D: Trừ ví Investor, cộng tiền Escrow & Tạo bản ghi Investment
    D-->>S: Hoàn tất các tác vụ nguyên tử (Atomicity)
    S-->>I: Thông báo đầu tư thành công!
```

### Diagram UI-017: Theo dõi Portfolio

```mermaid
sequenceDiagram
    autonumber
    participant I as Nhà đầu tư (Investor)
    participant S as Server (NestJS)
    participant D as Database (TiDB)

    I->>S: Xem Dashboard "Đầu tư của tôi"
    S->>D: Tổng hợp số dư, tổng lãi nhận & Lịch thu nợ sắp tới
    D-->>S: Dữ liệu thống kê thô
    Note over S: Server tính toán ROI & Tỷ lệ tăng trưởng
    S-->>I: Hiển thị biểu đồ & Dashboard phân tích tài chính
```

### Diagram UI-018: Tạo khiếu nại

```mermaid
sequenceDiagram
    autonumber
    participant I as Nhà đầu tư (Investor)
    participant S as Server (NestJS)
    participant D as Database (TiDB)

    I->>S: Gửi lý do khiếu nại & Minh chứng (Evidence URL)
    Note over S: Xác thực quyền sở hữu khoản đầu tư trong dự án
    S->>D: Tạo bản ghi project_disputes (Status: Open)
    D-->>S: Thành công
    S-->>I: Thông báo hệ thống đã tiếp nhận khiếu nại
```

### Diagram UI-019: Voting Milestone

```mermaid
sequenceDiagram
    autonumber
    participant I as Nhà đầu tư (Investor)
    participant S as Server (NestJS)
    participant D as Database (TiDB)

    I->>S: Gửi phiếu biểu quyết (Đồng ý/Từ chối) cho Milestone M
    Note over S: Kiểm tra xem I có quyền Vote & Đã Vote chưa
    S->>D: Lưu bản ghi milestone_votes & Cập nhật tỷ lệ Approve
    Note over S: Nếu Approve > 50%, chuyển trạng thái Milestone
    S-->>I: Cập nhật trạng thái biểu quyết thành công
```

### Diagram UI-020: Tạo dự án mới

```mermaid
sequenceDiagram
    autonumber
    participant O as Chủ dự án (Owner)
    participant S as Server (NestJS)
    participant D as Database (TiDB)

    O->>S: Gửi thông tin dự án + Danh sách Milestones
    Note over S: Kiểm tra logic (Tổng % Milestone = 100%)
    S->>D: Lưu Project & Milestones (Status: Pending Review)
    D-->>S: Thành công
    S-->>O: Thông báo dự án đang chờ Admin xét duyệt
```

### Diagram UI-021: Cập nhật dự án

```mermaid
sequenceDiagram
    autonumber
    participant O as Chủ dự án (Owner)
    participant S as Server (NestJS)
    participant D as Database (TiDB)

    O->>S: Chỉnh sửa nội dung/Hình ảnh dự án
    Note over S: Kiểm tra quyền sở hữu (OwnerID match)
    S->>D: Cập nhật các trường thông tin cho phép
    S-->>O: Thông báo cập nhật dự án thành công
```

### Diagram UI-022: Quản lý Milestones

```mermaid
sequenceDiagram
    autonumber
    participant O as Chủ dự án (Owner)
    participant S as Server (NestJS)
    participant D as Database (TiDB)

    O->>S: Upload minh chứng hoàn thành giai đoạn (PDF/Ảnh)
    Note over S: Kiểm tra Milestone hiện tại có đang chờ nộp không
    S->>D: Lưu Evidence URL & Chuyển trạng thái sang VOTING
    S-->>O: Milestone đã sẵn sàng để Nhà đầu tư biểu quyết
```

### Diagram UI-023: Dừng huy động sớm

```mermaid
sequenceDiagram
    autonumber
    participant O as Chủ dự án (Owner)
    participant S as Server (NestJS)
    participant D as Database (TiDB)

    O->>S: Yêu cầu kết thúc đợt gọi vốn trước thời hạn
    Note over S: Kiểm tra số vốn tối thiểu đã đạt chưa
    S->>D: Đóng trạng thái FUNDING -> Chuyển sang ACTIVE
    S-->>O: Thông báo dự án bắt đầu giai đoạn triển khai
```

### Diagram UI-024: Danh sách dự án của tôi

```mermaid
sequenceDiagram
    autonumber
    participant O as Chủ dự án (Owner)
    participant S as Server (NestJS)
    participant D as Database (TiDB)

    O->>S: Truy cập mục "Dự án đã đăng"
    S->>D: Truy vấn danh sách Projects theo OwnerID
    D-->>S: Trả về danh sách Projects
    Note over S: Map số lượng đầu tư & Trạng thái hiện tại
    S-->>O: Hiển thị danh sách dự án cho Owner
```

### Diagram UI-025: repay (Thanh toán)

```mermaid
sequenceDiagram
    autonumber
    participant O as Chủ dự án (Owner)
    participant S as Server (NestJS)
    participant D as Database (TiDB)

    O->>S: Chọn kỳ hạn thanh toán (Repay)
    Note over S: Kiểm tra số dư ví O có đủ trả Nợ + Lãi không
    S->>D: Khởi tạo Transaction Repayment (Atomic)
    Note over S: Phân bổ tiền (Gốc + Lãi) về ví từng Investor theo Lịch trả nợ
    S->>D: Trừ ví O, Cộng ví Investors, Cập nhật Payment Schedule = Paid
    D-->>S: Giao dịch tài chính hoàn tất
    S-->>O: Thông báo đã trả nợ kỳ hạn thành công
```

### Diagram UI-026: Xem danh sách blog công khai

```mermaid
sequenceDiagram
    autonumber
    participant U as Người dùng (Investor/Owner/Guest)
    participant S as Server (NestJS)
    participant D as Database (TiDB)

    U->>S: Mở trang Blog hoặc nhập từ khóa tìm kiếm
    S->>D: Truy vấn danh sách blog đã xuất bản theo page/search
    D-->>S: Trả về danh sách bài viết và metadata phân trang
    Note over S: Chỉ trả về bài viết status = published
    S-->>U: Hiển thị danh sách blog công khai
```

### Diagram UI-027: Xem chi tiết bài blog

```mermaid
sequenceDiagram
    autonumber
    participant U as Người dùng (Investor/Owner/Guest)
    participant S as Server (NestJS)
    participant D as Database (TiDB)

    U->>S: Chọn bài viết và truy cập /blogs/:slug
    S->>D: Tìm bài blog theo slug và trạng thái published
    D-->>S: Trả về tiêu đề, thumbnail, category và content
    Note over S: Nếu không tồn tại, trả về lỗi không tìm thấy
    S-->>U: Hiển thị nội dung chi tiết bài blog
```

### Diagram UI-028: Quản lý bài viết blog

```mermaid
sequenceDiagram
    autonumber
    participant A as Admin
    participant S as Server (NestJS)
    participant D as Database (TiDB)

    A->>S: Mở trang quản lý Blog trong Admin Dashboard
    S->>D: Truy vấn danh sách bài viết theo page/search
    D-->>S: Trả về danh sách bài viết và trạng thái
    A->>S: Tạo mới, cập nhật hoặc xóa bài viết
    Note over S: Xác thực JWT và kiểm tra quyền ADMIN
    S->>D: Lưu thay đổi vào bảng blogs
    D-->>S: Cập nhật thành công
    S-->>A: Làm mới danh sách và hiển thị thông báo kết quả
```

## PlantUML Activity Diagrams (PlantText)

### PlantUML UI-001: Đăng ký tài khoản

```plantuml
@startuml
skinparam shadowing false
title UI-001 - Đăng ký tài khoản
|Người dùng|
start
:Mở màn hình đăng ký;
:Nhập thông tin tài khoản;
:Gửi yêu cầu đăng ký;
|Hệ thống|
:Kiểm tra dữ liệu và email;
if (Hợp lệ?) then (Có)
  :Hash mật khẩu;
  :Tạo tài khoản mới;
  |Người dùng|
  :Nhận thông báo đăng ký thành công;
  stop
else (Không)
  |Người dùng|
  :Nhận lỗi và nhập lại thông tin;
  stop
endif
@enduml
```

### PlantUML UI-002: Đăng nhập hệ thống

```plantuml
@startuml
skinparam shadowing false
title UI-002 - Đăng nhập hệ thống
|Người dùng|
start
:Yêu cầu đăng nhập vào hệ thống;
:Nhập email và mật khẩu;
|Hệ thống|
:Xác thực thông tin đăng nhập;
if (Hợp lệ?) then (Có)
  :Cấp token và tải hồ sơ người dùng;
  |Người dùng|
  :Truy cập dashboard tương ứng;
  stop
else (Không)
  |Người dùng|
  :Nhận lỗi và đăng nhập lại;
  stop
endif
@enduml
```

### PlantUML UI-003: Xem hồ sơ cá nhân và thông tin tài khoản

```plantuml
@startuml
skinparam shadowing false
title UI-003 - Xem hồ sơ cá nhân
|Người dùng|
start
:Truy cập dashboard hoặc trang profile;
|Hệ thống|
:Kiểm tra đăng nhập;
if (Đã đăng nhập?) then (Có)
  :Tải hồ sơ, vai trò và số dư ví;
  |Người dùng|
  :Xem thông tin tài khoản;
  stop
else (Không)
  |Người dùng|
  :Được yêu cầu đăng nhập lại;
  stop
endif
@enduml
```

### PlantUML UI-004: Cập nhật hồ sơ và ảnh đại diện

```plantuml
@startuml
skinparam shadowing false
title UI-004 - Cập nhật hồ sơ và ảnh đại diện
|Người dùng|
start
:Mở màn hình cài đặt;
:Chỉnh sửa hồ sơ hoặc chọn ảnh đại diện;
:Gửi yêu cầu cập nhật;
|Hệ thống|
:Kiểm tra dữ liệu và file ảnh;
if (Hợp lệ?) then (Có)
  :Cập nhật hồ sơ người dùng;
  |Người dùng|
  :Nhận kết quả cập nhật;
  stop
else (Không)
  |Người dùng|
  :Nhận lỗi và sửa lại;
  stop
endif
@enduml
```

### PlantUML UI-005: Đổi mật khẩu tài khoản

```plantuml
@startuml
skinparam shadowing false
title UI-005 - Đổi mật khẩu tài khoản
|Người dùng|
start
:Mở chức năng đổi mật khẩu;
:Nhập mật khẩu cũ và mật khẩu mới;
|Hệ thống|
:Xác thực mật khẩu cũ;
:Kiểm tra điều kiện mật khẩu mới;
if (Hợp lệ?) then (Có)
  :Hash và lưu mật khẩu mới;
  |Người dùng|
  :Nhận thông báo đổi mật khẩu thành công;
  stop
else (Không)
  |Người dùng|
  :Nhận lỗi và nhập lại;
  stop
endif
@enduml
```

### PlantUML UI-006: Cài đặt thông báo và sở thích danh mục

```plantuml
@startuml
skinparam shadowing false
title UI-006 - Cài đặt thông báo và sở thích danh mục
|Người dùng|
start
:Mở phần thông báo và sở thích;
:Thay đổi tùy chọn cá nhân;
|Hệ thống|
:Kiểm tra dữ liệu tùy chọn;
if (Hợp lệ?) then (Có)
  :Lưu cấu hình người dùng;
  |Người dùng|
  :Thấy trạng thái mới được đồng bộ;
  stop
else (Không)
  |Người dùng|
  :Nhận lỗi và sửa lại;
  stop
endif
@enduml
```

### PlantUML UI-007: Nộp KYC và theo dõi trạng thái xác minh

```plantuml
@startuml
skinparam shadowing false
title UI-007 - Nộp KYC và theo dõi trạng thái
|Người dùng|
start
:Mở màn hình KYC;
:Nhập thông tin và tải ảnh giấy tờ;
:Gửi hồ sơ xác minh;
|Hệ thống|
:Kiểm tra dữ liệu KYC;
if (Hợp lệ?) then (Có)
  :Lưu hồ sơ với trạng thái chờ duyệt;
  |Người dùng|
  :Theo dõi trạng thái xác minh;
  stop
else (Không)
  |Người dùng|
  :Nhận lỗi và bổ sung hồ sơ;
  stop
endif
@enduml
```

### PlantUML UI-008: Nạp tiền vào ví

```plantuml
@startuml
skinparam shadowing false
title UI-008 - Nạp tiền vào ví
|Người dùng|
start
:Mở màn hình nạp tiền;
:Nhập số tiền và chọn VNPAY/MoMo;
:Xác nhận thanh toán;
|Hệ thống|
:Tạo giao dịch nạp tiền;
:Chuyển đến cổng thanh toán;
:Nhận kết quả thanh toán;
if (Thanh toán thành công?) then (Có)
  :Cộng số dư ví và cập nhật giao dịch;
  |Người dùng|
  :Nhận thông báo nạp tiền thành công;
  stop
else (Không)
  :Cập nhật giao dịch thất bại;
  |Người dùng|
  :Nhận thông báo thanh toán thất bại;
  stop
endif
@enduml
```

### PlantUML UI-009: Rút tiền khỏi ví

```plantuml
@startuml
skinparam shadowing false
title UI-009 - Rút tiền khỏi ví
|Người dùng|
start
:Mở màn hình rút tiền;
:Nhập số tiền và thông tin ngân hàng;
:Gửi yêu cầu rút tiền;
|Hệ thống|
:Kiểm tra số dư khả dụng;
if (Đủ số dư?) then (Có)
  :Tạo yêu cầu rút tiền chờ duyệt;
  |Người dùng|
  :Nhận thông báo yêu cầu đã được gửi;
  stop
else (Không)
  |Người dùng|
  :Nhận lỗi số dư không đủ;
  stop
endif
@enduml
```

### PlantUML UI-010: Xem lịch sử giao dịch cá nhân

```plantuml
@startuml
skinparam shadowing false
title UI-010 - Xem lịch sử giao dịch cá nhân
|Người dùng|
start
:Mở mục lịch sử giao dịch;
:Chọn bộ lọc nếu cần;
|Hệ thống|
:Tải danh sách giao dịch cá nhân;
if (Có dữ liệu?) then (Có)
  |Người dùng|
  :Xem bảng lịch sử giao dịch;
  stop
else (Không)
  |Người dùng|
  :Xem trạng thái không có giao dịch;
  stop
endif
@enduml
```

### PlantUML UI-011: Quản lý thông báo trong ứng dụng

```plantuml
@startuml
skinparam shadowing false
title UI-011 - Quản lý thông báo trong ứng dụng
|Người dùng|
start
:Mở danh sách thông báo;
|Hệ thống|
:Tải thông báo và số lượng chưa đọc;
|Người dùng|
:Chọn đọc hoặc đánh dấu đã đọc;
|Hệ thống|
:Cập nhật trạng thái thông báo;
|Người dùng|
:Nhận danh sách thông báo mới;
stop
@enduml
```

### PlantUML UI-012: Sử dụng AI Chatbox hỗ trợ phân tích

```plantuml
@startuml
skinparam shadowing false
title UI-012 - Sử dụng AI Chatbox
|Người dùng|
start
:Mở AI Chatbox;
:Nhập câu hỏi cần hỗ trợ;
|Hệ thống|
:Lấy dữ liệu ngữ cảnh;
:Gửi prompt đến AI service;
if (Có phản hồi?) then (Có)
  :Lưu lịch sử chat;
  |Người dùng|
  :Nhận câu trả lời từ AI;
  stop
else (Không)
  |Người dùng|
  :Nhận thông báo không thể xử lý;
  stop
endif
@enduml
```

### PlantUML UI-013: Quản lý thư viện media trên giao diện

```plantuml
@startuml
skinparam shadowing false
title UI-013 - Quản lý thư viện media
|Người dùng|
start
:Mở thư viện media;
:Chọn upload hoặc xóa file;
|Hệ thống|
:Kiểm tra thao tác và dữ liệu media;
if (Hợp lệ?) then (Có)
  :Upload/xóa file và cập nhật metadata;
  |Người dùng|
  :Nhận danh sách media mới;
  stop
else (Không)
  |Người dùng|
  :Nhận lỗi thao tác media;
  stop
endif
@enduml
```

### PlantUML UI-014: Tìm kiếm và xem danh sách dự án

```plantuml
@startuml
skinparam shadowing false
title UI-014 - Tìm kiếm và xem danh sách dự án
|Người dùng|
start
:Mở trang danh sách dự án;
:Nhập từ khóa hoặc chọn danh mục;
|Hệ thống|
:Truy vấn dự án theo điều kiện lọc;
if (Có kết quả?) then (Có)
  |Người dùng|
  :Xem danh sách dự án phù hợp;
  stop
else (Không)
  |Người dùng|
  :Xem trạng thái không có kết quả;
  stop
endif
@enduml
```

### PlantUML UI-015: Xem chi tiết dự án và hồ sơ công khai

```plantuml
@startuml
skinparam shadowing false
title UI-015 - Xem chi tiết dự án và hồ sơ công khai
|Người dùng|
start
:Chọn một dự án;
|Hệ thống|
:Tải chi tiết dự án, media, milestones và owner;
if (Tồn tại?) then (Có)
  |Người dùng|
  :Xem chi tiết dự án và hồ sơ công khai;
  stop
else (Không)
  |Người dùng|
  :Nhận thông báo không tìm thấy;
  stop
endif
@enduml
```

### PlantUML UI-016: Đầu tư vào dự án

```plantuml
@startuml
skinparam shadowing false
title UI-016 - Đầu tư vào dự án
|Nhà đầu tư|
start
:Mở chi tiết dự án;
:Nhập số tiền đầu tư;
:Xác nhận đầu tư;
|Hệ thống|
:Kiểm tra KYC, số dư và trạng thái dự án;
if (Đủ điều kiện?) then (Có)
  :Tạo khoản đầu tư và giao dịch;
  :Cập nhật số vốn dự án;
  |Nhà đầu tư|
  :Nhận thông báo đầu tư thành công;
  stop
else (Không)
  |Nhà đầu tư|
  :Nhận lỗi và điều chỉnh lại;
  stop
endif
@enduml
```

### PlantUML UI-017: Theo dõi danh mục đầu tư và chỉ số cá nhân

```plantuml
@startuml
skinparam shadowing false
title UI-017 - Theo dõi danh mục đầu tư
|Nhà đầu tư|
start
:Mở mục danh mục đầu tư;
|Hệ thống|
:Tải các khoản đầu tư và chỉ số cá nhân;
if (Có khoản đầu tư?) then (Có)
  |Nhà đầu tư|
  :Xem portfolio, lợi nhuận và biểu đồ;
  stop
else (Không)
  |Nhà đầu tư|
  :Xem trạng thái chưa có khoản đầu tư;
  stop
endif
@enduml
```

### PlantUML UI-018: Tạo khiếu nại dự án

```plantuml
@startuml
skinparam shadowing false
title UI-018 - Tạo khiếu nại dự án
|Nhà đầu tư|
start
:Mở chức năng khiếu nại dự án;
:Nhập lý do và minh chứng;
:Gửi khiếu nại;
|Hệ thống|
:Kiểm tra quyền khiếu nại;
if (Đủ điều kiện?) then (Có)
  :Tạo dispute trạng thái mở;
  :Cập nhật danh sách tranh chấp;
  |Nhà đầu tư|
  :Nhận thông báo đã gửi khiếu nại;
  stop
else (Không)
  |Nhà đầu tư|
  :Nhận lỗi không thể khiếu nại;
  stop
endif
@enduml
```

### PlantUML UI-019: Tham gia voting milestone và xem thảo luận

```plantuml
@startuml
skinparam shadowing false
title UI-019 - Voting milestone và xem thảo luận
|Nhà đầu tư|
start
:Mở milestone đang voting;
:Xem bằng chứng và thảo luận;
:Gửi phiếu biểu quyết;
|Hệ thống|
:Kiểm tra quyền vote và trạng thái milestone;
if (Hợp lệ?) then (Có)
  :Lưu phiếu vote và cập nhật kết quả;
  |Nhà đầu tư|
  :Nhận kết quả biểu quyết hiện tại;
  stop
else (Không)
  |Nhà đầu tư|
  :Nhận lỗi không thể voting;
  stop
endif
@enduml
```

### PlantUML UI-020: Tạo dự án mới

```plantuml
@startuml
skinparam shadowing false
title UI-020 - Tạo dự án mới
|Chủ dự án|
start
:Mở màn hình tạo dự án;
:Nhập thông tin dự án và milestones;
:Gửi dự án để xét duyệt;
|Hệ thống|
:Kiểm tra vai trò và dữ liệu dự án;
if (Hợp lệ?) then (Có)
  :Lưu dự án trạng thái chờ duyệt;
  |Chủ dự án|
  :Nhận thông báo dự án đã được gửi;
  stop
else (Không)
  |Chủ dự án|
  :Nhận lỗi và sửa lại;
  stop
endif
@enduml
```

### PlantUML UI-021: Cập nhật thông tin dự án

```plantuml
@startuml
skinparam shadowing false
title UI-021 - Cập nhật thông tin dự án
|Chủ dự án|
start
:Mở trang chỉnh sửa dự án;
:Cập nhật thông tin, nội dung hoặc media;
:Gửi yêu cầu lưu;
|Hệ thống|
:Kiểm tra quyền sở hữu và dữ liệu;
if (Hợp lệ?) then (Có)
  :Cập nhật thông tin dự án;
  |Chủ dự án|
  :Nhận kết quả cập nhật;
  stop
else (Không)
  |Chủ dự án|
  :Nhận lỗi và sửa lại;
  stop
endif
@enduml
```

### PlantUML UI-022: Quản lý milestones của dự án

```plantuml
@startuml
skinparam shadowing false
title UI-022 - Quản lý milestones của dự án
|Chủ dự án|
start
:Mở mục milestones của dự án;
:Cập nhật kế hoạch hoặc nộp bằng chứng;
|Hệ thống|
:Kiểm tra quyền và trạng thái milestone;
if (Hợp lệ?) then (Có)
  :Lưu milestone hoặc evidence URL;
  :Cập nhật trạng thái xử lý;
  |Chủ dự án|
  :Nhận kết quả cập nhật milestone;
  stop
else (Không)
  |Chủ dự án|
  :Nhận lỗi và sửa lại;
  stop
endif
@enduml
```

### PlantUML UI-023: Dừng huy động vốn sớm

```plantuml
@startuml
skinparam shadowing false
title UI-023 - Dừng huy động vốn sớm
|Chủ dự án|
start
:Mở dự án đang huy động vốn;
:Chọn dừng huy động sớm;
:Xác nhận thao tác;
|Hệ thống|
:Kiểm tra quyền và điều kiện dừng;
if (Đủ điều kiện?) then (Có)
  :Cập nhật trạng thái dự án;
  |Chủ dự án|
  :Nhận thông báo dừng huy động thành công;
  stop
else (Không)
  |Chủ dự án|
  :Nhận lỗi không thể dừng huy động;
  stop
endif
@enduml
```

### PlantUML UI-024: Theo dõi danh sách dự án của tôi

```plantuml
@startuml
skinparam shadowing false
title UI-024 - Theo dõi danh sách dự án của tôi
|Chủ dự án|
start
:Mở mục dự án của tôi;
|Hệ thống|
:Tải danh sách dự án theo owner;
if (Có dự án?) then (Có)
  |Chủ dự án|
  :Xem danh sách và trạng thái dự án;
  stop
else (Không)
  |Chủ dự án|
  :Xem trạng thái chưa có dự án;
  stop
endif
@enduml
```

### PlantUML UI-025: Thanh toán nợ dự án

```plantuml
@startuml
skinparam shadowing false
title UI-025 - Thanh toán nợ dự án
|Chủ dự án|
start
:Mở mục repayment;
:Chọn kỳ hạn thanh toán;
:Xác nhận thanh toán;
|Hệ thống|
:Kiểm tra lịch trả nợ và số dư ví;
if (Đủ điều kiện?) then (Có)
  :Trừ ví chủ dự án;
  :Phân bổ tiền cho nhà đầu tư và hệ thống;
  :Cập nhật lịch trả nợ;
  |Chủ dự án|
  :Nhận thông báo thanh toán thành công;
  stop
else (Không)
  |Chủ dự án|
  :Nhận lỗi không thể thanh toán;
  stop
endif
@enduml
```

### PlantUML UI-026: Xem danh sách blog công khai

```plantuml
@startuml
skinparam shadowing false
title UI-026 - Xem danh sách blog công khai
|Người dùng/Khách|
start
:Mở trang blog;
:Nhập từ khóa nếu cần;
|Hệ thống|
:Tải danh sách blog đã xuất bản;
if (Có bài viết?) then (Có)
  |Người dùng/Khách|
  :Xem danh sách blog;
  stop
else (Không)
  |Người dùng/Khách|
  :Xem trạng thái không có bài viết;
  stop
endif
@enduml
```

### PlantUML UI-027: Xem chi tiết bài blog

```plantuml
@startuml
skinparam shadowing false
title UI-027 - Xem chi tiết bài blog
|Người dùng/Khách|
start
:Chọn một bài blog;
|Hệ thống|
:Tải bài viết theo slug;
if (Tồn tại?) then (Có)
  |Người dùng/Khách|
  :Xem nội dung chi tiết bài viết;
  stop
else (Không)
  |Người dùng/Khách|
  :Nhận thông báo không tìm thấy;
  stop
endif
@enduml
```

### PlantUML UI-028: Quản lý bài viết blog

```plantuml
@startuml
skinparam shadowing false
title UI-028 - Quản lý bài viết blog
|Người quản trị|
start
:Mở trang quản lý blog;
|Hệ thống|
:Kiểm tra đăng nhập và quyền admin;
:Tải danh sách bài viết;
|Người quản trị|
:Chọn tạo mới/chỉnh sửa/xóa bài viết;
|Hệ thống|
:Kiểm tra dữ liệu bài viết;
if (Hợp lệ?) then (Có)
  :Lưu thay đổi và cập nhật danh sách;
  |Người quản trị|
  :Nhận kết quả cập nhật;
  stop
else (Không)
  |Người quản trị|
  :Nhận lỗi và sửa lại;
  stop
endif
@enduml
```
