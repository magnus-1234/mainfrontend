import { mkdir, rm, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { parse } from "node-html-parser";

const siteBase = "https://www.whiteoutsurvival.wiki";
const outDataDir = path.join(process.cwd(), "src", "data", "wiki");
const outPublicDir = path.join(process.cwd(), "public", "wiki");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const slugFromUrl = (url) => {
  const pathname = new URL(url).pathname;
  const parts = pathname.split("/").filter(Boolean);
  return parts.at(-1) || parts.at(-2) || "item";
};

const cleanText = (value = "") =>
  value
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const buildingCategoryFor = (name) => {
  const normalized = name.toLowerCase();
  if (normalized.includes("fire crystal") || ["crystal laboratory", "war academy"].includes(normalized)) {
    return "Fire Crystal";
  }
  if (["barricade", "marksman camp", "lancer camp", "infantry camp", "infirmary", "command center", "embassy", "enlistment office"].includes(normalized)) {
    return "Military";
  }
  if (["furnace", "storehouse", "clinic", "shelter", "cookhouse", "hero hall", "iron mine", "sawmill", "coal mine", "hunter’s hut", "hunter's hut", "research center"].includes(normalized)) {
    return "Inner City";
  }
  return "Other";
};

const fetchText = async (url) => {
  const response = await fetch(url, {
    headers: {
      "user-agent": "WhiteoutSurvival.dev wiki snapshot bot",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  return response.text();
};

const extensionFor = (url, contentType = "") => {
  const pathname = decodeURIComponent(new URL(url).pathname);
  const ext = path.extname(pathname).toLowerCase();
  if ([".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"].includes(ext)) {
    return ext;
  }
  if (contentType.includes("jpeg")) return ".jpg";
  if (contentType.includes("webp")) return ".webp";
  if (contentType.includes("gif")) return ".gif";
  if (contentType.includes("svg")) return ".svg";
  return ".png";
};

const localImagePath = async (imageUrl, section, slug, imageCache) => {
  const absolute = new URL(imageUrl, siteBase).href;
  if (!absolute.startsWith("http")) return imageUrl;
  if (imageCache.has(absolute)) return imageCache.get(absolute);

  const response = await fetch(absolute, {
    headers: { "user-agent": "WhiteoutSurvival.dev wiki snapshot bot" },
  });
  if (!response.ok) {
    return absolute;
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const hash = createHash("sha1").update(absolute).digest("hex").slice(0, 12);
  const ext = extensionFor(absolute, response.headers.get("content-type") || "");
  const folder = path.join(outPublicDir, section, slug);
  const fileName = `${hash}${ext}`;
  const diskPath = path.join(folder, fileName);
  const publicPath = `/wiki/${section}/${slug}/${fileName}`;

  await mkdir(folder, { recursive: true });
  await writeFile(diskPath, buffer);
  imageCache.set(absolute, publicPath);
  await sleep(30);
  return publicPath;
};

const normalizeContent = async (node, section, slug, imageCache) => {
  const clone = parse(node.toString());

  for (const selector of [
    "script",
    "style",
    "iframe",
    "form",
    ".adsbygoogle",
    ".google-auto-placed",
    ".row-1",
    ".woswiki-ad",
  ]) {
    for (const match of clone.querySelectorAll(selector)) {
      match.remove();
    }
  }

  for (const anchor of clone.querySelectorAll("a")) {
    const href = anchor.getAttribute("href") || "";
    if (href.startsWith("#")) {
      anchor.setAttribute("href", href);
      continue;
    }
    anchor.removeAttribute("href");
    anchor.removeAttribute("target");
    anchor.removeAttribute("rel");
  }

  for (const img of clone.querySelectorAll("img")) {
    const src = img.getAttribute("src") || img.getAttribute("data-src");
    if (!src) continue;
    const localPath = await localImagePath(src, section, slug, imageCache);
    img.setAttribute("src", localPath);
    img.removeAttribute("srcset");
    img.removeAttribute("sizes");
    if (!img.getAttribute("alt")) {
      img.setAttribute("alt", "");
    }
  }

  for (const element of clone.querySelectorAll("*")) {
    element.removeAttribute("style");
    element.removeAttribute("onclick");
    element.removeAttribute("onerror");
    element.removeAttribute("loading");
    element.removeAttribute("decoding");
    element.removeAttribute("data-src");
  }

  return clone.toString();
};

const extractHeroMeta = (root, fallbackName) => {
  const getAttr = (label) => {
    for (const item of root.querySelectorAll(".hero-attr-item")) {
      const itemLabel = cleanText(item.querySelector(".hero-attr-label")?.textContent || "");
      if (itemLabel.toLowerCase() === label.toLowerCase()) {
        return cleanText(item.querySelector(".hero-attr-value span")?.textContent || item.querySelector(".hero-attr-value")?.textContent || "");
      }
    }
    return "";
  };

  const statRows = root.querySelectorAll(".hero-stats-row").map((row) => ({
    label: cleanText(row.querySelector(".hero-stats-label")?.textContent || ""),
    value: cleanText(row.querySelector(".hero-stats-value")?.textContent || ""),
  })).filter((row) => row.label && row.value);

  const skills = root.querySelectorAll(".bg-dark h5")
    .map((skill) => cleanText(skill.textContent))
    .filter(Boolean);

  return {
    name: cleanText(root.querySelector(".hero-left-title")?.textContent || root.querySelector("h2")?.textContent || fallbackName),
    rarity: getAttr("Rarity"),
    heroClass: getAttr("Class"),
    subClass: getAttr("Sub Class"),
    stats: statRows,
    skills,
  };
};

const extractBuildingMeta = (root, fallbackName) => {
  const description = cleanText(root.querySelector("#description p")?.textContent || "");
  const tables = root.querySelectorAll("table").map((table) => {
    const headers = table.querySelectorAll("thead th, tr:first-child th, tr:first-child td").map((cell) => cleanText(cell.textContent));
    const rows = table.querySelectorAll("tbody tr, tr").map((row) =>
      row.querySelectorAll("th,td").map((cell) => cleanText(cell.textContent)).filter(Boolean)
    ).filter((row) => row.length);
    return { headers, rows: rows.slice(0, 120) };
  }).filter((table) => table.rows.length);

  return {
    name: cleanText(root.querySelector("h2")?.textContent || fallbackName),
    category: buildingCategoryFor(fallbackName),
    description,
    tableCount: tables.length,
    previewTable: tables[0] || null,
  };
};

const discoverItems = async (section) => {
  const url = `${siteBase}/${section}/`;
  const root = parse(await fetchText(url));
  const cardSelector = section === "heroes" ? ".pet-card-item" : ".building-card-item";
  const items = [];
  const seen = new Set();

  for (const card of root.querySelectorAll(cardSelector)) {
    const anchor = card.querySelector(`a[href*="/${section}/"]`);
    if (!anchor) continue;
    const itemUrl = new URL(anchor.getAttribute("href"), siteBase).href;
    if (seen.has(itemUrl)) continue;
    seen.add(itemUrl);

    const img = card.querySelector(".pet-image-wrapper img") || card.querySelector("img");
    items.push({
      name: cleanText(anchor.textContent),
      url: itemUrl,
      slug: slugFromUrl(itemUrl),
      thumbnailUrl: img?.getAttribute("src") || "",
    });
  }

  return items;
};

const scrapeSection = async (section) => {
  const items = await discoverItems(section);
  const imageCache = new Map();
  const scraped = [];

  console.log(`Scraping ${items.length} ${section}...`);

  for (const [index, item] of items.entries()) {
    const root = parse(await fetchText(item.url));
    const contentRoot = section === "heroes"
      ? root.querySelector(".content-hero")
      : root.querySelector("h2.fs-1")?.parentNode?.parentNode?.parentNode;

    if (!contentRoot) {
      console.warn(`Skipping ${item.url}: content root not found`);
      continue;
    }

    const thumbnail = item.thumbnailUrl
      ? await localImagePath(item.thumbnailUrl, section, item.slug, imageCache)
      : "";
    const html = await normalizeContent(contentRoot, section, item.slug, imageCache);
    const meta = section === "heroes"
      ? extractHeroMeta(contentRoot, item.name)
      : extractBuildingMeta(contentRoot, item.name);

    scraped.push({
      ...item,
      ...meta,
      sourceUrl: item.url,
      thumbnail,
      html,
      scrapedAt: new Date().toISOString(),
    });

    console.log(`${index + 1}/${items.length} ${item.name}`);
    await sleep(80);
  }

  return scraped;
};

const main = async () => {
  await mkdir(outDataDir, { recursive: true });
  await rm(outPublicDir, { recursive: true, force: true });
  await mkdir(outPublicDir, { recursive: true });

  const heroes = await scrapeSection("heroes");
  const buildings = await scrapeSection("buildings");

  await writeFile(path.join(outDataDir, "heroes.json"), `${JSON.stringify(heroes, null, 2)}\n`);
  await writeFile(path.join(outDataDir, "buildings.json"), `${JSON.stringify(buildings, null, 2)}\n`);

  console.log(`Wrote ${heroes.length} heroes and ${buildings.length} buildings.`);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
