import type { ElementType } from "react";

interface Props {
  as?: ElementType;
  className?: string;
  children: string;
  id?: string;
  /** Seconds to wait before the words start revealing. */
  delay?: number;
}

/**
 * Splits a string into word spans so RevealManager can blur each word in,
 * left to right, as it scrolls into view. Server-rendered, no effects.
 * The full sentence is kept once for assistive tech; the split copy is hidden.
 */
export default function BlurText({ as: Tag = "p", className, children, id, delay }: Props) {
  const words = children.split(" ");
  return (
    <Tag className={className} data-reveal-text="" data-reveal-delay={delay} id={id}>
      <span className="sr-only">{children}</span>
      <span aria-hidden="true">
        {words.map((word, i) => (
          <span className="w" key={`${word}-${i}`}>
            <span className="wi">{word}</span>
            {i < words.length - 1 ? " " : ""}
          </span>
        ))}
      </span>
    </Tag>
  );
}
