const sourceUrl = "https://whiteoutsurvival.pl/state-timeline/";
const ajaxUrl = "https://whiteoutsurvival.pl/wp-admin/admin-ajax.php";

const firstMatch = (value: string, pattern: RegExp) => value.match(pattern)?.[1]?.trim() || "";

const decodeHtml = (value: string) =>
  value
    .replace(/\\\//g, "/")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#8211;|&#8212;|\\u2013/g, "-")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");

const cleanText = (value: string) =>
  decodeHtml(value)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

async function run() {
  const page = await fetch(sourceUrl).then(r => r.text());
  const nonce = firstMatch(page, /var STPAjax = \{"ajax_url":"[^"]+","nonce":"([^"]+)"/);

  const response = await fetch(ajaxUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
    body: new URLSearchParams({
      action: "stp_get_timeline",
      nonce,
      server_id: "3063",
    }),
  });
  const payload = await response.json();
  const html = payload?.data?.html ? String(payload.data.html) : "";
  
  const chunk = html.match(/<div class='stp-event'[\s\S]*?(?=<div class='stp-event-separator'|<h3|<\/div>$)/g)?.[0] || "";
  
  const blocks = Array.from(chunk.matchAll(/<(?:a|div)[^>]*class=['"][^'"]*\bstp-hero\b(?!-)[^'"]*['"][^>]*>([\s\S]*?)<\/(?:a|div)>/gi));
  
  const items = [];
  blocks.forEach((match, index) => {
    const block = match[1];
    const caption = cleanText(firstMatch(block, /<figcaption[^>]*>([\s\S]*?)<\/figcaption>/i));
    const alt = cleanText(firstMatch(block, /<img[^>]+alt=['"]([^'"]*)['"]/i));
    const image = firstMatch(block, /<img[^>]+src=['"]([^'"]*)['"]/i);
    const afterBreak = cleanText(firstMatch(block, /<br\s*\/?>\s*([^<]+)/i));
    const title = cleanText(firstMatch(chunk, /<h4>([\s\S]*?)<\/h4>/i));
    const name = caption || afterBreak || alt || (index ? `${title} ${index + 1}` : title);

    if (!name) return;
    items.push({ name, ...(image && { image }) });
  });

  console.log(JSON.stringify(items, null, 2));
}

run().catch(console.error);
