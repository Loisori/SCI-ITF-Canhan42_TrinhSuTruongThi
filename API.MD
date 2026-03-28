POST /api/auth/register: Đăng ký tài khoản mới (Lưu tên, email, mật khẩu đã hash).
POST /api/auth/login: Đăng nhập và trả về JWT Token.
GET /api/auth/me: Lấy thông tin người dùng hiện tại (dùng để hiển thị user.fullName và user.balance trên Header bạn vừa làm).
POST /api/auth/logout: Đăng xuất (xóa cookie hoặc token).
GET /api/projects: Lấy danh sách dự án đang huy động vốn.
GET /api/projects/:id: Lấy chi tiết một dự án (kèm nội dung Markdown theo content_slug).
GET /api/projects/slug/:slug: Lấy chi tiết dự án theo content_slug (public, dùng cho route /projects/:slug).
POST /api/projects: Chỉ Owner tạo dự án mới.
DELETE /api/projects/:id: Chỉ Owner xóa dự án.
POST /api/projects/invest: Chỉ Investor được đầu tư, trừ số dư user và cộng current_capital của project.
GET /api/users/profile: Lấy chi tiết hồ sơ người dùng.
PATCH /api/users/update-profile: Cập nhật thông tin cá nhân (Họ tên, avatar).
GET /api/users/balance: Lấy số dư thực tế từ database.
POST /api/users/deposit: API xử lý nạp tiền (Cập nhật SQL: UPDATE users SET balance = balance + ?).
GET /api/transactions: Lấy danh sách lịch sử nạp/rút/đầu tư của người dùng.
GET /api/transactions/:id: Xem chi tiết một giao dịch cụ thể.
POST /api/transactions/invest: Thực hiện lệnh đầu tư (Trừ số dư và tạo bản ghi giao dịch).
GET /api/admin/users: Danh sách tất cả nhà đầu tư.
PATCH /api/admin/users/:id/balance: Admin điều chỉnh số dư cho người dùng (Sử dụng câu lệnh SQL UPDATE mà bạn đã hỏi trước đó).
