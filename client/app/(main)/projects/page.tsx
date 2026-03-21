"use client";

import Link from "next/link";
import Navbar from "@/components/client/Navbar";
import Footer from "@/components/client/Footer";

export default function ProjectList() {
  // Mock data để render danh sách nhanh
  const projects = [
    {
      id: 1,
      title: "Căn hộ cao cấp Vista TP.HCM",
      location: "Quận 2, TP. Hồ Chí Minh",
      category: "BĐS",
      apy: "12.5%",
      minInvest: "50.000.000đ",
      progress: 75,
      raised: "15/20 tỷ",
      timeLeft: "20 ngày",
      status: "Đang mở",
      img: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=400&q=80",
    },
    {
      id: 2,
      title: "Trang trại điện gió Alpha",
      location: "Tuy Phong, Bình Thuận",
      category: "Năng lượng",
      apy: "15.0%",
      minInvest: "100.000.000đ",
      progress: 0,
      raised: "0/150 tỷ",
      timeLeft: "3 ngày",
      status: "Sắp ra mắt",
      img: "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&w=400&q=80",
    },
    {
      id: 3,
      title: "Hệ thống AI Cloud Nexus",
      location: "Khu Công nghệ cao, Hà Nội",
      category: "Công nghệ",
      apy: "22.0%",
      minInvest: "20.000.000đ",
      progress: 92,
      raised: "18.4/20 tỷ",
      timeLeft: "2 ngày",
      status: "Đang mở",
      img: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80",
    },
  ];

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen font-display">
      {/* Header Section */}
      <Navbar />
      <main>
        <div className="wrapper wrapper--lg flex flex-col gap-2 mb-8">
          <h1 className="text-h3 md:text-h2 font-black text-slate-900 dark:text-white tracking-tight">
            Cơ hội đầu tư tiềm năng
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-body max-w-2xl">
            Đa dạng hóa danh mục đầu tư của bạn với các dự án bất động sản, năng
            lượng tái tạo và công nghệ đột phá.
          </p>
        </div>

        {/* Search & Filter Section */}
        <div className="wrapper wrapper--lg  flex flex-col gap-6 mb-10">
          <div className="w-full">
            <div className="flex w-full items-stretch rounded-xl h-14 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="text-slate-400 flex items-center justify-center pl-5">
                <span className="material-symbols-outlined">search</span>
              </div>
              <input
                className="flex-1 px-4 text-smaller focus:outline-none bg-transparent border-none focus:ring-0 text-slate-900 dark:text-white placeholder:text-slate-500"
                placeholder="Tìm kiếm dự án theo tên, địa điểm hoặc từ khóa..."
              />
              <button className="bg-primary text-white px-6 font-bold m-1.5 rounded-lg hover:opacity-90 transition-opacity">
                Tìm kiếm
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-smallest font-semibold text-slate-500 uppercase tracking-wider mr-2">
              <span className="material-symbols-outlined text-small">
                filter_list
              </span>{" "}
              Lọc:
            </div>
            <button className="px-4 py-2 rounded-full bg-primary text-white text-smaller font-medium">
              Tất cả
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-smaller font-medium">
              <span className="material-symbols-outlined text-small">
                apartment
              </span>{" "}
              Bất động sản
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-smaller font-medium">
              <span className="material-symbols-outlined text-small">bolt</span>{" "}
              Năng lượng
            </button>
          </div>
        </div>

        {/* Grid Projects */}
        <div className="wrapper wrapper--lg  grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project) => (
            <div
              key={project.id}
              className="group flex flex-col bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300"
            >
              <div className="relative w-full aspect-[16/10] overflow-hidden">
                <img
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  src={project.img}
                  alt={project.title}
                />
                <div
                  className={`absolute top-4 left-4 ${project.status === "Đang mở" ? "bg-green-500" : "bg-blue-500"} text-white text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-wider`}
                >
                  {project.status}
                </div>
              </div>
              <div className="p-5 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-h6 font-bold text-slate-900 dark:text-white leading-tight">
                    {project.title}
                  </h3>
                  <span className="bg-primary/10 text-primary dark:bg-white/10 dark:text-white text-smallest font-bold px-2 py-1 rounded">
                    {project.category}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-smaller mb-4">
                  <span className="material-symbols-outlined text-small">
                    location_on
                  </span>{" "}
                  {project.location}
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6 py-4 border-y border-slate-100 dark:border-slate-800">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                      Lợi nhuận (APY)
                    </p>
                    <p className="text-h6 font-bold text-green-600 dark:text-green-400">
                      {project.apy}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                      Vốn tối thiểu
                    </p>
                    <p className="text-h6 font-bold text-slate-900 dark:text-white">
                      {project.minInvest}
                    </p>
                  </div>
                </div>
                <div className="mb-6">
                  <div className="flex justify-between text-smaller mb-1.5">
                    <span className="text-slate-600 dark:text-slate-400">
                      Tiến độ huy động
                    </span>
                    <span className="font-bold text-primary dark:text-white">
                      {project.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-primary h-full"
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                </div>
                <button
                  className={`w-full py-3 ${project.status === "Đang mở" ? "bg-primary text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"} font-bold rounded-lg mt-auto transition-colors`}
                >
                  {project.status === "Đang mở"
                    ? "Xem chi tiết"
                    : "Đặt chỗ trước"}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Bottom */}
        <div className="wrapper wrapper--lg  mt-16 flex flex-col items-center gap-6 py-10 bg-primary rounded-2xl text-white px-6 text-center">
          <h2 className="text-h4 font-bold">Bạn đang có dự án cần gọi vốn?</h2>
          <p className="text-slate-400 max-w-xl text-smaller">
            Hợp tác cùng InvestPro để kết nối với mạng lưới hơn 50.000 nhà đầu
            tư uy tín trên toàn quốc.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button className="bg-white text-primary px-8 py-3 rounded-lg font-bold hover:bg-slate-100 transition-colors">
              Đăng ký ngay
            </button>
            <button className="border border-white/30 px-8 py-3 rounded-lg font-bold hover:bg-white/10 transition-colors">
              Liên hệ tư vấn
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
