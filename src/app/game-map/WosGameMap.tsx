"use client";

import type { CSSProperties, PointerEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

const MAP_MIN = 1;
const MAP_MAX = 1199;
const CANVAS_SIZE = 1199;
const COORDINATE_STEP = 1;
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

type ResourceKind = "iron" | "meat" | "wood" | "coal";

type ResourceBuilding = {
  id: string;
  x: number;
  y: number;
  kind: ResourceKind;
};

type SunfireLandmarkKind = "castle" | "turret" | "stronghold" | "fortress" | "facility";

type SunfireLandmark = {
  id: string;
  label: string;
  kind: SunfireLandmarkKind;
  planner: {
    col: number;
    row: number;
    size: number;
  };
  facing?: number;
  bonus?: string;
  color?: string;
};

type PlannerItemKind = "hq" | "banner";
type PlannerItem = {
  id: string;
  kind: PlannerItemKind;
  col: number;
  row: number;
};

const RESOURCE_BUILDING_SIZE = 2;

const SUNFIRE_LANDMARKS: SunfireLandmark[] = [
  {
    id: "sunfire-turret-north",
    label: "North Turret",
    kind: "turret",
    planner: { col: 593, row: 593, size: 2 },
    facing: -135,
  },
  {
    id: "sunfire-turret-east",
    label: "East Turret",
    kind: "turret",
    planner: { col: 603, row: 593, size: 2 },
    facing: -45,
  },
  {
    id: "sunfire-turret-south",
    label: "South Turret",
    kind: "turret",
    planner: { col: 603, row: 603, size: 2 },
    facing: 45,
  },
  {
    id: "sunfire-turret-west",
    label: "West Turret",
    kind: "turret",
    planner: { col: 593, row: 603, size: 2 },
    facing: 135,
  },
  {
    id: "sunfire-castle",
    label: "Sunfire Castle",
    kind: "castle",
    planner: { col: 597, row: 597, size: 4 },
  },
];

const WOS_STRONGHOLDS: SunfireLandmark[] = [
  { id: "stronghold-1", label: "Stronghold 1", kind: "stronghold", planner: { col: 394, row: 597, size: 3 } },
  { id: "stronghold-2", label: "Stronghold 2", kind: "stronghold", planner: { col: 597, row: 794, size: 3 } },
  { id: "stronghold-3", label: "Stronghold 3", kind: "stronghold", planner: { col: 794, row: 597, size: 3 } },
  { id: "stronghold-4", label: "Stronghold 4", kind: "stronghold", planner: { col: 597, row: 394, size: 3 } },
];

const WOS_FORTRESSES: SunfireLandmark[] = [
  { id: "fortress-1", label: "Fortress 1", kind: "fortress", planner: { col: 366, row: 957, size: 2 } },
  { id: "fortress-2", label: "Fortress 2", kind: "fortress", planner: { col: 588, row: 957, size: 2 } },
  { id: "fortress-3", label: "Fortress 3", kind: "fortress", planner: { col: 846, row: 957, size: 2 } },
  { id: "fortress-4", label: "Fortress 4", kind: "fortress", planner: { col: 957, row: 828, size: 2 } },
  { id: "fortress-5", label: "Fortress 5", kind: "fortress", planner: { col: 957, row: 606, size: 2 } },
  { id: "fortress-6", label: "Fortress 6", kind: "fortress", planner: { col: 957, row: 348, size: 2 } },
  { id: "fortress-7", label: "Fortress 7", kind: "fortress", planner: { col: 846, row: 237, size: 2 } },
  { id: "fortress-8", label: "Fortress 8", kind: "fortress", planner: { col: 588, row: 237, size: 2 } },
  { id: "fortress-9", label: "Fortress 9", kind: "fortress", planner: { col: 366, row: 237, size: 2 } },
  { id: "fortress-10", label: "Fortress 10", kind: "fortress", planner: { col: 237, row: 348, size: 2 } },
  { id: "fortress-11", label: "Fortress 11", kind: "fortress", planner: { col: 237, row: 588, size: 2 } },
  { id: "fortress-12", label: "Fortress 12", kind: "fortress", planner: { col: 237, row: 828, size: 2 } },
];

const WOS_FACILITIES: SunfireLandmark[] = [
  { id: "facility-1", label: "Construction Lv. 1", kind: "facility", planner: { col: 1068, row: 138, size: 3 }, bonus: "Construction Speed +5%", color: "#42a5f5" },
  { id: "facility-2", label: "Construction Lv. 1", kind: "facility", planner: { col: 537, row: 138, size: 3 }, bonus: "Construction Speed +5%", color: "#42a5f5" },
  { id: "facility-3", label: "Construction Lv. 1", kind: "facility", planner: { col: 138, row: 138, size: 3 }, bonus: "Construction Speed +5%", color: "#42a5f5" },
  { id: "facility-4", label: "Construction Lv. 1", kind: "facility", planner: { col: 138, row: 666, size: 3 }, bonus: "Construction Speed +5%", color: "#42a5f5" },
  { id: "facility-5", label: "Construction Lv. 1", kind: "facility", planner: { col: 138, row: 1038, size: 3 }, bonus: "Construction Speed +5%", color: "#42a5f5" },
  { id: "facility-6", label: "Construction Lv. 1", kind: "facility", planner: { col: 666, row: 1068, size: 3 }, bonus: "Construction Speed +5%", color: "#42a5f5" },
  { id: "facility-7", label: "Construction Lv. 1", kind: "facility", planner: { col: 1068, row: 567, size: 3 }, bonus: "Construction Speed +5%", color: "#42a5f5" },
  { id: "facility-8", label: "Construction Lv. 1", kind: "facility", planner: { col: 1068, row: 1068, size: 3 }, bonus: "Construction Speed +5%", color: "#42a5f5" },
  { id: "facility-9", label: "Construction Lv. 3", kind: "facility", planner: { col: 486, row: 327, size: 3 }, bonus: "Construction Speed +8%", color: "#42a5f5" },
  { id: "facility-10", label: "Construction Lv. 3", kind: "facility", planner: { col: 768, row: 867, size: 3 }, bonus: "Construction Speed +8%", color: "#42a5f5" },
  { id: "facility-11", label: "Construction Lv. 3", kind: "facility", planner: { col: 867, row: 567, size: 3 }, bonus: "Construction Speed +8%", color: "#42a5f5" },
  { id: "facility-12", label: "Construction Lv. 3", kind: "facility", planner: { col: 327, row: 666, size: 3 }, bonus: "Construction Speed +8%", color: "#42a5f5" },
  { id: "facility-13", label: "Defense Lv. 2", kind: "facility", planner: { col: 666, row: 138, size: 3 }, bonus: "Troop Defense +5%", color: "#26c6da" },
  { id: "facility-14", label: "Defense Lv. 2", kind: "facility", planner: { col: 438, row: 267, size: 3 }, bonus: "Troop Defense +5%", color: "#26c6da" },
  { id: "facility-15", label: "Defense Lv. 2", kind: "facility", planner: { col: 138, row: 537, size: 3 }, bonus: "Troop Defense +5%", color: "#26c6da" },
  { id: "facility-16", label: "Defense Lv. 2", kind: "facility", planner: { col: 237, row: 768, size: 3 }, bonus: "Troop Defense +5%", color: "#26c6da" },
  { id: "facility-17", label: "Defense Lv. 2", kind: "facility", planner: { col: 537, row: 1038, size: 3 }, bonus: "Troop Defense +5%", color: "#26c6da" },
  { id: "facility-18", label: "Defense Lv. 2", kind: "facility", planner: { col: 738, row: 957, size: 3 }, bonus: "Troop Defense +5%", color: "#26c6da" },
  { id: "facility-19", label: "Defense Lv. 2", kind: "facility", planner: { col: 1068, row: 666, size: 3 }, bonus: "Troop Defense +5%", color: "#26c6da" },
  { id: "facility-20", label: "Defense Lv. 2", kind: "facility", planner: { col: 957, row: 438, size: 3 }, bonus: "Troop Defense +5%", color: "#26c6da" },
  { id: "facility-21", label: "Defense Lv. 4", kind: "facility", planner: { col: 816, row: 717, size: 3 }, bonus: "Troop Defense +8%", color: "#26c6da" },
  { id: "facility-22", label: "Defense Lv. 4", kind: "facility", planner: { col: 387, row: 717, size: 3 }, bonus: "Troop Defense +8%", color: "#26c6da" },
  { id: "facility-23", label: "Defense Lv. 4", kind: "facility", planner: { col: 588, row: 327, size: 3 }, bonus: "Troop Defense +8%", color: "#26c6da" },
  { id: "facility-24", label: "Tech Lv. 1", kind: "facility", planner: { col: 957, row: 237, size: 3 }, bonus: "Research Speed +5%", color: "#ffa726" },
  { id: "facility-25", label: "Tech Lv. 1", kind: "facility", planner: { col: 666, row: 267, size: 3 }, bonus: "Research Speed +5%", color: "#ffa726" },
  { id: "facility-26", label: "Tech Lv. 1", kind: "facility", planner: { col: 237, row: 237, size: 3 }, bonus: "Research Speed +5%", color: "#ffa726" },
  { id: "facility-27", label: "Tech Lv. 1", kind: "facility", planner: { col: 267, row: 537, size: 3 }, bonus: "Research Speed +5%", color: "#ffa726" },
  { id: "facility-28", label: "Tech Lv. 1", kind: "facility", planner: { col: 237, row: 957, size: 3 }, bonus: "Research Speed +5%", color: "#ffa726" },
  { id: "facility-29", label: "Tech Lv. 1", kind: "facility", planner: { col: 537, row: 936, size: 3 }, bonus: "Research Speed +5%", color: "#ffa726" },
  { id: "facility-30", label: "Tech Lv. 1", kind: "facility", planner: { col: 936, row: 537, size: 3 }, bonus: "Research Speed +5%", color: "#ffa726" },
  { id: "facility-31", label: "Tech Lv. 1", kind: "facility", planner: { col: 957, row: 957, size: 3 }, bonus: "Research Speed +5%", color: "#ffa726" },
  { id: "facility-32", label: "Tech Lv. 3", kind: "facility", planner: { col: 867, row: 327, size: 3 }, bonus: "Research Speed +8%", color: "#ffa726" },
  { id: "facility-33", label: "Tech Lv. 3", kind: "facility", planner: { col: 327, row: 327, size: 3 }, bonus: "Research Speed +8%", color: "#ffa726" },
  { id: "facility-34", label: "Tech Lv. 3", kind: "facility", planner: { col: 327, row: 867, size: 3 }, bonus: "Research Speed +8%", color: "#ffa726" },
  { id: "facility-35", label: "Tech Lv. 3", kind: "facility", planner: { col: 867, row: 867, size: 3 }, bonus: "Research Speed +8%", color: "#ffa726" },
  { id: "facility-36", label: "Weapons Lv. 2", kind: "facility", planner: { col: 867, row: 138, size: 3 }, bonus: "Troop Attack +5%", color: "#ef5350" },
  { id: "facility-37", label: "Weapons Lv. 2", kind: "facility", planner: { col: 366, row: 138, size: 3 }, bonus: "Troop Attack +5%", color: "#ef5350" },
  { id: "facility-38", label: "Weapons Lv. 2", kind: "facility", planner: { col: 138, row: 438, size: 3 }, bonus: "Troop Attack +5%", color: "#ef5350" },
  { id: "facility-39", label: "Weapons Lv. 2", kind: "facility", planner: { col: 138, row: 867, size: 3 }, bonus: "Troop Attack +5%", color: "#ef5350" },
  { id: "facility-40", label: "Weapons Lv. 2", kind: "facility", planner: { col: 438, row: 1068, size: 3 }, bonus: "Troop Attack +5%", color: "#ef5350" },
  { id: "facility-41", label: "Weapons Lv. 2", kind: "facility", planner: { col: 1068, row: 327, size: 3 }, bonus: "Troop Attack +5%", color: "#ef5350" },
  { id: "facility-42", label: "Weapons Lv. 2", kind: "facility", planner: { col: 1068, row: 867, size: 3 }, bonus: "Troop Attack +5%", color: "#ef5350" },
  { id: "facility-43", label: "Weapons Lv. 2", kind: "facility", planner: { col: 867, row: 1068, size: 3 }, bonus: "Troop Attack +5%", color: "#ef5350" },
  { id: "facility-44", label: "Weapons Lv. 4", kind: "facility", planner: { col: 816, row: 486, size: 3 }, bonus: "Troop Attack +8%", color: "#ef5350" },
  { id: "facility-45", label: "Weapons Lv. 4", kind: "facility", planner: { col: 387, row: 486, size: 3 }, bonus: "Troop Attack +8%", color: "#ef5350" },
  { id: "facility-46", label: "Weapons Lv. 4", kind: "facility", planner: { col: 588, row: 867, size: 3 }, bonus: "Troop Attack +8%", color: "#ef5350" },
  { id: "facility-47", label: "Gathering Lv. 1", kind: "facility", planner: { col: 957, row: 138, size: 3 }, bonus: "Gathering Speed +5%", color: "#ab47bc" },
  { id: "facility-48", label: "Gathering Lv. 1", kind: "facility", planner: { col: 537, row: 87, size: 3 }, bonus: "Gathering Speed +5%", color: "#ab47bc" },
  { id: "facility-49", label: "Gathering Lv. 1", kind: "facility", planner: { col: 138, row: 237, size: 3 }, bonus: "Gathering Speed +5%", color: "#ab47bc" },
  { id: "facility-50", label: "Gathering Lv. 1", kind: "facility", planner: { col: 87, row: 666, size: 3 }, bonus: "Gathering Speed +5%", color: "#ab47bc" },
  { id: "facility-51", label: "Gathering Lv. 1", kind: "facility", planner: { col: 267, row: 1068, size: 3 }, bonus: "Gathering Speed +5%", color: "#ab47bc" },
  { id: "facility-52", label: "Gathering Lv. 1", kind: "facility", planner: { col: 636, row: 1137, size: 3 }, bonus: "Gathering Speed +5%", color: "#ab47bc" },
  { id: "facility-53", label: "Gathering Lv. 1", kind: "facility", planner: { col: 1137, row: 567, size: 3 }, bonus: "Gathering Speed +5%", color: "#ab47bc" },
  { id: "facility-54", label: "Gathering Lv. 1", kind: "facility", planner: { col: 1068, row: 936, size: 3 }, bonus: "Gathering Speed +5%", color: "#ab47bc" },
  { id: "facility-55", label: "Production Lv. 1", kind: "facility", planner: { col: 1068, row: 237, size: 3 }, bonus: "RSS Gathering Speed +5%", color: "#66bb6a" },
  { id: "facility-56", label: "Production Lv. 1", kind: "facility", planner: { col: 768, row: 138, size: 3 }, bonus: "RSS Gathering Speed +5%", color: "#66bb6a" },
  { id: "facility-57", label: "Production Lv. 1", kind: "facility", planner: { col: 237, row: 138, size: 3 }, bonus: "RSS Gathering Speed +5%", color: "#66bb6a" },
  { id: "facility-58", label: "Production Lv. 1", kind: "facility", planner: { col: 138, row: 327, size: 3 }, bonus: "RSS Gathering Speed +5%", color: "#66bb6a" },
  { id: "facility-59", label: "Production Lv. 1", kind: "facility", planner: { col: 138, row: 957, size: 3 }, bonus: "RSS Gathering Speed +5%", color: "#66bb6a" },
  { id: "facility-60", label: "Production Lv. 1", kind: "facility", planner: { col: 327, row: 1038, size: 3 }, bonus: "RSS Gathering Speed +5%", color: "#66bb6a" },
  { id: "facility-61", label: "Production Lv. 1", kind: "facility", planner: { col: 1068, row: 747, size: 3 }, bonus: "RSS Gathering Speed +5%", color: "#66bb6a" },
  { id: "facility-62", label: "Production Lv. 1", kind: "facility", planner: { col: 957, row: 1068, size: 3 }, bonus: "RSS Gathering Speed +5%", color: "#66bb6a" },
  { id: "facility-63", label: "Training Lv. 2", kind: "facility", planner: { col: 237, row: 486, size: 3 }, bonus: "Training Speed +5%", color: "#ffee58" },
  { id: "facility-64", label: "Training Lv. 2", kind: "facility", planner: { col: 138, row: 747, size: 3 }, bonus: "Training Speed +5%", color: "#ffee58" },
  { id: "facility-65", label: "Training Lv. 2", kind: "facility", planner: { col: 486, row: 957, size: 3 }, bonus: "Training Speed +5%", color: "#ffee58" },
  { id: "facility-66", label: "Training Lv. 2", kind: "facility", planner: { col: 768, row: 1038, size: 3 }, bonus: "Training Speed +5%", color: "#ffee58" },
  { id: "facility-67", label: "Training Lv. 2", kind: "facility", planner: { col: 957, row: 747, size: 3 }, bonus: "Training Speed +5%", color: "#ffee58" },
  { id: "facility-68", label: "Training Lv. 2", kind: "facility", planner: { col: 1068, row: 486, size: 3 }, bonus: "Training Speed +5%", color: "#ffee58" },
  { id: "facility-69", label: "Training Lv. 2", kind: "facility", planner: { col: 486, row: 138, size: 3 }, bonus: "Training Speed +5%", color: "#ffee58" },
  { id: "facility-70", label: "Training Lv. 2", kind: "facility", planner: { col: 768, row: 237, size: 3 }, bonus: "Training Speed +5%", color: "#ffee58" },
  { id: "facility-71", label: "Expedition Lv. 3", kind: "facility", planner: { col: 768, row: 327, size: 3 }, bonus: "March Speed +15%", color: "#f48fb1" },
  { id: "facility-72", label: "Expedition Lv. 3", kind: "facility", planner: { col: 327, row: 567, size: 3 }, bonus: "March Speed +15%", color: "#f48fb1" },
  { id: "facility-73", label: "Expedition Lv. 3", kind: "facility", planner: { col: 486, row: 867, size: 3 }, bonus: "March Speed +15%", color: "#f48fb1" },
  { id: "facility-74", label: "Expedition Lv. 3", kind: "facility", planner: { col: 867, row: 666, size: 3 }, bonus: "March Speed +15%", color: "#f48fb1" },
];

const RESOURCE_BUILDING_META: Record<ResourceKind, { label: string; image: string }> = {
  iron: { label: "Iron", image: "/vendor/krozac-wos-interactive-map/alliance/iron-clean.png?v=resource-transparent-v5" },
  meat: { label: "Meat", image: "/vendor/krozac-wos-interactive-map/alliance/farm-clean.png?v=resource-transparent-v5" },
  wood: { label: "Wood", image: "/vendor/krozac-wos-interactive-map/alliance/wood-clean.png?v=resource-transparent-v5" },
  coal: { label: "Coal", image: "/vendor/krozac-wos-interactive-map/alliance/coal-clean.png?v=resource-transparent-v5" },
};

const WOS_RESOURCE_BUILDING_TUPLES = [
  [563,886,"iron"],[884,885,"meat"],[890,884,"iron"],[564,880,"coal"],[555,880,"meat"],[880,879,"wood"],[574,879,"coal"],[568,874,"iron"],
  [550,874,"iron"],[596,872,"meat"],[576,872,"meat"],[607,871,"coal"],[890,869,"coal"],[585,869,"wood"],[1177,868,"meat"],[549,868,"meat"],
  [1141,867,"wood"],[601,866,"coal"],[576,866,"coal"],[523,865,"iron"],[1147,864,"coal"],[1191,863,"meat"],[1161,860,"meat"],[1073,859,"coal"],
  [535,859,"iron"],[1082,858,"wood"],[593,858,"coal"],[1145,857,"wood"],[529,857,"iron"],[1108,856,"wood"],[549,856,"iron"],[876,854,"wood"],
  [621,854,"wood"],[1135,853,"meat"],[1116,853,"wood"],[581,852,"iron"],[539,852,"wood"],[519,851,"meat"],[532,849,"wood"],[1044,848,"meat"],
  [617,848,"iron"],[1062,846,"wood"],[1021,846,"wood"],[883,845,"iron"],[634,845,"iron"],[1037,844,"wood"],[576,844,"coal"],[1075,843,"meat"],
  [532,843,"coal"],[513,843,"iron"],[589,842,"coal"],[566,842,"wood"],[600,841,"meat"],[889,840,"meat"],[897,839,"coal"],[638,838,"wood"],
  [546,838,"coal"],[537,837,"iron"],[588,836,"coal"],[1037,835,"meat"],[626,835,"iron"],[925,833,"meat"],[565,833,"meat"],[918,832,"wood"],
  [520,831,"coal"],[893,828,"coal"],[588,828,"iron"],[595,827,"iron"],[482,827,"wood"],[568,826,"coal"],[532,826,"wood"],[544,822,"meat"],
  [522,822,"wood"],[501,818,"meat"],[522,813,"coal"],[512,811,"meat"],[499,810,"meat"],[537,807,"coal"],[510,802,"iron"],[801,790,"coal"],
  [819,789,"iron"],[517,787,"meat"],[526,785,"coal"],[504,785,"meat"],[811,784,"coal"],[843,783,"iron"],[822,782,"iron"],[824,776,"coal"],
  [818,776,"meat"],[514,775,"iron"],[830,773,"wood"],[796,773,"wood"],[524,773,"iron"],[808,771,"meat"],[773,770,"meat"],[763,769,"meat"],
  [512,767,"wood"],[799,765,"coal"],[770,763,"meat"],[518,763,"wood"],[592,761,"meat"],[811,760,"meat"],[621,760,"meat"],[501,760,"meat"],
  [799,758,"meat"],[534,758,"meat"],[545,757,"iron"],[836,756,"iron"],[627,756,"coal"],[601,756,"coal"],[856,752,"coal"],[797,751,"iron"],
  [630,750,"iron"],[549,749,"iron"],[804,748,"coal"],[613,748,"iron"],[595,747,"iron"],[586,747,"iron"],[637,746,"coal"],[569,746,"coal"],
  [764,745,"iron"],[548,743,"iron"],[859,742,"coal"],[489,742,"coal"],[788,741,"meat"],[606,741,"iron"],[576,741,"iron"],[518,741,"meat"],
  [634,740,"iron"],[592,740,"iron"],[591,740,"iron"],[441,740,"wood"],[808,739,"iron"],[555,739,"iron"],[410,739,"meat"],[508,736,"coal"],
  [620,735,"iron"],[597,734,"coal"],[433,734,"wood"],[779,733,"wood"],[606,733,"coal"],[453,733,"iron"],[410,733,"wood"],[569,731,"iron"],
  [550,731,"coal"],[518,731,"coal"],[584,730,"coal"],[539,730,"iron"],[850,729,"iron"],[481,729,"coal"],[773,727,"iron"],[531,727,"coal"],
  [524,726,"meat"],[416,725,"iron"],[410,725,"coal"],[426,724,"wood"],[848,723,"coal"],[766,723,"iron"],[547,723,"coal"],[560,722,"meat"],
  [496,722,"iron"],[433,722,"wood"],[448,719,"iron"],[820,718,"coal"],[484,718,"coal"],[852,717,"iron"],[772,716,"wood"],[555,715,"meat"],
  [807,714,"wood"],[839,713,"meat"],[759,713,"coal"],[829,711,"iron"],[450,711,"iron"],[738,706,"wood"],[825,704,"wood"],[727,703,"coal"],
  [802,701,"wood"],[761,701,"meat"],[551,700,"iron"],[318,699,"iron"],[840,698,"meat"],[424,698,"meat"],[809,697,"coal"],[418,697,"meat"],
  [751,696,"iron"],[739,695,"iron"],[441,694,"coal"],[435,693,"meat"],[725,692,"iron"],[802,691,"wood"],[814,690,"wood"],[750,689,"wood"],
  [426,689,"iron"],[715,686,"iron"],[709,686,"meat"],[820,685,"meat"],[739,684,"coal"],[317,684,"iron"],[803,682,"wood"],[747,681,"iron"],
  [441,680,"meat"],[708,678,"coal"],[305,677,"meat"],[727,676,"iron"],[742,675,"iron"],[736,675,"iron"],[800,674,"meat"],[767,674,"coal"],
  [755,674,"wood"],[440,674,"coal"],[476,673,"wood"],[711,671,"iron"],[464,671,"coal"],[315,670,"coal"],[299,670,"wood"],[428,668,"coal"],
  [474,667,"coal"],[770,666,"coal"],[321,666,"meat"],[440,665,"iron"],[723,664,"iron"],[451,664,"iron"],[757,662,"iron"],[714,662,"coal"],
  [484,662,"wood"],[467,660,"coal"],[748,659,"meat"],[412,658,"meat"],[490,657,"coal"],[439,657,"coal"],[427,657,"wood"],[418,657,"coal"],
  [293,657,"meat"],[778,656,"iron"],[321,656,"coal"],[454,654,"coal"],[496,652,"coal"],[445,651,"coal"],[525,650,"coal"],[303,650,"wood"],
  [608,649,"iron"],[417,649,"iron"],[760,646,"iron"],[469,646,"coal"],[461,646,"coal"],[494,645,"iron"],[418,643,"wood"],[331,643,"iron"],
  [315,643,"meat"],[741,642,"iron"],[708,642,"iron"],[486,642,"meat"],[515,641,"iron"],[478,640,"coal"],[522,638,"iron"],[508,638,"iron"],
  [446,638,"wood"],[436,638,"wood"],[324,638,"meat"],[749,637,"coal"],[739,636,"coal"],[455,636,"coal"],[765,635,"wood"],[692,635,"wood"],
  [461,635,"iron"],[420,633,"iron"],[490,632,"iron"],[432,632,"wood"],[722,630,"coal"],[522,630,"meat"],[499,630,"coal"],[480,630,"iron"],
  [459,628,"iron"],[514,626,"iron"],[466,626,"coal"],[492,625,"iron"],[338,625,"coal"],[728,623,"iron"],[321,623,"coal"],[734,621,"coal"],
  [523,621,"meat"],[445,621,"meat"],[477,618,"coal"],[427,617,"wood"],[451,616,"coal"],[519,614,"iron"],[508,614,"iron"],[467,613,"coal"],
  [321,613,"meat"],[441,612,"meat"],[461,611,"coal"],[472,607,"coal"],[507,606,"iron"],[491,606,"iron"],[453,606,"iron"],[428,606,"meat"],
  [523,603,"meat"],[497,603,"iron"],[509,599,"iron"],[434,598,"iron"],[765,597,"iron"],[500,597,"coal"],[487,597,"wood"],[465,597,"coal"],
  [453,596,"coal"],[442,596,"wood"],[722,595,"wood"],[519,594,"coal"],[756,592,"meat"],[742,591,"meat"],[498,591,"meat"],[765,587,"wood"],
  [466,587,"iron"],[433,587,"wood"],[744,585,"meat"],[507,585,"meat"],[717,584,"iron"],[444,584,"meat"],[515,583,"iron"],[522,582,"wood"],
  [487,582,"iron"],[765,581,"wood"],[428,580,"iron"],[464,579,"iron"],[746,578,"coal"],[720,577,"coal"],[838,576,"iron"],[755,576,"iron"],
  [733,576,"coal"],[727,576,"coal"],[829,574,"coal"],[473,572,"meat"],[462,572,"iron"],[525,571,"coal"],[444,571,"wood"],[502,569,"iron"],
  [767,568,"meat"],[730,568,"coal"],[398,568,"coal"],[759,567,"wood"],[436,567,"wood"],[805,566,"iron"],[390,566,"meat"],[375,566,"coal"],
  [492,565,"meat"],[418,565,"iron"],[742,564,"iron"],[518,564,"wood"],[785,563,"iron"],[443,563,"iron"],[766,562,"meat"],[823,561,"wood"],
  [481,560,"iron"],[471,559,"iron"],[431,559,"wood"],[751,558,"coal"],[716,558,"meat"],[455,558,"iron"],[806,556,"iron"],[371,556,"coal"],
  [763,555,"wood"],[722,555,"iron"],[813,554,"meat"],[446,553,"wood"],[381,553,"meat"],[755,552,"meat"],[494,551,"iron"],[739,550,"meat"],
  [703,550,"coal"],[465,550,"meat"],[455,550,"iron"],[782,548,"iron"],[747,548,"coal"],[407,548,"meat"],[816,547,"meat"],[769,547,"wood"],
  [422,547,"coal"],[448,546,"coal"],[789,545,"wood"],[763,545,"coal"],[730,545,"wood"],[475,545,"wood"],[428,545,"coal"],[706,544,"meat"],
  [714,543,"iron"],[439,543,"coal"],[817,541,"wood"],[796,540,"meat"],[781,540,"coal"],[450,540,"iron"],[392,540,"iron"],[376,540,"coal"],
  [370,540,"wood"],[826,536,"meat"],[761,536,"wood"],[712,536,"coal"],[423,536,"coal"],[807,535,"iron"],[739,535,"wood"],[781,534,"meat"],
  [451,534,"coal"],[414,534,"wood"],[381,534,"meat"],[393,532,"coal"],[467,530,"coal"],[800,529,"iron"],[478,528,"iron"],[759,527,"iron"],
  [432,527,"wood"],[387,527,"coal"],[734,525,"iron"],[426,525,"meat"],[796,522,"coal"],[453,522,"iron"],[475,521,"iron"],[401,521,"wood"],
  [386,519,"meat"],[378,519,"meat"],[483,518,"iron"],[416,516,"coal"],[449,515,"iron"],[793,513,"iron"],[409,511,"iron"],[468,509,"coal"],
  [460,509,"iron"],[493,508,"iron"],[431,508,"meat"],[386,508,"coal"],[449,507,"coal"],[416,505,"meat"],[407,503,"iron"],[397,503,"iron"],
  [487,502,"coal"],[438,500,"iron"],[493,499,"coal"],[452,497,"iron"],[524,493,"wood"],[389,493,"meat"],[503,491,"coal"],[421,491,"coal"],
  [451,485,"wood"],[424,485,"wood"],[487,484,"iron"],[475,483,"wood"],[410,483,"iron"],[404,483,"iron"],[391,483,"meat"],[505,482,"coal"],
  [461,481,"iron"],[454,478,"meat"],[515,477,"iron"],[413,477,"wood"],[388,477,"meat"],[547,476,"iron"],[465,475,"coal"],[477,474,"wood"],
  [528,472,"iron"],[439,470,"iron"],[483,469,"iron"],[464,469,"iron"],[619,468,"iron"],[517,468,"coal"],[504,467,"coal"],[477,467,"meat"],
  [427,467,"iron"],[558,466,"meat"],[457,466,"wood"],[723,465,"iron"],[412,465,"coal"],[730,464,"meat"],[707,464,"coal"],[446,464,"meat"],
  [544,463,"wood"],[389,463,"wood"],[699,462,"coal"],[382,462,"iron"],[737,461,"coal"],[512,461,"coal"],[494,459,"coal"],[477,459,"iron"],
  [505,458,"coal"],[599,456,"iron"],[457,456,"wood"],[435,456,"coal"],[396,455,"coal"],[746,454,"meat"],[700,454,"iron"],[414,454,"iron"],
  [528,453,"coal"],[477,453,"iron"],[467,453,"wood"],[505,451,"iron"],[449,451,"iron"],[434,450,"meat"],[517,449,"coal"],[496,449,"coal"],
  [486,449,"coal"],[404,449,"meat"],[743,448,"meat"],[732,448,"meat"],[423,448,"wood"],[534,446,"coal"],[477,446,"coal"],[413,445,"coal"],
  [397,444,"meat"],[698,443,"coal"],[611,443,"coal"],[597,443,"wood"],[445,443,"iron"],[510,442,"meat"],[421,441,"wood"],[461,440,"meat"],
  [620,439,"coal"],[746,436,"meat"],[399,435,"iron"],[520,434,"iron"],[448,434,"wood"],[510,432,"coal"],[406,432,"meat"],[704,431,"wood"],
  [485,431,"meat"],[456,431,"coal"],[765,430,"wood"],[491,430,"meat"],[463,430,"meat"],[747,429,"coal"],[697,429,"coal"],[538,429,"meat"],
  [442,429,"iron"],[721,427,"coal"],[731,425,"wood"],[484,425,"wood"],[513,424,"wood"],[542,423,"wood"],[748,421,"iron"],[405,416,"wood"],
  [536,414,"meat"],[392,414,"meat"],[726,413,"iron"],[472,411,"iron"],[452,410,"iron"],[442,408,"meat"],[735,406,"meat"],[720,406,"meat"],
  [533,405,"meat"],[462,405,"iron"],[728,403,"wood"],[479,401,"iron"],[448,400,"wood"],[538,399,"wood"],[441,399,"meat"],[531,398,"iron"],
  [465,398,"iron"],[533,392,"meat"],[441,391,"coal"],[447,390,"coal"],[538,386,"iron"],[443,382,"coal"],[542,378,"meat"],[535,374,"iron"],
  [657,370,"wood"],[445,368,"wood"],[543,364,"iron"],[652,363,"coal"],[549,363,"coal"],[665,358,"wood"],[519,347,"coal"],[444,345,"meat"],
  [652,344,"iron"],[453,343,"meat"],[542,339,"wood"],[515,338,"iron"],[622,336,"iron"],[509,336,"iron"],[449,335,"wood"],[640,332,"wood"],
  [495,332,"wood"],[595,330,"iron"],[467,329,"wood"],[516,328,"iron"],[487,327,"coal"],[473,327,"wood"],[523,324,"coal"],[460,324,"wood"],
  [514,322,"wood"],[507,322,"wood"],[611,318,"wood"],[643,317,"iron"],[496,317,"iron"],[543,315,"meat"],[537,315,"iron"],[438,314,"meat"],
  [455,313,"coal"],[619,312,"wood"],[588,312,"coal"],[637,311,"meat"],[490,310,"wood"],[421,310,"coal"],[526,309,"meat"],[440,308,"wood"],
  [538,306,"wood"],[475,305,"meat"],[516,304,"coal"],[504,304,"meat"],[483,304,"meat"],[527,303,"iron"],[442,302,"coal"],[435,302,"iron"],
  [510,300,"wood"],[492,300,"wood"],[540,294,"coal"],[661,292,"meat"],[542,292,"meat"],[641,272,"meat"],[678,269,"coal"],[695,247,"coal"],
  [4,6,"wood"]

] as const satisfies readonly (readonly [number, number, ResourceKind])[];

const WOS_RESOURCE_BUILDINGS: ResourceBuilding[] = WOS_RESOURCE_BUILDING_TUPLES.map(([x, y, kind], index) => ({
  id: `resource-${kind}-${index}`,
  x,
  y,
  kind,
}));

const renderFlatResourceBuilding = (node: ResourceBuilding) => {
  const meta = RESOURCE_BUILDING_META[node.kind];
  return (
    <g key={node.id} transform={`translate(${node.x} ${node.y})`} aria-label={`${meta.label} resource building`}>
      <title>{`${meta.label} resource building at ${node.x},${node.y}`}</title>

      <image href={meta.image} x="0.34" y="0.16" width="1.32" height="1.08" preserveAspectRatio="xMidYMid meet" opacity="0.98" />
      <text x="1" y="1.48" textAnchor="middle" fontSize="0.26" fontWeight="800" fill="#1f2937" stroke="rgba(248, 253, 255, 0.92)" strokeWidth="0.045" paintOrder="stroke" pointerEvents="none">
        {meta.label}
      </text>
    </g>
  );
};

const renderRaisedResourceBuilding = (node: ResourceBuilding) => {
  const meta = RESOURCE_BUILDING_META[node.kind];
  return (
    <g key={node.id} transform={`translate(${node.x} ${node.y})`} aria-label={`${meta.label} resource building`}>
      <title>{`${meta.label} resource building at ${node.x},${node.y}`}</title>

      <image href={meta.image} x="0.3" y="0.1" width="1.4" height="1.12" preserveAspectRatio="xMidYMid meet" />
      <path d="M 0.24 0.42 C 0.62 0.16, 1.38 0.16, 1.76 0.42" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.09" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <text x="1" y="1.48" textAnchor="middle" fontSize="0.26" fontWeight="800" fill="#1f2937" stroke="rgba(248, 253, 255, 0.92)" strokeWidth="0.045" paintOrder="stroke" pointerEvents="none">
        {meta.label}
      </text>
    </g>
  );
};

const renderResourceBuilding = (node: ResourceBuilding, mode: MapMode) => (
  mode === "2d" ? renderFlatResourceBuilding(node) : renderRaisedResourceBuilding(node)
);

const sunfireFootprintFor = (node: SunfireLandmark) => {
  const { col: x, row: y, size } = node.planner;
  return {
    x,
    y,
    size,
    cx: x + size / 2,
    cy: y + size / 2,
    maxX: x + size,
    maxY: y + size,
    clipId: `${node.id}-clip`,
  };
};

const sunfireFootprintTitle = (node: SunfireLandmark) => {
  const maxCol = node.planner.col + node.planner.size - 1;
  const maxRow = node.planner.row + node.planner.size - 1;
  return `${node.label}; WoSTools grid ${node.planner.col},${node.planner.row} to ${maxCol},${maxRow}`;
};

const renderSunfireCastle = (node: SunfireLandmark, mode: MapMode) => {
  const footprint = sunfireFootprintFor(node);

  return (
    <g key={node.id} aria-label={node.label} shapeRendering="geometricPrecision">
      <title>{sunfireFootprintTitle(node)}</title>
      <image
        href="/vendor/krozac-wos-interactive-map/sunfire_castle.png"
        x={footprint.x}
        y={footprint.y - footprint.size * 0.05}
        width={footprint.size}
        height={footprint.size * 1.2}
        preserveAspectRatio="xMidYMid meet"
      />
      <text x={footprint.cx} y={footprint.maxY + 0.8} textAnchor="middle" fontSize="0.8" fontWeight="800" fill="#1f2937" stroke="rgba(248, 253, 255, 0.92)" strokeWidth="0.1" paintOrder="stroke" pointerEvents="none">
        {node.label}
      </text>
    </g>
  );
};

const renderSunfireTurret = (node: SunfireLandmark, mode: MapMode) => {
  const footprint = sunfireFootprintFor(node);
  const isWest = node.facing && node.facing > 90; // Reflect if facing left

  return (
    <g key={node.id} aria-label={node.label} shapeRendering="geometricPrecision">
      <title>{sunfireFootprintTitle(node)}</title>
      <image
        href="/vendor/krozac-wos-interactive-map/sunfire_turret.png"
        x={footprint.x}
        y={footprint.y - footprint.size * 0.05}
        width={footprint.size}
        height={footprint.size * 1.2}
        preserveAspectRatio="xMidYMid meet"
        transform={isWest ? `translate(${footprint.cx * 2}, 0) scale(-1, 1)` : ""}
      />
      <text x={footprint.cx} y={footprint.maxY + 0.6} textAnchor="middle" fontSize="0.6" fontWeight="800" fill="#1f2937" stroke="rgba(248, 253, 255, 0.92)" strokeWidth="0.08" paintOrder="stroke" pointerEvents="none">
        {node.label}
      </text>
    </g>
  );
};

const renderStronghold = (node: SunfireLandmark, mode: MapMode) => {
  const footprint = sunfireFootprintFor(node);
  const actualSize = 12; // Much larger bounding box for the entire region
  const x = footprint.cx - actualSize / 2;
  const y = footprint.cy - actualSize / 2;
  const maxY = y + actualSize;

  return (
    <g key={node.id} aria-label={node.label} shapeRendering="geometricPrecision">
      <title>{sunfireFootprintTitle(node)}</title>
      <image
        href="/vendor/krozac-wos-interactive-map/stronghold.png"
        x={x}
        y={y - actualSize * 0.05}
        width={actualSize}
        height={actualSize * 1.2}
        preserveAspectRatio="xMidYMid meet"
      />
      <text x={footprint.cx} y={maxY + 1.2} textAnchor="middle" fontSize="1.2" fontWeight="800" fill="#1f2937" stroke="rgba(248, 253, 255, 0.92)" strokeWidth="0.15" paintOrder="stroke" pointerEvents="none">
        {node.label}
      </text>
    </g>
  );
};

const renderFortress = (node: SunfireLandmark, mode: MapMode) => {
  const footprint = sunfireFootprintFor(node);
  const actualSize = 10; // Large bounding box for fortress region
  const x = footprint.cx - actualSize / 2;
  const y = footprint.cy - actualSize / 2;
  const maxY = y + actualSize;

  return (
    <g key={node.id} aria-label={node.label} shapeRendering="geometricPrecision">
      <title>{sunfireFootprintTitle(node)}</title>
      <image
        href="/vendor/krozac-wos-interactive-map/fortress.png"
        x={x}
        y={y - actualSize * 0.05}
        width={actualSize}
        height={actualSize * 1.2}
        preserveAspectRatio="xMidYMid meet"
      />
      <text x={footprint.cx} y={maxY + 1} textAnchor="middle" fontSize="1" fontWeight="800" fill="#1f2937" stroke="rgba(248, 253, 255, 0.92)" strokeWidth="0.1" paintOrder="stroke" pointerEvents="none">
        {node.label}
      </text>
    </g>
  );
};

const renderFacility = (node: SunfireLandmark, mode: MapMode) => {
  const footprint = sunfireFootprintFor(node);
  const { color = "#ffffff", bonus = "" } = node;

  return (
    <g key={node.id} aria-label={node.label} shapeRendering="geometricPrecision">
      <title>{sunfireFootprintTitle(node)} - {bonus}</title>
      <circle cx={footprint.cx} cy={footprint.cy + footprint.size * 0.2} r={footprint.size * 0.8} fill={color} opacity="0.15" />
      <image
        href="/vendor/krozac-wos-interactive-map/facility.png"
        x={footprint.x}
        y={footprint.y - footprint.size * 0.15}
        width={footprint.size}
        height={footprint.size * 1.3}
        preserveAspectRatio="xMidYMid meet"
        filter="url(#wos-building-shadow)"
      />
      <text x={footprint.cx} y={footprint.maxY + 0.4} textAnchor="middle" fontSize="0.45" fontWeight="800" fill="#1f2937" stroke="rgba(248, 253, 255, 0.92)" strokeWidth="0.06" paintOrder="stroke" pointerEvents="none">
        {node.label}
      </text>
      <text x={footprint.cx} y={footprint.maxY + 0.9} textAnchor="middle" fontSize="0.4" fontWeight="800" fill={color} stroke="rgba(30, 40, 50, 0.9)" strokeWidth="0.08" paintOrder="stroke" pointerEvents="none">
        {bonus}
      </text>
    </g>
  );
};

const renderPlannerItem = (item: PlannerItem) => {
  const size = item.kind === "hq" ? 4 : 1;
  const col = item.col;
  const row = item.row;
  const cx = col + size / 2;
  const cy = row + size / 2;
  const x = col;
  const y = row;

  return (
    <g key={item.id} shapeRendering="geometricPrecision">
      <title>{item.kind === "hq" ? "Alliance HQ" : "Alliance Banner"} ({col}, {row})</title>
      <image
        href={`/vendor/krozac-wos-interactive-map/alliance_${item.kind}.png`}
        x={x}
        y={y - size * 0.15}
        width={size}
        height={size * 1.3}
        preserveAspectRatio="xMidYMid meet"
        filter="url(#wos-building-shadow)"
      />
    </g>
  );
};

const renderSunfireLandmark = (node: SunfireLandmark, mode: MapMode) => (
  node.kind === "castle" ? renderSunfireCastle(node, mode) : renderSunfireTurret(node, mode)
);

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const gridCellFor = (coord: Coordinate) => ({
  x: Math.floor((MAP_MAX - coord.y) / COORDINATE_STEP) * COORDINATE_STEP,
  y: Math.floor((MAP_MAX - coord.x) / COORDINATE_STEP) * COORDINATE_STEP,
});

const coordinateForGridCell = (cell: Coordinate) => ({
  x: Math.round(clamp(MAP_MAX - cell.y, MAP_MIN, MAP_MAX)),
  y: Math.round(clamp(MAP_MAX - cell.x, MAP_MIN, MAP_MAX)),
});

const cameraForCoordinate = (coordinate: Coordinate) => {
  const cell = gridCellFor(coordinate);
  return {
    x: cell.x + COORDINATE_STEP / 2,
    y: cell.y + COORDINATE_STEP / 2,
  };
};

const INITIAL_COORDINATE = { x: 600, y: 600 };
const INITIAL_CAMERA = cameraForCoordinate(INITIAL_COORDINATE);

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
  const pendingCameraRef = useRef(INITIAL_CAMERA);
  const [selected, setSelected] = useState<Coordinate>(INITIAL_COORDINATE);
  const [hover, setHover] = useState<Coordinate | null>(null);
  const [mode, setMode] = useState<MapMode>("2d");
  const [depthMode, setDepthMode] = useState<DepthMode>("2d");
  const [pitch, setPitch] = useState(0);
  const [yaw, setYaw] = useState(0);
  const [roll, setRoll] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [camera, setCamera] = useState(INITIAL_CAMERA);
  const [plannerItems, setPlannerItems] = useState<PlannerItem[]>([]);
  const [buildMode, setBuildMode] = useState<PlannerItemKind | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("wos-planner-items-v1");
      if (saved) {
        setPlannerItems(JSON.parse(saved));
      }
    } catch (err) {}
  }, []);

  useEffect(() => {
    localStorage.setItem("wos-planner-items-v1", JSON.stringify(plannerItems));
  }, [plannerItems]);

  const viewSize = Math.max(MIN_VIEW_SIZE, CANVAS_SIZE / zoom);
  const viewX = clamp(camera.x - viewSize / 2, 0, CANVAS_SIZE - viewSize);
  const viewY = clamp(camera.y - viewSize / 2, 0, CANVAS_SIZE - viewSize);
  const selectedCell = gridCellFor(selected);
  const hoverCell = hover ? gridCellFor(hover) : null;
  const mapGrowthProgress = clamp((zoom - 1.35) / 2.65, 0, 1);
  const easedMapGrowth = mapGrowthProgress * mapGrowthProgress * (3 - 2 * mapGrowthProgress);
  const baseMapWidth = mode === "isometric" ? 80 : 83;
  const baseMapHeight = mode === "isometric" ? 74 : 76;
  const mapFrameStyle = {
    width: `${baseMapWidth + (100 - baseMapWidth) * easedMapGrowth}%`,
    height: `${baseMapHeight + (100 - baseMapHeight) * easedMapGrowth}%`,
    aspectRatio: "auto",
    transform: mode === "2d" ? "none" : `rotateX(${pitch}deg) rotateY(${yaw}deg) rotateZ(${roll}deg)`,
  } satisfies CSSProperties;
  const selectedFill = zoom >= 24 ? "rgba(14, 165, 233, 0.1)" : zoom >= 6 ? "rgba(14, 165, 233, 0.16)" : "rgba(14, 165, 233, 0.22)";
  const hoverFill = zoom >= 24 ? "rgba(34, 211, 238, 0.06)" : zoom >= 6 ? "rgba(34, 211, 238, 0.1)" : "rgba(34, 211, 238, 0.14)";
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
    const mapX = clamp(Math.floor(viewX + ((event.clientX - rect.left) / rect.width) * viewSize), 0, CANVAS_SIZE - COORDINATE_STEP);
    const mapY = clamp(Math.floor(viewY + ((event.clientY - rect.top) / rect.height) * viewSize), 0, CANVAS_SIZE - COORDINATE_STEP);
    return coordinateForGridCell({ x: mapX, y: mapY });
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
      setCamera(cameraForCoordinate(selected));
      return;
    }
    if (nextMode === "isometric") {
      setPitch(depthMode === "3d" ? 58 : 0);
      setYaw(0);
      setRoll(45);
      setZoom(1);
      setCamera(cameraForCoordinate(selected));
      return;
    }
    setDepthMode("3d");
    setPitch(58);
    setYaw(-28);
    setRoll(0);
    setZoom(1);
    setCamera(cameraForCoordinate(selected));
  };

  const resetView = () => {
    if (mode === "2d") {
      setPitch(0);
      setYaw(0);
      setRoll(0);
      setZoom(1);
      setCamera(cameraForCoordinate(selected));
      return;
    }
    if (mode === "isometric") {
      setPitch(depthMode === "3d" ? 58 : 0);
      setYaw(0);
      setRoll(45);
      setZoom(1);
      setCamera(cameraForCoordinate(selected));
      return;
    }
    setPitch(58);
    setYaw(-28);
    setRoll(0);
    setZoom(1);
    setCamera(cameraForCoordinate(selected));
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
            className={`wos-map-rotator mode-${mode} depth-${depthMode} fit-board`}
            style={mapFrameStyle}
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
                if (!drag) return;
                if (event.pointerId !== drag.pointerId) return;

                const dx = event.clientX - drag.x;
                const dy = event.clientY - drag.y;
                const moved = Math.sqrt(dx * dx + dy * dy);

                if (moved > 2) {
                  const rect = event.currentTarget.getBoundingClientRect();
                  const isRotate = mode === "3d" && (event.buttons === 2 || event.buttons === 4);
                  
                  if (isRotate) {
                    setYaw(drag.yaw - dx * 0.4);
                    setPitch(clamp(drag.pitch - dy * 0.4, 0, 82));
                  } else {
                    scheduleCamera({
                      x: drag.cameraX - (dx * viewSize) / rect.width,
                      y: drag.cameraY - (dy * viewSize) / rect.height,
                    });
                  }
                }
              }}
              onPointerUp={(event) => {
                const drag = dragRef.current;
                if (drag && event.pointerId === drag.pointerId) {
                  const dx = event.clientX - drag.x;
                  const dy = event.clientY - drag.y;
                  const moved = Math.sqrt(dx * dx + dy * dy);

                  dragRef.current = null;
                  if (moved < 8) {
                    const coord = coordinateFromPointer(event);
                    if (buildMode) {
                      const newCell = gridCellFor(coord);
                      const existingIndex = plannerItems.findIndex(i => i.col === newCell.x && i.row === newCell.y);
                      if (existingIndex >= 0) {
                        setPlannerItems(prev => prev.filter((_, idx) => idx !== existingIndex));
                      } else {
                        setPlannerItems(prev => [...prev, {
                          id: Date.now().toString(),
                          kind: buildMode,
                          col: newCell.x,
                          row: newCell.y
                        }]);
                      }
                    } else {
                      selectCoordinate(coord);
                    }
                  }
                }
              }}
              onContextMenu={(e) => {
                e.preventDefault();
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
                <filter id="wos-snow-grain" x="-10%" y="-10%" width="120%" height="120%">
                  <feTurbulence type="fractalNoise" baseFrequency="0.022 0.04" numOctaves="4" seed="34" result="grain" />
                  <feColorMatrix
                    in="grain"
                    type="matrix"
                    values="
                      0.08 0 0 0 0.93
                      0 0.1 0 0 0.96
                      0 0 0.12 0 1
                      0 0 0 0.18 0"
                    result="snowNoise"
                  />
                  <feBlend in="SourceGraphic" in2="snowNoise" mode="screen" />
                </filter>
                <filter id="wos-building-shadow" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow dx="2" dy="5" stdDeviation="4" floodColor="#041221" floodOpacity="0.45" />
                </filter>
                <filter id="wos-fortress-shadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="4" dy="8" stdDeviation="6" floodColor="#041221" floodOpacity="0.55" />
                </filter>
                <filter id="wos-snow-glow" x="-8%" y="-8%" width="116%" height="116%">
                  <feGaussianBlur stdDeviation="8" />
                </filter>
                <filter id="wos-snow-line-soften" x="-4%" y="-4%" width="108%" height="108%">
                  <feGaussianBlur stdDeviation="0.9" />
                </filter>
                <linearGradient id="wos-snow-base" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#ffffff" />
                  <stop offset="0.28" stopColor="#fbfeff" />
                  <stop offset="0.56" stopColor="#eefbff" />
                  <stop offset="0.82" stopColor="#f8fdff" />
                  <stop offset="1" stopColor="#ffffff" />
                </linearGradient>
                <radialGradient id="wos-snow-cold-pocket" cx="24%" cy="26%" r="56%">
                  <stop offset="0" stopColor="#ffffff" stopOpacity="0.96" />
                  <stop offset="0.42" stopColor="#f0fbff" stopOpacity="0.42" />
                  <stop offset="1" stopColor="#d9f5ff" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="wos-snow-hardpack" cx="74%" cy="68%" r="58%">
                  <stop offset="0" stopColor="#d8f6ff" stopOpacity="0.24" />
                  <stop offset="0.5" stopColor="#f5fdff" stopOpacity="0.2" />
                  <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="wos-snow-ice-sheen" x1="0" y1="1" x2="1" y2="0">
                  <stop offset="0" stopColor="#d7f5ff" stopOpacity="0.16" />
                  <stop offset="0.42" stopColor="#ffffff" stopOpacity="0.38" />
                  <stop offset="0.72" stopColor="#e6faff" stopOpacity="0.14" />
                  <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
                </linearGradient>
                <pattern id="wos-snow-flurry" width="90" height="90" patternUnits="userSpaceOnUse">
                  <circle cx="10" cy="18" r="1.2" fill="#ffffff" opacity="0.5" />
                  <circle cx="42" cy="12" r="0.9" fill="#f7fdff" opacity="0.62" />
                  <circle cx="75" cy="36" r="1.4" fill="#ffffff" opacity="0.44" />
                  <circle cx="28" cy="70" r="0.8" fill="#f4fcff" opacity="0.52" />
                  <circle cx="62" cy="78" r="1" fill="#ffffff" opacity="0.42" />
                  <animateTransform attributeName="patternTransform" type="translate" values="0 0; 18 30; 0 90" dur="14s" repeatCount="indefinite" />
                </pattern>
                <pattern id="wos-snow-wind" width="180" height="112" patternUnits="userSpaceOnUse" patternTransform="rotate(-12)">
                  <path d="M -20 22 C 40 10, 82 22, 142 8 S 238 0, 296 -16" fill="none" stroke="#ffffff" strokeOpacity="0.42" strokeWidth="4.8" strokeLinecap="round" />
                  <path d="M -24 58 C 38 44, 88 58, 156 40 S 238 30, 304 18" fill="none" stroke="#dff7ff" strokeOpacity="0.16" strokeWidth="2.2" strokeLinecap="round" />
                  <path d="M 16 92 C 58 82, 112 86, 166 72 S 236 62, 292 54" fill="none" stroke="#ffffff" strokeOpacity="0.28" strokeWidth="1.6" strokeLinecap="round" />
                  <animateTransform attributeName="patternTransform" type="translate" additive="sum" values="-40 0; 40 0; -40 0" dur="18s" repeatCount="indefinite" />
                </pattern>
                <pattern id="wos-snow-ridges" width="260" height="170" patternUnits="userSpaceOnUse" patternTransform="rotate(-6)">
                  <path d="M -34 44 C 34 18, 98 34, 164 16 S 270 8, 342 -10" fill="none" stroke="#ffffff" strokeOpacity="0.28" strokeWidth="7" strokeLinecap="round" />
                  <path d="M -18 108 C 48 84, 112 104, 176 84 S 268 72, 344 54" fill="none" stroke="#eefbff" strokeOpacity="0.22" strokeWidth="4" strokeLinecap="round" />
                  <path d="M 42 148 C 96 134, 154 150, 220 130 S 290 118, 344 108" fill="none" stroke="#ffffff" strokeOpacity="0.18" strokeWidth="2.6" strokeLinecap="round" />
                </pattern>
                <pattern id="wos-snow-cracks" width="150" height="130" patternUnits="userSpaceOnUse" patternTransform="rotate(8)">
                  <path d="M 18 28 L 48 42 L 72 32 M 72 32 L 98 52 L 130 44" fill="none" stroke="#d5f4ff" strokeOpacity="0.08" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M 34 96 L 60 80 L 82 88 M 82 88 L 112 72" fill="none" stroke="#ffffff" strokeOpacity="0.24" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M 116 16 L 126 28 L 142 24" fill="none" stroke="#e6faff" strokeOpacity="0.08" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" />
                </pattern>
                <pattern id="wos-snow-speckles" width="72" height="72" patternUnits="userSpaceOnUse">
                  <path d="M 12 12 L 16 12 M 14 10 L 14 14" stroke="#ffffff" strokeOpacity="0.48" strokeWidth="0.6" strokeLinecap="round" />
                  <path d="M 44 18 L 48 18 M 46 16 L 46 20" stroke="#f5fdff" strokeOpacity="0.5" strokeWidth="0.6" strokeLinecap="round" />
                  <path d="M 28 54 L 32 54 M 30 52 L 30 56" stroke="#ffffff" strokeOpacity="0.38" strokeWidth="0.55" strokeLinecap="round" />
                  <circle cx="62" cy="48" r="0.8" fill="#eefbff" opacity="0.3" />
                  <circle cx="8" cy="62" r="0.7" fill="#ffffff" opacity="0.32" />
                </pattern>
              </defs>
              <rect width={CANVAS_SIZE} height={CANVAS_SIZE} fill="url(#wos-snow-base)" />
              {/* --- Map Zones --- */}
              <g pointerEvents="none" aria-label="Map Zones">
                {/* Tundra Zone */}
                <rect x={200} y={200} width={800} height={800} fill="#7ec6e3" opacity="0.12" />
                <rect x={200} y={200} width={800} height={800} fill="none" stroke="rgba(126, 198, 227, 0.45)" strokeWidth="3" strokeDasharray="20 30" vectorEffect="non-scaling-stroke" />
                <text x={212} y={228} fill="rgba(126, 198, 227, 0.8)" fontSize="16" fontWeight="800" style={{ textTransform: 'uppercase', letterSpacing: '4px' }}>Tundra</text>
                <text x={988} y={988} fill="rgba(126, 198, 227, 0.8)" fontSize="16" fontWeight="800" textAnchor="end" style={{ textTransform: 'uppercase', letterSpacing: '4px' }}>Tundra</text>

                {/* Fertile Land Zone */}
                <rect x={400} y={400} width={400} height={400} fill="#a4d168" opacity="0.12" />
                <rect x={400} y={400} width={400} height={400} fill="none" stroke="rgba(164, 209, 104, 0.55)" strokeWidth="4" strokeDasharray="30 40" vectorEffect="non-scaling-stroke" />
                <text x={412} y={428} fill="rgba(164, 209, 104, 0.85)" fontSize="18" fontWeight="900" style={{ textTransform: 'uppercase', letterSpacing: '4px' }}>Fertile Land</text>
                <text x={788} y={788} fill="rgba(164, 209, 104, 0.85)" fontSize="18" fontWeight="900" textAnchor="end" style={{ textTransform: 'uppercase', letterSpacing: '4px' }}>Fertile Land</text>
                
                {/* Ice Field Zone Labels */}
                <text x={12} y={28} fill="rgba(200, 230, 255, 0.6)" fontSize="20" fontWeight="800" style={{ textTransform: 'uppercase', letterSpacing: '8px' }}>Ice Field</text>
                <text x={1188} y={1188} fill="rgba(200, 230, 255, 0.6)" fontSize="20" fontWeight="800" textAnchor="end" style={{ textTransform: 'uppercase', letterSpacing: '8px' }}>Ice Field</text>
              </g>
              {/* ----------------- */}
              <rect width={CANVAS_SIZE} height={CANVAS_SIZE} fill="url(#wos-snow-cold-pocket)" />
              <rect width={CANVAS_SIZE} height={CANVAS_SIZE} fill="url(#wos-snow-hardpack)" />
              <rect width={CANVAS_SIZE} height={CANVAS_SIZE} fill="url(#wos-snow-ice-sheen)" />
              <g filter="url(#wos-snow-glow)" opacity="0.86">
                <path d="M -80 168 C 96 96, 240 168, 410 128 C 612 78, 760 158, 938 112 C 1082 76, 1212 108, 1300 58 L 1300 -40 L -80 -40 Z" fill="#ffffff" opacity="0.46" />
                <path d="M -90 930 C 80 860, 238 944, 424 892 C 594 846, 720 914, 898 862 C 1056 814, 1168 868, 1306 798 L 1306 1230 L -90 1230 Z" fill="#eefbff" opacity="0.28" />
                <path d="M 24 526 C 200 446, 380 542, 560 490 C 738 438, 870 526, 1048 466 C 1148 432, 1232 456, 1286 416 L 1286 618 C 1112 676, 960 598, 794 642 C 616 690, 470 604, 308 660 C 178 704, 62 660, -26 702 L -26 552 C 0 544, 12 534, 24 526 Z" fill="#ffffff" opacity="0.46" />
              </g>
              <g filter="url(#wos-snow-line-soften)" opacity="0.8">
                <path d="M 96 164 L 218 112 L 356 136 L 470 82 L 610 112 L 742 72" fill="none" stroke="#ffffff" strokeOpacity="0.42" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M 226 752 L 360 696 L 512 726 L 650 672 L 790 704 L 914 650" fill="none" stroke="#e5f8ff" strokeOpacity="0.18" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M 742 360 L 858 318 L 970 346 L 1088 298 L 1190 318" fill="none" stroke="#ffffff" strokeOpacity="0.3" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </g>
              <rect width={CANVAS_SIZE} height={CANVAS_SIZE} fill="url(#wos-snow-ridges)" opacity="0.42" />
              <rect width={CANVAS_SIZE} height={CANVAS_SIZE} fill="url(#wos-snow-cracks)" opacity="0.32" />
              <rect width={CANVAS_SIZE} height={CANVAS_SIZE} fill="url(#wos-snow-wind)" opacity="0.56" />
              <rect width={CANVAS_SIZE} height={CANVAS_SIZE} fill="url(#wos-snow-speckles)" opacity="0.6" />
              <rect width={CANVAS_SIZE} height={CANVAS_SIZE} fill="url(#wos-snow-flurry)" opacity="0.42" />
              <rect width={CANVAS_SIZE} height={CANVAS_SIZE} fill="#f8fdff" filter="url(#wos-snow-grain)" opacity="0.2" />
              <rect width={CANVAS_SIZE} height={CANVAS_SIZE} fill="none" stroke="rgba(255, 255, 255, 0.58)" strokeWidth="18" vectorEffect="non-scaling-stroke" />
              <g aria-label="WOSTools fixed resource buildings">
                {WOS_RESOURCE_BUILDINGS.map((node) => renderResourceBuilding(node, mode))}
              </g>
              <g aria-label="WoSTools Sunfire Castle fixed landmarks">
                {SUNFIRE_LANDMARKS.map((node) => renderSunfireLandmark(node, mode))}
              </g>
              <g aria-label="WoSTools Strongholds">
                {WOS_STRONGHOLDS.map((node) => renderStronghold(node, mode))}
              </g>
              <g aria-label="WoSTools Fortresses">
                {WOS_FORTRESSES.map((node) => renderFortress(node, mode))}
              </g>
              <g aria-label="WoSTools Facilities">
                {WOS_FACILITIES.map((node) => renderFacility(node, mode))}
              </g>
              <g aria-label="User Layout Planner Items">
                {plannerItems.map((item) => renderPlannerItem(item))}
              </g>
              {hover && (
                <rect
                  x={gridCellFor(hover).x}
                  y={gridCellFor(hover).y}
                  width={buildMode === "hq" ? 4 : COORDINATE_STEP}
                  height={buildMode === "hq" ? 4 : COORDINATE_STEP}
                  fill={hoverFill}
                  stroke="rgba(34, 211, 238, 0.68)"
                  strokeWidth="1.6"
                  vectorEffect="non-scaling-stroke"
                />
              )}
              {buildMode && hover && (
                <image
                  href={`/vendor/krozac-wos-interactive-map/alliance_${buildMode}.png`}
                  x={gridCellFor(hover).x}
                  y={gridCellFor(hover).y - (buildMode === "hq" ? 4 : 1) * 0.15}
                  width={buildMode === "hq" ? 4 : 1}
                  height={(buildMode === "hq" ? 4 : 1) * 1.3}
                  preserveAspectRatio="xMidYMid meet"
                  opacity="0.5"
                />
              )}
              <rect
                x={gridCellFor(selected).x}
                y={gridCellFor(selected).y}
                width={COORDINATE_STEP}
                height={COORDINATE_STEP}
                fill={selectedFill}
                stroke="#0891b2"
                strokeWidth="2.2"
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

          <div className="wos-planner-panel">
            <h3>Layout Planner</h3>
            <div className="wos-planner-tools">
              <button 
                className={`wos-planner-button ${buildMode === "hq" ? "active" : ""}`}
                onClick={() => setBuildMode(buildMode === "hq" ? null : "hq")}
              >
                <img src="/vendor/krozac-wos-interactive-map/alliance_hq.png" alt="Alliance HQ" />
                <span>Alliance HQ</span>
              </button>
              <button 
                className={`wos-planner-button ${buildMode === "banner" ? "active" : ""}`}
                onClick={() => setBuildMode(buildMode === "banner" ? null : "banner")}
              >
                <img src="/vendor/krozac-wos-interactive-map/alliance_banner.png" alt="Alliance Banner" />
                <span>Banner</span>
              </button>
            </div>
            {buildMode && (
              <span style={{ fontSize: "12px", color: "#0ea5e9", marginTop: "4px", textAlign: "center" }}>
                Click map to place. Click item to delete.
              </span>
            )}
            <div className="wos-planner-actions">
              <button onClick={() => setBuildMode(null)} disabled={!buildMode}>Exit Build Mode</button>
              <button 
                className="danger" 
                onClick={() => {
                  if (confirm("Clear your entire layout plan? This cannot be undone.")) {
                    setPlannerItems([]);
                  }
                }}
              >
                Clear Map
              </button>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
