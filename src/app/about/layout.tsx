import type { Metadata } from "next";

const description =
  "Namu Park is a product designer in Brooklyn, New York — a fractional design partner for early-stage founders across consumer, B2B, fintech, AI, and healthcare.";

export const metadata: Metadata = {
  title: "About",
  description,
  openGraph: {
    title: "About — Namu Park",
    description,
    images: [
      {
        url: "/namupark-opengraph.png",
        width: 1200,
        height: 630,
        alt: "Namu Park Portfolio",
      },
    ],
    type: "profile",
  },
  twitter: {
    card: "summary_large_image",
    title: "About — Namu Park",
    description,
    images: ["/namupark-opengraph.png"],
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
