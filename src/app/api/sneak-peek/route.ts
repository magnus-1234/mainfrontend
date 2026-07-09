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

    // Filter to a likely main container if available, otherwise root
    const container = root.querySelector("article") || root.querySelector("main") || root;

    const elements = container.querySelectorAll("p, img, h2, h3, h4, h5");
    
    const extractedData = [];
    let giftCode = "";

    for (const el of elements) {
      if (el.tagName === "IMG") {
        let src = el.getAttribute("src") || el.getAttribute("data-src") || "";
        if (src && !src.includes("logo") && !src.includes("icon") && !src.includes("avatar")) {
          // ensure absolute url
          if (src.startsWith("/")) {
            src = `https://www.whiteoutsurvival.wiki${src}`;
          }
          extractedData.push({ type: "image", content: src });
        }
      } else {
        const text = el.textContent?.trim() || "";
        if (text && text.length > 2) {
          extractedData.push({ type: "text", content: text, tag: el.tagName.toLowerCase() });
          
          // Try to detect a gift code
          const codeMatch = text.match(/Gift Code:\s*([A-Za-z0-9]+)/i) || text.match(/Code:\s*([A-Za-z0-9]+)/i);
          if (codeMatch && codeMatch[1].length <= 10) {
            giftCode = codeMatch[1];
          }
        }
      }
    }

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
