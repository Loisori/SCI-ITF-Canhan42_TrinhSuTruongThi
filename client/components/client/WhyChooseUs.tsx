export default function WhyChooseUs() {
  const features = [
    {
      icon: "verified_user",
      title: "Uy tín hàng đầu",
      desc: "Đối tác tin cậy của hơn 100 doanh nghiệp lớn.",
      offset: false,
    },
    {
      icon: "security",
      title: "Bảo mật tuyệt đối",
      desc: "Hệ thống mã hóa dữ liệu chuẩn ngân hàng.",
      offset: true,
    },
    {
      icon: "visibility",
      title: "Minh bạch 100%",
      desc: "Mọi báo cáo tài chính đều được công khai.",
      offset: false,
    },
    {
      icon: "support_agent",
      title: "Hỗ trợ 24/7",
      desc: "Đội ngũ chuyên gia luôn sẵn sàng giải đáp.",
      offset: true,
    },
  ];

  return (
    <section className="py-24  font-display">
      <div className="wrapper wrapper--lg grid md:grid-cols-2 gap-16 items-center">
        <div className="grid grid-cols-2 gap-4">
          {features.map((f, i) => (
            <div
              key={i}
              className={`p-8 bg-white dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10 flex flex-col gap-4 shadow-sm ${f.offset ? "translate-y-8" : ""}`}
            >
              <span className="material-symbols-outlined text-primary dark:text-slate-100 text-h3">
                {f.icon}
              </span>
              <h5 className="font-bold text-body">{f.title}</h5>
              <p className="text-smaller text-slate-500">{f.desc}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-6">
          <h3 className="text-h3 font-black text-primary dark:text-slate-100">
            Tại sao nên chọn InvestPro?
          </h3>
          <p className="text-body text-slate-600 dark:text-slate-400 leading-relaxed">
            Chúng tôi xây dựng một hệ sinh thái tài chính an toàn, nơi mỗi đồng
            vốn của bạn được bảo vệ bằng công nghệ AI tiên tiến nhất.
          </p>
          <ul className="space-y-4">
            {[
              "Sàng lọc dự án gắt gao",
              "Cam kết tiến độ hoàn thành",
              "Cộng đồng nhà đầu tư vững mạnh",
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-3">
                <span className="material-symbols-outlined text-green-500">
                  check_circle
                </span>
                <span className="text-small font-semibold">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
