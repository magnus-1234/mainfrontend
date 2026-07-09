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
    
    // Remove unwanted script, style, header, footer nodes
    const unwantedTags = ["SCRIPT", "STYLE", "NOSCRIPT", "NAV", "HEADER", "FOOTER"];
    for (const tag of unwantedTags) {
      container.querySelectorAll(tag).forEach(node => {
        node.remove();
      });
    }

    // Fix relative image links and strip out logos
    container.querySelectorAll("img").forEach(img => {
      let src = img.getAttribute("src") || img.getAttribute("data-src") || "";
      if (src && (src.includes("logo") || src.includes("icon") || src.includes("avatar"))) {
        img.remove();
      } else if (src.startsWith("/")) {
        img.setAttribute("src", `https://www.whiteoutsurvival.wiki${src}`);
      }
    });

    let htmlContent = container.innerHTML || "";
    
    // Strip out boilerplate text completely
    const boilerplates = [
      "Whiteout Survival - Official Wiki | Century Games © 2026",
      "Whiteout Survival - Official Wiki | Century Games",
      "Whiteout Survival Wiki sneak peek"
    ];
    for (const bp of boilerplates) {
      // Regex replace to handle potential line breaks or tags between text
      const regex = new RegExp(bp.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'gi');
      htmlContent = htmlContent.replace(regex, "");
    }

    // Attempt to extract gift code for the header if it exists
    let giftCode = "";
    const textContent = container.textContent || "";
    const codeMatch = textContent.match(/Gift Code:\s*([A-Za-z0-9]+)/i) || textContent.match(/Code:\s*([A-Za-z0-9]+)/i);
    if (codeMatch && codeMatch[1].length <= 10) {
      giftCode = codeMatch[1];
    }

    // Also strip out any <p> or <div> that are now empty or just contain "Source: ."
    htmlContent = htmlContent.replace(/<p[^>]*>\s*Source:\s*<a[^>]*>\s*<\/a>\.\s*<\/p>/gi, "");
    htmlContent = htmlContent.replace(/Source:\s*<a[^>]*>\s*<\/a>\./gi, "");

    return NextResponse.json({
      title: latestTitle,
      sourceUrl: latestLink,
      giftCode,
      htmlContent
    });

  } catch (error: any) {
    console.error("Sneak peek API error:", error);
    return NextResponse.json({ error: error.message || "Unknown error" }, { status: 500 });
  }
}
