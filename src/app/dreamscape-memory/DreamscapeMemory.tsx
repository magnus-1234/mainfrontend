/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, MouseEvent } from "react";
import type { KeyboardEvent } from "react";
import { dreamscapeMaps } from "@/data/dreamscape-memory";
import { dreamscapeTargetsByMap } from "@/data/dreamscape-memory-targets";
import type { DreamscapeTarget } from "@/data/dreamscape-memory-targets";

type DreamscapeMemoryProps = {
  embedded?: boolean;
};

const totalSeconds = 60;
const checklistKeyPrefix = "whiteoutsurvival-dreamscape-memory-found-v2";

const scoreFor = (found: number, secondsLeft: number, hintsUsed: number, misses: number, complete: boolean) => ({
  itemPoints: found * 100,
  timeBonus: complete ? secondsLeft * 10 : 0,
  hintPenalty: hintsUsed * 50,
  missPenalty: misses * 10,
  total: Math.max(0, found * 100 + (complete ? secondsLeft * 10 : 0) - hintsUsed * 50 - misses * 10),
});

const normalize = (value: string) => value.trim().toLowerCase();

const readStoredFound = (mapId: string, stageId: string) => {
  if (typeof window === "undefined") {
    return new Set<number>();
  }

  try {
    const stored = JSON.parse(window.localStorage.getItem(`${checklistKeyPrefix}-${mapId}-${stageId}`) || "[]") as number[];
    return new Set(Array.isArray(stored) ? stored.filter((value) => Number.isInteger(value)) : []);
  } catch {
    return new Set<number>();
  }
};

const stageNumberFromId = (stageId: string) => {
  const match = stageId.match(/-(\d+)$/);
  return match ? Number(match[1]) : 1;
};

const targetStage = (target: DreamscapeTarget) => target.stage ?? 1;

const isTargetInStage = (target: DreamscapeTarget, stageNumber: number) =>
  targetStage(target) === stageNumber || target.stages?.includes(stageNumber);

const targetLabel = (items: string[], target?: DreamscapeTarget) => {
  if (!target) {
    return "";
  }
  return items[target.n - 1] || `Item #${target.n}`;
};

const pointInTarget = (
  target: DreamscapeTarget,
  point: { x: number; y: number },
  scene: { left: number; top: number; width: number; height: number },
  dimensions: { width: number; height: number },
) => {
  const centerX = scene.left + target.x * scene.width;
  const centerY = scene.top + target.y * scene.height;

  if (target.w !== undefined && target.h !== undefined) {
    const halfWidth = Math.min(0.2, Math.max(0.028, (target.w * scene.width) / 2));
    const halfHeight = Math.min(0.2, Math.max(0.028, (target.h * scene.height) / 2));
    let dx = (point.x - centerX) * dimensions.width;
    let dy = (point.y - centerY) * dimensions.height;

    if (target.rot) {
      const angle = (-target.rot * Math.PI) / 180;
      const rotatedX = dx * Math.cos(angle) - dy * Math.sin(angle);
      const rotatedY = dx * Math.sin(angle) + dy * Math.cos(angle);
      dx = rotatedX;
      dy = rotatedY;
    }

    const xRadius = (halfWidth + 0.008) * dimensions.width;
    const yRadius = (halfHeight + 0.008) * dimensions.height;
    const hit =
      target.shape === "ellipse"
        ? (dx / xRadius) ** 2 + (dy / yRadius) ** 2 <= 1
        : Math.abs(dx) <= xRadius && Math.abs(dy) <= yRadius;
    const area = halfWidth * halfHeight * (target.shape === "ellipse" ? Math.PI / 4 : 1);
    return { hit, area };
  }

  const distance = Math.hypot(point.x - centerX, point.y - centerY);
  return { hit: distance <= 0.05, area: distance };
};

const targetPoint = (
  target: DreamscapeTarget,
  scene: { left: number; top: number; width: number; height: number },
) => ({
  x: scene.left + target.x * scene.width,
  y: scene.top + target.y * scene.height,
});

const targetHotspotStyle = (
  target: DreamscapeTarget,
  scene: { left: number; top: number; width: number; height: number },
) => {
  const point = targetPoint(target, scene);
  const base = {
    left: `${point.x * 100}%`,
    top: `${point.y * 100}%`,
  } as CSSProperties;

  if (target.w !== undefined && target.h !== undefined) {
    return {
      ...base,
      width: `${Math.max(0.052, target.w * scene.width) * 100}%`,
      height: `${Math.max(0.052, target.h * scene.height) * 100}%`,
      transform: `translate(-50%, -50%) rotate(${target.rot ?? 0}deg)`,
    } as CSSProperties;
  }

  return base;
};

export default function DreamscapeMemory({ embedded = false }: DreamscapeMemoryProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [selectedMapId, setSelectedMapId] = useState(dreamscapeMaps[0]?.id || "");
  const [selectedStageId, setSelectedStageId] = useState(dreamscapeMaps[0]?.stages[0]?.id || "");
  const [query, setQuery] = useState("");
  const [foundItems, setFoundItems] = useState<Set<number>>(() =>
    readStoredFound(dreamscapeMaps[0]?.id || "", dreamscapeMaps[0]?.stages[0]?.id || ""),
  );
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [status, setStatus] = useState<"ready" | "playing" | "complete" | "expired">("ready");
  const [misses, setMisses] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [hintedItem, setHintedItem] = useState<number | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [feedback, setFeedback] = useState<{
    tone: "found" | "miss" | "hint";
    text: string;
    key: number;
    x?: number;
    y?: number;
  } | null>(null);

  const selectedMap = dreamscapeMaps.find((map) => map.id === selectedMapId) || dreamscapeMaps[0];
  const selectedStage = selectedMap.stages.find((stage) => stage.id === selectedStageId) || selectedMap.stages[0];
  const selectedStageNumber = stageNumberFromId(selectedStage?.id || "");
  const targetMap = dreamscapeTargetsByMap[selectedMap.id];
  const sceneRect = targetMap?.sceneRect || { left: 0, top: 0, right: 1, bottom: 1 };
  const scene = {
    left: sceneRect.left,
    top: sceneRect.top,
    width: sceneRect.right - sceneRect.left,
    height: sceneRect.bottom - sceneRect.top,
  };
  const dimensions = { width: targetMap?.width || 798, height: targetMap?.height || 1308 };
  const stageTargets = useMemo<DreamscapeTarget[]>(() => {
    if (!targetMap) {
      return selectedMap.items.map((_, index) => ({ n: index + 1, x: 0, y: 0 }));
    }
    return targetMap.coords
      .filter((target) => target.n <= selectedMap.items.length && isTargetInStage(target, selectedStageNumber))
      .sort((left, right) => left.n - right.n);
  }, [selectedMap.items, selectedStageNumber, targetMap]);
  const stageItemCount = stageTargets.length;
  const foundCount = foundItems.size;
  const complete = stageItemCount > 0 && foundCount >= stageItemCount;
  const displayStatus = status === "playing" && complete ? "complete" : status;
  const stageStyle = { "--dreamscape-stage-ratio": `${dimensions.width} / ${dimensions.height}` } as CSSProperties;
  const score = useMemo(
    () => scoreFor(foundCount, secondsLeft, hintsUsed, misses, complete),
    [complete, foundCount, hintsUsed, misses, secondsLeft],
  );

  const filteredItems = useMemo(() => {
    const needle = normalize(query);
    const stageItems = stageTargets.map((target) => ({ target, label: targetLabel(selectedMap.items, target) }));
    if (!needle) {
      return stageItems;
    }
    return stageItems.filter(({ label }) => normalize(label).includes(needle));
  }, [query, selectedMap.items, stageTargets]);

  const nextTargets = useMemo(
    () => stageTargets.filter((target) => !foundItems.has(target.n)).slice(0, 3),
    [foundItems, stageTargets],
  );
  const currentTarget = nextTargets[0];

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(`${checklistKeyPrefix}-${selectedMap.id}-${selectedStage?.id || ""}`, JSON.stringify([...foundItems]));
  }, [foundItems, selectedMap.id, selectedStage?.id]);

  useEffect(() => {
    setFoundItems(readStoredFound(selectedMap.id, selectedStage?.id || ""));
    setSecondsLeft(totalSeconds);
    setStatus("ready");
    setMisses(0);
    setHintsUsed(0);
    setHintedItem(null);
    setQuery("");
    setFeedback(null);
    setIsZoomed(false);
  }, [selectedMap.id, selectedStage?.id]);

  useEffect(() => {
    if (status !== "playing" || complete) {
      return;
    }
    const timer = window.setInterval(() => {
      setSecondsLeft((value) => {
        if (value <= 1) {
          setStatus("expired");
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [complete, status]);

  useEffect(() => {
    if (!feedback) {
      return;
    }
    const timeout = window.setTimeout(() => setFeedback(null), 950);
    return () => window.clearTimeout(timeout);
  }, [feedback]);

  useEffect(() => {
    if (!isZoomed) {
      return;
    }
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsZoomed(false);
      }
    };
    document.body.classList.add("dreamscape-zoom-lock");
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.classList.remove("dreamscape-zoom-lock");
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isZoomed]);

  const changeMap = (mapId: string) => {
    const nextMap = dreamscapeMaps.find((map) => map.id === mapId) || dreamscapeMaps[0];
    setSelectedMapId(nextMap.id);
    setSelectedStageId(nextMap.stages[0]?.id || "");
  };

  const startRun = () => {
    setFoundItems(new Set());
    setSecondsLeft(totalSeconds);
    setStatus("playing");
    setMisses(0);
    setHintsUsed(0);
    setHintedItem(null);
    setQuery("");
    setFeedback(null);
  };

  const resetChecklist = () => {
    setFoundItems(new Set());
    setSecondsLeft(totalSeconds);
    setStatus("ready");
    setMisses(0);
    setHintsUsed(0);
    setHintedItem(null);
    setFeedback(null);
  };

  const setTargetFound = (target: DreamscapeTarget, point?: { x: number; y: number }) => {
    if (status !== "playing") {
      return;
    }
    const label = targetLabel(selectedMap.items, target);
    setFoundItems((current) => {
      const next = new Set(current);
      next.add(target.n);
      return next;
    });
    if (hintedItem === target.n) {
      setHintedItem(null);
    }
    setFeedback({ tone: "found", text: label ? `Found: ${label}` : "Found", key: Date.now(), x: point?.x, y: point?.y });
  };

  const toggleFound = (target: DreamscapeTarget) => {
    setFoundItems((current) => {
      const next = new Set(current);
      if (next.has(target.n)) {
        next.delete(target.n);
      } else {
        next.add(target.n);
      }
      return next;
    });
    if (hintedItem === target.n) {
      setHintedItem(null);
    }
  };

  const markFound = (target?: DreamscapeTarget) => {
    if (!target) {
      return;
    }
    setTargetFound(target, targetPoint(target, scene));
  };

  const recordMiss = (point?: { x: number; y: number }) => {
    if (status !== "playing" || complete) {
      return;
    }
    setMisses((value) => value + 1);
    setFeedback({ tone: "miss", text: "Miss", key: Date.now(), x: point?.x, y: point?.y });
  };

  const handleSceneClick = (event: MouseEvent<HTMLDivElement>) => {
    if (status !== "playing" || complete) {
      return;
    }

    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }

    const point = {
      x: (event.clientX - rect.left) / rect.width,
      y: (event.clientY - rect.top) / rect.height,
    };
    let best: { target: DreamscapeTarget; area: number } | null = null;

    for (const target of stageTargets) {
      if (foundItems.has(target.n)) {
        continue;
      }
      const result = pointInTarget(target, point, scene, dimensions);
      if (result.hit && (!best || result.area < best.area)) {
        best = { target, area: result.area };
      }
    }

    if (best) {
      setTargetFound(best.target, point);
      return;
    }
    recordMiss(point);
  };

  const handleSceneKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }
    event.preventDefault();
    recordMiss();
  };

  const useHint = () => {
    if (status !== "playing" || !currentTarget) {
      return;
    }
    setHintedItem(currentTarget.n);
    setQuery(targetLabel(selectedMap.items, currentTarget));
    setHintsUsed((value) => value + 1);
    setFeedback({
      tone: "hint",
      text: `Hint: ${targetLabel(selectedMap.items, currentTarget)}`,
      key: Date.now(),
      x: scene.left + currentTarget.x * scene.width,
      y: scene.top + currentTarget.y * scene.height,
    });
  };

  return (
    <section
      className={`dreamscape-page ${embedded ? "is-embedded" : ""} ${isZoomed ? "is-stage-zoomed" : ""}`}
      id="dreamscape-memory"
      aria-label="Dreamscape Memory"
    >
      <aside className="dreamscape-menu" aria-label="Dreamscape Memory controls">
        <div>
          <span className="dreamscape-kicker">Dreamscape Memory</span>
          <h1>Find the Objects</h1>
        </div>

        <label>
          Map
          <select value={selectedMapId} onChange={(event) => changeMap(event.target.value)}>
            {dreamscapeMaps.map((map) => (
              <option value={map.id} key={map.id}>
                {map.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Stage
          <select value={selectedStage?.id || ""} onChange={(event) => setSelectedStageId(event.target.value)}>
            {selectedMap.stages.map((stage) => (
              <option value={stage.id} key={stage.id}>
                {stage.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Find item
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search checklist" />
        </label>

        <div className="dreamscape-actions">
          <button type="button" onClick={startRun}>{status === "playing" && !complete ? "Restart" : "Start 60s Run"}</button>
          <button type="button" className="is-secondary" onClick={resetChecklist}>Reset</button>
        </div>
      </aside>

      <main className="dreamscape-game">
        <div className="dreamscape-bar">
          <span><small>Found</small><strong>{foundCount}/{stageItemCount}</strong></span>
          <span className={secondsLeft <= 10 && status === "playing" && !complete ? "is-low" : ""}><small>Time</small><strong>{secondsLeft}s</strong></span>
          <span><small>Miss</small><strong>{misses}</strong></span>
          <span><small>Score</small><strong>{score.total.toLocaleString()}</strong></span>
          <button type="button" onClick={useHint} disabled={status !== "playing" || complete || nextTargets.length === 0}>Hint</button>
          <button type="button" className="is-secondary" onClick={() => setIsZoomed((value) => !value)}>
            {isZoomed ? "Exit Zoom" : "Zoom"}
          </button>
        </div>

        <div className="dreamscape-target-strip" aria-live="polite">
          <span>
            <small>Target</small>
            <strong>{targetLabel(selectedMap.items, currentTarget) || "Cleared"}</strong>
          </span>
          <div>
            {nextTargets.map((target) => (
              <button
                type="button"
                className={hintedItem === target.n ? "is-hinted" : ""}
                onClick={() => setQuery(targetLabel(selectedMap.items, target))}
                key={target.n}
              >
                {targetLabel(selectedMap.items, target)}
              </button>
            ))}
          </div>
        </div>

        <section className="dreamscape-stage-panel" aria-label={`${selectedMap.name} ${selectedStage?.label || ""}`}>
          {isZoomed && (
            <button type="button" className="dreamscape-zoom-close" onClick={() => setIsZoomed(false)}>
              Close Zoom
            </button>
          )}
          <div
            ref={stageRef}
            className="dreamscape-stage-image"
            style={stageStyle}
            onClick={handleSceneClick}
            onKeyDown={handleSceneKeyDown}
            role="button"
            tabIndex={0}
            aria-label="Dreamscape scene"
          >
            {selectedStage ? (
              <img src={selectedStage.image} alt={`${selectedMap.name} ${selectedStage.label} Dreamscape Memory scene`} draggable={false} />
            ) : (
              <span>No stage image available</span>
            )}
            {status === "playing" && stageTargets.map((target) => {
              const label = targetLabel(selectedMap.items, target);
              const found = foundItems.has(target.n);
              return (
                <button
                  type="button"
                  className={`dreamscape-hotspot ${found ? "is-found" : ""} ${hintedItem === target.n ? "is-hinted" : ""} ${target.shape === "ellipse" ? "is-ellipse" : ""}`}
                  style={targetHotspotStyle(target, scene)}
                  onClick={(event) => {
                    event.stopPropagation();
                    if (!found) {
                      setTargetFound(target, targetPoint(target, scene));
                    }
                  }}
                  title={label}
                  aria-label={`Find ${label}`}
                  key={target.n}
                >
                  <span>{found ? "ok" : target.n}</span>
                </button>
              );
            })}
            {feedback && (
              <span
                className={`dreamscape-feedback is-${feedback.tone}`}
                key={feedback.key}
                style={feedback.x !== undefined && feedback.y !== undefined ? { left: `${feedback.x * 100}%`, top: `${feedback.y * 100}%` } : undefined}
              >
                {feedback.text}
              </span>
            )}
            {displayStatus !== "playing" && (
              <div className="dreamscape-overlay">
                {displayStatus === "ready" ? (
                  <span>Start a run, then click objects directly in the scene.</span>
                ) : (
                  <>
                    <h2>{displayStatus === "complete" ? "Map checklist cleared" : "Timer ended"}</h2>
                    <p>
                      {score.itemPoints} item pts | {score.timeBonus} time bonus | -{score.hintPenalty} hints | -{score.missPenalty} misses
                    </p>
                    <button type="button" onClick={startRun}>Play Again</button>
                  </>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="dreamscape-lists">
          <div className="dreamscape-current" aria-live="polite">
            <h2>Current Target</h2>
            <strong>{targetLabel(selectedMap.items, currentTarget) || "All targets cleared"}</strong>
            <div>
              <button type="button" onClick={() => markFound(currentTarget)} disabled={status !== "playing" || !currentTarget}>
                Found
              </button>
              <button type="button" className="is-miss" onClick={() => recordMiss()} disabled={status !== "playing" || complete}>
                Miss
              </button>
            </div>
          </div>

          <div className="dreamscape-targets" aria-live="polite">
            <h2>Up Next</h2>
            <div>
              {nextTargets.length ? nextTargets.map((item) => (
                <button
                  type="button"
                  className={hintedItem === item.n ? "is-hinted" : ""}
                  onClick={() => setQuery(targetLabel(selectedMap.items, item))}
                  key={item.n}
                >
                  {targetLabel(selectedMap.items, item)}
                </button>
              )) : <span>All items marked found</span>}
            </div>
          </div>

          <div className="dreamscape-checklist">
            <h2>Checklist</h2>
            <div className="dreamscape-item-grid">
              {filteredItems.map(({ target, label }) => (
                <button
                  type="button"
                  className={`${foundItems.has(target.n) ? "is-found" : ""} ${hintedItem === target.n ? "is-hinted" : ""}`}
                  onClick={() => toggleFound(target)}
                  key={target.n}
                >
                  <span aria-hidden>{foundItems.has(target.n) ? "ok" : target.n}</span>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </section>
      </main>
    </section>
  );
}
