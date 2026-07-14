import type { Metadata } from "next";

const description =
  "Founding a peer-to-peer resale company (2019–2023) — designing tools that make selling secondhand clothing as effortless as buying it.";

export const metadata: Metadata = {
  title: "The Sloth",
  description,
  openGraph: {
    title: "The Sloth — Namu Park",
    description,
    images: [
      {
        url: "/og/thesloth.png",
        width: 1200,
        height: 630,
        alt: "The Sloth product board",
      },
    ],
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Sloth — Namu Park",
    description,
    images: ["/og/thesloth.png"],
  },
};

export default function TheSlothLayout({ children }: { children: React.ReactNode }) {
  return children;
}
