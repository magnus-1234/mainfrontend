import { NextRequest, NextResponse } from "next/server";

const backendUrl = process.env.BACKEND_URL || process.env.PUBLIC_API_URL || "http://localhost:3001";

type RouteContext = {
  params: Promise<{
    path?: string[];
  }>;
};

const forward = async (request: NextRequest, context: RouteContext) => {
  const params = await context.params;
  const path = (params.path || []).map((part) => encodeURIComponent(part)).join("/");
  const target = new URL(`${backendUrl.replace(/\/+$/, "")}/api/message-templates/${path}`);
  request.nextUrl.searchParams.forEach((value, key) => target.searchParams.set(key, value));
  const contentType = request.headers.get("content-type") || "";
  const isMultipart = contentType.includes("multipart/form-data");

  const response = await fetch(target, {
    method: request.method,
    headers: {
      ...(!isMultipart ? { "Content-Type": contentType || "application/json" } : {}),
      cookie: request.headers.get("cookie") || "",
    },
    body: request.method === "GET" || request.method === "HEAD" ? undefined : isMultipart ? await request.formData() : await request.text(),
    cache: "no-store",
  });

  const body = await response.text();
  return new NextResponse(body, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("content-type") || "application/json",
    },
  });
};

export const GET = forward;
export const POST = forward;
export const PATCH = forward;
export const DELETE = forward;
