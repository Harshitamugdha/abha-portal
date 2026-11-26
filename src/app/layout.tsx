import type { Metadata } from "next";
import { Noto_Sans } from "next/font/google";
import { SiteFooter } from "@/components/ui/site-footer";
import { SiteHeader } from "@/components/ui/site-header";
import "./globals.css";

const notoSans = Noto_Sans({
  variable: "--font-noto",
  subsets: ["latin", "devanagari"],
});

export const metadata: Metadata = {
  title: "ABHA Health Portal",
  description: "Your health records from every hospital, shared only with your consent.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${notoSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <SiteHeader />
        <div id="content" className="flex flex-col flex-1" tabIndex={-1}>
          {children}
        </div>
        <SiteFooter />
      </body>
    </html>
  );
}
