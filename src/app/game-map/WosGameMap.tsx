"use client";

import type { PointerEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

const MAP_SIZE = 1199;
const CANVAS_SIZE = 1199;
const GRID_STEP = 25;
const MIN_ZOOM = 0.3;
const MAX_ZOOM = 24;
const WHEEL_ZOOM_FACTOR = 1.16;

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
  kind: "castle" | "turret";
  col: number;
  row: number;
  size: number;
};

const SUNFIRE_FACILITIES: Facility[] = [
  { id: "sunfire-castle", label: "Sunfire Castle", kind: "castle", col: 597, row: 597, size: 4 },
  { id: "north-turret", label: "North Turret", kind: "turret", col: 593, row: 593, size: 2 },
  { id: "east-turret", label: "East Turret", kind: "turret", col: 603, row: 593, size: 2 },
  { id: "south-turret", label: "South Turret", kind: "turret", col: 603, row: 603, size: 2 },
  { id: "west-turret", label: "West Turret", kind: "turret", col: 593, row: 603, size: 2 },
];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const gridCellFor = (coord: Coordinate) => ({
  x: Math.floor((coord.x - 1) / GRID_STEP) * GRID_STEP,
  y: Math.floor((coord.y - 1) / GRID_STEP) * GRID_STEP,
});

const formatCoordinate = (coordinate: Coordinate) => `${coordinate.x}:${coordinate.y}`;

const drawCellBlock = (
  context: CanvasRenderingContext2D,
  col: number,
  row: number,
  size: number,
  fill: string,
  stroke: string,
) => {
  const x = col;
  const y = row;
  const blockSize = size;
  context.fillStyle = fill;
  context.fillRect(x, y, blockSize, blockSize);
  context.strokeStyle = stroke;
  context.lineWidth = 1.5;
  context.strokeRect(x + 0.75, y + 0.75, blockSize - 1.5, blockSize - 1.5);
};

const drawFacilityLabel = (context: CanvasRenderingContext2D, facility: Facility) => {
  const centerX = facility.col + facility.size / 2;
  const label = facility.kind === "castle" ? "SC" : facility.label.split(" ")[0];
  const width = facility.kind === "castle" ? 20 : 18;
  const height = 7;
  const x = centerX - width / 2;
  const y = facility.row + facility.size + 2;

  context.fillStyle = "rgba(13, 24, 38, 0.94)";
  context.fillRect(x, y, width, height);
  context.strokeStyle = "rgba(255, 255, 255, 0.82)";
  context.lineWidth = 0.7;
  context.strokeRect(x + 0.35, y + 0.35, width - 0.7, height - 0.7);
  context.fillStyle = "#ffffff";
  context.font = "700 4px Arial";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(label, centerX, y + height / 2 + 0.25);
};

const drawSunfireFacilities = (context: CanvasRenderingContext2D) => {
  context.save();
  for (const facility of SUNFIRE_FACILITIES) {
    if (facility.kind === "castle") {
      drawCellBlock(context, facility.col, facility.row, facility.size, "rgba(245, 158, 11, 0.88)", "#92400e");
      context.strokeStyle = "rgba(255, 255, 255, 0.92)";
      context.lineWidth = 0.9;
      context.strokeRect(facility.col + 1.2, facility.row + 1.2, facility.size - 2.4, facility.size - 2.4);
    } else {
      drawCellBlock(context, facility.col, facility.row, facility.size, "rgba(14, 165, 233, 0.86)", "#075985");
    }
    drawFacilityLabel(context, facility);
  }
  context.restore();
};

const drawSelection = (context: CanvasRenderingContext2D, coord: Coordinate, selectedCell = false) => {
  const cell = gridCellFor(coord);
  const cellWidth = Math.min(GRID_STEP, CANVAS_SIZE - cell.x);
  const cellHeight = Math.min(GRID_STEP, CANVAS_SIZE - cell.y);

  context.fillStyle = selectedCell ? "rgba(37, 99, 235, 0.14)" : "rgba(37, 99, 235, 0.08)";
  context.fillRect(cell.x, cell.y, cellWidth, cellHeight);
  context.strokeStyle = selectedCell ? "#2563eb" : "rgba(37, 99, 235, 0.62)";
  context.lineWidth = selectedCell ? 4 : 2;
  context.strokeRect(cell.x + 1, cell.y + 1, Math.max(1, cellWidth - 2), Math.max(1, cellHeight - 2));
};

const drawMap = (canvas: HTMLCanvasElement, selected: Coordinate, hover: Coordinate | null, zoom: number) => {
  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }

  const ratio = window.devicePixelRatio || 1;
  const renderBoost = zoom > 1 ? Math.min(4, Math.ceil(zoom)) : 1;
  const renderScale = ratio * renderBoost;
  canvas.width = CANVAS_SIZE * renderScale;
  canvas.height = CANVAS_SIZE * renderScale;
  context.setTransform(renderScale, 0, 0, renderScale, 0, 0);
  context.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  context.imageSmoothingEnabled = false;

  context.fillStyle = "#f8fafc";
  context.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  context.lineWidth = 1;
  for (let value = 1; value <= MAP_SIZE; value += GRID_STEP) {
    const position = value - 1;
    const isMajor = value === 1 || value % 100 === 0 || value === MAP_SIZE;
    context.strokeStyle = isMajor ? "rgba(17, 24, 39, 0.38)" : "rgba(17, 24, 39, 0.11)";
    context.beginPath();
    context.moveTo(position, 0);
    context.lineTo(position, CANVAS_SIZE);
    context.moveTo(0, position);
    context.lineTo(CANVAS_SIZE, position);
    context.stroke();
  }

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
  drawSunfireFacilities(context);

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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    drawMap(canvas, selected, hover, zoom);
  }, [hover, selected, zoom]);

  const coordinateLabelStyle = (coordinate: Coordinate, selectedLabel = false) => {
    const cell = gridCellFor(coordinate);
    const cellWidth = Math.min(GRID_STEP, CANVAS_SIZE - cell.x);
    const inverseScale = clamp(1 / Math.max(zoom, 1), 0.2, 1);
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
    const x = clamp(Math.round(((event.clientX - rect.left) / rect.width) * MAP_SIZE), 1, MAP_SIZE);
    const y = clamp(Math.round(((event.clientY - rect.top) / rect.height) * MAP_SIZE), 1, MAP_SIZE);
    return { x, y };
  }, []);

  const selectCoordinate = (coordinate: Coordinate) => {
    setSelected({
      x: Math.round(clamp(coordinate.x, 1, MAP_SIZE)),
      y: Math.round(clamp(coordinate.y, 1, MAP_SIZE)),
    });
  };

  const moveSelection = (xDelta: number, yDelta: number) => {
    setSelected((value) => ({
      x: Math.round(clamp(value.x + xDelta, 1, MAP_SIZE)),
      y: Math.round(clamp(value.y + yDelta, 1, MAP_SIZE)),
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
          <h1>1199 x 1199 Coordinate Grid</h1>
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
              aria-label="Clickable 1199 by 1199 Whiteout Survival coordinate map"
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
              <input type="number" min="1" max={MAP_SIZE} value={selected.x} onChange={(event) => selectCoordinate({ ...selected, x: Number(event.target.value) })} />
            </label>
            <label>
              <span>Y</span>
              <input type="number" min="1" max={MAP_SIZE} value={selected.y} onChange={(event) => selectCoordinate({ ...selected, y: Number(event.target.value) })} />
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
            <input type="range" min="30" max="2400" value={Math.round(zoom * 100)} onChange={(event) => setZoom(Number(event.target.value) / 100)} />
            <output>{Math.round(zoom * 100)}%</output>
          </label>
          <button type="button" onClick={resetView}>Reset View</button>
        </aside>
      </div>
    </section>
  );
}
