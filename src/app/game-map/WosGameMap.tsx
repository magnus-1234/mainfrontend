"use client";

import type { PointerEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

const MAP_SIZE = 1199;
const CANVAS_SIZE = 1199;
const GRID_STEP = 25;
const ASSET_ROOT = "/game-map/assets";

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

type LoadedAssets = Record<string, HTMLImageElement>;

type MapObject = {
  id: string;
  label: string;
  x: number;
  y: number;
  size: number;
  kind: "capital" | "tower" | "fort" | "city" | "resource";
  asset: string;
  tint?: string;
};

type Territory = {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
};

const assetFiles = {
  terrainMask: "terrain_mask.png",
  terrainMask2: "terrain_mask_2.png",
  waterMask: "water_mask.png",
  waterMask2: "water_mask2.png",
  iceMask: "ice_mask.png",
  worldMask: "mask.png",
  worldMaskAlt: "mask_1.png",
  resourceMask: "resource_mask.png",
  border: "border.png",
  borderDot: "border_dot.png",
  gridGreen: "GridGreen.png",
  gridRed: "GridRed.png",
  path: "WorldPath.png",
  cloud1: "fxui_m_tex_world_cloud01_lxy.png",
  cloud2: "fxui_m_tex_world_cloud02_lxy.png",
  maskEdge: "fxui_m_tex_world_maskedge03_lxy.png",
  sunfire: "3d_world_building_polar_knight_diffuse_01.png",
  turret: "3d_world_building_cloud_tower_diffuse_lighting.png",
  atlantis: "3d_world_building_atlantis_diffuse.png",
  dragon: "3d_world_building_dragon_diffuse.png",
  blueHeart: "3d_world_building_blue_heart_diffuse.png",
  snowman: "3d_world_building_giant_snowman_diffuse.png",
  flame: "3d_world_building_knight_of_flame_diffuse.png",
  wood: "item_icon_100001.png",
  meat: "item_icon_100002.png",
  coal: "item_icon_100003.png",
  iron: "item_icon_100004.png",
  crystal: "item_icon_100011.png",
  scaffold1: "slg_scaffold_01.png",
  scaffold2: "slg_scaffold_04.png",
  allianceBg: "allianceterritory_bg_001.png",
  allianceFlag: "allianceterritory_icon_001.png",
  allianceTower: "allianceterritory_icon_004.png",
  allianceTrap: "allianceterritory_icon_008.png",
} as const;

const WORLD_OBJECTS: MapObject[] = [
  { id: "sunfire", label: "Sunfire Castle", x: 597, y: 597, size: 72, kind: "capital", asset: "sunfire" },
  { id: "north-tower", label: "North Turret", x: 597, y: 512, size: 44, kind: "tower", asset: "turret" },
  { id: "east-tower", label: "East Turret", x: 682, y: 597, size: 44, kind: "tower", asset: "turret" },
  { id: "south-tower", label: "South Turret", x: 597, y: 682, size: 44, kind: "tower", asset: "turret" },
  { id: "west-tower", label: "West Turret", x: 512, y: 597, size: 44, kind: "tower", asset: "turret" },
  { id: "frost-fort", label: "Frost Fort", x: 298, y: 312, size: 58, kind: "fort", asset: "snowman" },
  { id: "flame-fort", label: "Flame Fort", x: 914, y: 336, size: 60, kind: "fort", asset: "flame" },
  { id: "eastern-city", label: "State City", x: 862, y: 776, size: 58, kind: "city", asset: "dragon" },
  { id: "western-city", label: "Alliance City", x: 268, y: 820, size: 58, kind: "city", asset: "blueHeart" },
  { id: "north-ruin", label: "Ruins", x: 612, y: 188, size: 54, kind: "fort", asset: "atlantis" },
  { id: "wood-node", label: "Wood", x: 212, y: 472, size: 34, kind: "resource", asset: "wood" },
  { id: "meat-node", label: "Meat", x: 775, y: 224, size: 34, kind: "resource", asset: "meat" },
  { id: "coal-node", label: "Coal", x: 410, y: 938, size: 34, kind: "resource", asset: "coal" },
  { id: "iron-node", label: "Iron", x: 976, y: 866, size: 34, kind: "resource", asset: "iron" },
  { id: "crystal-node", label: "Crystal", x: 628, y: 936, size: 34, kind: "resource", asset: "crystal" },
];

const TERRITORIES: Territory[] = [
  { id: "northwest", label: "ICE", x: 134, y: 166, width: 318, height: 258, color: "rgba(54, 161, 217, 0.22)" },
  { id: "northeast", label: "SUN", x: 736, y: 178, width: 290, height: 266, color: "rgba(238, 167, 69, 0.2)" },
  { id: "southwest", label: "ASH", x: 176, y: 744, width: 324, height: 252, color: "rgba(89, 127, 93, 0.2)" },
  { id: "southeast", label: "FROST", x: 752, y: 720, width: 318, height: 276, color: "rgba(123, 98, 206, 0.18)" },
];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const gridCellFor = (coord: Coordinate) => ({
  x: Math.floor((coord.x - 1) / GRID_STEP) * GRID_STEP,
  y: Math.floor((coord.y - 1) / GRID_STEP) * GRID_STEP,
});

const formatCoordinate = (coordinate: Coordinate) => `${coordinate.x}:${coordinate.y}`;

const loadMapAssets = async () => {
  const entries = Object.entries(assetFiles);
  const loaded = await Promise.all(
    entries.map(
      ([key, file]) =>
        new Promise<[string, HTMLImageElement]>((resolve) => {
          const image = new Image();
          image.onload = () => resolve([key, image]);
          image.onerror = () => resolve([key, image]);
          image.src = `${ASSET_ROOT}/${file}`;
        }),
    ),
  );
  return Object.fromEntries(loaded) as LoadedAssets;
};

const drawRoundedRect = (context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) => {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
};

const drawImagePattern = (
  context: CanvasRenderingContext2D,
  image: HTMLImageElement | undefined,
  alpha: number,
  composite: GlobalCompositeOperation = "source-over",
) => {
  if (!image?.complete || !image.naturalWidth) {
    return;
  }
  context.save();
  context.globalAlpha = alpha;
  context.globalCompositeOperation = composite;
  const pattern = context.createPattern(image, "repeat");
  if (pattern) {
    context.fillStyle = pattern;
    context.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  } else {
    context.drawImage(image, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
  }
  context.restore();
};

const drawWorldTerrain = (context: CanvasRenderingContext2D, assets: LoadedAssets | null) => {
  const base = context.createLinearGradient(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  base.addColorStop(0, "#d7edf1");
  base.addColorStop(0.28, "#eff8f7");
  base.addColorStop(0.58, "#c8dfd4");
  base.addColorStop(0.78, "#edf3e6");
  base.addColorStop(1, "#bccdd0");
  context.fillStyle = base;
  context.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  if (!assets) {
    return;
  }

  drawImagePattern(context, assets.terrainMask, 0.32, "multiply");
  drawImagePattern(context, assets.terrainMask2, 0.28, "overlay");
  drawImagePattern(context, assets.iceMask, 0.18, "screen");

  context.save();
  context.globalAlpha = 0.34;
  context.globalCompositeOperation = "multiply";
  context.drawImage(assets.waterMask2, -70, -54, 560, 560);
  context.drawImage(assets.waterMask, 740, 70, 460, 420);
  context.drawImage(assets.waterMask2, 732, 715, 540, 500);
  context.drawImage(assets.waterMask, 80, 820, 380, 320);
  context.restore();

  context.save();
  context.globalAlpha = 0.2;
  context.globalCompositeOperation = "soft-light";
  context.drawImage(assets.worldMask, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
  context.drawImage(assets.worldMaskAlt, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
  context.restore();
};

const drawTerritories = (context: CanvasRenderingContext2D, assets: LoadedAssets | null) => {
  for (const territory of TERRITORIES) {
    context.save();
    context.translate(territory.x + territory.width / 2, territory.y + territory.height / 2);
    context.rotate(-0.08);
    context.fillStyle = territory.color;
    context.strokeStyle = "rgba(255, 255, 255, 0.74)";
    context.lineWidth = 4;
    drawRoundedRect(context, -territory.width / 2, -territory.height / 2, territory.width, territory.height, 30);
    context.fill();
    context.stroke();
    context.strokeStyle = "rgba(18, 83, 92, 0.24)";
    context.lineWidth = 2;
    context.setLineDash([14, 12]);
    context.stroke();
    context.setLineDash([]);
    context.fillStyle = "rgba(15, 23, 42, 0.44)";
    context.font = "900 34px Arial";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(territory.label, 0, 0);
    if (assets?.allianceFlag?.complete) {
      context.drawImage(assets.allianceFlag, -territory.width / 2 + 20, -territory.height / 2 + 20, 44, 44);
    }
    context.restore();
  }
};

const drawRoads = (context: CanvasRenderingContext2D, assets: LoadedAssets | null) => {
  context.save();
  context.strokeStyle = "rgba(83, 92, 83, 0.28)";
  context.lineWidth = 16;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.beginPath();
  context.moveTo(150, 604);
  context.bezierCurveTo(360, 544, 468, 642, 596, 596);
  context.bezierCurveTo(748, 548, 838, 640, 1050, 584);
  context.moveTo(596, 596);
  context.bezierCurveTo(564, 422, 614, 338, 612, 188);
  context.moveTo(596, 596);
  context.bezierCurveTo(520, 742, 454, 826, 410, 938);
  context.moveTo(596, 596);
  context.bezierCurveTo(752, 676, 864, 746, 976, 866);
  context.stroke();

  context.strokeStyle = "rgba(255, 255, 255, 0.36)";
  context.lineWidth = 5;
  context.stroke();

  if (assets?.path?.complete) {
    const pattern = context.createPattern(assets.path, "repeat");
    if (pattern) {
      context.globalAlpha = 0.58;
      context.strokeStyle = pattern;
      context.lineWidth = 3;
      context.setLineDash([2, 12]);
      context.stroke();
    }
  }
  context.restore();
};

const drawGrid = (context: CanvasRenderingContext2D, assets: LoadedAssets | null) => {
  context.save();
  context.lineWidth = 1;
  for (let value = 1; value <= MAP_SIZE; value += GRID_STEP) {
    const position = value - 1;
    const isMajor = value === 1 || value % 100 === 0 || value === MAP_SIZE;
    context.strokeStyle = isMajor ? "rgba(28, 52, 58, 0.28)" : "rgba(28, 52, 58, 0.075)";
    context.beginPath();
    context.moveTo(position, 0);
    context.lineTo(position, CANVAS_SIZE);
    context.moveTo(0, position);
    context.lineTo(CANVAS_SIZE, position);
    context.stroke();
  }
  if (assets?.gridGreen?.complete && assets?.gridRed?.complete) {
    context.globalAlpha = 0.26;
    context.drawImage(assets.gridGreen, 568, 568, 64, 64);
    context.drawImage(assets.gridRed, 492, 492, 44, 44);
    context.drawImage(assets.gridRed, 664, 492, 44, 44);
    context.drawImage(assets.gridRed, 664, 664, 44, 44);
    context.drawImage(assets.gridRed, 492, 664, 44, 44);
  }
  context.restore();
};

const drawSelectedCell = (context: CanvasRenderingContext2D, coord: Coordinate, selectedCell = false) => {
  const cell = gridCellFor(coord);
  const cellWidth = Math.min(GRID_STEP, CANVAS_SIZE - cell.x);
  const cellHeight = Math.min(GRID_STEP, CANVAS_SIZE - cell.y);
  context.fillStyle = selectedCell ? "rgba(47, 116, 202, 0.18)" : "rgba(47, 116, 202, 0.09)";
  context.fillRect(cell.x, cell.y, cellWidth, cellHeight);
  context.strokeStyle = selectedCell ? "#2f74ca" : "rgba(47, 116, 202, 0.6)";
  context.lineWidth = selectedCell ? 4 : 2;
  context.strokeRect(cell.x + 1, cell.y + 1, Math.max(1, cellWidth - 2), Math.max(1, cellHeight - 2));
};

const drawSpriteObject = (context: CanvasRenderingContext2D, object: MapObject, assets: LoadedAssets | null) => {
  const image = assets?.[object.asset];
  const size = object.size;
  const x = object.x - size / 2;
  const y = object.y - size / 2;

  context.save();
  context.shadowColor = "rgba(11, 24, 34, 0.38)";
  context.shadowBlur = object.kind === "resource" ? 10 : 18;
  context.shadowOffsetY = object.kind === "resource" ? 8 : 16;

  if (object.kind !== "resource") {
    context.fillStyle = "rgba(12, 29, 35, 0.26)";
    context.beginPath();
    context.ellipse(object.x, object.y + size * 0.36, size * 0.44, size * 0.18, 0, 0, Math.PI * 2);
    context.fill();
  }

  if (image?.complete && image.naturalWidth) {
    if (object.kind === "resource") {
      context.drawImage(image, x, y, size, size);
    } else {
      context.save();
      context.beginPath();
      context.ellipse(object.x, object.y, size * 0.46, size * 0.48, 0, 0, Math.PI * 2);
      context.clip();
      context.drawImage(image, x, y, size, size);
      context.restore();
      context.strokeStyle = "rgba(255, 255, 255, 0.78)";
      context.lineWidth = 2;
      context.beginPath();
      context.ellipse(object.x, object.y, size * 0.46, size * 0.48, 0, 0, Math.PI * 2);
      context.stroke();
    }
  } else {
    const fallback = context.createRadialGradient(object.x, object.y - size * 0.2, 2, object.x, object.y, size);
    fallback.addColorStop(0, "#f5f7f2");
    fallback.addColorStop(1, "#6f8b86");
    context.fillStyle = fallback;
    context.beginPath();
    context.ellipse(object.x, object.y, size * 0.45, size * 0.45, 0, 0, Math.PI * 2);
    context.fill();
  }

  context.shadowBlur = 0;
  context.fillStyle = "rgba(8, 20, 26, 0.82)";
  context.strokeStyle = "rgba(255, 255, 255, 0.82)";
  context.lineWidth = 3;
  context.font = object.kind === "resource" ? "900 16px Arial" : "900 18px Arial";
  context.textAlign = "center";
  context.textBaseline = "top";
  context.strokeText(object.label, object.x, y + size + 6);
  context.fillText(object.label, object.x, y + size + 6);
  context.restore();
};

const drawWorldObjects = (context: CanvasRenderingContext2D, assets: LoadedAssets | null) => {
  for (const object of WORLD_OBJECTS) {
    drawSpriteObject(context, object, assets);
  }
};

const drawAtmosphere = (context: CanvasRenderingContext2D, assets: LoadedAssets | null) => {
  if (!assets) {
    return;
  }
  context.save();
  context.globalAlpha = 0.16;
  context.drawImage(assets.cloud1, 48, 54, 280, 170);
  context.drawImage(assets.cloud2, 806, 46, 330, 210);
  context.drawImage(assets.cloud1, 736, 930, 310, 180);
  context.drawImage(assets.maskEdge, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
  context.restore();
};

const drawMap = (canvas: HTMLCanvasElement, selected: Coordinate, hover: Coordinate | null, zoom: number, assets: LoadedAssets | null) => {
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
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";

  drawWorldTerrain(context, assets);
  drawTerritories(context, assets);
  drawRoads(context, assets);
  drawGrid(context, assets);

  if (hover) {
    drawSelectedCell(context, hover);
  }
  drawSelectedCell(context, selected, true);
  drawWorldObjects(context, assets);
  drawAtmosphere(context, assets);

  context.strokeStyle = "rgba(10, 30, 36, 0.72)";
  context.lineWidth = 3;
  context.strokeRect(1.5, 1.5, CANVAS_SIZE - 3, CANVAS_SIZE - 3);
};

export default function WosGameMap({ embedded = false }: { embedded?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mapShellRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const [assets, setAssets] = useState<LoadedAssets | null>(null);
  const [selected, setSelected] = useState<Coordinate>({ x: 600, y: 600 });
  const [hover, setHover] = useState<Coordinate | null>(null);
  const [mode, setMode] = useState<MapMode>("isometric");
  const [depthMode, setDepthMode] = useState<DepthMode>("2d");
  const [pitch, setPitch] = useState(0);
  const [yaw, setYaw] = useState(0);
  const [roll, setRoll] = useState(45);
  const [zoom, setZoom] = useState(0.78);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let alive = true;
    loadMapAssets().then((loaded) => {
      if (alive) {
        setAssets(loaded);
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    drawMap(canvas, selected, hover, zoom, assets);
  }, [assets, hover, selected, zoom]);

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
          <h1>Textured World Map</h1>
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
            setZoom((value) => clamp(value + (event.deltaY > 0 ? -0.16 : 0.16), 0.3, 8));
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
                setHover(coordinateFromPointer(event));
                const drag = dragRef.current;
                if (!drag || drag.pointerId !== event.pointerId) {
                  return;
                }
                if (mode !== "3d" && !(mode === "isometric" && depthMode === "3d")) {
                  setPan({ x: drag.panX + event.clientX - drag.x, y: drag.panY + event.clientY - drag.y });
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
                setZoom((value) => clamp(value + (event.deltaY > 0 ? -0.16 : 0.16), 0.3, 8));
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
                  setZoom((value) => clamp(value + 0.16, 0.3, 8));
                } else if (event.key === "-" || event.key === "_") {
                  event.preventDefault();
                  setZoom((value) => clamp(value - 0.16, 0.3, 8));
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
          <div className="wos-map-legend" aria-hidden="true">
            <span>Extracted terrain</span>
            <span>World buildings</span>
            <span>Resource nodes</span>
            <span>Territory overlay</span>
          </div>
        </div>

        <aside className="wos-map-controls" aria-label="Map controls">
          <div className="wos-map-mode-control" role="group" aria-label="Map mode">
            <button className={mode === "2d" ? "active" : ""} type="button" onClick={() => setMapMode("2d")}>2D</button>
            <button className={mode === "isometric" ? "active" : ""} type="button" onClick={() => setMapMode("isometric")}>ISO</button>
            <button className={mode === "3d" ? "active" : ""} type="button" onClick={() => setMapMode("3d")}>3D</button>
          </div>
          <div className="wos-zoom-board" aria-label="Zoom controls">
            <button type="button" aria-label="Zoom out" onClick={() => setZoom((value) => clamp(value - 0.25, 0.3, 8))}>−</button>
            <div>
              <span>Zoom</span>
              <strong>{Math.round(zoom * 100)}%</strong>
            </div>
            <button type="button" aria-label="Zoom in" onClick={() => setZoom((value) => clamp(value + 0.25, 0.3, 8))}>+</button>
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
          <div className="wos-map-asset-readout">
            <strong>{assets ? Object.keys(assetFiles).length : "0"}</strong>
            <span>Extracted PNG assets loaded</span>
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
            <input type="range" min="30" max="800" value={Math.round(zoom * 100)} onChange={(event) => setZoom(Number(event.target.value) / 100)} />
            <output>{Math.round(zoom * 100)}%</output>
          </label>
          <button type="button" onClick={resetView}>Reset View</button>
        </aside>
      </div>
    </section>
  );
}
