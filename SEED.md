## 🌟 Delete Tables

-- 1. Vô hiệu hóa kiểm tra khóa ngoại
SET FOREIGN_KEY_CHECKS = 0;

-- 2. Xóa sạch dữ liệu và reset ID cho TOÀN BỘ các bảng trong ảnh
TRUNCATE TABLE chat_history;
TRUNCATE TABLE investments;
TRUNCATE TABLE kycs;
TRUNCATE TABLE milestone_discussions;
TRUNCATE TABLE milestone_votes;
TRUNCATE TABLE notifications;
TRUNCATE TABLE payment_schedules;
TRUNCATE TABLE project_categories;
TRUNCATE TABLE project_disputes;
TRUNCATE TABLE project_media;
TRUNCATE TABLE project_milestones;
TRUNCATE TABLE projects;
TRUNCATE TABLE transactions;
TRUNCATE TABLE user_blacklist_categories;
TRUNCATE TABLE user_favorite_categories;
TRUNCATE TABLE user_media;
TRUNCATE TABLE users;

-- 3. Kích hoạt lại kiểm tra khóa ngoại
SET FOREIGN_KEY_CHECKS = 1;

-- 4. Kiểm tra nhanh (Tùy chọn)
SELECT 'Database is now clean!' AS Status;

## 🌟 Insert Users

INSERT INTO users (
email,
password,
full_name,
role,
balance,
avatar_url,
is_verified,
bio,
cover_photo_url,
social_links,
notification_settings,
is_frozen,
slug,
address,
created_at,
updated_at
) VALUES
-- 1. Investor (Nhà đầu tư)
(
'loisori1001@gmail.com',
'123456',
'Lợi Sori Investor',
'investor',
1000000000.00,
'https://ui-avatars.com/api/?name=Loi+Sori&background=random',
1,
'Tôi là một nhà đầu tư yêu thích các dự án năng lượng xanh và công nghệ.',
'https://images.unsplash.com/photo-1557683316-973673baf926',
'{"facebook": "fb.com/loi", "linkedin": "in/loi"}',
'{"email": true, "push": true}',
0,
'loi-sori-investor',
'Quận Hải Châu, TP. Đà Nẵng',
NOW(),
NOW()
),

-- 2. Owner (Chủ dự án)
(
'xrejji04@gmail.com',
'123456',
'Xrejji Project Owner',
'owner',
1000000000.00,
'https://ui-avatars.com/api/?name=Xrejji+Owner&background=random',
1,
'Chuyên gia phát triển dự án bất động sản và nông nghiệp công nghệ cao.',
'https://images.unsplash.com/photo-1557682250-33bd709cbe85',
'{"website": "xrejji.com"}',
'{"email": true, "push": false}',
0,
'xrejji-project-owner',
'Quận 1, TP. Hồ Chí Minh',
NOW(),
NOW()
),

-- 3. Admin (Quản trị viên)
(
'admin@gmail.com',
'123456',
'System Admin',
'admin',
1000000000.00,
'https://ui-avatars.com/api/?name=System+Admin&background=0D8ABC&color=fff',
1,
'Quản trị viên cấp cao của nền tảng InvestPro.',
'https://images.unsplash.com/photo-1557683311-eac922347aa1',
'{}',
'{"all": true}',
0,
'system-admin',
'Phố Duy Tân, Cầu Giấy, Hà Nội',
NOW(),
NOW()
);

## 🌟 Insert Categories

INSERT INTO project_categories (name, slug, description, icon_url, created_at) VALUES
('Art', 'art', 'Các dự án về hội họa, điêu khắc và nghệ thuật thị giác.', 'https://cdn-icons-png.flaticon.com/512/1048/1048953.png', NOW()),
('Comics', 'comics', 'Truyện tranh, tiểu thuyết đồ họa và nghệ thuật minh họa.', 'https://cdn-icons-png.flaticon.com/512/3011/3011306.png', NOW()),
('Crafts', 'crafts', 'Sản phẩm thủ công mỹ nghệ, đồ handmade và trang sức.', 'https://cdn-icons-png.flaticon.com/512/3040/3040181.png', NOW()),
('Dance', 'dance', 'Các buổi trình diễn múa, biên đạo và nghệ thuật chuyển động.', 'https://cdn-icons-png.flaticon.com/512/3133/3133098.png', NOW()),
('Design', 'design', 'Thiết kế công nghiệp, đồ họa, nội thất và sản phẩm sáng tạo.', 'https://cdn-icons-png.flaticon.com/512/1055/1055666.png', NOW()),
('Fashion', 'fashion', 'Thời trang bền vững, phụ kiện và xu hướng may mặc mới.', 'https://cdn-icons-png.flaticon.com/512/3050/3050117.png', NOW()),
('Film & Video', 'film-video', 'Phim điện ảnh, phim tài liệu và nội dung video sáng tạo.', 'https://cdn-icons-png.flaticon.com/512/1179/1179069.png', NOW()),
('Food', 'food', 'Ẩm thực, nông sản sạch và các mô hình nhà hàng sáng tạo.', 'https://cdn-icons-png.flaticon.com/512/2737/2737034.png', NOW()),
('Games', 'games', 'Phát triển trò chơi điện tử, board games và giải trí tương tác.', 'https://cdn-icons-png.flaticon.com/512/686/686588.png', NOW()),
('Journalism', 'journalism', 'Báo chí điều tra, tạp chí độc lập và nội dung số.', 'https://cdn-icons-png.flaticon.com/512/2537/2537926.png', NOW()),
('Music', 'music', 'Sản xuất âm nhạc, album mới và các thiết bị âm thanh.', 'https://cdn-icons-png.flaticon.com/512/3043/3043665.png', NOW()),
('Photography', 'photography', 'Nhiếp ảnh nghệ thuật, phóng sự ảnh và thiết bị chụp hình.', 'https://cdn-icons-png.flaticon.com/512/685/685655.png', NOW()),
('Publishing', 'publishing', 'Xuất bản sách, tạp chí và các ấn phẩm in ấn sáng tạo.', 'https://cdn-icons-png.flaticon.com/512/3145/3145765.png', NOW()),
('Technology', 'technology', 'Phần cứng, phần mềm, AI và các giải pháp công nghệ mới.', 'https://cdn-icons-png.flaticon.com/512/2103/2103633.png', NOW()),
('Theater', 'theater', 'Kịch nghệ, biểu diễn sân khấu và nghệ thuật trình diễn.', 'https://cdn-icons-png.flaticon.com/512/3133/3133139.png', NOW());

## 🌟 Insert Projects

INSERT INTO projects (
owner_id, category_id, title, slug, short_description, content,
goal_amount, current_amount, min_investment, interest_rate,
commission_rate, duration_months, risk_level, status,
start_date, end_date, is_frozen, address, created_at
) VALUES
-- 1. ART
((SELECT id FROM users WHERE email = 'xrejji04@gmail.com'), 1, 'Triển lãm Nghệ thuật Đương đại 2026', 'art-exhibition-2026', 'Trưng bày các tác phẩm điêu khắc hiện đại.', 'Nội dung...', 500000000, 0, 1000000, 12.0, 5, 12, 'low', 'funding', '2026-05-01', '2026-08-01', 0, 'Quận 1, TP. HCM', NOW()),
((SELECT id FROM users WHERE email = 'xrejji04@gmail.com'), 1, 'Xưởng vẽ tranh Sơn dầu Kỹ thuật số', 'digital-oil-painting-studio', 'Kết hợp nghệ thuật truyền thống và AI.', 'Nội dung...', 300000000, 0, 500000, 15.0, 5, 10, 'medium', 'funding', '2026-05-10', '2026-09-10', 0, 'Quận 3, TP. HCM', NOW()),
((SELECT id FROM users WHERE email = 'xrejji04@gmail.com'), 1, 'Lễ hội Street Art Sài Gòn', 'saigon-street-art-fest', 'Trang trí các bức tường phố cổ bằng Graffiti.', 'Nội dung...', 700000000, 0, 1000000, 10.0, 5, 6, 'high', 'funding', '2026-06-01', '2026-08-01', 0, 'Quận 5, TP. HCM', NOW()),

-- 2. COMICS
((SELECT id FROM users WHERE email = 'xrejji04@gmail.com'), 2, 'Manga Series: The Code Runner', 'manga-code-runner', 'Truyện tranh về thế giới lập trình viên tương lai.', 'Nội dung...', 200000000, 0, 200000, 18.0, 7, 12, 'high', 'funding', '2026-05-05', '2026-11-05', 0, 'Hà Nội', NOW()),
((SELECT id FROM users WHERE email = 'xrejji04@gmail.com'), 2, 'Webtoon Studio Expansion', 'webtoon-studio-expansion', 'Nâng cấp hệ thống vẽ và sản xuất truyện màu.', 'Nội dung...', 400000000, 0, 500000, 14.0, 5, 18, 'medium', 'funding', '2026-05-15', '2026-12-15', 0, 'Đà Nẵng', NOW()),
((SELECT id FROM users WHERE email = 'xrejji04@gmail.com'), 2, 'Graphic Novel: InvestMan', 'graphic-novel-investman', 'Siêu anh hùng tài chính bảo vệ nhà đầu tư.', 'Nội dung...', 150000000, 0, 200000, 20.0, 8, 9, 'high', 'funding', '2026-06-01', '2026-09-01', 0, 'TP. HCM', NOW()),

-- 3. CRAFTS
((SELECT id FROM users WHERE email = 'xrejji04@gmail.com'), 3, 'Xưởng Da thủ công Handmade', 'leather-craft-workshop', 'Sản xuất ví và túi xách da thật tự chọn màu.', 'Nội dung...', 250000000, 0, 1000000, 13.0, 5, 12, 'low', 'funding', '2026-05-01', '2026-10-01', 0, 'Quận Phú Nhuận, TP. HCM', NOW()),
((SELECT id FROM users WHERE email = 'xrejji04@gmail.com'), 3, 'Gốm Bát Tràng phong cách Nordic', 'modern-bat-trang-pottery', 'Đưa thiết kế Bắc Âu vào gốm sứ Việt.', 'Nội dung...', 500000000, 0, 2000000, 11.5, 4, 24, 'low', 'funding', '2026-05-20', '2026-11-20', 0, 'Gia Lâm, Hà Nội', NOW()),
((SELECT id FROM users WHERE email = 'xrejji04@gmail.com'), 3, 'Trang sức từ nhựa tái chế Ocean-Blue', 'ocean-blue-recycled-jewelry', 'Biến rác thải biển thành phụ kiện cao cấp.', 'Nội dung...', 180000000, 0, 500000, 16.0, 6, 8, 'medium', 'funding', '2026-06-10', '2026-12-10', 0, 'Nha Trang', NOW()),

-- 4. DANCE
((SELECT id FROM users WHERE email = 'xrejji04@gmail.com'), 4, 'Contemporary Dance Tour: The Flow', 'dance-tour-the-flow', 'Lưu diễn múa đương đại tại 5 thành phố lớn.', 'Nội dung...', 600000000, 0, 1000000, 12.5, 5, 6, 'medium', 'funding', '2026-05-01', '2026-07-01', 0, 'Toàn quốc', NOW()),
((SELECT id FROM users WHERE email = 'xrejji04@gmail.com'), 4, 'Hiphop Academy App', 'hiphop-academy-app', 'Ứng dụng học nhảy trực tuyến tích hợp AI.', 'Nội dung...', 350000000, 0, 500000, 15.0, 5, 12, 'high', 'funding', '2026-05-15', '2026-11-15', 0, 'TP. Thủ Đức', NOW()),
((SELECT id FROM users WHERE email = 'xrejji04@gmail.com'), 4, 'Múa Rối Nước Hiện Đại', 'modern-water-puppet', 'Kết hợp ánh sáng laser vào múa rối truyền thống.', 'Nội dung...', 450000000, 0, 1000000, 11.0, 4, 18, 'low', 'funding', '2026-06-01', '2026-12-01', 0, 'Hà Nội', NOW()),

-- 5. DESIGN
((SELECT id FROM users WHERE email = 'xrejji04@gmail.com'), 5, 'Nội thất Gỗ Xếp gọn ZenHome', 'zenhome-furniture', 'Giải pháp tối ưu cho chung cư mini.', 'Nội dung...', 800000000, 0, 5000000, 10.5, 3, 24, 'low', 'funding', '2026-05-10', '2026-09-10', 0, 'Quận 2, TP. HCM', NOW()),
((SELECT id FROM users WHERE email = 'xrejji04@gmail.com'), 5, 'Bao bì Sinh học từ Sợi chuối', 'banana-fiber-packaging', 'Thay thế túi nilon bằng vật liệu tự nhiên.', 'Nội dung...', 1200000000, 0, 2000000, 14.0, 5, 30, 'medium', 'funding', '2026-05-25', '2026-12-25', 0, 'Cần Thơ', NOW()),
((SELECT id FROM users WHERE email = 'xrejji04@gmail.com'), 5, 'Font chữ Việt hóa Chuyên nghiệp', 'vn-font-pro', 'Tạo bộ font chuẩn cho designer Việt.', 'Nội dung...', 150000000, 0, 500000, 17.0, 6, 6, 'medium', 'funding', '2026-06-05', '2026-10-05', 0, 'Hà Nội', NOW()),

-- 6. FASHION
((SELECT id FROM users WHERE email = 'xrejji04@gmail.com'), 6, 'Thương hiệu Giày làm từ Cà phê', 'coffee-shoes-brand', 'Giày sneaker bền vững từ bã cà phê.', 'Nội dung...', 950000000, 0, 1000000, 13.5, 5, 12, 'medium', 'funding', '2026-05-01', '2026-09-01', 0, 'Lâm Đồng', NOW()),
((SELECT id FROM users WHERE email = 'xrejji04@gmail.com'), 6, 'Áo dài lụa tơ tằm vẽ tay', 'hand-painted-silk-aodai', 'Nghệ thuật truyền thống trên trang phục hiện đại.', 'Nội dung...', 300000000, 0, 2000000, 11.0, 4, 18, 'low', 'funding', '2026-05-18', '2026-11-18', 0, 'Hội An', NOW()),
((SELECT id FROM users WHERE email = 'xrejji04@gmail.com'), 6, 'Thời trang Streetwear Reflective', 'reflective-streetwear', 'Trang phục phát quang cho giới trẻ đô thị.', 'Nội dung...', 550000000, 0, 1000000, 16.0, 6, 12, 'high', 'funding', '2026-06-15', '2027-02-15', 0, 'Quận 1, TP. HCM', NOW()),

-- 7. FILM & VIDEO
((SELECT id FROM users WHERE email = 'xrejji04@gmail.com'), 7, 'Phim Ngắn Indie: The Last Block', 'indie-film-the-last-block', 'Câu chuyện về lập trình viên cuối cùng.', 'Nội dung...', 400000000, 0, 1000000, 14.5, 5, 12, 'high', 'funding', '2026-05-05', '2026-12-05', 0, 'Đà Lạt', NOW()),
((SELECT id FROM users WHERE email = 'xrejji04@gmail.com'), 7, 'Phim Tài liệu: Tương lai Tài chính', 'future-of-finance-doc', 'Khám phá thế giới Blockchain tại Việt Nam.', 'Nội dung...', 750000000, 0, 2000000, 12.0, 4, 18, 'medium', 'funding', '2026-05-20', '2027-02-20', 0, 'TP. HCM', NOW()),
((SELECT id FROM users WHERE email = 'xrejji04@gmail.com'), 7, 'Hệ thống Camera Bay tự động (Drone Tech)', 'drone-cinematic-tech', 'Ghi hình điện ảnh từ trên không bằng AI.', 'Nội dung...', 1500000000, 0, 5000000, 10.5, 3, 24, 'low', 'funding', '2026-06-10', '2027-02-10', 0, 'Hà Nội', NOW()),

-- 8. FOOD
((SELECT id FROM users WHERE email = 'xrejji04@gmail.com'), 8, 'Nhà hàng Chay Fusion: An Nhiên', 'fusion-vegan-restaurant', 'Kết hợp ẩm thực Âu-Á theo lối sống lành mạnh.', 'Nội dung...', 1200000000, 0, 5000000, 11.5, 4, 36, 'low', 'funding', '2026-05-12', '2027-01-12', 0, 'Quận 3, TP. HCM', NOW()),
((SELECT id FROM users WHERE email = 'xrejji04@gmail.com'), 8, 'Xưởng Socola Thủ công từ Cacao Tiền Giang', 'handcrafted-chocolate-factory', 'Sản xuất socola nguyên chất 100%.', 'Nội dung...', 800000000, 0, 1000000, 13.0, 5, 18, 'medium', 'funding', '2026-05-28', '2026-11-28', 0, 'Tiền Giang', NOW()),
((SELECT id FROM users WHERE email = 'xrejji04@gmail.com'), 8, 'Chuỗi Trà sữa Thảo mộc Organic', 'organic-herbal-milktea', 'Nước uống tốt cho sức khỏe cho giới văn phòng.', 'Nội dung...', 600000000, 0, 1000000, 15.5, 6, 12, 'medium', 'funding', '2026-06-15', '2026-12-15', 0, 'Quận 1, TP. HCM', NOW()),

-- 9. GAMES
((SELECT id FROM users WHERE email = 'xrejji04@gmail.com'), 9, 'Game RPG: Quest of InvestPro', 'rpg-quest-of-investpro', 'Hành trình trở thành tỷ phú trong thế giới ảo.', 'Nội dung...', 2500000000, 0, 1000000, 18.0, 8, 36, 'high', 'funding', '2026-05-01', '2027-05-01', 0, 'Quận 9, TP. HCM', NOW()),
((SELECT id FROM users WHERE email = 'xrejji04@gmail.com'), 9, 'Mobile Puzzle: Logic Solver', 'mobile-game-logic-solver', 'Thử thách trí tuệ với hàng ngàn cấp độ.', 'Nội dung...', 450000000, 0, 200000, 16.0, 6, 12, 'medium', 'funding', '2026-05-18', '2026-11-18', 0, 'Đà Nẵng', NOW()),
((SELECT id FROM users WHERE email = 'xrejji04@gmail.com'), 9, 'Retro Arcade Bar Experience', 'retro-arcade-bar', 'Kết hợp quán bia và trò chơi điện tử cổ điển.', 'Nội dung...', 1100000000, 0, 2000000, 12.0, 4, 24, 'low', 'funding', '2026-06-10', '2027-02-10', 0, 'Quận 7, TP. HCM', NOW()),

-- 10. JOURNALISM
((SELECT id FROM users WHERE email = 'xrejji04@gmail.com'), 10, 'Tạp chí Tech Insider Vietnam', 'tech-insider-vn-magazine', 'Kênh tin tức chuyên sâu về startup Việt.', 'Nội dung...', 300000000, 0, 500000, 14.0, 5, 12, 'medium', 'funding', '2026-05-10', '2026-10-10', 0, 'Hà Nội', NOW()),
((SELECT id FROM users WHERE email = 'xrejji04@gmail.com'), 10, 'Quỹ Phóng sự Điều tra Độc lập', 'investigative-reporting-fund', 'Tài trợ cho các nhà báo thực hiện các đề tài khó.', 'Nội dung...', 1500000000, 0, 1000000, 9.0, 3, 24, 'low', 'funding', '2026-05-25', '2026-12-25', 0, 'Toàn quốc', NOW()),
((SELECT id FROM users WHERE email = 'xrejji04@gmail.com'), 10, 'Nền tảng Podcast chuyên sâu Insight-Talk', 'insight-talk-podcast', 'Chia sẻ kiến thức từ các chuyên gia hàng đầu.', 'Nội dung...', 200000000, 0, 200000, 17.5, 7, 6, 'high', 'funding', '2026-06-01', '2026-09-01', 0, 'TP. HCM', NOW()),

-- 11. MUSIC
((SELECT id FROM users WHERE email = 'xrejji04@gmail.com'), 11, 'Album Jazz Fusion: Sài Gòn Đêm', 'jazz-album-saigon-night', 'Hòa âm phối khí giữa Jazz và nhạc cụ dân tộc.', 'Nội dung...', 400000000, 0, 1000000, 15.0, 5, 12, 'medium', 'funding', '2026-05-01', '2026-11-01', 0, 'TP. HCM', NOW()),
((SELECT id FROM users WHERE email = 'xrejji04@gmail.com'), 11, 'Hệ thống Phòng thu chuyên nghiệp Q1', 'recording-studio-q1', 'Cho thuê phòng thu đạt chuẩn quốc tế.', 'Nội dung...', 1300000000, 0, 5000000, 11.0, 4, 24, 'low', 'funding', '2026-05-15', '2026-12-15', 0, 'Quận 1, TP. HCM', NOW()),
((SELECT id FROM users WHERE email = 'xrejji04@gmail.com'), 11, 'Lễ hội Âm nhạc Indie Fest', 'indie-music-fest-2026', 'Sân chơi cho các ban nhạc trẻ độc lập.', 'Nội dung...', 900000000, 0, 1000000, 13.5, 6, 6, 'high', 'funding', '2026-06-10', '2026-09-10', 0, 'Đà Nẵng', NOW()),

-- 12. PHOTOGRAPHY
((SELECT id FROM users WHERE email = 'xrejji04@gmail.com'), 12, 'Triển lãm Ảnh: Động vật Hoang dã', 'wildlife-photo-exhibition', 'Bộ sưu tập ảnh từ rừng quốc gia Cát Tiên.', 'Nội dung...', 250000000, 0, 500000, 16.0, 5, 8, 'medium', 'funding', '2026-05-05', '2026-09-05', 0, 'TP. HCM', NOW()),
((SELECT id FROM users WHERE email = 'xrejji04@gmail.com'), 12, 'Sách ảnh: Di sản Việt Nam từ trên cao', 'vietnam-heritage-photo-book', 'Góc nhìn Drone về vẻ đẹp dải đất hình chữ S.', 'Nội dung...', 450000000, 0, 1000000, 14.0, 5, 12, 'medium', 'funding', '2026-05-20', '2026-12-20', 0, 'Toàn quốc', NOW()),
((SELECT id FROM users WHERE email = 'xrejji04@gmail.com'), 12, 'Studio Chụp ảnh chân dung Nghệ thuật', 'portrait-photo-studio', 'Dịch vụ chụp ảnh cao cấp cho doanh nhân.', 'Nội dung...', 600000000, 0, 2000000, 12.5, 4, 18, 'low', 'funding', '2026-06-01', '2026-12-01', 0, 'Hà Nội', NOW()),

-- 13. PUBLISHING
((SELECT id FROM users WHERE email = 'xrejji04@gmail.com'), 13, 'Tiểu thuyết Giả tưởng: Kỷ nguyên AI', 'scifi-novel-ai-era', 'Tác phẩm văn học về tương lai con người.', 'Nội dung...', 150000000, 0, 200000, 18.5, 7, 10, 'high', 'funding', '2026-05-10', '2026-11-10', 0, 'TP. HCM', NOW()),
((SELECT id FROM users WHERE email = 'xrejji04@gmail.com'), 13, 'Sách dạy Tài chính cho trẻ em', 'finance-for-kids-book', 'Học về tiền bạc qua các câu chuyện thú vị.', 'Nội dung...', 350000000, 0, 500000, 14.0, 5, 12, 'medium', 'funding', '2026-05-25', '2026-12-25', 0, 'Hà Nội', NOW()),
((SELECT id FROM users WHERE email = 'xrejji04@gmail.com'), 13, 'Bộ cẩm nang khởi nghiệp Thực tế', 'startup-handbook-real', 'Chia sẻ từ các founder thành công tại Việt Nam.', 'Nội dung...', 250000000, 0, 500000, 16.0, 6, 9, 'medium', 'funding', '2026-06-05', '2026-11-05', 0, 'Toàn quốc', NOW()),

-- 14. TECHNOLOGY
((SELECT id FROM users WHERE email = 'xrejji04@gmail.com'), 14, 'Trợ lý ảo AI cho Doanh nghiệp Việt', 'vi-ai-assistant', 'Phát triển chatbot hiểu sâu tiếng Việt.', 'Nội dung...', 2800000000, 0, 5000000, 17.5, 6, 36, 'high', 'funding', '2026-05-01', '2027-05-01', 0, 'Quận 1, TP. HCM', NOW()),
((SELECT id FROM users WHERE email = 'xrejji04@gmail.com'), 14, 'Hệ thống Nhà thông minh EcoSmart', 'ecosmart-home-system', 'Giải pháp tiết kiệm năng lượng tự động.', 'Nội dung...', 1600000000, 0, 2000000, 13.0, 4, 24, 'low', 'funding', '2026-05-15', '2026-12-15', 0, 'TP. Thủ Đức', NOW()),
((SELECT id FROM users WHERE email = 'xrejji04@gmail.com'), 14, 'Nền tảng Lưu trữ Phi tập trung', 'decentralized-cloud-storage', 'Bảo mật dữ liệu tuyệt đối bằng Blockchain.', 'Nội dung...', 4000000000, 0, 10000000, 19.0, 5, 48, 'high', 'funding', '2026-06-10', '2028-06-10', 0, 'Quận Cầu Giấy, Hà Nội', NOW()),

-- 15. THEATER
((SELECT id FROM users WHERE email = 'xrejji04@gmail.com'), 15, 'Nhạc kịch Broadway: Ánh đèn Sài Gòn', 'musical-saigon-lights', 'Vở diễn quy mô lớn với dàn diễn viên tài năng.', 'Nội dung...', 2000000000, 0, 5000000, 14.0, 5, 12, 'high', 'funding', '2026-05-05', '2026-11-05', 0, 'Nhà hát Thành phố', NOW()),
((SELECT id FROM users WHERE email = 'xrejji04@gmail.com'), 15, 'Kịch tương tác cho Trẻ em: Xứ sở Diệu kỳ', 'interactive-kids-theater', 'Vở diễn nơi khán giả nhí có thể tham gia vào cốt truyện.', 'Nội dung...', 600000000, 0, 1000000, 15.5, 6, 12, 'medium', 'funding', '2026-05-20', '2026-11-20', 0, 'TP. HCM', NOW()),
((SELECT id FROM users WHERE email = 'xrejji04@gmail.com'), 15, 'Sân khấu kịch thể nghiệm Mini-Show', 'mini-theater-show', 'Nơi thử nghiệm các hình thức biểu diễn mới.', 'Nội dung...', 300000000, 0, 500000, 17.0, 7, 9, 'medium', 'funding', '2026-06-12', '2027-02-12', 0, 'Quận 3, TP. HCM', NOW());
