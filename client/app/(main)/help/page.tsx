"use client";

import Navbar from "@/components/client/Navbar";
import Footer from "@/components/client/Footer";

export default function HelpCenterPage() {
  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen font-display">
      <Navbar />
      <main className="wrapper wrapper--md py-16 md:py-24">
        <div className="max-w-3xl mx-auto space-y-12">
          <div className="text-center mb-12">
            <h1 className="text-h3 md:text-h2 font-black text-slate-900 dark:text-white mb-4">
              Trung tâm trợ giúp
            </h1>
            <p className="text-body text-slate-500">
              Tìm câu trả lời cho các câu hỏi thường gặp về cách hoạt động của InvestPro.
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
              <h3 className="text-h6 font-bold text-slate-900 dark:text-white mb-3">
                1. InvestPro là gì?
              </h3>
              <p className="text-body text-slate-600 dark:text-slate-400">
                InvestPro là nền tảng gọi vốn cộng đồng (crowdfunding) và đầu tư dự án số một Việt Nam. Chúng tôi kết nối các nhà đầu tư cá nhân với các dự án tiềm năng trong lĩnh vực khởi nghiệp, bất động sản và nông nghiệp xanh, mang lại lợi nhuận bền vững và minh bạch.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
              <h3 className="text-h6 font-bold text-slate-900 dark:text-white mb-3">
                2. Làm thế nào để bắt đầu đầu tư?
              </h3>
              <p className="text-body text-slate-600 dark:text-slate-400">
                Bạn chỉ cần tạo một tài khoản miễn phí trên InvestPro, nạp tiền vào ví điện tử cá nhân thông qua các phương thức thanh toán hỗ trợ (như VNPAY), tìm một dự án phù hợp với sở thích rủi ro của bạn và chọn số tiền muốn đầu tư. Toàn bộ quy trình diễn ra minh bạch với hợp đồng thông minh.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
              <h3 className="text-h6 font-bold text-slate-900 dark:text-white mb-3">
                3. Đầu tư có an toàn không, rủi ro là gì?
              </h3>
              <p className="text-body text-slate-600 dark:text-slate-400">
                Mọi hình thức đầu tư đều đi kèm với rủi ro nhất định. Tuy nhiên, tại InvestPro, chúng tôi áp dụng các tiêu chuẩn thẩm định dự án vô cùng khắt khe trước khi niêm yết. Số tiền của bạn được bảo lãnh an toàn và phân phối theo lộ trình dự án (Milestones) nhằm giảm thiểu tối đa rủi ro mất mát.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
              <h3 className="text-h6 font-bold text-slate-900 dark:text-white mb-3">
                4. Rút tiền lợi nhuận như thế nào?
              </h3>
              <p className="text-body text-slate-600 dark:text-slate-400">
                Khi dự án đạt lợi nhuận và tiến hành chi trả, tiền sẽ tự động được cộng vào ví của bạn (Balance). Từ đây, bạn có thể thực hiện lệnh "Rút tiền" từ ví về tài khoản ngân hàng cá nhân liên kết bất kỳ lúc nào. Giao dịch rút tiền thường mất từ 1-3 ngày làm việc.
              </p>
            </div>
          </div>
          
          <div className="mt-16 text-center border-t border-slate-200 dark:border-slate-800 pt-12">
            <h4 className="text-h5 font-bold mb-4">Vẫn cần hỗ trợ?</h4>
            <p className="text-slate-500 mb-6">Xin hãy liên hệ trực tiếp với đội ngũ hỗ trợ qua thư điện tử.</p>
            <a href="mailto:support@investpro.vn" className="inline-block px-8 py-3 rounded-xl bg-primary text-white font-bold hover:shadow-lg transition-all">
              Email cho chúng tôi
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
