export default function AdminDashboardPage() {
  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display min-h-screen">
      <div className="flex min-h-screen">
        <aside className="w-[25.6ren] bg-white dark:bg-primary border-r border-slate-200 dark:border-primary/50 flex flex-col">
          <div className="p-6 flex items-center gap-3">
            <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center text-white">
              <span className="material-symbols-outlined">
                account_balance_wallet
              </span>
            </div>
            <div className="flex flex-col">
              <h1 className="text-primary dark:text-white text-small font-bold leading-tight">
                InvestorHub
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-smallest">
                ID: INV-2024
              </p>
            </div>
          </div>
          <nav className="flex-1 px-4 space-y-1 mt-4">
            <a
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary text-white"
              href="#"
            >
              <span className="material-symbols-outlined text-[22px]">
                dashboard
              </span>
              <span className="text-smaller font-medium">Tổng quan</span>
            </a>
            <a
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
              href="#"
            >
              <span className="material-symbols-outlined text-[22px]">
                account_balance
              </span>
              <span className="text-smaller font-medium">Danh mục đầu tư</span>
            </a>
            <a
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
              href="/admin-dashboard/approval"
            >
              <span className="material-symbols-outlined text-[22px]">
                pending_actions
              </span>
              <span className="text-smaller font-medium">Duyệt dự án</span>
            </a>
            <a
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
              href="#"
            >
              <span className="material-symbols-outlined text-[22px]">
                history
              </span>
              <span className="text-smaller font-medium">Giao dịch</span>
            </a>
            <a
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
              href="#"
            >
              <span className="material-symbols-outlined text-[22px]">
                settings
              </span>
              <span className="text-smaller font-medium">Cài đặt</span>
            </a>
          </nav>
          <div className="p-4 border-t border-slate-200 dark:border-primary/50">
            <div className="flex items-center gap-3 p-2">
              <div
                className="size-8 rounded-full bg-slate-200"
                style={{
                  backgroundImage:
                    "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDt3FHvqYqJl1KPPDCcU5zmYE4gyZ6WdYxeJSHqLVDsh9z3B6iD9VSCe41MCYCUBHwVWQ0_1Rj2FLvZTNdnAi6YlWkxewJol87JxEQRkRctvcBcKpR7MUm1qEPrHAwbkbh71cvHT08s2jkDcaEJGW7W_dRah50USPvzYl8GIwWuLJwP19WNBGTEPaAsPR21bQnW-M3mK5vBFV36KnAWNro3S4zY__-s5CXRr3_3cf-t9b5a_GhX0QAyUzbM12CQ4Tk1ATH-4_Cz9yI')",
                }}
              ></div>
              <div className="flex flex-col overflow-hidden">
                <p className="text-smaller font-semibold truncate">
                  Nguyễn Văn A
                </p>
                <p className="text-smallest text-slate-500 truncate">
                  Pro Investor
                </p>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col min-w-0">
          <header className="h-16 bg-white dark:bg-primary/10 border-b border-slate-200 dark:border-primary/20 flex items-center justify-between px-8">
            <h2 className="text-body font-bold text-primary dark:text-slate-100">
              Bảng điều khiển
            </h2>
            <div className="flex items-center gap-4">
              <div className="relative hidden sm:block">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-smaller">
                  search
                </span>
                <input
                  className="pl-10 pr-4 py-1.5 bg-slate-100 dark:bg-white/5 border-none rounded-lg text-smaller w-[25.6ren] focus:ring-2 focus:ring-primary/20"
                  placeholder="Tìm kiếm tài sản..."
                  type="text"
                />
              </div>
              <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg relative">
                <span className="material-symbols-outlined">notifications</span>
                <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full"></span>
              </button>
              <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg">
                <span className="material-symbols-outlined">help_outline</span>
              </button>
            </div>
          </header>

          <div className="p-8 space-y-8 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-primary/40 p-6 rounded-xl border border-slate-200 dark:border-primary/50 shadow-sm">
                <p className="text-slate-500 dark:text-slate-400 text-smaller font-medium">
                  Tổng giá trị tài sản
                </p>
                <div className="flex items-baseline gap-2 mt-2">
                  <h3 className="text-h5 font-bold text-primary dark:text-white">
                    2.500.000.000 đ
                  </h3>
                  <span className="text-emerald-500 text-smaller font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-smallest">
                      trending_up
                    </span>
                    +5.2%
                  </span>
                </div>
              </div>
              <div className="bg-white dark:bg-primary/40 p-6 rounded-xl border border-slate-200 dark:border-primary/50 shadow-sm">
                <p className="text-slate-500 dark:text-slate-400 text-smaller font-medium">
                  Số dư khả dụng
                </p>
                <div className="flex items-baseline gap-2 mt-2">
                  <h3 className="text-h5 font-bold text-primary dark:text-white">
                    450.000.000 đ
                  </h3>
                  <span className="text-slate-400 text-smaller font-medium">
                    0%
                  </span>
                </div>
              </div>
              <div className="bg-white dark:bg-primary/40 p-6 rounded-xl border border-slate-200 dark:border-primary/50 shadow-sm">
                <p className="text-slate-500 dark:text-slate-400 text-smaller font-medium">
                  Tổng lợi nhuận đã nhận
                </p>
                <div className="flex items-baseline gap-2 mt-2">
                  <h3 className="text-h5 font-bold text-emerald-600 dark:text-emerald-400">
                    +12.5%
                  </h3>
                  <span className="text-emerald-500 text-smaller font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-smallest">
                      trending_up
                    </span>
                    +1.8%
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white dark:bg-primary/40 p-6 rounded-xl border border-slate-200 dark:border-primary/50 shadow-sm h-full">
                  <h4 className="text-base font-bold mb-6">Phân bổ danh mục</h4>
                  <div className="flex justify-center py-4 relative">
                    <div className="size-[19.2rem] rounded-full border-[16px] border-slate-100 dark:border-white/5 relative flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full border-[16px] border-primary border-r-transparent border-b-transparent -rotate-45"></div>
                      <div className="absolute inset-0 rounded-full border-[16px] border-blue-400 border-l-transparent border-t-transparent rotate-12"></div>
                      <div className="text-center">
                        <span className="text-h6 font-bold">100%</span>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                          Tài sản
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-8 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-primary"></span>
                        <span className="text-smaller">Bất động sản</span>
                      </div>
                      <span className="text-smaller font-bold">50%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-blue-400"></span>
                        <span className="text-smaller">Cổ phiếu</span>
                      </div>
                      <span className="text-smaller font-bold">30%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-emerald-400"></span>
                        <span className="text-smaller">Trái phiếu</span>
                      </div>
                      <span className="text-smaller font-bold">15%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-slate-300"></span>
                        <span className="text-smaller">Tiền mặt</span>
                      </div>
                      <span className="text-smaller font-bold">5%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-8">
                <div className="bg-white dark:bg-primary/40 p-6 rounded-xl border border-slate-200 dark:border-primary/50 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-base font-bold">Dự án đang đầu tư</h4>
                    <button className="text-smaller text-primary dark:text-blue-400 font-semibold hover:underline">
                      Xem tất cả
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 border border-slate-100 dark:border-white/5 rounded-lg">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary dark:text-white">
                        <span className="material-symbols-outlined">
                          apartment
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-smaller font-bold">
                          Vinhomes Grand Park
                        </p>
                        <p className="text-smallest text-slate-500">
                          Bất động sản dân dụng
                        </p>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between text-smallest mb-1">
                          <span>Tiến độ</span>
                          <span>75%</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-white/10 rounded-full h-1.5">
                          <div className="bg-primary h-full rounded-full w-[75%]"></div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-smaller font-bold text-emerald-600 dark:text-emerald-400">
                          +8.5%
                        </p>
                        <p className="text-[10px] text-slate-500">
                          Lợi nhuận thực tế
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 border border-slate-100 dark:border-white/5 rounded-lg">
                      <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                        <span className="material-symbols-outlined">
                          factory
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-smaller font-bold">
                          KCN Long Thành Phase 2
                        </p>
                        <p className="text-smallest text-slate-500">
                          Bất động sản công nghiệp
                        </p>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between text-smallest mb-1">
                          <span>Tiến độ</span>
                          <span>30%</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-white/10 rounded-full h-1.5">
                          <div className="bg-blue-400 h-full rounded-full w-[30%]"></div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-smaller font-bold text-emerald-600 dark:text-emerald-400">
                          +4.2%
                        </p>
                        <p className="text-[10px] text-slate-500">
                          Lợi nhuận thực tế
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-primary/40 p-6 rounded-xl border border-slate-200 dark:border-primary/50 shadow-sm">
                  <h4 className="text-base font-bold mb-6">
                    Giao dịch gần đây
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-smallest text-slate-500 uppercase border-b border-slate-100 dark:border-white/5">
                          <th className="pb-3 font-medium">Giao dịch</th>
                          <th className="pb-3 font-medium">Ngày</th>
                          <th className="pb-3 font-medium">Số tiền</th>
                          <th className="pb-3 font-medium">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="text-smaller">
                        <tr className="border-b border-slate-50 dark:border-white/5">
                          <td className="py-4 font-medium">Nạp tiền vào ví</td>
                          <td className="py-4 text-slate-500">12/05/2024</td>
                          <td className="py-4 text-emerald-600 font-bold">
                            +50.000.000 đ
                          </td>
                          <td className="py-4">
                            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 rounded-lg text-[10px] font-bold">
                              THÀNH CÔNG
                            </span>
                          </td>
                        </tr>
                        <tr className="border-b border-slate-50 dark:border-white/5">
                          <td className="py-4 font-medium">
                            Đầu tư Vinhomes Grand Park
                          </td>
                          <td className="py-4 text-slate-500">10/05/2024</td>
                          <td className="py-4 font-bold">-200.000.000 đ</td>
                          <td className="py-4">
                            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 rounded-lg text-[10px] font-bold">
                              THÀNH CÔNG
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td className="py-4 font-medium">
                            Rút tiền lợi nhuận
                          </td>
                          <td className="py-4 text-slate-500">05/05/2024</td>
                          <td className="py-4 font-bold">-15.000.000 đ</td>
                          <td className="py-4">
                            <span className="px-2 py-1 bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 rounded-lg text-[10px] font-bold">
                              CHỜ XỬ LÝ
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-primary/5 dark:bg-white/5 border border-primary/20 p-6 rounded-xl flex items-start gap-4">
              <div className="p-2 bg-primary rounded-lg text-white">
                <span className="material-symbols-outlined">campaign</span>
              </div>
              <div>
                <h5 className="font-bold text-smaller">Thông báo quan trọng</h5>
                <p className="text-smaller text-slate-600 dark:text-slate-400 mt-1">
                  Cơ hội đầu tư mới tại khu vực miền Trung sẽ được mở bán vào
                  ngày 20/05. Vui lòng kiểm tra ví để đảm bảo số dư khả dụng tối
                  thiểu 100.000.000đ để tham gia suất ưu tiên.
                </p>
                <button className="mt-3 text-smaller font-bold text-primary dark:text-blue-400 flex items-center gap-1">
                  Tìm hiểu ngay{" "}
                  <span className="material-symbols-outlined text-smaller">
                    chevron_right
                  </span>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
