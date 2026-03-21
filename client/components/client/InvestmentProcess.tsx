export default function InvestmentProcess() {
  const steps = [
    {
      icon: "person_add",
      title: "1. Đăng ký tài khoản",
      desc: "Tạo tài khoản và xác thực danh tính chỉ trong 2 phút.",
    },
    {
      icon: "search_insights",
      title: "2. Lựa chọn dự án",
      desc: "Tìm kiếm và phân tích các dự án phù hợp với mục tiêu của bạn.",
    },
    {
      icon: "account_balance_wallet",
      title: "3. Nhận lợi nhuận",
      desc: "Theo dõi tiến độ và nhận lợi nhuận trực tiếp về tài khoản.",
    },
  ];

  return (
    <section className="py-24 bg-primary text-white font-display">
      <div className="wrapper wrapper--lg text-center">
        <h3 className="text-h4 font-black mb-16 font-display">
          Quy trình đầu tư 3 bước đơn giản
        </h3>
        <div className="grid md:grid-cols-3 gap-12 relative">
          {steps.map((step, index) => (
            <div key={index} className="flex flex-col items-center gap-4">
              <div className="size-20 bg-white/10 rounded-full flex items-center justify-center border border-white/20 mb-4 shadow-xl">
                <span className="material-symbols-outlined !text-h3">
                  {step.icon}
                </span>
              </div>
              <h4 className="text-h6 font-bold">{step.title}</h4>
              <p className="text-small text-slate-400">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
