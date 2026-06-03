"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { MouseEvent } from "react";
import "./dreamscape.css";

type StageItem = {
  n: number;
  name: string;
  x: number;
  y: number;
};

const stageItems: StageItem[] = [
  { n: 1, name: "Birdcage", x: 0.36, y: 0.22 },
  { n: 2, name: "Gramophone", x: 0.43, y: 0.31 },
  { n: 3, name: "Vase", x: 0.25, y: 0.31 },
  { n: 4, name: "Telescope", x: 0.82, y: 0.58 },
  { n: 5, name: "Picture frame", x: 0.06, y: 0.21 },
  { n: 6, name: "Lantern", x: 0.34, y: 0.32 },
  { n: 30, name: "Crown", x: 0.27, y: 0.55 },
  { n: 33, name: "Umbrella", x: 0.85, y: 0.36 },
  { n: 43, name: "Headwear", x: 0.66, y: 0.76 },
];

const totalSeconds = 60;
const hitRadius = 0.05;

const shuffle = (items: StageItem[]) => {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
};

const scoreFor = (found: number, secondsLeft: number, hintsUsed: number, won: boolean) => ({
  itemPoints: found * 100,
  timeBonus: won ? secondsLeft * 10 : 0,
  hintPenalty: hintsUsed * 50,
  total: Math.max(0, found * 100 + (won ? secondsLeft * 10 : 0) - hintsUsed * 50),
});

export default function DreamscapeMemoryPage() {
  const [seed, setSeed] = useState(0);
  const [orderedItems, setOrderedItems] = useState<StageItem[]>(() => shuffle(stageItems));
  const [activeTargets, setActiveTargets] = useState<StageItem[]>(() => orderedItems.slice(0, 3));
  const [foundIds, setFoundIds] = useState<Set<number>>(new Set());
  const [misses, setMisses] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [status, setStatus] = useState<"menu" | "playing" | "won" | "lost">("menu");
  const [hintsLeft, setHintsLeft] = useState(3);
  const [hintId, setHintId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ x: number; y: number; hit: boolean; key: number } | null>(null);

  const foundCount = foundIds.size;
  const hintsUsed = 3 - hintsLeft;
  const won = status === "won";
  const score = useMemo(() => scoreFor(foundCount, secondsLeft, hintsUsed, won), [foundCount, secondsLeft, hintsUsed, won]);

  const startRun = () => {
    const nextOrder = shuffle(stageItems);
    setSeed((value) => value + 1);
    setOrderedItems(nextOrder);
    setActiveTargets(nextOrder.slice(0, 3));
    setFoundIds(new Set());
    setMisses(0);
    setSecondsLeft(totalSeconds);
    setHintsLeft(3);
    setHintId(null);
    setFeedback(null);
    setStatus("playing");
  };

  useEffect(() => {
    if (status !== "playing") {
      return;
    }
    const timer = window.setInterval(() => {
      setSecondsLeft((value) => {
        if (value <= 1) {
          setStatus("lost");
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [status, seed]);

  useEffect(() => {
    if (!feedback) {
      return;
    }
    const timer = window.setTimeout(() => setFeedback(null), 700);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  useEffect(() => {
    if (hintId === null) {
      return;
    }
    const timer = window.setTimeout(() => setHintId(null), 2500);
    return () => window.clearTimeout(timer);
  }, [hintId]);

  useEffect(() => {
    if (status === "playing" && foundIds.size === stageItems.length) {
      const timer = window.setTimeout(() => setStatus("won"), 0);
      return () => window.clearTimeout(timer);
    }
  }, [foundIds.size, status]);

  const handleStageClick = (event: MouseEvent<HTMLDivElement>) => {
    if (status !== "playing") {
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    const match = activeTargets.find((item) => Math.hypot(x - item.x, y - item.y) <= hitRadius);

    if (match) {
      const nextFound = new Set(foundIds).add(match.n);
      const remainingActive = activeTargets.filter((item) => item.n !== match.n);
      const nextTarget = orderedItems.find((item) => !nextFound.has(item.n) && !remainingActive.some((active) => active.n === item.n));
      setFoundIds(nextFound);
      setActiveTargets(nextTarget ? [...remainingActive, nextTarget] : remainingActive);
      setFeedback({ x, y, hit: true, key: Date.now() });
      if (hintId === match.n) {
        setHintId(null);
      }
      return;
    }

    setMisses((value) => value + 1);
    setFeedback({ x, y, hit: false, key: Date.now() });
  };

  const useHint = () => {
    if (status !== "playing" || hintsLeft <= 0 || activeTargets.length === 0) {
      return;
    }
    const candidates = activeTargets.filter((item) => item.n !== hintId);
    const nextHint = candidates.length ? candidates[Math.floor(Math.random() * candidates.length)] : activeTargets[0];
    setHintId(nextHint.n);
    setHintsLeft((value) => value - 1);
  };

  return (
    <main className="dreamscape-page">
      <section className="dreamscape-menu" aria-label="Dreamscape Memory menu">
        <Link className="dreamscape-home-link" href="/">WhiteoutSurvival.dev</Link>
        <div>
          <span className="dreamscape-kicker">Dreamscape Memory</span>
          <h1>Ballroom Stage 1</h1>
        </div>
        <label>
          Map
          <select value="Ballroom" disabled>
            <option>Ballroom</option>
          </select>
        </label>
        <label>
          Stage
          <select value="1" disabled>
            <option>Stage 1</option>
          </select>
        </label>
        <button type="button" onClick={startRun}>{status === "menu" ? "Start" : "Restart"}</button>
      </section>

      <section className="dreamscape-game" style={{ ["--stage-w" as string]: "798", ["--stage-h" as string]: "1308" }}>
        <div className="dreamscape-bar">
          <span><small>Found</small><strong>{foundCount}/{stageItems.length}</strong></span>
          <span className={secondsLeft <= 10 && status === "playing" ? "is-low" : ""}><small>Time</small><strong>{secondsLeft}s</strong></span>
          <span><small>Misses</small><strong>{misses}</strong></span>
          <button type="button" onClick={useHint} disabled={status !== "playing" || hintsLeft <= 0}>Hint ({hintsLeft})</button>
        </div>

        <div className="dreamscape-stage" role="button" tabIndex={0} aria-label="Click hidden objects" onClick={handleStageClick}>
          <img src="/images/dreamscape/ballroom.webp" alt="Dreamscape Memory Ballroom Stage 1" draggable={false} />
          {hintId !== null && (
            <span
              className="dreamscape-hint"
              style={{
                left: `${(stageItems.find((item) => item.n === hintId)?.x || 0) * 100}%`,
                top: `${(stageItems.find((item) => item.n === hintId)?.y || 0) * 100}%`,
              }}
            />
          )}
          {feedback && (
            <span className={`dreamscape-feedback ${feedback.hit ? "is-hit" : "is-miss"}`} style={{ left: `${feedback.x * 100}%`, top: `${feedback.y * 100}%` }} key={feedback.key}>
              {feedback.hit ? "OK" : "X"}
            </span>
          )}
          {status !== "playing" && (
            <div className="dreamscape-overlay">
              {status === "menu" ? (
                <span>Start the stage from the menu</span>
              ) : (
                <>
                  <h2>{status === "won" ? "Stage cleared" : "Time's up"}</h2>
                  <p>{score.total} pts · +{score.itemPoints} items · +{score.timeBonus} time · -{score.hintPenalty} hints</p>
                  <button type="button" onClick={startRun}>Play Again</button>
                </>
              )}
            </div>
          )}
        </div>

        <div className="dreamscape-targets" aria-live="polite">
          {activeTargets.length ? activeTargets.map((item) => (
            <span className={foundIds.has(item.n) ? "is-found" : ""} key={item.n}>{item.name}</span>
          )) : <span>All items found</span>}
        </div>
      </section>
    </main>
  );
}
