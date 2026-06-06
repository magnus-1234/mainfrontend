import { NextRequest, NextResponse } from "next/server";

const backendUrl = (process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://140.245.201.209:3001").replace(/\/+$/, "");

export const proxyAdminRequest = async (request: NextRequest, path: string) => {
  const targetUrl = new URL(`${backendUrl}/api/admin/${path.replace(/^\/+/, "")}`);
  const sourceUrl = new URL(request.url);
  sourceUrl.searchParams.forEach((value, key) => targetUrl.searchParams.set(key, value));

  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  const cookie = request.headers.get("cookie");
  const userAgent = request.headers.get("user-agent");
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const country = request.headers.get("x-vercel-ip-country") || request.headers.get("cf-ipcountry");
  const region = request.headers.get("x-vercel-ip-country-region");
  const city = request.headers.get("x-vercel-ip-city");

  headers.set("accept", "application/json");
  if (contentType) headers.set("content-type", contentType);
  if (cookie) headers.set("cookie", cookie);
  if (userAgent) headers.set("user-agent", userAgent);
  if (forwardedFor) headers.set("x-forwarded-for", forwardedFor);
  if (realIp) headers.set("x-real-ip", realIp);
  if (country) headers.set("x-vercel-ip-country", country);
  if (region) headers.set("x-vercel-ip-country-region", region);
  if (city) headers.set("x-vercel-ip-city", city);

  const body = request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer();
  const backendResponse = await fetch(targetUrl, {
    method: request.method,
    headers,
    body,
    cache: "no-store",
  });

  const responseBody = await backendResponse.arrayBuffer();
  const response = new NextResponse(responseBody, {
    status: backendResponse.status,
    statusText: backendResponse.statusText,
    headers: {
      "content-type": backendResponse.headers.get("content-type") || "application/json",
      "cache-control": "no-store",
    },
  });

  const setCookie = backendResponse.headers.get("set-cookie");
  if (setCookie) {
    response.headers.set("set-cookie", setCookie);
  }

  return response;
};
