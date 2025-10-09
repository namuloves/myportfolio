import Link from "next/link";
import Image from "next/image";
import styles from "@/styles/home.module.css";

interface CardProps {
  title: string;
  href?: string;
  image?: string;
  video?: string;
  comingSoon?: boolean;
  hoverLabel?: string;
  subtitle?: string;
  disableHoverDim?: boolean;
}

export default function CaseStudyCard({
  title,
  href,
  image,
  video,
  comingSoon,
  hoverLabel,
  subtitle,
  disableHoverDim,
}: CardProps) {
  const hasMedia = Boolean(image || video);

  const cardClassName = [
    styles.card,
    hasMedia ? styles.cardWithMedia : "",
    image ? styles.cardWithImage : "",
    video ? styles.cardWithVideo : "",
    disableHoverDim ? styles.noHoverDim : "",
  ]
    .filter(Boolean)
    .join(" ");

  const overlay = hoverLabel ? (
    <div className={styles.mediaOverlay}>
      <span>{hoverLabel}</span>
    </div>
  ) : null;

  const mediaContent = image ? (
    <div className={styles.imageWrapper}>
      <Image
        src={image}
        alt={title}
        width={1000}
        height={1000}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
        unoptimized
      />
      {overlay}
    </div>
  ) : video ? (
    <div className={styles.videoWrapper}>
      <video
        src={video}
        autoPlay
        loop
        muted
        playsInline
        controls={true}
        preload="auto"
        onError={(e) => console.error("Video error:", e)}
        onLoadStart={() => console.log("Video loading started")}
        onCanPlay={() => console.log("Video can play")}
        style={{ minHeight: "200px" }}
      >
        <p>Your browser does not support video playback.</p>
      </video>
      {overlay}
    </div>
  ) : null;

  const titleContent = (
    <div className={styles.cardTitleWrapper}>
      <span className={styles.cardTitle}>{title}</span>
      {subtitle && <span className={styles.cardSubtitle}>{subtitle}</span>}
      {comingSoon && <span className={styles.comingSoon}>COMING SOON</span>}
    </div>
  );

  const cardContent = (
    <>
      {mediaContent}
      {titleContent}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={cardClassName}>
        {cardContent}
      </Link>
    );
  }

  return <div className={cardClassName}>{cardContent}</div>;
}
