import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { fontVariables } from "@/lib/fonts";
import "../globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Istanbul Hostel · Staff", template: "%s · Istanbul Hostel" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#1e2227", width: "device-width", initialScale: 1 };

export default function StaffRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontVariables}>
      <body className="min-h-dvh bg-limestone">
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
