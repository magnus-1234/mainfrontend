/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useState } from "react";
import type { KeyboardEvent } from "react";
import { dreamscapeMaps } from "@/data/dreamscape-memory";

type DreamscapeMemoryProps = {
  embedded?: boolean;
};

const totalSeconds = 60;
const checklistKeyPrefix = "whiteoutsurvival-dreamscape-memory-found";

const scoreFor = (found: number, secondsLeft: number, hintsUsed: number, misses: number, complete: boolean) => ({
  itemPoints: found * 100,
  timeBonus: complete ? secondsLeft * 10 : 0,
  hintPenalty: hintsUsed * 50,
  missPenalty: misses * 10,
  total: Math.max(0, found * 100 + (complete ? secondsLeft * 10 : 0) - hintsUsed * 50 - misses * 10),
});

const normalize = (value: string) => value.trim().toLowerCase();

const readStoredFound = (mapId: string) => {
  if (typeof window === "undefined") {
    return new Set<string>();
  }

  try {
    const stored = JSON.parse(window.localStorage.getItem(`${checklistKeyPrefix}-${mapId}`) || "[]") as string[];
    return new Set(Array.isArray(stored) ? stored : []);
  } catch {
    return new Set<string>();
  }
};

export default function DreamscapeMemory({ embedded = false }: DreamscapeMemoryProps) {
  const [selectedMapId, setSelectedMapId] = useState(dreamscapeMaps[0]?.id || "");
  const [selectedStageId, setSelectedStageId] = useState(dreamscapeMaps[0]?.stages[0]?.id || "");
  const [query, setQuery] = useState("");
  const [foundItems, setFoundItems] = useState<Set<string>>(() => readStoredFound(dreamscapeMaps[0]?.id || ""));
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [status, setStatus] = useState<"ready" | "playing" | "complete" | "expired">("ready");
  const [misses, setMisses] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [hintedItem, setHintedItem] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ tone: "found" | "miss" | "hint"; text: string; key: number } | null>(null);

  const selectedMap = dreamscapeMaps.find((map) => map.id === selectedMapId) || dreamscapeMaps[0];
  const selectedStage = selectedMap.stages.find((stage) => stage.id === selectedStageId) || selectedMap.stages[0];
  const foundCount = foundItems.size;
  const complete = selectedMap.items.length > 0 && foundCount === selectedMap.items.length;
  const displayStatus = status === "playing" && complete ? "complete" : status;
  const score = useMemo(
    () => scoreFor(foundCount, secondsLeft, hintsUsed, misses, complete),
    [complete, foundCount, hintsUsed, misses, secondsLeft],
  );

  const filteredItems = useMemo(() => {
    const needle = normalize(query);
    if (!needle) {
      return selectedMap.items;
    }
    return selectedMap.items.filter((item) => normalize(item).includes(needle));
  }, [query, selectedMap.items]);

  const nextTargets = useMemo(
    () => selectedMap.items.filter((item) => !foundItems.has(item)).slice(0, 3),
    [foundItems, selectedMap.items],
  );
  const currentTarget = nextTargets[0];

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(`${checklistKeyPrefix}-${selectedMap.id}`, JSON.stringify([...foundItems]));
  }, [foundItems, selectedMap.id]);

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

  const changeMap = (mapId: string) => {
    const nextMap = dreamscapeMaps.find((map) => map.id === mapId) || dreamscapeMaps[0];
    setSelectedMapId(nextMap.id);
    setSelectedStageId(nextMap.stages[0]?.id || "");
    setFoundItems(readStoredFound(nextMap.id));
    setSecondsLeft(totalSeconds);
    setStatus("ready");
    setMisses(0);
    setHintsUsed(0);
    setHintedItem(null);
    setQuery("");
    setFeedback(null);
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

  const toggleFound = (item: string) => {
    setFoundItems((current) => {
      const next = new Set(current);
      if (next.has(item)) {
        next.delete(item);
      } else {
        next.add(item);
      }
      return next;
    });
    if (hintedItem === item) {
      setHintedItem(null);
    }
  };

  const markFound = (item?: string) => {
    if (status !== "playing" || !item) {
      return;
    }
    setFoundItems((current) => {
      if (current.has(item)) {
        return current;
      }
      return new Set(current).add(item);
    });
    if (hintedItem === item) {
      setHintedItem(null);
    }
    setFeedback({ tone: "found", text: `Found: ${item}`, key: Date.now() });
  };

  const recordMiss = () => {
    if (status !== "playing" || complete) {
      return;
    }
    setMisses((value) => value + 1);
    setFeedback({ tone: "miss", text: "Miss", key: Date.now() });
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
    setHintedItem(currentTarget);
    setQuery(currentTarget);
    setHintsUsed((value) => value + 1);
    setFeedback({ tone: "hint", text: `Hint: ${currentTarget}`, key: Date.now() });
  };

  return (
    <section className={`dreamscape-page ${embedded ? "is-embedded" : ""}`} id="dreamscape-memory" aria-label="Dreamscape Memory">
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
          <span><small>Found</small><strong>{foundCount}/{selectedMap.items.length}</strong></span>
          <span className={secondsLeft <= 10 && status === "playing" && !complete ? "is-low" : ""}><small>Time</small><strong>{secondsLeft}s</strong></span>
          <span><small>Miss</small><strong>{misses}</strong></span>
          <span><small>Score</small><strong>{score.total.toLocaleString()}</strong></span>
          <button type="button" onClick={useHint} disabled={status !== "playing" || complete || nextTargets.length === 0}>Hint</button>
        </div>

        <section className="dreamscape-stage-panel" aria-label={`${selectedMap.name} ${selectedStage?.label || ""}`}>
          <div
            className="dreamscape-stage-image"
            onClick={recordMiss}
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
            {feedback && (
              <span className={`dreamscape-feedback is-${feedback.tone}`} key={feedback.key}>
                {feedback.text}
              </span>
            )}
            {displayStatus !== "playing" && (
              <div className="dreamscape-overlay">
                {displayStatus === "ready" ? (
                  <span>Start a run, find the current object, then press Found. Tap the scene only for a miss.</span>
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
            <strong>{currentTarget || "All targets cleared"}</strong>
            <div>
              <button type="button" onClick={() => markFound(currentTarget)} disabled={status !== "playing" || !currentTarget}>
                Found
              </button>
              <button type="button" className="is-miss" onClick={recordMiss} disabled={status !== "playing" || complete}>
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
                  className={hintedItem === item ? "is-hinted" : ""}
                  onClick={() => setQuery(item)}
                  key={item}
                >
                  {item}
                </button>
              )) : <span>All items marked found</span>}
            </div>
          </div>

          <div className="dreamscape-checklist">
            <h2>Checklist</h2>
            <div className="dreamscape-item-grid">
              {filteredItems.map((item) => (
                <button
                  type="button"
                  className={`${foundItems.has(item) ? "is-found" : ""} ${hintedItem === item ? "is-hinted" : ""}`}
                  onClick={() => toggleFound(item)}
                  key={item}
                >
                  <span aria-hidden>{foundItems.has(item) ? "ok" : ""}</span>
                  {item}
                </button>
              ))}
            </div>
          </div>
        </section>
      </main>
    </section>
  );
}
