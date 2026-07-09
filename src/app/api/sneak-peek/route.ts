import { NextResponse } from "next/server";
import { parse } from "node-html-parser";

export const revalidate = 3600; // Cache for 1 hour

export async function GET() {
  try {
    const feedUrl = "https://www.whiteoutsurvival.wiki/sneak-peek/feed/";
    const feedResponse = await fetch(feedUrl, {
      headers: { "user-agent": "WhiteoutSurvival.dev wiki snapshot bot" },
      next: { revalidate: 3600 }
    });

    if (!feedResponse.ok) {
      throw new Error(`Failed to fetch feed: ${feedResponse.status}`);
    }

    const xml = await feedResponse.text();
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];
    
    let latestLink = "";
    let latestTitle = "Sneak Peek";

    for (const match of items) {
      const linkMatch = match[1].match(/<link>(.*?)<\/link>/);
      const titleMatch = match[1].match(/<title>(.*?)<\/title>/);
      if (linkMatch) {
        latestLink = linkMatch[1];
        latestTitle = titleMatch ? titleMatch[1] : "Sneak Peek";
        break; // Get the first one (latest)
      }
    }

    if (!latestLink) {
      throw new Error("No sneak peek link found in feed.");
    }

    const articleResponse = await fetch(latestLink, {
      headers: { "user-agent": "WhiteoutSurvival.dev wiki snapshot bot" },
      next: { revalidate: 3600 }
    });

    if (!articleResponse.ok) {
      throw new Error(`Failed to fetch article: ${articleResponse.status}`);
    }

    const html = await articleResponse.text();
    const root = parse(html);

    // Better container fallback for the WOS Wiki elementor template
    const container = root.querySelector(".description") || root.querySelector(".col-lg-8") || root;
    
    const extractedData: { type: string, content: string, tag?: string }[] = [];
    let giftCode = "";

    function walk(node: any) {
      if (node.nodeType === 3) {
        const text = node.textContent.trim();
        // Ignore very short strings, raw functions, and boilerplate footer strings
        if (text.length > 2 && !text.includes("function(") && !text.includes("Century Games") && !text.includes("Whiteout Survival Wiki")) {
          extractedData.push({ type: "text", content: text, tag: "p" });
          
          // Try to detect a gift code
          const codeMatch = text.match(/Gift Code:\s*([A-Za-z0-9]+)/i) || text.match(/Code:\s*([A-Za-z0-9]+)/i);
          if (codeMatch && codeMatch[1].length <= 10) {
            giftCode = codeMatch[1];
          }
        }
        return;
      }
      
      if (node.nodeType === 1) {
        // Skip navs, headers, footers and scripts
        if (["SCRIPT", "STYLE", "NOSCRIPT", "NAV", "HEADER", "FOOTER"].includes(node.tagName)) {
          return;
        }
        if (node.tagName === "IMG") {
          let src = node.getAttribute("src") || node.getAttribute("data-src") || "";
          if (src && !src.includes("logo") && !src.includes("icon") && !src.includes("avatar")) {
            if (src.startsWith("/")) {
              src = `https://www.whiteoutsurvival.wiki${src}`;
            }
            extractedData.push({ type: "image", content: src });
          }
          return;
        }
        // Recurse into children
        node.childNodes.forEach(walk);
      }
    }

    walk(container);

    // Deduplicate consecutive identical texts or images just in case
    const deduplicated = extractedData.filter((item, index, self) => 
      index === 0 || item.content !== self[index - 1].content
    );

    return NextResponse.json({
      title: latestTitle,
      sourceUrl: latestLink,
      giftCode,
      items: deduplicated
    });

  } catch (error: any) {
    console.error("Sneak peek API error:", error);
    return NextResponse.json({ error: error.message || "Unknown error" }, { status: 500 });
  }
}
