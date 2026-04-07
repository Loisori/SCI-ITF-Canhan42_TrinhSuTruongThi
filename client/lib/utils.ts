export function formatVnd(amount: number | string) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (!num || !Number.isFinite(num)) return "0 đ";
  return `${num.toLocaleString("vi-VN")} đ`;
}

export function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
