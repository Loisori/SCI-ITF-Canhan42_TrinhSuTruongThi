"use client";

import React, { useState } from "react";
import Navbar from "@/components/client/Navbar"; // Đảm bảo đúng đường dẫn Navbar của bạn

export default function ContactPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    subject: "Portfolio Management Inquiry",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Dữ liệu gửi đi:", formData);
    alert("Cảm ơn Lợi! Yêu cầu của bạn đã được ghi nhận.");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="py-16 font-display">
        {/* Header Section */}

        <div className="wrapper wrapper--lg">
          <div className="mb-16">
            <p className="text-smallest font-bold tracking-widest uppercase text-slate-500 mb-4">
              Liên hệ với đội ngũ InvestPro
            </p>
            <h1 className="text-h3 md:text-h2 font-bold text-slate-900 dark:text-white tracking-tight mb-6">
              Sự chuyên nghiệp chỉ cách bạn <br />
              <span className="text-primary/60">một cuộc hội thoại.</span>
            </h1>
            <p className="text-body text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
              Cho dù bạn đang tìm kiếm thông tin thị trường hay cần hỗ trợ về
              danh mục đầu tư, đội ngũ chuyên gia của chúng tôi luôn sẵn sàng
              giúp đỡ.
            </p>
          </div>

          {/* Main Grid: Form and Support Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Contact Form Column */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-8 md:p-10 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-8">
                Gửi yêu cầu hỗ trợ
              </h2>

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">
                      Họ và tên
                    </label>
                    <input
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-primary outline-none transition-all text-slate-900 dark:text-white"
                      placeholder="Huỳnh Viết Lợi"
                      type="text"
                      required
                      onChange={(e) =>
                        setFormData({ ...formData, fullName: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">
                      Địa chỉ Email
                    </label>
                    <input
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-primary outline-none transition-all text-slate-900 dark:text-white"
                      placeholder="loi@example.com"
                      type="email"
                      required
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">
                    Chủ đề
                  </label>
                  <select
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-primary outline-none transition-all text-slate-900 dark:text-white appearance-none"
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData({ ...formData, subject: e.target.value })
                    }
                  >
                    <option>Truy vấn quản lý danh mục</option>
                    <option>Hỗ trợ kỹ thuật</option>
                    <option>Hợp tác đầu tư</option>
                    <option>Truyền thông & Báo chí</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">
                    Tin nhắn
                  </label>
                  <textarea
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-primary outline-none transition-all text-slate-900 dark:text-white"
                    placeholder="Chúng tôi có thể giúp gì cho bạn?"
                    rows={5}
                    required
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                  ></textarea>
                </div>

                <button
                  className="w-full md:w-auto px-10 py-4 bg-primary text-white font-bold rounded-xl shadow-lg hover:opacity-90 transition-all active:scale-[0.98]"
                  type="submit"
                >
                  Gửi tin nhắn
                </button>
              </form>
            </div>

            {/* Support Cards Column */}
            <div className="lg:col-span-5 space-y-6">
              {/* Live Chat Card */}
              <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-start gap-5 hover:border-primary/50 transition-colors">
                <div className="bg-primary text-white p-3 rounded-xl shadow-md shadow-primary/20">
                  <span
                    className="material-symbols-outlined"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    chat
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    Trò chuyện trực tiếp
                  </h3>
                  <p className="text-small text-slate-500 mb-3">
                    Hỗ trợ tức thì cho các nhà đầu tư đang hoạt động.
                  </p>
                  <span className="text-[10px] font-bold text-green-600 dark:text-green-400 flex items-center gap-1.5 uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    CHỜ ĐỢI TB: 2 PHÚT
                  </span>
                  <button className="mt-4 text-small font-bold text-primary hover:underline block">
                    Bắt đầu trò chuyện
                  </button>
                </div>
              </div>

              {/* Email & Phone Cards */}
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-xl">
                      mail
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">
                      Email Support
                    </p>
                    <p className="text-small font-bold text-slate-700 dark:text-slate-200">
                      support@investpro.com
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-xl">
                      call
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">
                      Điện thoại
                    </p>
                    <p className="text-small font-bold text-slate-700 dark:text-slate-200">
                      +84 (1800) INVEST
                    </p>
                  </div>
                </div>
              </div>

              {/* Address Card */}
              <div className="bg-slate-900 text-white p-8 rounded-2xl relative overflow-hidden group">
                <div className="relative z-10">
                  <h3 className="font-bold text-body mb-2">Trụ sở chính</h3>
                  <p className="text-small text-slate-400 leading-relaxed mb-6">
                    Quận 1, Thành phố Hồ Chí Minh
                    <br />
                    Bitexco Financial Tower
                    <br />
                    Việt Nam
                  </p>
                  <button className="flex items-center gap-2 text-small font-bold text-primary group-hover:gap-3 transition-all">
                    Xem trên bản đồ{" "}
                    <span className="material-symbols-outlined text-small">
                      arrow_forward
                    </span>
                  </button>
                </div>
                <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-[120px]">
                    location_on
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Map Section Overlay */}
          <div className="mt-12 p-1 bg-gradient-to-r from-primary/20 to-transparent rounded-2xl">
            <div className="bg-white dark:bg-slate-950 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                  Ghé thăm văn phòng
                </h2>
                <p className="text-slate-500 mb-6 leading-relaxed">
                  Tọa lạc tại trung tâm tài chính của Sài Gòn, cửa của chúng tôi
                  luôn mở rộng cho các buổi tư vấn trực tiếp theo lịch hẹn.
                </p>
                <div className="flex flex-wrap gap-4">
                  <button className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:shadow-lg transition-all">
                    Chỉ đường
                  </button>
                  <button className="px-6 py-3 border border-slate-200 dark:border-slate-800 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all text-slate-700 dark:text-slate-300">
                    Đặt lịch hẹn
                  </button>
                </div>
              </div>
              <div className="h-64 bg-slate-100 dark:bg-slate-900 rounded-xl overflow-hidden relative border border-slate-200 dark:border-slate-800">
                {/* Bạn có thể nhúng Iframe Google Map vào đây */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center shadow-2xl ring-8 ring-primary/20 animate-bounce">
                    <span className="material-symbols-outlined">
                      location_on
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
