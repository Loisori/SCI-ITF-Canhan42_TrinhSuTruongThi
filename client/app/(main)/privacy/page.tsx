"use client";

import Navbar from "@/components/client/Navbar";
import Footer from "@/components/client/Footer";

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen font-display">
      <Navbar />
      <main className="wrapper wrapper--md py-16 md:py-24">
        <div className="max-w-3xl mx-auto">
          <div className="mb-12">
            <h1 className="text-h3 md:text-h2 font-black text-slate-900 dark:text-white mb-4">
              Chính sách bảo mật
            </h1>
            <p className="text-small text-slate-500">Cập nhật lần cuối: Tháng 8 năm 2026</p>
          </div>

          <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-headings:text-slate-900 dark:prose-headings:text-white">
            <h3>1. Giới thiệu khái quát</h3>
            <p>
              InvestPro ("chúng tôi", "của chúng tôi") tôn trọng và cam kết bảo vệ dữ liệu cá nhân của bạn. Chính sách quy định cách chúng tôi thu thập, sử dụng và bảo mật thông tin khi bạn tương tác với nền tảng qua website hệ thống.
            </p>

            <h3>2. Dữ liệu chúng tôi thu thập</h3>
            <p>
              Khi bạn khởi tạo tài khoản đầu tư, truy cập hoặc sử dụng Dịch vụ, chúng tôi có thể thu thập các thông tin bao gồm:
            </p>
            <ul>
              <li><strong>Thông tin xác thực danh tính:</strong> Họ tên đầy đủ, ngày sinh, Số CMND/CCCD/Hộ chiếu với mục đích xác thực eKYC.</li>
              <li><strong>Thông tin liên lạc:</strong> Email, số điện thoại, địa chỉ nhà.</li>
              <li><strong>Thông tin tài chính:</strong> Dữ liệu thẻ ngân hàng liên kết, ví điện tử (sử dụng qua hệ thống API bên thứ 3 an toàn, chúng tôi không lưu trữ mã bảo mật).</li>
              <li><strong>Dữ liệu trình duyệt:</strong> Cookie, địa chỉ IP, thao tác click, thiết bị truy cập để nâng cao bảo mật hệ thống.</li>
            </ul>

            <h3>3. Tại sao chúng tôi sử dụng dữ liệu của bạn?</h3>
            <p>
              Chúng tôi chỉ sử dụng Dữ liệu Sinh trắc & Cá nhân nhằm:
              <br />- Cung cấp tính năng gọi vốn, theo dõi danh mục đầu tư tài chính chính xác.
              <br />- Đảm bảo an toàn, ngừa gian lận hoặc vi phạm luật phòng chống rửa tiền (AML).
              <br />- Cá nhân hóa các gợi ý hạng mục yêu thích đầu tư dựa trên sở thích danh mục cá nhân đã tùy chỉnh (Preferences).
            </p>

            <h3>4. Quyền của bạn và cam kết bảo mật</h3>
            <p>
              Dữ liệu của bạn được lưu trữ trên hạ tầng mã hóa TiDB. Chúng tôi cam kết <strong>không buôn bán</strong> dữ liệu của bạn với bên thứ 3 cho mục đích quảng cáo mà không báo trước.
              Bất cứ khi nào, trong "Cài đặt" của Dashboard, bạn đều có quyền lựa chọn điều chỉnh dữ liệu, từ chối nhận email thông báo thị trường, và có quyền yêu cầu vô hiệu hóa/xoá toàn bộ dữ liệu tài khoản thuộc về bạn.
            </p>

            <hr className="my-8 border-slate-200 dark:border-slate-800" />
            <p className="text-[14px]">
              Nếu có đóng góp hoặc câu hỏi về Quyền Bảo Mật xin liên hệ: privacy@investpro.vn
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
