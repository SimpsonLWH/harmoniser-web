"use client";

import { motion, useReducedMotion } from "motion/react";

/*
 * The app's home hero springs its title in word by word (HomeHero.ets). The
 * website borrows exactly that move, and nothing else on the page loops.
 */
export function WordSpring({ text, className }: { text: string; className?: string }) {
  const reduce = useReducedMotion();
  const words = text.split(" ");

  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((word, index) => (
          <motion.span
            key={`${word}-${index}`}
            className="inline-block"
            style={{ marginRight: "0.26em" }}
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 180, damping: 17, delay: 0.1 + index * 0.09 }}
          >
            {word}
          </motion.span>
        ))}
      </span>
    </span>
  );
}
