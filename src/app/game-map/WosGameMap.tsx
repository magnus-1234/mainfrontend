"use client";

import type { PointerEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

const MAP_SIZE = 1199;
const CANVAS_SIZE = 1199;

type Coordinate = {
  x: number;
  y: number;
};

type DragState = {
  pointerId: number;
  x: number;
  y: number;
  yaw: number;
  pitch: number;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const drawMap = (canvas: HTMLCanvasElement, selected: Coordinate, hover: Coordinate | null) => {
  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }

  const ratio = window.devicePixelRatio || 1;
  canvas.width = CANVAS_SIZE * ratio;
  canvas.height = CANVAS_SIZE * ratio;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  const terrain = context.createLinearGradient(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  terrain.addColorStop(0, "#d9f0f5");
  terrain.addColorStop(0.28, "#edf7f3");
  terrain.addColorStop(0.54, "#b9d2cf");
  terrain.addColorStop(0.78, "#9cb7ac");
  terrain.addColorStop(1, "#eef8fb");
  context.fillStyle = terrain;
  context.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  context.fillStyle = "rgba(255,255,255,0.28)";
  for (let i = 0; i < 42; i += 1) {
    const x = (i * 167) % CANVAS_SIZE;
    const y = (i * 263) % CANVAS_SIZE;
    const radius = 28 + ((i * 17) % 80);
    context.beginPath();
    context.ellipse(x, y, radius * 1.8, radius, (i % 5) * 0.4, 0, Math.PI * 2);
    context.fill();
  }

  const majorEvery = 100;
  const minorEvery = 25;
  context.lineWidth = 1;

  for (let value = 1; value <= MAP_SIZE; value += minorEvery) {
    const position = value - 1;
    const isMajor = value === 1 || value % majorEvery === 0 || value === MAP_SIZE;
    context.strokeStyle = isMajor ? "rgba(10, 48, 58, 0.46)" : "rgba(10, 48, 58, 0.14)";
    context.beginPath();
    context.moveTo(position, 0);
    context.lineTo(position, CANVAS_SIZE);
    context.moveTo(0, position);
    context.lineTo(CANVAS_SIZE, position);
    context.stroke();
  }

  context.fillStyle = "rgba(8, 34, 42, 0.82)";
  context.font = "700 18px Arial";
  context.textAlign = "center";
  context.textBaseline = "middle";
  for (let value = 100; value <= 1100; value += 100) {
    const position = value - 1;
    context.fillText(String(value), position, 22);
    context.fillText(String(value), 24, position);
  }

  const markCoordinate = (coord: Coordinate, color: string, radius: number) => {
    const x = coord.x - 1;
    const y = coord.y - 1;
    context.strokeStyle = color;
    context.fillStyle = color;
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(x - 20, y);
    context.lineTo(x + 20, y);
    context.moveTo(x, y - 20);
    context.lineTo(x, y + 20);
    context.stroke();
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.stroke();
    context.font = "800 20px Arial";
    context.textAlign = "left";
    context.textBaseline = "bottom";
    context.fillText(`X:${coord.x} Y:${coord.y}`, clamp(x + 16, 12, 1050), clamp(y - 14, 34, 1184));
  };

  if (hover) {
    markCoordinate(hover, "rgba(21, 94, 117, 0.58)", 15);
  }
  markCoordinate(selected, "#f48120", 22);
};

export default function WosGameMap({ embedded = false }: { embedded?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mapShellRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const [selected, setSelected] = useState<Coordinate>({ x: 600, y: 600 });
  const [hover, setHover] = useState<Coordinate | null>(null);
  const [pitch, setPitch] = useState(58);
  const [yaw, setYaw] = useState(-28);
  const [roll, setRoll] = useState(0);
  const [zoom, setZoom] = useState(0.82);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    drawMap(canvas, selected, hover);
  }, [hover, selected]);

  const coordinateFromPointer = useCallback((event: PointerEvent<HTMLCanvasElement>): Coordinate => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = clamp(Math.round(((event.clientX - rect.left) / rect.width) * MAP_SIZE), 1, MAP_SIZE);
    const y = clamp(Math.round(((event.clientY - rect.top) / rect.height) * MAP_SIZE), 1, MAP_SIZE);
    return { x, y };
  }, []);

  const resetView = () => {
    setPitch(58);
    setYaw(-28);
    setRoll(0);
    setZoom(0.82);
  };

  return (
    <section className={`wos-game-map-page ${embedded ? "embedded" : ""}`} aria-label="Whiteout Survival game map">
      <div className="wos-map-toolbar">
        <div>
          <span className="section-kicker">WOS Game Map</span>
          <h1>1199 x 1199 Coordinate Grid</h1>
        </div>
        <div className="wos-map-selected" aria-live="polite">
          <strong>X:{selected.x}</strong>
          <strong>Y:{selected.y}</strong>
        </div>
      </div>

      <div className="wos-map-workspace">
        <div className="wos-map-stage" ref={mapShellRef}>
          <div
            className="wos-map-rotator"
            style={{
              transform: `scale(${zoom}) rotateX(${pitch}deg) rotateY(${yaw}deg) rotateZ(${roll}deg)`,
            }}
          >
            <canvas
              ref={canvasRef}
              className="wos-map-canvas"
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              aria-label="Clickable 1199 by 1199 Whiteout Survival coordinate map"
              onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId);
                dragRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, yaw, pitch };
              }}
              onPointerMove={(event) => {
                setHover(coordinateFromPointer(event));
                const drag = dragRef.current;
                if (!drag || drag.pointerId !== event.pointerId) {
                  return;
                }
                setYaw(Math.round(clamp(drag.yaw + (event.clientX - drag.x) * 0.35, -180, 180)));
                setPitch(Math.round(clamp(drag.pitch - (event.clientY - drag.y) * 0.28, 0, 82)));
              }}
              onPointerUp={(event) => {
                if (dragRef.current?.pointerId === event.pointerId) {
                  const moved = Math.abs(event.clientX - dragRef.current.x) + Math.abs(event.clientY - dragRef.current.y);
                  dragRef.current = null;
                  if (moved < 8) {
                    setSelected(coordinateFromPointer(event));
                  }
                }
              }}
              onPointerLeave={() => setHover(null)}
              onWheel={(event) => {
                event.preventDefault();
                setZoom((value) => clamp(value + (event.deltaY > 0 ? -0.04 : 0.04), 0.38, 1.45));
              }}
            />
          </div>
        </div>

        <aside className="wos-map-controls" aria-label="Map controls">
          <label>
            <span>Pitch</span>
            <input type="range" min="0" max="82" value={pitch} onChange={(event) => setPitch(Number(event.target.value))} />
            <output>{pitch} deg</output>
          </label>
          <label>
            <span>Yaw</span>
            <input type="range" min="-180" max="180" value={yaw} onChange={(event) => setYaw(Number(event.target.value))} />
            <output>{yaw} deg</output>
          </label>
          <label>
            <span>Roll</span>
            <input type="range" min="-45" max="45" value={roll} onChange={(event) => setRoll(Number(event.target.value))} />
            <output>{roll} deg</output>
          </label>
          <label>
            <span>Zoom</span>
            <input type="range" min="38" max="145" value={Math.round(zoom * 100)} onChange={(event) => setZoom(Number(event.target.value) / 100)} />
            <output>{Math.round(zoom * 100)}%</output>
          </label>
          <button type="button" onClick={resetView}>Reset View</button>
        </aside>
      </div>
    </section>
  );
}
