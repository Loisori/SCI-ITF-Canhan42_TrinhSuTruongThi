"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Cookies from "js-cookie";

const AUTH_CHANGED_EVENT = "auth-changed";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const error = searchParams.get("error");

  useEffect(() => {
    if (error) {
      router.push(`/login?error=${error}`);
      return;
    }

    if (token) {
      // Lưu token vào Cookie
      Cookies.set("access_token", token, {
        expires: 1,
        path: "/",
      });

      // Thông báo cho hệ thống biết Auth đã thay đổi
      window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));

      // Redirect về dashboard
      router.push("/dashboard");
      router.refresh();
    } else {
      router.push("/login");
    }
  }, [token, error, router]);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col items-center justify-center p-6">
      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-8"></div>
      <h2 className="text-h5 font-bold text-slate-900 dark:text-white mb-2">
        Đang xác thực tài khoản Google...
      </h2>
      <p className="text-slate-500 text-center max-w-sm">
        Vui lòng đợi trong giây lát, chúng tôi đang thiết lập không gian làm việc của bạn.
      </p>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-8"></div>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
