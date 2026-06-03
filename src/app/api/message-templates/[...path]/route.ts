import { NextRequest, NextResponse } from "next/server";
import {
  deleteTemplate,
  emptyFavorites,
  likeTemplate,
  listUploads,
  shareTemplate,
  updateTemplate,
} from "../store";

type RouteContext = {
  params: Promise<{
    path?: string[];
  }>;
};

const partsFor = async (context: RouteContext) => (await context.params).path || [];

export const GET = async (request: NextRequest, context: RouteContext) => {
  const parts = await partsFor(context);
  if (parts[0] === "me" && parts[1] === "uploads") {
    return listUploads(request);
  }
  if (parts[0] === "me" && parts[1] === "favorites") {
    return emptyFavorites();
  }
  return NextResponse.json({ error: "Not found" }, { status: 404 });
};

export const PATCH = async (request: NextRequest, context: RouteContext) => {
  const [templateId] = await partsFor(context);
  if (!templateId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return updateTemplate(request, templateId);
};

export const DELETE = async (request: NextRequest, context: RouteContext) => {
  const parts = await partsFor(context);
  const [templateId, action] = parts;
  if (!templateId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (action === "like") {
    return likeTemplate(request, templateId, -1);
  }
  return deleteTemplate(request, templateId);
};

export const POST = async (request: NextRequest, context: RouteContext) => {
  const [templateId, action] = await partsFor(context);
  if (!templateId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (action === "like") {
    return likeTemplate(request, templateId, 1);
  }
  if (action === "share") {
    return shareTemplate(request, templateId);
  }
  return NextResponse.json({ error: "Not found" }, { status: 404 });
};
