import { useEffect, useRef } from "react";

let _setToast: ((msg: string, type?: string) => void) | null = null;

export function toast(msg: string, type: "ok" | "err" | "" = "") {
  _setToast?.(msg, type);
}

export function ToastContainer() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    _setToast = (msg, type = "") => {
      const el = ref.current;
      if (!el) return;
      el.textContent = msg;
      el.className = `toast show ${type}`;
      clearTimeout((el as any)._t);
      (el as any)._t = setTimeout(() => { el.className = "toast"; }, 2400);
    };
    return () => { _setToast = null; };
  }, []);

  return <div ref={ref} className="toast" />;
}
