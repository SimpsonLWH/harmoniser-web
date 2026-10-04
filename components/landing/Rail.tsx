"use client";

import { motion, useReducedMotion } from "motion/react";

import {
  ConverterScreen,
  HabitsScreen,
  PackingScreen,
  PomodoroScreen,
  QuizScreen,
  SplitScreen,
  TennisScreen,
  WaterScreen,
} from "@/components/frames/screens";

/*
 * One layout pattern per capsule shape. The rail scrolls with snap points and
 * keeps each frame still; motion is only the entrance and a small lift.
 */

const SHAPES = [
  { id: "pomodoro", caption: "Timer with a ring", Screen: PomodoroScreen },
  { id: "water", caption: "Goal with a tick ring", Screen: WaterScreen },
  { id: "quiz", caption: "Question and answers", Screen: QuizScreen },
  { id: "packing", caption: "Grouped checklist", Screen: PackingScreen },
  { id: "habits", caption: "Week of habits", Screen: HabitsScreen },
  { id: "split", caption: "Inputs and live result", Screen: SplitScreen },
  { id: "converter", caption: "Two units, one swap", Screen: ConverterScreen },
  { id: "tennis", caption: "Two players, one score", Screen: TennisScreen },
];

export function Rail() {
  const reduce = useReducedMotion();

  return (
    <div className="rail rail-mask -mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6">
      {SHAPES.map((shape, index) => (
        <motion.figure
          key={shape.id}
          className="w-[200px] shrink-0 snap-start sm:w-[240px]"
          /* Movement only: a frame that never enters view stays readable. */
          initial={reduce ? false : { y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ type: "spring", stiffness: 130, damping: 20, delay: Math.min(index, 4) * 0.05 }}
        >
          <motion.div
            whileHover={reduce ? undefined : { y: -6 }}
            whileFocus={reduce ? undefined : { y: -6 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="rounded-card"
            tabIndex={0}
            aria-label={`${shape.caption}. Scroll the row for more capsule shapes.`}
          >
            <shape.Screen decorative />
          </motion.div>
          <figcaption className="mt-3 text-[13px] font-semibold text-text-2">{shape.caption}</figcaption>
        </motion.figure>
      ))}
    </div>
  );
}
