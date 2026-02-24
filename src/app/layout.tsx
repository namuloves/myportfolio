import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "../styles/globals.css";
import { Analytics } from "@vercel/analytics/next";

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
  openGraph: {
    title: "Namu Park Portfolio",
    description: "Making beautiful things that work",
    images: [
      {
        url: "/namupark-opengraph.png",
        width: 1200,
        height: 630,
        alt: "Namu Park Portfolio",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Namu Park Portfolio",
    description: "Making beautiful things that work",
    images: ["/namupark-opengraph.png"],
  },
};

const themeInitScript = `(() => {
  try {
    const storedTheme = window.localStorage.getItem("theme-preference");
    const theme =
      storedTheme === "light" || storedTheme === "dark"
        ? storedTheme
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
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
        <Analytics />
      </body>
    </html>
  );
}
