"use client";

import Navbar from "@/components/client/Navbar";
import Footer from "@/components/client/Footer";
import { Gavel, Banknote, Lock } from "lucide-react";

export default function InvestmentRulesPage() {
  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen font-display">
      <Navbar />
      <main className="wrapper wrapper--md py-16 md:py-24">
        <div className="max-w-3xl mx-auto">
          <div className="mb-12 text-center md:text-left">
            <h1 className="text-h3 md:text-h2 font-black text-slate-900 dark:text-white mb-4">
              Quy định đầu tư
            </h1>
            <p className="text-body text-slate-500">
              Tiêu chuẩn và Quy trình Bảo vệ Nhà Đầu Tư từ InvestPro
            </p>
          </div>

          <div className="space-y-8">
            <div className="bg-primary/5 dark:bg-white/5 border border-primary/20 p-8 rounded-2xl">
               <h3 className="text-h5 font-bold text-primary dark:text-slate-100 mb-4 flex items-center gap-2">
                 <Gavel />
                 1. Xác thực Danh Tính (KYC)
               </h3>
               <p className="text-slate-600 dark:text-slate-400">
                 Tất cả người dùng khi kích hoạt tính năng nạp tiền và tham gia các chiến dịch cấp vốn (Capital Campaigns) đều phải cung cấp CMND/CCCD hợp lệ. Giao dịch rút tiền chỉ được cấp phép khi Tên Tài Khoản Ngân Hàng đồng nhất với Tên Đăng Ký Hệ Thống.
               </p>
            </div>

            <div className="bg-primary/5 dark:bg-white/5 border border-primary/20 p-8 rounded-2xl">
               <h3 className="text-h5 font-bold text-primary dark:text-slate-100 mb-4 flex items-center gap-2">
                 <Banknote />
                 2. Xác nhận Khởi Tạo khoản Đầu Tư
               </h3>
               <p className="text-slate-600 dark:text-slate-400">
                 Mỗi khi chọn đầu tư, số tiền sẽ bị "khóa" trên Hợp đồng Thông minh (Smart Contract). Cổ phần dự án / Khế ước đóng góp chỉ kích hoạt khi dự án Vượt Target (%) số tiền huy động tối thiểu do Owner đưa ra. Khách hàng <strong>được quyền Hủy Đầu Tư</strong> và nhận hoàn tiền 100% trong 24H nếu dự án vẫn ở Giai đoạn Thu thập.
               </p>
            </div>

            <div className="bg-primary/5 dark:bg-white/5 border border-primary/20 p-8 rounded-2xl">
               <h3 className="text-h5 font-bold text-primary dark:text-slate-100 mb-4 flex items-center gap-2">
                 <Lock />
                 3. Phát hành Lợi nhuận & Cột mốc
               </h3>
               <p className="text-slate-600 dark:text-slate-400">
                 Lợi nhuận được thanh toán theo kỳ (hoặc cuối kỳ T+D) theo cam kết lợi suất từ phía Chủ Dự Án. Hệ thống InvestPro thu khoản phí quản lý định kỳ <strong>0.5%</strong> / giao dịch thành công. Việc chi trả dựa trên xác thực cột mốc tiến độ dự án mà Hội Đồng Quản Trị của chúng tôi đã thẩm định.
               </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
