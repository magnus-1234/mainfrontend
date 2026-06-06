"use client";

import type { PointerEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

const MAP_MIN = 1;
const MAP_MAX = 1199;
const CANVAS_SIZE = 1199;
const COORDINATE_STEP = 1;
const MINOR_GRID_STEP = 25;
const MID_GRID_STEP = 5;
const MAJOR_GRID_STEP = 100;
const MIN_ZOOM = 1;
const MAX_ZOOM = 1200;
const WHEEL_ZOOM_FACTOR = 1.22;
const MIN_VIEW_SIZE = CANVAS_SIZE / MAX_ZOOM;

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
  cameraX: number;
  cameraY: number;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const gridCellFor = (coord: Coordinate) => ({
  x: Math.floor((coord.x - MAP_MIN) / COORDINATE_STEP) * COORDINATE_STEP,
  y: Math.floor((coord.y - MAP_MIN) / COORDINATE_STEP) * COORDINATE_STEP,
});

const formatCoordinate = (coordinate: Coordinate) => `${coordinate.x},${coordinate.y}`;

const boundCamera = (camera: Coordinate, zoom: number) => {
  const size = CANVAS_SIZE / zoom;
  const halfSize = size / 2;
  return {
    x: clamp(camera.x, halfSize, CANVAS_SIZE - halfSize),
    y: clamp(camera.y, halfSize, CANVAS_SIZE - halfSize),
  };
};

export default function WosGameMap({ embedded = false }: { embedded?: boolean }) {
  const mapShellRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const hoverFrameRef = useRef<number | null>(null);
  const pendingHoverRef = useRef<Coordinate | null>(null);
  const cameraFrameRef = useRef<number | null>(null);
  const pendingCameraRef = useRef({ x: 600, y: 600 });
  const [selected, setSelected] = useState<Coordinate>({ x: 600, y: 600 });
  const [hover, setHover] = useState<Coordinate | null>(null);
  const [mode, setMode] = useState<MapMode>("2d");
  const [depthMode, setDepthMode] = useState<DepthMode>("2d");
  const [pitch, setPitch] = useState(0);
  const [yaw, setYaw] = useState(0);
  const [roll, setRoll] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [camera, setCamera] = useState({ x: 600, y: 600 });
  const viewSize = Math.max(MIN_VIEW_SIZE, CANVAS_SIZE / zoom);
  const viewX = clamp(camera.x - viewSize / 2, 0, CANVAS_SIZE - viewSize);
  const viewY = clamp(camera.y - viewSize / 2, 0, CANVAS_SIZE - viewSize);
  const selectedCell = gridCellFor(selected);
  const hoverCell = hover ? gridCellFor(hover) : null;
  const selectedFill = zoom >= 24 ? "rgba(37, 99, 235, 0.1)" : zoom >= 6 ? "rgba(37, 99, 235, 0.18)" : "rgba(37, 99, 235, 0.28)";
  const hoverFill = zoom >= 24 ? "rgba(37, 99, 235, 0.06)" : zoom >= 6 ? "rgba(37, 99, 235, 0.1)" : "rgba(37, 99, 235, 0.16)";
  const coordinateLabelStyle = (coordinate: Coordinate, selectedLabel = false) => {
    const cell = gridCellFor(coordinate);
    return {
      left: `${clamp(((cell.x + 0.5 - viewX) / viewSize) * 100, 3, 97)}%`,
      top: `${clamp(((cell.y + 0.5 - viewY) / viewSize) * 100, 3, 97)}%`,
      ["--label-opacity" as string]: selectedLabel ? "1" : "0.94",
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
    if (cameraFrameRef.current !== null) {
      window.cancelAnimationFrame(cameraFrameRef.current);
    }
  }, []);

  const coordinateFromPointer = useCallback((event: PointerEvent<SVGSVGElement>): Coordinate => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = clamp(Math.floor(viewX + ((event.clientX - rect.left) / rect.width) * viewSize) + MAP_MIN, MAP_MIN, MAP_MAX);
    const y = clamp(Math.floor(viewY + ((event.clientY - rect.top) / rect.height) * viewSize) + MAP_MIN, MAP_MIN, MAP_MAX);
    return { x, y };
  }, [viewSize, viewX, viewY]);

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
    setZoom((value) => {
      const nextZoom = clamp(updater(value), MIN_ZOOM, MAX_ZOOM);
      setCamera((cameraValue) => boundCamera(cameraValue, nextZoom));
      return nextZoom;
    });
  };

  const zoomByWheel = (event: { clientX: number; clientY: number; currentTarget: SVGSVGElement; deltaY: number }) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const pointerXRatio = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    const pointerYRatio = clamp((event.clientY - rect.top) / rect.height, 0, 1);
    const mapX = viewX + pointerXRatio * viewSize;
    const mapY = viewY + pointerYRatio * viewSize;
    const nextZoom = clamp(zoom * (event.deltaY > 0 ? 1 / WHEEL_ZOOM_FACTOR : WHEEL_ZOOM_FACTOR), MIN_ZOOM, MAX_ZOOM);
    const nextViewSize = Math.max(MIN_VIEW_SIZE, CANVAS_SIZE / nextZoom);

    setZoom(nextZoom);
    setCamera(
      boundCamera(
        {
          x: mapX - (pointerXRatio - 0.5) * nextViewSize,
          y: mapY - (pointerYRatio - 0.5) * nextViewSize,
        },
        nextZoom,
      ),
    );
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

  const scheduleCamera = (nextCamera: { x: number; y: number }) => {
    pendingCameraRef.current = nextCamera;
    if (cameraFrameRef.current !== null) {
      return;
    }
    cameraFrameRef.current = window.requestAnimationFrame(() => {
      cameraFrameRef.current = null;
      setCamera(boundCamera(pendingCameraRef.current, zoom));
    });
  };

  const setMapMode = (nextMode: MapMode) => {
    setMode(nextMode);
    if (nextMode === "2d") {
      setDepthMode("2d");
      setPitch(0);
      setYaw(0);
      setRoll(0);
      setZoom(1);
      setCamera({ x: selected.x, y: selected.y });
      return;
    }
    if (nextMode === "isometric") {
      setPitch(depthMode === "3d" ? 58 : 0);
      setYaw(0);
      setRoll(45);
      setZoom(1);
      setCamera({ x: selected.x, y: selected.y });
      return;
    }
    setDepthMode("3d");
    setPitch(58);
    setYaw(-28);
    setRoll(0);
    setZoom(1);
    setCamera({ x: selected.x, y: selected.y });
  };

  const resetView = () => {
    if (mode === "2d") {
      setPitch(0);
      setYaw(0);
      setRoll(0);
      setZoom(1);
      setCamera({ x: selected.x, y: selected.y });
      return;
    }
    if (mode === "isometric") {
      setPitch(depthMode === "3d" ? 58 : 0);
      setYaw(0);
      setRoll(45);
      setZoom(1);
      setCamera({ x: selected.x, y: selected.y });
      return;
    }
    setPitch(58);
    setYaw(-28);
    setRoll(0);
    setZoom(1);
    setCamera({ x: selected.x, y: selected.y });
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
          }}
        >
          <div
            className={`wos-map-rotator mode-${mode} depth-${depthMode}`}
            style={{
              transform: mode === "2d" ? "none" : `rotateX(${pitch}deg) rotateY(${yaw}deg) rotateZ(${roll}deg)`,
            }}
          >
            <svg
              className="wos-map-canvas"
              viewBox={`${viewX} ${viewY} ${viewSize} ${viewSize}`}
              aria-label="Clickable 1199 by 1199 Whiteout Survival coordinate map"
              role="application"
              tabIndex={0}
              preserveAspectRatio="none"
              onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId);
                dragRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, yaw, pitch, cameraX: camera.x, cameraY: camera.y };
              }}
              onPointerMove={(event) => {
                event.preventDefault();
                scheduleHover(coordinateFromPointer(event));
                const drag = dragRef.current;
                if (!drag || drag.pointerId !== event.pointerId) {
                  return;
                }
                if (mode !== "3d" && !(mode === "isometric" && depthMode === "3d")) {
                  const rect = event.currentTarget.getBoundingClientRect();
                  const mapUnitsPerPixel = viewSize / Math.max(1, rect.width);
                  scheduleCamera({
                    x: clamp(drag.cameraX - (event.clientX - drag.x) * mapUnitsPerPixel, MAP_MIN, MAP_MAX),
                    y: clamp(drag.cameraY - (event.clientY - drag.y) * mapUnitsPerPixel, MAP_MIN, MAP_MAX),
                  });
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
                zoomByWheel(event);
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
            >
              <defs>
                <pattern id="wos-grid-unit" width={COORDINATE_STEP} height={COORDINATE_STEP} patternUnits="userSpaceOnUse">
                  <path d={`M ${COORDINATE_STEP} 0 L 0 0 0 ${COORDINATE_STEP}`} fill="none" stroke="rgba(15, 23, 42, 0.12)" strokeWidth="0.018" vectorEffect="non-scaling-stroke" />
                </pattern>
                <pattern id="wos-grid-mid" width={MID_GRID_STEP} height={MID_GRID_STEP} patternUnits="userSpaceOnUse">
                  <path d={`M ${MID_GRID_STEP} 0 L 0 0 0 ${MID_GRID_STEP}`} fill="none" stroke="rgba(15, 23, 42, 0.18)" strokeWidth="0.035" vectorEffect="non-scaling-stroke" />
                </pattern>
                <pattern id="wos-grid-minor" width={MINOR_GRID_STEP} height={MINOR_GRID_STEP} patternUnits="userSpaceOnUse">
                  <path d={`M ${MINOR_GRID_STEP} 0 L 0 0 0 ${MINOR_GRID_STEP}`} fill="none" stroke="rgba(17, 24, 39, 0.22)" strokeWidth="0.12" vectorEffect="non-scaling-stroke" />
                </pattern>
                <pattern id="wos-grid-major" width={MAJOR_GRID_STEP} height={MAJOR_GRID_STEP} patternUnits="userSpaceOnUse">
                  <path d={`M ${MAJOR_GRID_STEP} 0 L 0 0 0 ${MAJOR_GRID_STEP}`} fill="none" stroke="rgba(17, 24, 39, 0.48)" strokeWidth="0.35" vectorEffect="non-scaling-stroke" />
                </pattern>
              </defs>
              <rect width={CANVAS_SIZE} height={CANVAS_SIZE} fill="#ffffff" />
              {zoom >= 12 && <rect width={CANVAS_SIZE} height={CANVAS_SIZE} fill="url(#wos-grid-unit)" />}
              {zoom >= 4 && <rect width={CANVAS_SIZE} height={CANVAS_SIZE} fill="url(#wos-grid-mid)" />}
              <rect width={CANVAS_SIZE} height={CANVAS_SIZE} fill="url(#wos-grid-minor)" />
              <rect width={CANVAS_SIZE} height={CANVAS_SIZE} fill="url(#wos-grid-major)" />
              {hover && (
                <rect
                  x={gridCellFor(hover).x}
                  y={gridCellFor(hover).y}
                  width={COORDINATE_STEP}
                  height={COORDINATE_STEP}
                  fill={hoverFill}
                  stroke="rgba(37, 99, 235, 0.72)"
                  strokeWidth="0.08"
                  vectorEffect="non-scaling-stroke"
                />
              )}
              <rect
                x={gridCellFor(selected).x}
                y={gridCellFor(selected).y}
                width={COORDINATE_STEP}
                height={COORDINATE_STEP}
                fill={selectedFill}
                stroke="#2563eb"
                strokeWidth="0.12"
                vectorEffect="non-scaling-stroke"
              />
              {zoom <= 1.15 && <rect x="1.5" y="1.5" width={CANVAS_SIZE - 3} height={CANVAS_SIZE - 3} fill="none" stroke="rgba(17, 24, 39, 0.6)" strokeWidth="2" vectorEffect="non-scaling-stroke" />}
            </svg>
            <span className="wos-coordinate-tag selected" style={coordinateLabelStyle(selected, true)}>
              {formatCoordinate(selected)}
            </span>
            {hover && hoverCell && (hoverCell.x !== selectedCell.x || hoverCell.y !== selectedCell.y) && (
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
            <input type="range" min="100" max="120000" value={Math.round(zoom * 100)} onChange={(event) => setSmoothZoom(() => Number(event.target.value) / 100)} />
            <output>{Math.round(zoom * 100)}%</output>
          </label>
          <button type="button" onClick={resetView}>Reset View</button>
        </aside>
      </div>
    </section>
  );
}
