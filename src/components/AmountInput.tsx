"use client";

import { useState, useEffect } from "react";

interface Props {
  value: number;
  onChange: (v: number) => void;
}

export default function AmountInput({ value, onChange }: Props) {
  const [raw, setRaw] = useState(String(value));

  useEffect(() => {
    setRaw(String(value));
  }, [value]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const s = e.target.value.replace(/[^0-9.]/g, "");
    setRaw(s);
    const n = parseFloat(s);
    if (!isNaN(n) && n >= 0) onChange(n);
  }

  return (
    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm w-full max-w-xs focus-within:ring-2 focus-within:ring-blue-500">
      <span className="text-slate-400 text-lg font-semibold select-none">$</span>
      <input
        type="text"
        inputMode="decimal"
        value={raw}
        onChange={handleChange}
        className="flex-1 text-2xl font-bold text-slate-800 outline-none bg-transparent min-w-0"
        aria-label="Amount in USD to send"
        placeholder="500"
      />
      <span className="text-slate-400 text-sm font-medium select-none">USD</span>
    </div>
  );
}
