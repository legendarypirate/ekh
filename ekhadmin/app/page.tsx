"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function Home() {
  const { user, ready } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!ready) return;
    if (!user) router.replace("/login");
    else router.replace(user.role === "superadmin" ? "/admin" : "/dashboard");
  }, [ready, user, router]);
  return (
    <div className="login-bg">
      <div className="login">
        <div className="kicker">ЭНХЭХ</div>
        <h1>Ачааллаж байна…</h1>
      </div>
    </div>
  );
}
