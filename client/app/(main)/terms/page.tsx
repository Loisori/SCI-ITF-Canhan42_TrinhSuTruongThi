"use client";

import Navbar from "@/components/client/Navbar";
import Footer from "@/components/client/Footer";

export default function TermsPage() {
  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen font-display">
      <Navbar />
      <main className="wrapper wrapper--md py-16 md:py-24">
        <div className="max-w-3xl mx-auto">
          <div className="mb-12">
            <h1 className="text-h3 md:text-h2 font-black text-slate-900 dark:text-white mb-4">
              Điều khoản dịch vụ
            </h1>
            <p className="text-small text-slate-500">Áp dụng từ: 15/04/2026</p>
          </div>

          <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-headings:text-slate-900 dark:prose-headings:text-white prose-p:text-slate-600 dark:prose-p:text-slate-400">
            <h3>1. Sự chấp thuận Điều Khoản</h3>
            <p>
              Bằng việc truy cập sử dụng InvestPro, bao gồm cả tư cách Người dùng truy cập tự do, Nhà Đầu Tư, hay Chủ Dự Án (Owner), bạn đồng ý hoàn toàn và chịu sự ràng buộc bởi bản Điều Khoản Dịch Vụ này. 
            </p>

            <h3>2. Khả năng tham gia cung cấp/sử dụng Dịch Vụ</h3>
            <p>
              Bạn cam kết mình đạt độ tuổi đa số (trên 18 tuổi) và đủ năng lực dân sự khi ký kết hợp đồng điện tử hiện hành theo khuôn khổ pháp luật. Các pháp nhân mở tài khoản doanh nghiệp cần có văn bản ủy nhiệm quyền tương ứng.
            </p>

            <h3>3. Cam kết của Khách Hàng (Nhà Đầu Tư)</h3>
            <p>
              Việc sử dụng ví điện tử nội bộ phải tuân thủ nghiêm ngặt Luật Chuyển mạch Tài chính Quốc Gia. Khi bạn nạp vốn qua cổng trung gian (VNPay), mọi thay đổi thất lạc từ phía Ngân Hàng của bạn là rủi ro bạn phải chịu. 
              Các báo cáo về đầu tư, lợi nhuận, % phân bổ mà phía InvestPro cung cấp dựa vào sổ sách điện tử là quyết định có giá trị cuối cùng.
            </p>

            <h3>4. Quản lý nội dung của Chủ Dự Án</h3>
            <p>
              Các Startup / Owner sở hữu dự án trên nền tảng sẽ phải chịu trách nhiệm đảm bảo dự án có hồ sơ xác minh minh bạch. Phía Owner không được chỉnh sửa Thông Tin Nhạy Cảm (vốn kỳ vọng, ROI v.v.) sau khi đợt gọi vốn chính thức đi vào mở bán chung (Fundraising Stage). Mọi biểu hiện lừa đảo đều có thể dẫn đến việc InvestPro cung cấp hồ sơ cho cơ quan chức năng để khởi tố.
            </p>

            <h3>5. Thay Đổi và Chấm Dứt</h3>
            <p>
              InvestPro giữ độc quyền toàn quyết từ chối/khóa các tài khoản có hành vi phá hoại API hệ thống của chúng tôi mà không cần thông báo trước.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
