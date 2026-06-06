"use client";

import type { PointerEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

const MAP_MIN = 0;
const MAP_MAX = 1199;
const CANVAS_SIZE = 1200;
const COORDINATE_STEP = 1;
const MINOR_GRID_STEP = 25;
const MID_GRID_STEP = 5;
const MAJOR_GRID_STEP = 100;
const MIN_ZOOM = 0.3;
const MAX_ZOOM = 80;
const WHEEL_ZOOM_FACTOR = 1.16;
const MAX_RENDER_SCALE = 6;

type Coordinate = {
  x: number;
  y: number;
};

type MapMode = "2d" | "isometric" | "3d";
type DepthMode = "2d" | "3d";

type DragState = {
  pointerId: number;
  x: number;
  y: number;
  yaw: number;
  pitch: number;
  panX: number;
  panY: number;
};

type Facility = {
  id: string;
  label: string;
  kind: "castle" | "turret" | "stronghold" | "fortress";
  col: number;
  row: number;
  size: number;
};

const FIXED_FACILITIES: Facility[] = [
  { id: "sunfire-castle", label: "Sunfire Castle", kind: "castle", col: 597, row: 597, size: 4 },
  { id: "north-turret", label: "North Turret", kind: "turret", col: 593, row: 593, size: 2 },
  { id: "east-turret", label: "East Turret", kind: "turret", col: 603, row: 593, size: 2 },
  { id: "south-turret", label: "South Turret", kind: "turret", col: 603, row: 603, size: 2 },
  { id: "west-turret", label: "West Turret", kind: "turret", col: 593, row: 603, size: 2 },
  { id: "stronghold-1", label: "Stronghold 1", kind: "stronghold", col: 394, row: 597, size: 6 },
  { id: "stronghold-2", label: "Stronghold 2", kind: "stronghold", col: 597, row: 794, size: 6 },
  { id: "stronghold-3", label: "Stronghold 3", kind: "stronghold", col: 794, row: 597, size: 6 },
  { id: "stronghold-4", label: "Stronghold 4", kind: "stronghold", col: 597, row: 394, size: 6 },
  { id: "fortress-1", label: "Fortress 1", kind: "fortress", col: 366, row: 957, size: 6 },
  { id: "fortress-2", label: "Fortress 2", kind: "fortress", col: 588, row: 957, size: 6 },
  { id: "fortress-3", label: "Fortress 3", kind: "fortress", col: 846, row: 957, size: 6 },
  { id: "fortress-4", label: "Fortress 4", kind: "fortress", col: 957, row: 828, size: 6 },
  { id: "fortress-5", label: "Fortress 5", kind: "fortress", col: 957, row: 606, size: 6 },
  { id: "fortress-6", label: "Fortress 6", kind: "fortress", col: 957, row: 348, size: 6 },
  { id: "fortress-7", label: "Fortress 7", kind: "fortress", col: 846, row: 237, size: 6 },
  { id: "fortress-8", label: "Fortress 8", kind: "fortress", col: 588, row: 237, size: 6 },
  { id: "fortress-9", label: "Fortress 9", kind: "fortress", col: 366, row: 237, size: 6 },
  { id: "fortress-10", label: "Fortress 10", kind: "fortress", col: 237, row: 348, size: 6 },
  { id: "fortress-11", label: "Fortress 11", kind: "fortress", col: 237, row: 588, size: 6 },
  { id: "fortress-12", label: "Fortress 12", kind: "fortress", col: 237, row: 828, size: 6 },
];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const gridCellFor = (coord: Coordinate) => ({
  x: Math.floor(coord.x / COORDINATE_STEP) * COORDINATE_STEP,
  y: Math.floor(coord.y / COORDINATE_STEP) * COORDINATE_STEP,
});

const formatCoordinate = (coordinate: Coordinate) => `${coordinate.x},${coordinate.y}`;

const wrapText = (context: CanvasRenderingContext2D, text: string, maxWidth: number) => {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const nextLine = line ? `${line} ${word}` : word;
    if (line && context.measureText(nextLine).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = nextLine;
    }
  }
  if (line) {
    lines.push(line);
  }

  return lines;
};

const drawWrappedFacilityLabel = (context: CanvasRenderingContext2D, facility: Facility) => {
  const fontSize = facility.size * 0.22;
  const centerX = facility.col + facility.size / 2;
  const lineHeight = fontSize * 1.2;
  const maxWidth = Math.max(1, facility.size - 0.4);
  const lines = wrapText(context, facility.label, maxWidth);

  context.font = `700 ${fontSize}px Arial`;
  context.textAlign = "center";
  context.textBaseline = "top";
  context.fillStyle = "#ffffff";
  context.strokeStyle = "rgba(0, 0, 0, 0.82)";
  context.lineWidth = Math.max(0.35, fontSize * 0.18);

  const startY = facility.row + fontSize * 0.8;
  lines.forEach((line, index) => {
    const y = startY + index * lineHeight;
    context.strokeText(line, centerX, y);
    context.fillText(line, centerX, y);
  });
};

const drawFixedFacility = (context: CanvasRenderingContext2D, facility: Facility) => {
  const x = facility.col;
  const y = facility.row;
  const size = facility.size;
  const centerX = x + size / 2;
  const centerY = y + size / 2;
  const padding = Math.max(0.18, size * 0.08);

  if (facility.kind === "castle") {
    context.fillStyle = "#d97706";
    context.beginPath();
    context.arc(centerX, centerY, (size - padding * 2) / 2, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = "#78350f";
    context.lineWidth = Math.max(0.45, size * 0.06);
    context.stroke();
  } else if (facility.kind === "turret") {
    context.fillStyle = "#0e7490";
    context.beginPath();
    context.arc(centerX, centerY, ((size - padding * 2) / 2) * 0.85, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = "#164e63";
    context.lineWidth = Math.max(0.35, size * 0.06);
    context.stroke();
  } else if (facility.kind === "stronghold") {
    context.fillStyle = "#166534";
    context.fillRect(x + padding, y + padding, size - padding * 2, size - padding * 2);
    context.strokeStyle = "#22c55e";
    context.lineWidth = Math.max(0.5, size * 0.04);
    context.strokeRect(x + padding, y + padding, size - padding * 2, size - padding * 2);
  } else {
    context.fillStyle = "#312e81";
    context.fillRect(x + padding, y + padding, size - padding * 2, size - padding * 2);
    context.strokeStyle = "#818cf8";
    context.lineWidth = Math.max(0.5, size * 0.04);
    context.strokeRect(x + padding, y + padding, size - padding * 2, size - padding * 2);
  }

  drawWrappedFacilityLabel(context, facility);
};

const drawFixedFacilities = (context: CanvasRenderingContext2D) => {
  context.save();
  for (const facility of FIXED_FACILITIES) {
    drawFixedFacility(context, facility);
  }
  context.restore();
};

const drawSelection = (context: CanvasRenderingContext2D, coord: Coordinate, selectedCell = false) => {
  const cell = gridCellFor(coord);
  const cellWidth = Math.min(COORDINATE_STEP, CANVAS_SIZE - cell.x);
  const cellHeight = Math.min(COORDINATE_STEP, CANVAS_SIZE - cell.y);

  context.fillStyle = selectedCell ? "rgba(37, 99, 235, 0.34)" : "rgba(37, 99, 235, 0.2)";
  context.fillRect(cell.x, cell.y, cellWidth, cellHeight);
  context.strokeStyle = selectedCell ? "#2563eb" : "rgba(37, 99, 235, 0.62)";
  context.lineWidth = selectedCell ? 0.12 : 0.08;
  context.strokeRect(cell.x + 0.04, cell.y + 0.04, Math.max(0.08, cellWidth - 0.08), Math.max(0.08, cellHeight - 0.08));
};

const drawGridLines = (context: CanvasRenderingContext2D, step: number, color: string, lineWidth: number) => {
  context.strokeStyle = color;
  context.lineWidth = lineWidth;
  context.beginPath();
  for (let position = 0; position <= CANVAS_SIZE; position += step) {
    context.moveTo(position, 0);
    context.lineTo(position, CANVAS_SIZE);
    context.moveTo(0, position);
    context.lineTo(CANVAS_SIZE, position);
  }
  context.stroke();
};

const drawMap = (canvas: HTMLCanvasElement, selected: Coordinate, hover: Coordinate | null, zoom: number, showFixedFacilities: boolean) => {
  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }

  const ratio = window.devicePixelRatio || 1;
  const renderBoost = zoom > 1 ? Math.min(MAX_RENDER_SCALE, Math.ceil(Math.sqrt(zoom))) : 1;
  const renderScale = Math.min(MAX_RENDER_SCALE, ratio * renderBoost);
  canvas.width = CANVAS_SIZE * renderScale;
  canvas.height = CANVAS_SIZE * renderScale;
  context.setTransform(renderScale, 0, 0, renderScale, 0, 0);
  context.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  context.imageSmoothingEnabled = false;

  context.fillStyle = "#f8fafc";
  context.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  if (zoom >= 12) {
    drawGridLines(context, COORDINATE_STEP, "rgba(15, 23, 42, 0.08)", 0.025);
  }
  if (zoom >= 4) {
    drawGridLines(context, MID_GRID_STEP, "rgba(15, 23, 42, 0.16)", 0.05);
  }
  drawGridLines(context, MINOR_GRID_STEP, "rgba(17, 24, 39, 0.2)", 0.16);
  drawGridLines(context, MAJOR_GRID_STEP, "rgba(17, 24, 39, 0.44)", 0.42);

  context.fillStyle = "rgba(15, 23, 42, 0.08)";
  context.fillRect(552, 552, 96, 96);
  context.strokeStyle = "rgba(239, 68, 68, 0.72)";
  context.lineWidth = 2;
  context.setLineDash([6, 4]);
  context.strokeRect(585, 585, 28, 28);
  context.setLineDash([]);

  if (hover) {
    drawSelection(context, hover);
  }
  drawSelection(context, selected, true);
  if (showFixedFacilities) {
    drawFixedFacilities(context);
  }

  context.strokeStyle = "rgba(17, 24, 39, 0.72)";
  context.lineWidth = 3;
  context.strokeRect(1.5, 1.5, CANVAS_SIZE - 3, CANVAS_SIZE - 3);
};

export default function WosGameMap({ embedded = false }: { embedded?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mapShellRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const hoverFrameRef = useRef<number | null>(null);
  const pendingHoverRef = useRef<Coordinate | null>(null);
  const panFrameRef = useRef<number | null>(null);
  const pendingPanRef = useRef({ x: 0, y: 0 });
  const [selected, setSelected] = useState<Coordinate>({ x: 600, y: 600 });
  const [hover, setHover] = useState<Coordinate | null>(null);
  const [mode, setMode] = useState<MapMode>("2d");
  const [depthMode, setDepthMode] = useState<DepthMode>("2d");
  const [pitch, setPitch] = useState(0);
  const [yaw, setYaw] = useState(0);
  const [roll, setRoll] = useState(0);
  const [zoom, setZoom] = useState(0.9);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [showFixedFacilities, setShowFixedFacilities] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    drawMap(canvas, selected, hover, zoom, showFixedFacilities);
  }, [hover, selected, showFixedFacilities, zoom]);

  const coordinateLabelStyle = (coordinate: Coordinate, selectedLabel = false) => {
    const cell = gridCellFor(coordinate);
    const cellWidth = Math.min(COORDINATE_STEP, CANVAS_SIZE - cell.x);
    const inverseScale = clamp(1 / Math.max(zoom, 1), 0.0125, 1);
    return {
      left: `${((cell.x + cellWidth - 1) / CANVAS_SIZE) * 100}%`,
      top: `${((cell.y + 1) / CANVAS_SIZE) * 100}%`,
      transform: `translate(0, -100%) rotate(${mode === "isometric" ? 0 : 45}deg) scale(${inverseScale})`,
      transformOrigin: "0 100%",
      ["--label-opacity" as string]: selectedLabel ? "1" : "0.86",
    };
  };

  useEffect(() => {
    const stage = mapShellRef.current;
    if (!stage) {
      return;
    }

    const containWheel = (event: WheelEvent) => {
      event.preventDefault();
    };

    stage.addEventListener("wheel", containWheel, { passive: false });
    return () => stage.removeEventListener("wheel", containWheel);
  }, []);

  useEffect(() => () => {
    if (hoverFrameRef.current !== null) {
      window.cancelAnimationFrame(hoverFrameRef.current);
    }
    if (panFrameRef.current !== null) {
      window.cancelAnimationFrame(panFrameRef.current);
    }
  }, []);

  const coordinateFromPointer = useCallback((event: PointerEvent<HTMLCanvasElement>): Coordinate => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = clamp(Math.floor(((event.clientX - rect.left) / rect.width) * CANVAS_SIZE), MAP_MIN, MAP_MAX);
    const y = clamp(Math.floor(((event.clientY - rect.top) / rect.height) * CANVAS_SIZE), MAP_MIN, MAP_MAX);
    return { x, y };
  }, []);

  const selectCoordinate = (coordinate: Coordinate) => {
    setSelected({
      x: Math.round(clamp(coordinate.x, MAP_MIN, MAP_MAX)),
      y: Math.round(clamp(coordinate.y, MAP_MIN, MAP_MAX)),
    });
  };

  const moveSelection = (xDelta: number, yDelta: number) => {
    setSelected((value) => ({
      x: Math.round(clamp(value.x + xDelta, MAP_MIN, MAP_MAX)),
      y: Math.round(clamp(value.y + yDelta, MAP_MIN, MAP_MAX)),
    }));
  };

  const setSmoothZoom = (updater: (value: number) => number) => {
    setZoom((value) => clamp(updater(value), MIN_ZOOM, MAX_ZOOM));
  };

  const zoomByWheel = (deltaY: number) => {
    setSmoothZoom((value) => value * (deltaY > 0 ? 1 / WHEEL_ZOOM_FACTOR : WHEEL_ZOOM_FACTOR));
  };

  const scheduleHover = (coordinate: Coordinate) => {
    pendingHoverRef.current = coordinate;
    if (hoverFrameRef.current !== null) {
      return;
    }
    hoverFrameRef.current = window.requestAnimationFrame(() => {
      hoverFrameRef.current = null;
      setHover(pendingHoverRef.current);
    });
  };

  const schedulePan = (nextPan: { x: number; y: number }) => {
    pendingPanRef.current = nextPan;
    if (panFrameRef.current !== null) {
      return;
    }
    panFrameRef.current = window.requestAnimationFrame(() => {
      panFrameRef.current = null;
      setPan(pendingPanRef.current);
    });
  };

  const setMapMode = (nextMode: MapMode) => {
    setMode(nextMode);
    if (nextMode === "2d") {
      setDepthMode("2d");
      setPitch(0);
      setYaw(0);
      setRoll(0);
      setZoom(0.9);
      setPan({ x: 0, y: 0 });
      return;
    }
    if (nextMode === "isometric") {
      setPitch(depthMode === "3d" ? 58 : 0);
      setYaw(0);
      setRoll(45);
      setZoom(depthMode === "3d" ? 0.64 : 0.78);
      setPan({ x: 0, y: 0 });
      return;
    }
    setDepthMode("3d");
    setPitch(58);
    setYaw(-28);
    setRoll(0);
    setZoom(0.82);
    setPan({ x: 0, y: 0 });
  };

  const resetView = () => {
    if (mode === "2d") {
      setPitch(0);
      setYaw(0);
      setRoll(0);
      setZoom(0.9);
      setPan({ x: 0, y: 0 });
      return;
    }
    if (mode === "isometric") {
      setPitch(depthMode === "3d" ? 58 : 0);
      setYaw(0);
      setRoll(45);
      setZoom(depthMode === "3d" ? 0.64 : 0.78);
      setPan({ x: 0, y: 0 });
      return;
    }
    setPitch(58);
    setYaw(-28);
    setRoll(0);
    setZoom(0.82);
    setPan({ x: 0, y: 0 });
  };

  return (
    <section className={`wos-game-map-page ${embedded ? "embedded" : ""}`} aria-label="Whiteout Survival game map">
      <div className="wos-map-toolbar">
        <div>
          <span className="section-kicker">WOS Game Map</span>
          <h1>0-1199 Coordinate Grid</h1>
        </div>
        <div className="wos-map-selected" aria-live="polite">
          <strong>X:{selected.x}</strong>
          <strong>Y:{selected.y}</strong>
        </div>
      </div>

      <div className="wos-map-workspace">
        <div
          className="wos-map-stage"
          ref={mapShellRef}
          onWheel={(event) => {
            event.preventDefault();
            event.stopPropagation();
            zoomByWheel(event.deltaY);
          }}
        >
          <div
            className={`wos-map-rotator mode-${mode} depth-${depthMode}`}
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotateX(${pitch}deg) rotateY(${yaw}deg) rotateZ(${roll}deg)`,
            }}
          >
            <canvas
              ref={canvasRef}
              className="wos-map-canvas"
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              aria-label="Clickable 0 to 1199 Whiteout Survival coordinate map"
              role="application"
              tabIndex={0}
              onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId);
                dragRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, yaw, pitch, panX: pan.x, panY: pan.y };
              }}
              onPointerMove={(event) => {
                event.preventDefault();
                scheduleHover(coordinateFromPointer(event));
                const drag = dragRef.current;
                if (!drag || drag.pointerId !== event.pointerId) {
                  return;
                }
                if (mode !== "3d" && !(mode === "isometric" && depthMode === "3d")) {
                  schedulePan({ x: drag.panX + event.clientX - drag.x, y: drag.panY + event.clientY - drag.y });
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
                    selectCoordinate(coordinateFromPointer(event));
                  }
                }
              }}
              onPointerLeave={() => setHover(null)}
              onWheel={(event) => {
                event.preventDefault();
                event.stopPropagation();
                zoomByWheel(event.deltaY);
              }}
              onKeyDown={(event) => {
                const step = event.shiftKey ? 10 : 1;
                if (event.key === "ArrowLeft") {
                  event.preventDefault();
                  moveSelection(-step, 0);
                } else if (event.key === "ArrowRight") {
                  event.preventDefault();
                  moveSelection(step, 0);
                } else if (event.key === "ArrowUp") {
                  event.preventDefault();
                  moveSelection(0, -step);
                } else if (event.key === "ArrowDown") {
                  event.preventDefault();
                  moveSelection(0, step);
                } else if (event.key === "+" || event.key === "=") {
                  event.preventDefault();
                  setSmoothZoom((value) => value * WHEEL_ZOOM_FACTOR);
                } else if (event.key === "-" || event.key === "_") {
                  event.preventDefault();
                  setSmoothZoom((value) => value / WHEEL_ZOOM_FACTOR);
                } else if (event.key.toLowerCase() === "f") {
                  event.preventDefault();
                  resetView();
                } else if (mode === "3d" && event.key.toLowerCase() === "a") {
                  event.preventDefault();
                  setYaw((value) => clamp(value - 5, -180, 180));
                } else if (mode === "3d" && event.key.toLowerCase() === "d") {
                  event.preventDefault();
                  setYaw((value) => clamp(value + 5, -180, 180));
                } else if (mode === "3d" && event.key.toLowerCase() === "w") {
                  event.preventDefault();
                  setPitch((value) => clamp(value + 5, 0, 82));
                } else if (mode === "3d" && event.key.toLowerCase() === "s") {
                  event.preventDefault();
                  setPitch((value) => clamp(value - 5, 0, 82));
                }
              }}
            />
            <span className="wos-coordinate-tag selected" style={coordinateLabelStyle(selected, true)}>
              {formatCoordinate(selected)}
            </span>
            {hover && (gridCellFor(hover).x !== gridCellFor(selected).x || gridCellFor(hover).y !== gridCellFor(selected).y) && (
              <span className="wos-coordinate-tag hover" style={coordinateLabelStyle(hover)}>
                {formatCoordinate(hover)}
              </span>
            )}
          </div>
        </div>

        <aside className="wos-map-controls" aria-label="Map controls">
          <div className="wos-map-mode-control" role="group" aria-label="Map mode">
            <button className={mode === "2d" ? "active" : ""} type="button" onClick={() => setMapMode("2d")}>2D</button>
            <button className={mode === "isometric" ? "active" : ""} type="button" onClick={() => setMapMode("isometric")}>ISO</button>
            <button className={mode === "3d" ? "active" : ""} type="button" onClick={() => setMapMode("3d")}>3D</button>
          </div>
          <label className="wos-map-toggle">
            <input type="checkbox" checked={showFixedFacilities} onChange={(event) => setShowFixedFacilities(event.target.checked)} />
            <span>Show Fixed Sites</span>
          </label>
          <div className="wos-zoom-board" aria-label="Zoom controls">
            <button type="button" aria-label="Zoom out" onClick={() => setSmoothZoom((value) => value / 1.25)}>−</button>
            <div>
              <span>Zoom</span>
              <strong>{Math.round(zoom * 100)}%</strong>
            </div>
            <button type="button" aria-label="Zoom in" onClick={() => setSmoothZoom((value) => value * 1.25)}>+</button>
            <button type="button" onClick={resetView}>Fit</button>
          </div>
          <div className="wos-coordinate-fields">
            <label>
              <span>X</span>
              <input type="number" min={MAP_MIN} max={MAP_MAX} value={selected.x} onChange={(event) => selectCoordinate({ ...selected, x: Number(event.target.value) })} />
            </label>
            <label>
              <span>Y</span>
              <input type="number" min={MAP_MIN} max={MAP_MAX} value={selected.y} onChange={(event) => selectCoordinate({ ...selected, y: Number(event.target.value) })} />
            </label>
          </div>
          <div className="wos-map-nudge" aria-label="Move selected coordinate">
            <button type="button" aria-label="Move up" onClick={() => moveSelection(0, -1)}>↑</button>
            <button type="button" aria-label="Move left" onClick={() => moveSelection(-1, 0)}>←</button>
            <button type="button" aria-label="Move right" onClick={() => moveSelection(1, 0)}>→</button>
            <button type="button" aria-label="Move down" onClick={() => moveSelection(0, 1)}>↓</button>
          </div>
          <label>
            <span>Pitch</span>
            <input type="range" min="0" max="82" value={pitch} disabled={mode !== "3d"} onChange={(event) => setPitch(Number(event.target.value))} />
            <output>{pitch} deg</output>
          </label>
          <label>
            <span>Yaw</span>
            <input type="range" min="-180" max="180" value={yaw} disabled={mode !== "3d"} onChange={(event) => setYaw(Number(event.target.value))} />
            <output>{yaw} deg</output>
          </label>
          <label>
            <span>Roll</span>
            <input type="range" min="-45" max="45" value={roll} disabled={mode !== "3d"} onChange={(event) => setRoll(Number(event.target.value))} />
            <output>{roll} deg</output>
          </label>
          <label>
            <span>Zoom</span>
            <input type="range" min="30" max="8000" value={Math.round(zoom * 100)} onChange={(event) => setZoom(Number(event.target.value) / 100)} />
            <output>{Math.round(zoom * 100)}%</output>
          </label>
          <button type="button" onClick={resetView}>Reset View</button>
        </aside>
      </div>
    </section>
  );
}
