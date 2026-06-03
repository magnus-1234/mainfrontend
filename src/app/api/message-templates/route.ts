import { NextRequest, NextResponse } from "next/server";

const backendUrl = process.env.BACKEND_URL || process.env.PUBLIC_API_URL || "http://140.245.201.209:3001";

const forward = async (request: NextRequest) => {
  const target = new URL(`${backendUrl.replace(/\/+$/, "")}/api/message-templates`);
  request.nextUrl.searchParams.forEach((value, key) => target.searchParams.set(key, value));
  const contentType = request.headers.get("content-type") || "";
  const isMultipart = contentType.includes("multipart/form-data");
  const formData = isMultipart && request.method !== "GET" && request.method !== "HEAD" ? await request.formData() : null;
  const userId = request.headers.get("x-user-id") || (formData ? String(formData.get("creatorUserId") || "") : "");

  const response = await fetch(target, {
    method: request.method,
    headers: {
      ...(!isMultipart ? { "Content-Type": contentType || "application/json" } : {}),
      cookie: request.headers.get("cookie") || "",
      authorization: request.headers.get("authorization") || "",
      ...(userId ? { "x-user-id": userId } : {}),
    },
    body: request.method === "GET" || request.method === "HEAD" ? undefined : formData || await request.text(),
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
