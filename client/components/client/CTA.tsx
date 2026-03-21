export default function CTA() {
  return (
    <section className="py-20 px-4 font-display">
      <div className="max-w-[102.4rem] mx-auto bg-primary rounded-3xl p-12 text-center text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10">
          <h3 className="text-h4 font-black mb-4">
            Sẵn sàng để bắt đầu hành trình đầu tư?
          </h3>
          <p className="text-small text-slate-400 mb-8 max-w-[57.6rem] mx-auto">
            Gia nhập cộng đồng 15,000+ nhà đầu tư thông minh ngay hôm nay để
            nhận thông báo về những dự án sớm nhất.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <input
              className="px-6 py-4 rounded-xl text-primary bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-80"
              placeholder="Email của bạn"
              type="email"
            />
            <button className="px-8 py-4 bg-white/10 border border-white/20 text-white text-small font-bold rounded-xl hover:bg-white hover:text-primary transition-all backdrop-blur-sm">
              Đăng ký ngay
            </button>
          </div>
        </div>
        {/* Background Decoration */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <svg
            className="w-full h-full"
            preserveAspectRatio="none"
            viewBox="0 0 100 100"
          >
            <path
              d="M0 100 C 20 0 50 0 100 100"
              fill="transparent"
              stroke="white"
              strokeWidth="0.5"
            ></path>
          </svg>
        </div>
      </div>
    </section>
  );
}
