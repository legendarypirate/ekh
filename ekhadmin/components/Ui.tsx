"use client";

import type { ReactNode } from "react";
import { tagClass, statusLabel } from "@/lib/api";

export function Heading({
  kicker,
  title,
  desc,
  actions,
}: {
  kicker: string;
  title: string;
  desc?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="heading">
      <div>
        <div className="kicker">{kicker}</div>
        <h1>{title}</h1>
        {desc ? <p>{desc}</p> : null}
      </div>
      {actions ? <div className="actions">{actions}</div> : null}
    </div>
  );
}

export function Tag({ status, children }: { status: string; children?: ReactNode }) {
  return <span className={`tag ${tagClass(status)}`}>{children || statusLabel(status)}</span>;
}

export function Who({ name, sub }: { name: string; sub?: string }) {
  return (
    <div className="who">
      <div className="person">{(name || "?").slice(-1)}</div>
      <div>
        <b>{name}</b>
        {sub ? <small>{sub}</small> : null}
      </div>
    </div>
  );
}

export function Empty({ title, desc }: { title: string; desc?: string }) {
  return (
    <div className="empty">
      <b>{title}</b>
      {desc ? <p>{desc}</p> : null}
    </div>
  );
}

export function ErrorBox({ message }: { message?: string | null }) {
  if (!message) return null;
  return <div className="loginerr">{message}</div>;
}
