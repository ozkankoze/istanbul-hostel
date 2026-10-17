import "server-only";
import QRCode from "qrcode";

export function qrTargetUrl(path: string) {
  const base = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const sep = path.includes("?") ? "&" : "?";
  return `${base}${path}${sep}src=qr`;
}

const opts = { errorCorrectionLevel: "M" as const, margin: 2, color: { dark: "#1e2227", light: "#ffffff" } };

export function qrSvg(url: string) {
  return QRCode.toString(url, { ...opts, type: "svg" });
}

export function qrPng(url: string, width = 1024) {
  return QRCode.toBuffer(url, { ...opts, type: "png", width });
}
