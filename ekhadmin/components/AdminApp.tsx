"use client";

import { useEffect, useRef, useState } from "react";
import { bootAdmin } from "@/lib/enkhekh-admin";

export default function AdminApp() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    if (!document.getElementById("root")) {
      host.innerHTML = '<div id="root"></div><div id="modalroot"></div>';
    }
    bootAdmin();
    setReady(true);
  }, []);

  return (
    <>
      {!ready && (
        <div className="login-bg">
          <div className="login">
            <div className="kicker">ЭНХЭХ · ЭМНЭЛГИЙН СИСТЕМ</div>
            <h1>Системд нэвтрэх</h1>
            <p>Ачааллаж байна…</p>
          </div>
        </div>
      )}
      <div ref={hostRef} />
    </>
  );
}
