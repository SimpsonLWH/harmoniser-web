"use client";

import { motion, useReducedMotion } from "motion/react";

import { PomodoroDarkScreen, TennisFoldScreen } from "@/components/frames/screens";

/*
 * The same capsule on a bigger screen and in the dark. The foldable opens once
 * when it scrolls into view; after that it is a still frame.
 */
export function FoldDark() {
  const reduce = useReducedMotion();

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,330px)] lg:items-start">
      <motion.div
        initial={reduce ? false : { scaleX: 0.62, opacity: 0.55 }}
        whileInView={{ scaleX: 1, opacity: 1 }}
        viewport={{ once: true, amount: 0.45 }}
        transition={{ type: "spring", stiffness: 60, damping: 18, delay: 0.1 }}
        style={{ transformOrigin: "left center" }}
      >
        <TennisFoldScreen decorative />
        <p className="mt-3 text-[13px] font-semibold text-text-2">
          Two panes when there is room: the scoreboard, then the point history.
        </p>
      </motion.div>
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ type: "spring", stiffness: 120, damping: 20, delay: 0.2 }}
      >
        <PomodoroDarkScreen decorative />
        <p className="mt-3 text-[13px] font-semibold text-text-2">
          Dark mode follows the system, so a late break does not light up the room.
        </p>
      </motion.div>
    </div>
  );
}
