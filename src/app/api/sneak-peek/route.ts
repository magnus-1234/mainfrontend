import { NextResponse } from "next/server";
import { parse } from "node-html-parser";

export const revalidate = 3600; // Cache for 1 hour

export async function GET() {
  try {
    const feedUrl = "https://www.whiteoutsurvival.wiki/sneak-peek-sitemap.xml";
    const feedResponse = await fetch(feedUrl, {
      headers: { "user-agent": "WhiteoutSurvival.dev wiki snapshot bot" },
      next: { revalidate: 3600 }
    });

    if (!feedResponse.ok) {
      throw new Error(`Failed to fetch sitemap: ${feedResponse.status}`);
    }

    const xml = await feedResponse.text();
    const items = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)];
    
    let latestLink = "";
    let latestTitle = "Sneak Peek";

    const parsedItems = [];
    for (const match of items) {
      const urlBlock = match[1];
      const linkMatch = urlBlock.match(/<loc><!\[CDATA\[(.*?)\]\]><\/loc>/);
      const lastmodMatch = urlBlock.match(/<lastmod><!\[CDATA\[(.*?)\]\]><\/lastmod>/);
      if (linkMatch) {
        const link = linkMatch[1];
        
        // Ensure we only process english links or general links (like old ones that didn't have a language suffix)
        if (link.includes("/ja/") || link.includes("/ko/") || link.includes("jp/") || link.includes("kr/")) continue;
        
        let mmdd = 0;
        const urlMatch = link.match(/\/sneak-peek\/(\d{4})/);
        if (urlMatch) {
          mmdd = parseInt(urlMatch[1], 10);
        } else if (lastmodMatch) {
          // Fallback to lastmod
          mmdd = new Date(lastmodMatch[1]).getTime();
        }
        
        parsedItems.push({ link, title: "Sneak Peek", mmdd });
      }
    }

    if (parsedItems.length === 0) {
      return NextResponse.json({ error: "No sneak peek currently available." }, { status: 404 });
    }

    parsedItems.sort((a, b) => {
      if (a.mmdd > 10000 || b.mmdd > 10000) {
        return b.mmdd - a.mmdd; // normal descending for timestamps
      }
      
      const aMonth = Math.floor(a.mmdd / 100);
      const bMonth = Math.floor(b.mmdd / 100);
      
      // Wrap around logic: if difference in months is large (e.g. > 6), 
      // the smaller month (Jan) is newer than the larger (Dec).
      if (Math.abs(aMonth - bMonth) > 6) {
        return aMonth < bMonth ? -1 : 1; 
      }
      
      return b.mmdd - a.mmdd; // normal descending
    });

    latestLink = parsedItems[0].link;
    latestTitle = parsedItems[0].title;

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
      // Only remove the site logos, not everything hosted on the "gom-s3-user-avatar" bucket
      if (src && (src.includes("cropped-logo") || src.includes("logo_white"))) {
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

    const actualTitle = root.querySelector("title")?.text.replace(" - Whiteout Survival Wiki", "") || latestTitle;
    return NextResponse.json({
      title: actualTitle,
      sourceUrl: latestLink,
      giftCode,
      htmlContent
    });

  } catch (error: any) {
    console.error("Sneak peek API error:", error);
    return NextResponse.json({ error: error.message || "Unknown error" }, { status: 500 });
  }
}
