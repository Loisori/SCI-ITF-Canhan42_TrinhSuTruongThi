"use client";
import { Suspense } from "react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/client/Navbar";
import Footer from "@/components/client/Footer";

function DepositSuccessInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const code = searchParams.get("code");
  const amount = searchParams.get("amount");
  const [showToast, setShowToast] = useState(false);

  const isSuccess = status === "success";

  useEffect(() => {
    if (!isSuccess) {
      return;
    }

    setShowToast(true);
    window.dispatchEvent(new Event("auth-changed"));
    router.refresh();

    const timer = window.setTimeout(() => {
      setShowToast(false);
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [isSuccess, router]);

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen font-display">
      <Navbar />
      <main className="wrapper wrapper--sm py-16">
        {showToast ? (
          <div className="fixed top-20 right-6 z-[60] rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-small font-semibold text-green-700 shadow-lg">
            Nạp tiền thành công, số dư đã được cập nhật.
          </div>
        ) : null}

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center">
          <h1
            className={`text-h3 font-bold mb-3 ${
              isSuccess ? "text-green-600" : "text-red-600"
            }`}
          >
            {isSuccess ? "Nạp tiền thành công" : "Nạp tiền chưa thành công"}
          </h1>

          <p className="text-slate-600 dark:text-slate-400 mb-6">
            {isSuccess
              ? `Số dư ví của bạn đã được cập nhật${
                  amount ? ` (+${Number(amount).toLocaleString()} VND)` : ""
                }.`
              : `VNPay trả về mã lỗi: ${code ?? "unknown"}. Vui lòng thử lại.`}
          </p>

          <Link
            href="/dashboard"
            className="inline-flex px-6 py-2 rounded-lg bg-primary text-white font-bold"
          >
            Quay lại Dashboard
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function DepositSuccessPage() {
  return (
    <Suspense fallback={<div>Đang tải kết quả thanh toán...</div>}>
      <DepositSuccessInner />
    </Suspense>
  );
}
