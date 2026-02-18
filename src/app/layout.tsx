import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "../styles/globals.css";

const abcDiatype = localFont({
  src: "../fonts/ABCDiatype-Regular.otf",
  variable: "--font-abc-diatype",
  weight: "400",
  style: "normal",
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Namu Park Portfolio",
  description: "Making beautiful things that work",
  icons: {
    icon: "/namu_favicon12.png",
  },
};

const themeInitScript = `(() => {
  try {
    const theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", theme);
  } catch {
    const fallbackTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", fallbackTheme);
  }
})();`;
 
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${abcDiatype.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
