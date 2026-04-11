"use client";

import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/client/Navbar";
import Footer from "@/components/client/Footer";
import { Globe, ShieldCheck, Calendar, TrendingUp, Award } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen font-display">
      <Navbar />
      <main>
        {/* 1. Hero Section */}
        <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
          <Image
            src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1920&q=80"
            alt="Office building"
            fill
            className="object-cover brightness-[0.4]"
          />
          <div className="relative z-10 text-center px-4 max-w-4xl">
            <h1 className="text-h3 md:text-h1 font-black text-white mb-6 leading-tight">
              Kết nối nhà đầu tư với các giá trị bền vững
            </h1>
            <p className="text-body text-slate-300 max-w-2xl mx-auto">
              InvestPro hướng tới trở thành cầu nối tin cậy, thúc đẩy các giải
              pháp đầu tư có trách nhiệm và mang lại giá trị dài hạn cho cộng
              đồng toàn cầu.
            </p>
          </div>
        </section>

        {/* 2. Vision & Mission */}
        <section className="py-24 ">
          <div className="wrapper wrapper--lg ">
            <div className="text-center mb-16">
              <p className="text-smaller font-bold uppercase tracking-widest text-slate-500 mb-2">
                Tầm nhìn & Sứ mệnh
              </p>
              <h2 className="text-h3 font-black text-primary dark:text-white">
                Định hình tương lai tài chính xanh
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="p-10 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/5">
                <Globe className="text-h4 text-primary dark:text-slate-400 mb-4" />
                <h3 className="text-h5 font-bold mb-4">Tầm nhìn chiến lược</h3>
                <p className="text-body text-slate-600 dark:text-slate-400 leading-relaxed">
                  Trở thành định chế tài chính hàng đầu khu vực trong việc tiên
                  phong các tiêu chuẩn ESG (Môi trường - Xã hội - Quản trị),
                  kiến tạo hệ sinh thái đầu tư minh bạch và bền vững cho thế hệ
                  tương lai.
                </p>
              </div>
              <div className="p-10 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/5">
                <ShieldCheck className="text-h4 text-primary dark:text-slate-400 mb-4" />
                <h3 className="text-h5 font-bold mb-4">Sứ mệnh hành động</h3>
                <p className="text-body text-slate-600 dark:text-slate-400 leading-relaxed">
                  Tối ưu hóa lợi nhuận cho nhà đầu tư thông qua các chiến lược
                  quản lý rủi ro thông minh, đồng thời trực tiếp đóng góp vào
                  các dự án giảm thiểu biến đổi khí hậu và phát triển an sinh xã
                  hội.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Timeline Section (Các cột mốc) */}
        <section className="py-24 px-6 md:px-20">
          <div className="wrapper wrapper--md">
            <div className="text-center mb-16">
              <span className="text-primary font-bold tracking-widest uppercase text-smaller">
                Hành trình phát triển
              </span>
              <h2 className="text-h4 md:text-h3 font-bold mt-4">
                Các cột mốc quan trọng
              </h2>
            </div>
            <div className="relative space-y-12 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-primary text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                  <Calendar className="size-4" />
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[45%] p-6 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700">
                  <time className="text-small font-bold text-primary">
                    2018
                  </time>
                  <div className="text-body font-bold mt-1">
                    Khởi nguồn ý tưởng
                  </div>
                  <p className="text-small text-slate-500 mt-2">
                    InvestPro được thành lập bởi nhóm chuyên gia tài chính tâm
                    huyết với mục tiêu thay đổi cách thức đầu tư truyền thống.
                  </p>
                </div>
              </div>
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-primary text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                  <TrendingUp className="size-4" />
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[45%] p-6 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700">
                  <time className="text-small font-bold text-primary">
                    2020
                  </time>
                  <div className="text-body font-bold mt-1">
                    Mở rộng danh mục ESG
                  </div>
                  <p className="text-small text-slate-500 mt-2">
                    Đạt cột mốc 500 triệu USD tổng tài sản quản lý, tập trung
                    100% vào các dự án năng lượng tái tạo.
                  </p>
                </div>
              </div>
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-primary text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                  <Award className="size-4" />
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[45%] p-6 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700">
                  <time className="text-small font-bold text-primary">
                    2023
                  </time>
                  <div className="text-body font-bold mt-1">
                    Định chế uy tín quốc tế
                  </div>
                  <p className="text-small text-slate-500 mt-2">
                    Nhận giải thưởng "Nhà quản lý quỹ bền vững xuất sắc nhất
                    năm" tại khu vực Đông Nam Á.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* <!-- Strategic Partners Section --> */}
        <section className="py-24 px-6 md:px-20 bg-primary text-white">
          <div className="wrapper wrapper--lg">
            <div className="flex flex-col md:flex-row items-center justify-between gap-12">
              <div className="md:w-1/3">
                <h2 className="text-h4 font-bold mb-6">Đối tác chiến lược</h2>
                <p className="text-small text-slate-300 leading-relaxed">
                  Chúng tôi hợp tác với các định chế tài chính, tổ chức phi
                  chính phủ và các tập đoàn công nghệ hàng đầu thế giới để hiện
                  thực hóa sứ mệnh bền vững.
                </p>
              </div>
              <div className="md:w-2/3 grid grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="bg-white/10 h-24 rounded-lg flex items-center justify-center p-6 backdrop-blur-sm grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all cursor-pointer">
                  <div className="text-h6 font-bold tracking-tighter">
                    GLOBAL BANK
                  </div>
                </div>
                <div className="bg-white/10 h-24 rounded-lg flex items-center justify-center p-6 backdrop-blur-sm grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all cursor-pointer">
                  <div className="text-h6 font-bold tracking-tighter">
                    ECO FUND
                  </div>
                </div>
                <div className="bg-white/10 h-24 rounded-lg flex items-center justify-center p-6 backdrop-blur-sm grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all cursor-pointer">
                  <div className="text-h6 font-bold tracking-tighter">
                    TECH VENTURE
                  </div>
                </div>
                <div className="bg-white/10 h-24 rounded-lg flex items-center justify-center p-6 backdrop-blur-sm grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all cursor-pointer">
                  <div className="text-h6 font-bold tracking-tighter">
                    GREEN ALLY
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* 4. Leadership Section */}
        <section className="py-24">
          <div className="wrapper wrapper--lg">
            <div className="text-center mb-16">
              <p className="text-smaller font-bold uppercase tracking-widest text-slate-500 mb-2">
                Đội ngũ dẫn dắt
              </p>
              <h2 className="text-h3 font-black">Ban lãnh đạo</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <LeaderCard
                name="Lê Quang Minh"
                role="CEO & Người sáng lập"
                img="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80"
              />
              <LeaderCard
                name="Nguyễn Thu Hà"
                role="Giám đốc Chiến lược ESG"
                img="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80"
              />
              <LeaderCard
                name="Trần Hoàng Nam"
                role="Giám đốc Quản lý Quỹ"
                img="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80"
              />
            </div>
          </div>
        </section>

        {/* 5. CTA Section */}
        <section className="py-20 bg-slate-50 dark:bg-slate-900 text-center">
          <h3 className="text-h4 font-black mb-6">
            Sẵn sàng đồng hành cùng InvestPro?
          </h3>
          <div className="flex justify-center gap-4">
            <button className="bg-primary text-white px-8 py-3 rounded-lg font-bold hover:bg-slate-800 transition-all">
              Bắt đầu đầu tư
            </button>
            <button className="border border-primary/20 px-8 py-3 rounded-lg font-bold hover:bg-slate-100 dark:hover:bg-white/5 transition-all">
              Tìm hiểu thêm
            </button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function LeaderCard({
  name,
  role,
  img,
}: {
  name: string;
  role: string;
  img: string;
}) {
  return (
    <div className="flex flex-col group">
      <div className="relative aspect-[3/4] rounded-2xl overflow-hidden mb-4">
        <Image
          src={img}
          alt={name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <h4 className="text-h6 font-bold">{name}</h4>
      <p className="text-smaller text-slate-500">{role}</p>
    </div>
  );
}
