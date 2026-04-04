-- 1. Bảng danh mục dự án (Admin tạo trước)
CREATE TABLE project_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Bảng Users (Đã có, thêm trường nếu cần)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('investor', 'owner', 'admin') DEFAULT 'investor',
    balance DECIMAL(15, 2) DEFAULT 0.00,
    avatar_url VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
-- 3. Bảng Projects
CREATE TABLE projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    owner_id INT NOT NULL,
    category_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    short_description TEXT,
    content LONGTEXT, -- Dùng cho Markdown hoặc HTML mô tả chi tiết
    goal_amount DECIMAL(15, 2) NOT NULL,
    current_amount DECIMAL(15, 2) DEFAULT 0.00,
    min_investment DECIMAL(15, 2) NOT NULL,
    interest_rate DECIMAL(5, 2) NOT NULL, -- Ví dụ: 12.50 tương đương 12.5%
    duration_months INT NOT NULL,
    risk_level ENUM('low', 'medium', 'high') DEFAULT 'medium',
    status ENUM('pending', 'funding', 'active', 'completed', 'failed') DEFAULT 'pending',
    start_date DATE,
    end_date DATE,
    commission_rate DECIMAL(5,2) DEFAULT 5.00;
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES project_categories(id),
    is_frozen BOOLEAN DEFAULT FALSE
);

-- 4. Bảng Gallery ảnh và Thumbnail
CREATE TABLE project_media (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    url VARCHAR(255) NOT NULL,
    type ENUM('image', 'video') DEFAULT 'image',
    is_thumbnail BOOLEAN DEFAULT FALSE, -- Ảnh đại diện chính
    sort_order INT DEFAULT 0,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
-- 5. Bảng ghi nhận khoản đầu tư
CREATE TABLE investments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    project_id INT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    status ENUM('active', 'completed', 'withdrawn') DEFAULT 'active',
    invested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- 6. Bảng Lịch trả lãi (Mấu chốt để trả tiền cho User)
CREATE TABLE payment_schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    investment_id INT NOT NULL,
    due_date DATE NOT NULL, -- Ngày dự kiến trả
    amount DECIMAL(15, 2) NOT NULL, -- Số tiền lãi kỳ này
    status ENUM('unpaid', 'paid', 'overdue') DEFAULT 'unpaid',
    paid_at TIMESTAMP NULL,
    FOREIGN KEY (investment_id) REFERENCES investments(id) ON DELETE CASCADE
);

-- 7. Bảng Nhật ký giao dịch (Để User xem lịch sử tiền ra/vào)
CREATE TABLE transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    type ENUM('deposit', 'withdraw', 'invest', 'interest_receive', 'refund') NOT NULL,
    status ENUM('pending', 'success', 'failed') DEFAULT 'success',
    description VARCHAR(255),
    reference_id INT, -- ID của khoản đầu tư hoặc dự án liên quan
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 8. Bảng Danh mục đầu tư yêu thích của User
CREATE TABLE user_favorite_categories (
    user_id INT NOT NULL,
    category_id INT NOT NULL,
    PRIMARY KEY (user_id, category_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES project_categories(id) ON DELETE CASCADE
);

-- 9. Bảng Danh mục đầu tư loại trừ (Blacklist) của User
    CREATE TABLE user_blacklist_categories (
        user_id INT NOT NULL,
        category_id INT NOT NULL,
        PRIMARY KEY (user_id, category_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES project_categories(id) ON DELETE CASCADE
    );
-- 10. Bảng Ảnh của User
    CREATE TABLE user_media (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    url TEXT,           -- Link ảnh từ Cloudinary
    public_id TEXT,    -- ID để xóa/sửa ảnh trên Cloudinary
    file_name TEXT,    -- Tên gốc để User dễ tìm
    file_size INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);
-- 11. Bảng Khiếu nại dự án
CREATE TABLE project_disputes (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id),
    user_id INTEGER REFERENCES users(id), -- Người khiếu nại
    reason TEXT,
    evidence_url TEXT, -- Ảnh bằng chứng của User (nếu có)
    status VARCHAR(20) DEFAULT 'OPEN', -- OPEN, RESOLVED, REFUNDED
    created_at TIMESTAMP DEFAULT NOW()
);
-- 12. Bảng Thông báo
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'INFO',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 13. Bảng lịch sử chat AI (duy trì ngữ cảnh stateless 10 lượt gần nhất)
CREATE TABLE chat_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    role ENUM('user', 'model', 'system') NOT NULL,
    message TEXT NOT NULL,
    project_context JSON NULL, -- object dự án được gửi kèm mỗi lần chat (nếu có)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_chat_history_user_created_at (user_id, created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
