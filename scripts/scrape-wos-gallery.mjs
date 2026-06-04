import { mkdir, rm, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { parse } from "node-html-parser";

const sourceUrl = "https://www.whiteoutsurvival.wiki/official-gallery/";
const outDataDir = path.join(process.cwd(), "src", "data", "wiki");
const outPublicDir = path.join(process.cwd(), "public", "wiki", "posters");

const gallerySections = [
  { id: "heroes", label: "Heroes", pane: "sub-hero-all" },
  { id: "events", label: "Events", pane: "sub-all-huodonghaibao" },
  { id: "festivals", label: "Festivals", pane: "sub-festival-all" },
  { id: "survivors", label: "Survivors", pane: "sub-xingcunzhe-all" },
];

const extensionFor = (url, contentType = "") => {
  const ext = path.extname(new URL(url).pathname).toLowerCase();
  if ([".png", ".jpg", ".jpeg", ".webp", ".gif"].includes(ext)) return ext;
  if (contentType.includes("jpeg")) return ".jpg";
  if (contentType.includes("webp")) return ".webp";
  if (contentType.includes("gif")) return ".gif";
  return ".png";
};

const cleanTitle = (url, fallback) => {
  const fileName = decodeURIComponent(path.basename(new URL(url).pathname, path.extname(new URL(url).pathname)))
    .replace(/[-_]+/g, " ")
    .replace(/\bscaled\b/gi, "")
    .replace(/\boutput\b/gi, "")
    .replace(/\s+\d+$/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return fileName || fallback;
};

const fetchWithTimeout = async (url, options = {}, timeoutMs = 20000) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
};

const thumbnailCandidatesFor = (url) => {
  const parsed = new URL(url);
  const ext = path.extname(parsed.pathname);
  const base = url.slice(0, -ext.length);
  const normalizedBase = base.replace(/-scaled(?:-\d+)?$/i, "");
  return [
    `${normalizedBase}-768x432${ext}`,
    `${normalizedBase}-1024x576${ext}`,
    `${normalizedBase}-300x169${ext}`,
    url,
  ];
};

const downloadImage = async (url, sectionId, index) => {
  let selectedUrl = url;
  let response = null;
  for (const candidate of thumbnailCandidatesFor(url)) {
    try {
      response = await fetchWithTimeout(candidate, {
        headers: { "user-agent": "WhiteoutSurvival.dev gallery snapshot bot" },
      }, 9000);
      if (response.ok) {
        selectedUrl = candidate;
        break;
      }
    } catch {
      response = null;
    }
  }

  if (!response?.ok) {
    throw new Error(`Failed to download ${selectedUrl}: ${response?.status || "no response"}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const hash = createHash("sha1").update(selectedUrl).digest("hex").slice(0, 12);
  const ext = extensionFor(selectedUrl, response.headers.get("content-type") || "");
  const fileName = `${String(index).padStart(3, "0")}-${hash}${ext}`;
  const diskPath = path.resolve(outPublicDir, sectionId, fileName);
  const diskDir = path.resolve(outPublicDir, sectionId);

  try {
    await mkdir(diskDir, { recursive: true });
  } catch (error) {
    console.error({ url: selectedUrl, sectionId, fileName, diskDir, diskPath });
    throw error;
  }
  await writeFile(diskPath, buffer);

  return {
    image: `/wiki/posters/${sectionId}/${fileName}`,
    downloadedFrom: selectedUrl,
    bytes: buffer.length,
  };
};

const response = await fetch(sourceUrl, {
  headers: { "user-agent": "WhiteoutSurvival.dev gallery snapshot bot" },
});

if (!response.ok) {
  throw new Error(`Failed to fetch ${sourceUrl}: ${response.status}`);
}

await rm(outPublicDir, { recursive: true, force: true });
await mkdir(outDataDir, { recursive: true });

const root = parse(await response.text());
const seenUrls = new Set();
const posterTasks = [];

for (const section of gallerySections) {
  const pane = root.querySelector(`#${section.pane}`);
  if (!pane) {
    throw new Error(`Missing gallery pane #${section.pane}`);
  }

  let sectionIndex = 0;
  for (const img of pane.querySelectorAll("img")) {
    const src = img.getAttribute("data-src") || img.getAttribute("src");
    if (!src) continue;

    const absolute = new URL(src, sourceUrl).href;
    if (seenUrls.has(absolute)) continue;
    seenUrls.add(absolute);
    sectionIndex += 1;

    posterTasks.push({
      id: `${section.id}-${String(sectionIndex).padStart(3, "0")}`,
      title: cleanTitle(absolute, `${section.label} Poster ${sectionIndex}`),
      category: section.label,
      sectionId: section.id,
      sectionIndex,
      sourceUrl: absolute,
    });
  }
}

const posters = new Array(posterTasks.length);
let cursor = 0;

const worker = async () => {
  while (cursor < posterTasks.length) {
    const taskIndex = cursor;
    cursor += 1;
    const task = posterTasks[taskIndex];
    const localImage = await downloadImage(task.sourceUrl, task.sectionId, task.sectionIndex);
    posters[taskIndex] = {
      id: task.id,
      title: task.title,
      category: task.category,
      image: localImage.image,
      sourceUrl: task.sourceUrl,
      assetSourceUrl: localImage.downloadedFrom,
      bytes: localImage.bytes,
    };
    if ((taskIndex + 1) % 25 === 0 || taskIndex + 1 === posterTasks.length) {
      console.log(`Downloaded ${taskIndex + 1}/${posterTasks.length}`);
    }
  }
};

await Promise.all(Array.from({ length: 8 }, () => worker()));

await writeFile(
  path.join(outDataDir, "posters.json"),
  JSON.stringify(
    {
      sourceUrl,
      scrapedAt: new Date().toISOString(),
      categories: gallerySections.map(({ id, label }) => ({ id, label })),
      posters,
    },
    null,
    2,
  ),
);

console.log(`Saved ${posters.length} posters to ${path.relative(process.cwd(), outPublicDir)}`);
