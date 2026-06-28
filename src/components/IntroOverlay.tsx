import styles from "../styles/home.module.css";

const introText = "Namu Park is a product designer based in Brooklyn, New York.";
const introWords = introText.split(" ");

interface IntroOverlayProps {
  className: string;
}

/** The one-time landing overlay; its words fade in on a stagger. */
export default function IntroOverlay({ className }: IntroOverlayProps) {
  return (
    <div className={className} aria-hidden="true">
      <h1 className={styles.introHeadline}>
        {introWords.map((word, index) => (
          <span
            key={`${word}-${index}`}
            className={styles.introWord}
            style={{ animationDelay: `${index * 85}ms` }}
          >
            {word}
          </span>
        ))}
      </h1>
    </div>
  );
}
