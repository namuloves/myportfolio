import type { Metadata } from "next";

const description =
  "Bringing class action claims to everyone — shaping ClaimClam's visual language and designing the consumer app from scratch, processing over $2M in payouts.";

export const metadata: Metadata = {
  title: "ClaimClam",
  description,
  openGraph: {
    title: "ClaimClam — Namu Park",
    description,
    images: [
      {
        url: "/og/claimclam.png",
        width: 1200,
        height: 630,
        alt: "ClaimClam consumer app",
      },
    ],
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "ClaimClam — Namu Park",
    description,
    images: ["/og/claimclam.png"],
  },
};

export default function ClaimClamLayout({ children }: { children: React.ReactNode }) {
  return children;
}
