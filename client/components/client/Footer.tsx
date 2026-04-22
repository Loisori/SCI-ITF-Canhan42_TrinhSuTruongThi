//services
import Link from "next/link";
import {
  Rocket,
  Share2,
  Globe,
  AtSign,
  MapPin,
  Phone,
  Mail,
} from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-background-dark border-t border-slate-100 dark:border-white/10 pt-20 pb-10 font-display">
      <div className="wrapper wrapper--lg">
        <div className="grid md:grid-cols-4 gap-12 mb-16">
          {/* Cột 1: Brand & Social */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <Rocket className="text-primary dark:text-slate-100 text-h4" />
              <h1 className="text-h6 font-extrabold text-primary dark:text-slate-100">
                InvestPro
              </h1>
            </div>
            <p className="text-slate-500 text-smaller leading-relaxed mb-6">
              Đồng hành cùng sự phát triển của doanh nghiệp Việt và kiến tạo
              tương lai thịnh vượng cho nhà đầu tư.
            </p>
            <div className="flex gap-4">
              {[Share2, Globe, AtSign].map((Icon, index) => (
                <Link
                  key={index}
                  href="#"
                  className="size-10 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center hover:bg-primary hover:text-white transition-all text-slate-600 dark:text-slate-300"
                >
                  <Icon className="text-h6" />
                </Link>
              ))}
            </div>
          </div>

          {/* Cột 2: Khám phá */}
          <div>
            <h5 className="font-bold mb-6 text-primary dark:text-slate-100">
              Khám phá
            </h5>
            <ul className="space-y-4 text-smaller text-slate-500 dark:text-slate-400">
              <li>
                <Link className="hover:text-primary transition-colors" href="#">
                  Dự án Bất động sản
                </Link>
              </li>
              <li>
                <Link className="hover:text-primary transition-colors" href="#">
                  Dự án Công nghệ
                </Link>
              </li>
              <li>
                <Link className="hover:text-primary transition-colors" href="#">
                  Năng lượng xanh
                </Link>
              </li>
              <li>
                <Link className="hover:text-primary transition-colors" href="#">
                  Khởi nghiệp
                </Link>
              </li>
            </ul>
          </div>

          {/* Cột 3: Hỗ trợ */}
          <div>
            <h5 className="font-bold mb-6 text-primary dark:text-slate-100">
              Hỗ trợ
            </h5>
            <ul className="space-y-4 text-smaller text-slate-500 dark:text-slate-400">
              <li>
                <Link
                  href="/aboutus"
                  className="hover:text-primary transition-colors"
                >
                  Về chúng tôi
                </Link>
              </li>
              <li>
                <Link
                  className="hover:text-primary transition-colors"
                  href="/help"
                >
                  Trung tâm trợ giúp
                </Link>
              </li>
              <li>
                <Link
                  className="hover:text-primary transition-colors"
                  href="/privacy"
                >
                  Chính sách bảo mật
                </Link>
              </li>
              <li>
                <Link
                  className="hover:text-primary transition-colors"
                  href="/terms"
                >
                  Điều khoản dịch vụ
                </Link>
              </li>
              <li>
                <Link
                  className="hover:text-primary transition-colors"
                  href="/rules"
                >
                  Quy định đầu tư
                </Link>
              </li>
            </ul>
          </div>

          {/* Cột 4: Liên hệ */}
          <div>
            <Link
              href="/contact"
              className="text-small font-bold mb-6 text-primary dark:text-slate-100"
            >
              Liên hệ
            </Link>
            <ul className="space-y-4 text-smaller text-slate-500 dark:text-slate-400">
              <li className="flex items-start gap-2">
                <MapPin className="text-body" />
                <span>Tòa nhà Innovation, Quận 1, TP. HCM</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="text-body" />
                <span>1900 1234</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="text-body" />
                <span>contact@investpro.vn</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="pt-8 border-t border-slate-100 dark:border-white/10 text-center text-smallest text-slate-400">
          <p>© 2026 InvestPro. Bảo lưu mọi quyền.</p>
        </div>
      </div>
    </footer>
  );
}
