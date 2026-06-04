/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useState } from "react";
import { dreamscapeMaps, dreamscapeMemorySource } from "@/data/dreamscape-memory";

type DreamscapeMemoryProps = {
  embedded?: boolean;
};

const totalSeconds = 60;
const checklistKeyPrefix = "whiteoutsurvival-dreamscape-memory-found";

const scoreFor = (found: number, secondsLeft: number, hintsUsed: number, complete: boolean) => ({
  itemPoints: found * 100,
  timeBonus: complete ? secondsLeft * 10 : 0,
  hintPenalty: hintsUsed * 50,
  total: Math.max(0, found * 100 + (complete ? secondsLeft * 10 : 0) - hintsUsed * 50),
});

const normalize = (value: string) => value.trim().toLowerCase();

const formatCount = (value: number, label: string) => `${value.toLocaleString()} ${label}${value === 1 ? "" : "s"}`;

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
  const [hintsUsed, setHintsUsed] = useState(0);
  const [hintedItem, setHintedItem] = useState<string | null>(null);

  const selectedMap = dreamscapeMaps.find((map) => map.id === selectedMapId) || dreamscapeMaps[0];
  const selectedStage = selectedMap.stages.find((stage) => stage.id === selectedStageId) || selectedMap.stages[0];
  const foundCount = foundItems.size;
  const complete = selectedMap.items.length > 0 && foundCount === selectedMap.items.length;
  const displayStatus = status === "playing" && complete ? "complete" : status;
  const score = useMemo(
    () => scoreFor(foundCount, secondsLeft, hintsUsed, complete),
    [complete, foundCount, hintsUsed, secondsLeft],
  );

  const filteredItems = useMemo(() => {
    const needle = normalize(query);
    if (!needle) {
      return selectedMap.items;
    }
    return selectedMap.items.filter((item) => normalize(item).includes(needle));
  }, [query, selectedMap.items]);

  const nextTargets = useMemo(
    () => selectedMap.items.filter((item) => !foundItems.has(item)).slice(0, 6),
    [foundItems, selectedMap.items],
  );

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
    setHintsUsed(0);
    setHintedItem(null);
    setQuery("");
  };

  const startRun = () => {
    setFoundItems(new Set());
    setSecondsLeft(totalSeconds);
    setStatus("playing");
    setHintsUsed(0);
    setHintedItem(null);
    setQuery("");
  };

  const resetChecklist = () => {
    setFoundItems(new Set());
    setSecondsLeft(totalSeconds);
    setStatus("ready");
    setHintsUsed(0);
    setHintedItem(null);
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

  const useHint = () => {
    if (status !== "playing" || nextTargets.length === 0) {
      return;
    }
    const nextHint = nextTargets[Math.min(hintsUsed, nextTargets.length - 1)];
    setHintedItem(nextHint);
    setQuery(nextHint);
    setHintsUsed((value) => value + 1);
  };

  return (
    <section className={`dreamscape-page ${embedded ? "is-embedded" : ""}`} id="dreamscape-memory" aria-label="Dreamscape Memory">
      <aside className="dreamscape-menu" aria-label="Dreamscape Memory controls">
        <div>
          <span className="dreamscape-kicker">Dreamscape Memory</span>
          <h1>All Maps & Stages</h1>
          <p>
            {formatCount(dreamscapeMemorySource.mapCount, "map")} | {formatCount(dreamscapeMemorySource.stageCount, "stage")} |{" "}
            {formatCount(dreamscapeMemorySource.itemCount, "item")}
          </p>
        </div>

        <label>
          Map
          <select value={selectedMapId} onChange={(event) => changeMap(event.target.value)}>
            {dreamscapeMaps.map((map) => (
              <option value={map.id} key={map.id}>
                {map.name}{map.coOp ? " (Co-op)" : ""}
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
          <span><small>Score</small><strong>{score.total.toLocaleString()}</strong></span>
          <span><small>Map</small><strong>{selectedMap.coOp ? "Co-op" : "Solo"}</strong></span>
          <button type="button" onClick={useHint} disabled={status !== "playing" || complete || nextTargets.length === 0}>Hint</button>
        </div>

        <section className="dreamscape-stage-panel" aria-label={`${selectedMap.name} ${selectedStage?.label || ""}`}>
          <div className="dreamscape-stage-image">
            {selectedStage ? (
              <img src={selectedStage.image} alt={`${selectedMap.name} ${selectedStage.label} Dreamscape Memory scene`} draggable={false} />
            ) : (
              <span>No stage image available</span>
            )}
            {displayStatus !== "playing" && (
              <div className="dreamscape-overlay">
                {displayStatus === "ready" ? (
                  <span>Select a map and start a timed run</span>
                ) : (
                  <>
                    <h2>{displayStatus === "complete" ? "Map checklist cleared" : "Timer ended"}</h2>
                    <p>{score.itemPoints} item pts | {score.timeBonus} time bonus | -{score.hintPenalty} hint penalty</p>
                    <button type="button" onClick={startRun}>Play Again</button>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="dreamscape-stage-strip" aria-label="Stage gallery">
            {selectedMap.stages.map((stage) => (
              <button
                type="button"
                className={stage.id === selectedStage?.id ? "is-active" : ""}
                onClick={() => setSelectedStageId(stage.id)}
                key={stage.id}
                aria-label={`Open ${stage.label}`}
              >
                <img src={stage.image} alt="" draggable={false} />
                <span>{stage.label.replace("Stage ", "")}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="dreamscape-lists">
          <div className="dreamscape-targets" aria-live="polite">
            <h2>Next Targets</h2>
            <div>
              {nextTargets.length ? nextTargets.map((item) => (
                <button
                  type="button"
                  className={hintedItem === item ? "is-hinted" : ""}
                  onClick={() => toggleFound(item)}
                  key={item}
                >
                  {item}
                </button>
              )) : <span>All items marked found</span>}
            </div>
          </div>

          <div className="dreamscape-checklist">
            <h2>Complete Item List</h2>
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
