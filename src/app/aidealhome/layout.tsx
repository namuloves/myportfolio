import type { Metadata } from "next";

const description =
  "Design partner for a stealth fintech team — three hero screens and a complete deal-room workflow that validated the product and unlocked their first round.";

export const metadata: Metadata = {
  title: "AI Deal Home",
  description,
  openGraph: {
    title: "AI Deal Home — Namu Park",
    description,
    images: [
      {
        url: "/og/aidealhome.png",
        width: 1200,
        height: 630,
        alt: "AI Deal Home dashboard",
      },
    ],
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Deal Home — Namu Park",
    description,
    images: ["/og/aidealhome.png"],
  },
};

export default function AiDealHomeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
