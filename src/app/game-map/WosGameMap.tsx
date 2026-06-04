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
  markerSize: number;
  cellSize: number;
  kind: "capital" | "turret" | "facility" | "stronghold" | "fortress";
  asset: string;
  color: string;
  showLabel?: boolean;
  facilityType?: string;
  facilityLevel?: number;
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
  surface: "surface2001.png",
  surfaceSnow: "surface2001_01.png",
  surfaceRock: "surface2001_02.png",
  surfaceDark: "surface2001_03.png",
  surfaceSnowLight: "surface2001_01_lighting.png",
  surfaceRockLight: "surface2001_02_lighting.png",
  surfaceDarkLight: "surface2001_03_lighting.png",
  water1: "water1.png",
  water2: "water2.png",
  water3: "water3.png",
  water4: "water4.png",
  tree: "tree.png",
  cloud1: "fxui_m_tex_world_cloud01_lxy.png",
  cloud2: "fxui_m_tex_world_cloud02_lxy.png",
  maskEdge: "fxui_m_tex_world_maskedge03_lxy.png",
  sunfire: "3d_world_building_furnace_frozenplanet_diffuse2.png",
  sunfireAlt: "3d_world_building_furnace_frozenplanet_diffuse.png",
  turret: "3d_world_build_tower_03_diffuse_lighting.png",
  turretAlt: "3d_world_build_tower_02_diffuse.png",
  stronghold: "3d_world_build_tower_01_diffuse.png",
  fortress: "3d_world_build_tower_diffuse.png",
  capitalGlow: "fx_tex_world_capitalwar_221_gx.png",
  towerGlow: "fx_tex_world_capitalwartower_18_xl.png",
  scaffold1: "slg_scaffold_01.png",
  scaffold2: "slg_scaffold_04.png",
  allianceBg: "allianceterritory_bg_001.png",
  allianceFlag: "allianceterritory_icon_001.png",
  allianceTower: "allianceterritory_icon_004.png",
  allianceTrap: "allianceterritory_icon_008.png",
} as const;

type FacilityGroup = {
  facilityType: string;
  label: string;
  color: string;
  levels: Array<{
    level: number;
    coordinates: Array<[number, number]>;
  }>;
};

const FACILITY_GROUPS: FacilityGroup[] = [
  {
    facilityType: "construction",
    label: "Construction",
    color: "#42a5f5",
    levels: [
      { level: 1, coordinates: [[1068, 138], [537, 138], [138, 138], [138, 666], [138, 1038], [666, 1068], [1068, 567], [1068, 1068]] },
      { level: 3, coordinates: [[486, 327], [768, 867], [867, 567], [327, 666]] },
    ],
  },
  {
    facilityType: "defense",
    label: "Defense",
    color: "#26c6da",
    levels: [
      { level: 2, coordinates: [[666, 138], [438, 267], [138, 537], [237, 768], [537, 1038], [738, 957], [1068, 666], [957, 438]] },
      { level: 4, coordinates: [[816, 717], [387, 717], [588, 327]] },
    ],
  },
  {
    facilityType: "tech",
    label: "Tech",
    color: "#ffa726",
    levels: [
      { level: 1, coordinates: [[957, 237], [666, 267], [237, 237], [267, 537], [237, 957], [537, 936], [936, 537], [957, 957]] },
      { level: 3, coordinates: [[867, 327], [327, 327], [327, 867], [867, 867]] },
    ],
  },
  {
    facilityType: "weapon",
    label: "Weapons",
    color: "#ef5350",
    levels: [
      { level: 2, coordinates: [[867, 138], [366, 138], [138, 438], [138, 867], [438, 1068], [1068, 327], [1068, 867], [867, 1068]] },
      { level: 4, coordinates: [[816, 486], [387, 486], [588, 867]] },
    ],
  },
  {
    facilityType: "gathering",
    label: "Gathering",
    color: "#ab47bc",
    levels: [{ level: 1, coordinates: [[957, 138], [537, 87], [138, 237], [87, 666], [267, 1068], [636, 1137], [1137, 567], [1068, 936]] }],
  },
  {
    facilityType: "production",
    label: "Production",
    color: "#66bb6a",
    levels: [{ level: 1, coordinates: [[1068, 237], [768, 138], [237, 138], [138, 327], [138, 957], [327, 1038], [1068, 747], [957, 1068]] }],
  },
  {
    facilityType: "training",
    label: "Training",
    color: "#ffee58",
    levels: [{ level: 2, coordinates: [[237, 486], [138, 747], [486, 957], [768, 1038], [957, 747], [1068, 486], [486, 138], [768, 237]] }],
  },
  {
    facilityType: "expedition",
    label: "Expedition",
    color: "#f48fb1",
    levels: [{ level: 3, coordinates: [[768, 327], [327, 567], [486, 867], [867, 666]] }],
  },
];

const STRONGHOLDS = [
  { x: 394, y: 597, label: "Stronghold 1" },
  { x: 597, y: 794, label: "Stronghold 2" },
  { x: 794, y: 597, label: "Stronghold 3" },
  { x: 597, y: 394, label: "Stronghold 4" },
];

const FORTRESSES = [
  { x: 366, y: 957, label: "Fortress 1" },
  { x: 588, y: 957, label: "Fortress 2" },
  { x: 846, y: 957, label: "Fortress 3" },
  { x: 957, y: 828, label: "Fortress 4" },
  { x: 957, y: 606, label: "Fortress 5" },
  { x: 957, y: 348, label: "Fortress 6" },
  { x: 846, y: 237, label: "Fortress 7" },
  { x: 588, y: 237, label: "Fortress 8" },
  { x: 366, y: 237, label: "Fortress 9" },
  { x: 237, y: 348, label: "Fortress 10" },
  { x: 237, y: 588, label: "Fortress 11" },
  { x: 237, y: 828, label: "Fortress 12" },
];

const coordinateToObjectCenter = ([x, y]: [number, number], cellSize: number) => ({
  x: 1200 - y - cellSize + cellSize / 2,
  y: 1200 - x - cellSize + cellSize / 2,
});

const facilityObjects = FACILITY_GROUPS.flatMap((group) =>
  group.levels.flatMap((level) =>
    level.coordinates.map((coordinate, index) => {
      const center = coordinateToObjectCenter(coordinate, 3);
      return {
        id: `${group.facilityType}-${level.level}-${index}`,
        label: `${group.label} Lv.${level.level}`,
        ...center,
        markerSize: level.level >= 3 ? 18 : 14,
        cellSize: 3,
        kind: "facility" as const,
        asset: "allianceTower",
        color: group.color,
        facilityType: group.facilityType,
        facilityLevel: level.level,
      };
    }),
  ),
);

const WORLD_OBJECTS: MapObject[] = [
  { id: "sunfire", label: "Sunfire Castle", x: 599, y: 599, markerSize: 74, cellSize: 4, kind: "capital", asset: "sunfire", color: "#f6b04f", showLabel: true },
  { id: "north-turret", label: "North Turret", x: 594, y: 594, markerSize: 34, cellSize: 2, kind: "turret", asset: "turret", color: "#f08b43" },
  { id: "east-turret", label: "East Turret", x: 604, y: 594, markerSize: 34, cellSize: 2, kind: "turret", asset: "turret", color: "#f08b43" },
  { id: "south-turret", label: "South Turret", x: 604, y: 604, markerSize: 34, cellSize: 2, kind: "turret", asset: "turret", color: "#f08b43" },
  { id: "west-turret", label: "West Turret", x: 594, y: 604, markerSize: 34, cellSize: 2, kind: "turret", asset: "turret", color: "#f08b43" },
  ...STRONGHOLDS.map((object): MapObject => ({
    id: object.label.toLowerCase().replace(" ", "-"),
    label: object.label,
    x: object.x + 3,
    y: object.y + 3,
    markerSize: 42,
    cellSize: 6,
    kind: "stronghold",
    asset: "stronghold",
    color: "#d8af61",
    showLabel: true,
  })),
  ...FORTRESSES.map((object): MapObject => ({
    id: object.label.toLowerCase().replace(" ", "-"),
    label: object.label,
    x: object.x + 3,
    y: object.y + 3,
    markerSize: 32,
    cellSize: 6,
    kind: "fortress",
    asset: "fortress",
    color: "#9eb4c5",
  })),
  ...facilityObjects,
];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const gridCellFor = (coord: Coordinate) => ({
  x: Math.floor((coord.x - 1) / GRID_STEP) * GRID_STEP,
  y: Math.floor((coord.y - 1) / GRID_STEP) * GRID_STEP,
});

const formatCoordinate = (coordinate: Coordinate) => `${coordinate.x}:${coordinate.y}`;

const loadMapAssets = (onAssetChanged: () => void) =>
  Object.fromEntries(
    Object.entries(assetFiles).map(([key, file]) => {
      const image = new Image();
      image.onload = onAssetChanged;
      image.onerror = onAssetChanged;
      image.src = `${ASSET_ROOT}/${file}`;
      return [key, image];
    }),
  ) as LoadedAssets;

const canDrawImage = (image: HTMLImageElement | undefined): image is HTMLImageElement => Boolean(image?.complete && image.naturalWidth > 0);

const drawAsset = (
  context: CanvasRenderingContext2D,
  image: HTMLImageElement | undefined,
  x: number,
  y: number,
  width: number,
  height: number,
) => {
  if (canDrawImage(image)) {
    context.drawImage(image, x, y, width, height);
  }
};

const drawImagePattern = (
  context: CanvasRenderingContext2D,
  image: HTMLImageElement | undefined,
  alpha: number,
  composite: GlobalCompositeOperation = "source-over",
) => {
  if (!canDrawImage(image)) {
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

const drawProceduralTerrain = (context: CanvasRenderingContext2D) => {
  const terrainPatches = [
    { x: 170, y: 165, rx: 190, ry: 155, color: "rgba(72, 143, 82, 0.42)" },
    { x: 385, y: 140, rx: 165, ry: 135, color: "rgba(240, 246, 238, 0.68)" },
    { x: 655, y: 148, rx: 220, ry: 150, color: "rgba(174, 123, 89, 0.34)" },
    { x: 948, y: 170, rx: 185, ry: 145, color: "rgba(72, 142, 78, 0.44)" },
    { x: 180, y: 430, rx: 210, ry: 180, color: "rgba(197, 104, 73, 0.38)" },
    { x: 480, y: 455, rx: 195, ry: 150, color: "rgba(78, 139, 82, 0.4)" },
    { x: 728, y: 420, rx: 210, ry: 168, color: "rgba(235, 242, 225, 0.6)" },
    { x: 1008, y: 455, rx: 188, ry: 175, color: "rgba(175, 102, 72, 0.38)" },
    { x: 250, y: 720, rx: 230, ry: 170, color: "rgba(70, 132, 79, 0.44)" },
    { x: 595, y: 660, rx: 180, ry: 165, color: "rgba(207, 118, 78, 0.34)" },
    { x: 910, y: 720, rx: 220, ry: 180, color: "rgba(68, 129, 82, 0.44)" },
    { x: 170, y: 1010, rx: 210, ry: 160, color: "rgba(235, 245, 234, 0.62)" },
    { x: 510, y: 1010, rx: 210, ry: 155, color: "rgba(77, 143, 77, 0.4)" },
    { x: 835, y: 1020, rx: 205, ry: 165, color: "rgba(195, 108, 75, 0.38)" },
    { x: 1070, y: 990, rx: 165, ry: 150, color: "rgba(75, 147, 77, 0.42)" },
  ];

  context.save();
  context.globalCompositeOperation = "source-over";
  for (const patch of terrainPatches) {
    const gradient = context.createRadialGradient(patch.x, patch.y, 10, patch.x, patch.y, Math.max(patch.rx, patch.ry));
    gradient.addColorStop(0, patch.color);
    gradient.addColorStop(0.58, patch.color);
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    context.fillStyle = gradient;
    context.beginPath();
    context.ellipse(patch.x, patch.y, patch.rx, patch.ry, 0.18, 0, Math.PI * 2);
    context.fill();
  }
  context.restore();

  context.save();
  context.globalAlpha = 0.24;
  context.strokeStyle = "rgba(68, 107, 82, 0.34)";
  context.lineWidth = 30;
  context.lineCap = "round";
  for (const [startX, startY, endX, endY] of [
    [60, 248, 330, 110],
    [820, 110, 1150, 255],
    [40, 920, 288, 1105],
    [838, 1085, 1155, 916],
    [116, 676, 346, 602],
    [873, 624, 1104, 692],
  ]) {
    context.beginPath();
    context.moveTo(startX, startY);
    context.bezierCurveTo((startX + endX) / 2, startY - 70, (startX + endX) / 2, endY + 70, endX, endY);
    context.stroke();
  }
  context.restore();
};

const drawWorldTerrain = (context: CanvasRenderingContext2D, assets: LoadedAssets | null) => {
  const base = context.createRadialGradient(600, 600, 80, 600, 600, 760);
  base.addColorStop(0, "#f0f6ef");
  base.addColorStop(0.34, "#d9e7df");
  base.addColorStop(0.68, "#edf3f2");
  base.addColorStop(1, "#c3d3d8");
  context.fillStyle = base;
  context.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  drawProceduralTerrain(context);

  if (!assets) {
    return;
  }

  context.save();
  context.globalAlpha = 0.12;
  context.globalCompositeOperation = "multiply";
  drawAsset(context, assets.surfaceSnow, 0, 0, 650, 650);
  drawAsset(context, assets.surfaceRock, 520, 20, 680, 680);
  drawAsset(context, assets.surfaceDark, 0, 540, 640, 660);
  drawAsset(context, assets.surface, 560, 560, 640, 640);
  context.restore();

  context.save();
  context.globalAlpha = 0.16;
  context.globalCompositeOperation = "screen";
  drawAsset(context, assets.surfaceSnowLight, 0, 0, 650, 650);
  drawAsset(context, assets.surfaceRockLight, 520, 20, 680, 680);
  drawAsset(context, assets.surfaceDarkLight, 560, 560, 640, 640);
  context.restore();

  context.save();
  context.globalAlpha = 0.16;
  context.globalCompositeOperation = "multiply";
  drawAsset(context, assets.water2, -130, -100, 420, 420);
  drawAsset(context, assets.water3, 908, -92, 410, 390);
  drawAsset(context, assets.water4, 910, 902, 410, 410);
  drawAsset(context, assets.water1, -120, 900, 420, 420);
  context.restore();

  drawImagePattern(context, assets.terrainMask, 0.05, "multiply");
  drawImagePattern(context, assets.terrainMask2, 0.04, "overlay");
  drawImagePattern(context, assets.iceMask, 0.05, "screen");

  context.save();
  context.globalAlpha = 0.08;
  context.globalCompositeOperation = "soft-light";
  drawAsset(context, assets.worldMask, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
  drawAsset(context, assets.worldMaskAlt, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
  context.restore();

  if (canDrawImage(assets.tree)) {
    context.save();
    context.globalAlpha = 0.11;
    context.globalCompositeOperation = "multiply";
    drawAsset(context, assets.tree, 50, 70, 280, 280);
    drawAsset(context, assets.tree, 920, 80, 260, 260);
    drawAsset(context, assets.tree, 65, 920, 280, 280);
    drawAsset(context, assets.tree, 900, 900, 290, 290);
    context.restore();
  }
};

const drawRoads = (context: CanvasRenderingContext2D, assets: LoadedAssets | null) => {
  context.save();
  context.strokeStyle = "rgba(87, 102, 94, 0.24)";
  context.lineWidth = 12;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.beginPath();
  context.moveTo(237, 588);
  context.bezierCurveTo(355, 548, 492, 620, 599, 599);
  context.bezierCurveTo(708, 574, 842, 622, 957, 606);
  context.moveTo(599, 599);
  context.bezierCurveTo(552, 492, 570, 420, 597, 394);
  context.moveTo(599, 599);
  context.bezierCurveTo(548, 708, 572, 760, 597, 794);
  context.moveTo(599, 599);
  context.bezierCurveTo(472, 560, 430, 586, 394, 597);
  context.moveTo(599, 599);
  context.bezierCurveTo(712, 558, 756, 584, 794, 597);
  context.moveTo(237, 348);
  context.bezierCurveTo(332, 244, 492, 238, 588, 237);
  context.bezierCurveTo(720, 236, 844, 236, 957, 348);
  context.moveTo(237, 828);
  context.bezierCurveTo(332, 952, 500, 958, 588, 957);
  context.bezierCurveTo(720, 956, 848, 956, 957, 828);
  context.stroke();

  context.strokeStyle = "rgba(255, 255, 255, 0.3)";
  context.lineWidth = 4;
  context.stroke();

  if (canDrawImage(assets?.path)) {
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
  if (canDrawImage(assets?.gridGreen) && canDrawImage(assets?.gridRed)) {
    context.globalAlpha = 0.34;
    drawAsset(context, assets.gridGreen, 552, 552, 96, 96);
    drawAsset(context, assets.gridRed, 592, 592, 18, 18);
    drawAsset(context, assets.gridRed, 582, 582, 22, 22);
    drawAsset(context, assets.gridRed, 602, 582, 22, 22);
    drawAsset(context, assets.gridRed, 602, 602, 22, 22);
    drawAsset(context, assets.gridRed, 582, 602, 22, 22);
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
  const size = object.markerSize;
  const x = object.x - size / 2;
  const y = object.y - size / 2;
  const isLandmark = object.kind !== "facility";

  context.save();
  context.shadowColor = "rgba(11, 24, 34, 0.3)";
  context.shadowBlur = isLandmark ? 16 : 5;
  context.shadowOffsetY = isLandmark ? 13 : 3;

  if (isLandmark) {
    context.fillStyle = "rgba(12, 29, 35, 0.22)";
    context.beginPath();
    context.ellipse(object.x, object.y + size * 0.36, size * 0.44, size * 0.18, 0, 0, Math.PI * 2);
    context.fill();
  }

  if (object.kind === "facility") {
    context.fillStyle = object.color;
    context.strokeStyle = "rgba(12, 30, 38, 0.54)";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(object.x, object.y - size / 2);
    context.lineTo(object.x + size / 2, object.y);
    context.lineTo(object.x, object.y + size / 2);
    context.lineTo(object.x - size / 2, object.y);
    context.closePath();
    context.fill();
    context.stroke();
    context.fillStyle = "rgba(255, 255, 255, 0.82)";
    context.font = "900 9px Arial";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(String(object.facilityLevel ?? ""), object.x, object.y + 0.5);
  } else if (canDrawImage(image)) {
    if (object.kind === "capital" && canDrawImage(assets?.capitalGlow)) {
      context.save();
      context.globalAlpha = 0.72;
      drawAsset(context, assets.capitalGlow, object.x - size * 0.76, object.y - size * 0.72, size * 1.52, size * 1.52);
      context.restore();
    }
    if (object.kind === "turret" && canDrawImage(assets?.towerGlow)) {
      context.save();
      context.globalAlpha = 0.55;
      drawAsset(context, assets.towerGlow, object.x - size * 0.7, object.y - size * 0.7, size * 1.4, size * 1.4);
      context.restore();
    }

    if (object.kind === "capital" || object.kind === "turret") {
      context.save();
      context.beginPath();
      context.ellipse(object.x, object.y, size * 0.5, size * 0.5, 0, 0, Math.PI * 2);
      context.clip();
      drawAsset(context, image, x, y, size, size);
      context.restore();
    } else {
      drawAsset(context, image, x, y, size, size);
    }
    context.strokeStyle = object.kind === "capital" ? "rgba(255, 219, 140, 0.9)" : "rgba(255, 255, 255, 0.72)";
    context.lineWidth = object.kind === "capital" ? 3 : 2;
    context.beginPath();
    context.ellipse(object.x, object.y, size * 0.48, size * 0.44, 0, 0, Math.PI * 2);
    context.stroke();
  } else {
    const fallback = context.createRadialGradient(object.x, object.y - size * 0.2, 2, object.x, object.y, size);
    fallback.addColorStop(0, "#f5f7f2");
    fallback.addColorStop(1, object.color);
    context.fillStyle = fallback;
    context.beginPath();
    context.ellipse(object.x, object.y, size * 0.45, size * 0.45, 0, 0, Math.PI * 2);
    context.fill();
  }

  if (object.showLabel) {
    context.shadowBlur = 0;
    context.fillStyle = "rgba(8, 20, 26, 0.86)";
    context.strokeStyle = "rgba(255, 255, 255, 0.86)";
    context.lineWidth = 3;
    context.font = object.kind === "capital" ? "900 18px Arial" : "900 13px Arial";
    context.textAlign = "center";
    context.textBaseline = "top";
    const labelY = y + size + (object.kind === "capital" ? 8 : 5);
    context.strokeText(object.label, object.x, labelY);
    context.fillText(object.label, object.x, labelY);
  }
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
  drawAsset(context, assets.cloud1, 48, 54, 280, 170);
  drawAsset(context, assets.cloud2, 806, 46, 330, 210);
  drawAsset(context, assets.cloud1, 736, 930, 310, 180);
  drawAsset(context, assets.maskEdge, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
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
  const [assetLoadTick, setAssetLoadTick] = useState(0);
  const [selected, setSelected] = useState<Coordinate>({ x: 600, y: 600 });
  const [hover, setHover] = useState<Coordinate | null>(null);
  const [mode, setMode] = useState<MapMode>("2d");
  const [depthMode, setDepthMode] = useState<DepthMode>("2d");
  const [pitch, setPitch] = useState(0);
  const [yaw, setYaw] = useState(0);
  const [roll, setRoll] = useState(0);
  const [zoom, setZoom] = useState(0.9);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const availableAssetCount = Object.keys(assetFiles).length;

  useEffect(() => {
    let alive = true;
    const loaded = loadMapAssets(() => {
      if (alive) {
        setAssetLoadTick((value) => value + 1);
      }
    });
    window.setTimeout(() => {
      if (alive) {
        setAssets(loaded);
      }
    }, 0);
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
  }, [assetLoadTick, assets, hover, selected, zoom]);

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

  const objectMarkerStyle = (object: MapObject) => {
    const assetFile = assetFiles[object.asset as keyof typeof assetFiles];
    return {
      left: `${(object.x / CANVAS_SIZE) * 100}%`,
      top: `${(object.y / CANVAS_SIZE) * 100}%`,
      width: `${(object.markerSize / CANVAS_SIZE) * 100}%`,
      ["--marker-color" as string]: object.color,
      ["--marker-image" as string]: assetFile ? `url(${ASSET_ROOT}/${assetFile})` : "none",
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
            <div className="wos-map-object-layer" aria-hidden="true">
              {WORLD_OBJECTS.map((object) => (
                <span
                  key={object.id}
                  className={`wos-map-object-marker kind-${object.kind}`}
                  style={objectMarkerStyle(object)}
                  title={object.label}
                >
                  {object.kind === "facility" && <span>{object.facilityLevel}</span>}
                  {object.showLabel && <em>{object.label}</em>}
                </span>
              ))}
            </div>
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
            <span>1200 x 1200 state map</span>
            <span>Sunfire + turrets</span>
            <span>73 fixed facilities</span>
            <span>Strongholds + fortresses</span>
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
            <strong>{availableAssetCount}</strong>
            <span>Extracted PNG files available</span>
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
