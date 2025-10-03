import Image from "next/image";
import styles from "@/styles/home.module.css";

interface CardProps {
  title: string
  href?: string
  image?: string
  video?: string
}

export default function CaseStudyCard({ title, href, image, video }: CardProps) {
  const hasMedia = Boolean(image || video);
  const cardClassName = [
    styles.card,
    hasMedia ? styles.cardWithMedia : "",
    image ? styles.cardWithImage : "",
    video ? styles.cardWithVideo : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <a href={href || "#"} className={cardClassName}>
      {image ? (
        <>
          <div className={styles.imageWrapper}>
            <Image
              src={image}
              alt={title}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              style={{ objectFit: "cover" }}
            />
          </div>
          <span className={styles.cardTitle}>{title}</span>
        </>
      ) : video ? (
        <>
          <div className={styles.videoWrapper}>
            <video
              src={video}
              autoPlay
              loop
              muted
              playsInline
              controls={false}
            />
          </div>
          <span className={styles.cardTitle}>{title}</span>
        </>
      ) : (
        <span className={styles.cardTitle}>{title}</span>
      )}
    </a>
  );
}
