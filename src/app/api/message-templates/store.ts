import { MongoClient, type Collection, type Document } from "mongodb";
import { NextRequest, NextResponse } from "next/server";

type MessageTemplateDoc = {
  id: string;
  title: string;
  category: string;
  categories: string[];
  description: string;
  text: string;
  rawText: string;
  imageUrl: string;
  tags: string[];
  creatorName: string;
  creatorUserId: string | null;
  likes: number;
  shares: number;
  createdAt: string;
  updatedAt: string;
  builtin: boolean;
};

const validCategories = new Set([
  "state-transfer-chat",
  "unicodes",
  "emojis",
  "funny",
  "alliance-recruit",
  "various",
  "leaders",
  "nsfw",
]);

const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || "";
const mongoDbName = process.env.MONGODB_DB || process.env.MONGO_DB || "wosbot";

declare global {
  var messageTemplatesMongoClient: MongoClient | undefined;
}

const normalizeCopyText = (value: FormDataEntryValue | string | null | undefined) =>
  String(value || "").replace(/\r\n?/g, "\n");

const collection = async (): Promise<Collection<MessageTemplateDoc>> => {
  if (!mongoUri) {
    throw new Error("Message template storage is not configured");
  }
  if (!globalThis.messageTemplatesMongoClient) {
    globalThis.messageTemplatesMongoClient = new MongoClient(mongoUri);
  }
  await globalThis.messageTemplatesMongoClient.connect();
  return globalThis.messageTemplatesMongoClient.db(mongoDbName).collection<MessageTemplateDoc>("message_templates");
};

const userIdFrom = (request: NextRequest, form?: FormData | null) =>
  request.headers.get("x-user-id") || (form ? String(form.get("creatorUserId") || "") : "");

const publicTemplate = (doc: MessageTemplateDoc, userId = "") => {
  const { _id: _omit, ...template } = doc as MessageTemplateDoc & { _id?: unknown };
  void _omit;
  return {
    ...template,
    text: normalizeCopyText(template.text),
    rawText: normalizeCopyText(template.rawText || template.text),
    canManage: Boolean(userId && template.creatorUserId === userId),
  };
};

const categoryList = (form: FormData) => {
  const primary = String(form.get("category") || "state-transfer-chat");
  const selected = [
    primary,
    ...form.getAll("categories").map((value) => String(value)),
  ].filter((value) => validCategories.has(value));
  return Array.from(new Set(selected)).slice(0, 8).length ? Array.from(new Set(selected)).slice(0, 8) : ["state-transfer-chat"];
};

const tagsFrom = (form: FormData) =>
  String(form.get("tags") || "")
    .split(/[\s,#]+/)
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 12);

const imageUrlFrom = async (form: FormData) => {
  const imageUrl = String(form.get("imageUrl") || "").trim();
  if (imageUrl) {
    return imageUrl;
  }
  const image = form.get("image");
  if (!(image instanceof File) || image.size <= 0 || image.size > 2 * 1024 * 1024) {
    return "";
  }
  const bytes = Buffer.from(await image.arrayBuffer());
  return `data:${image.type || "application/octet-stream"};base64,${bytes.toString("base64")}`;
};

const payloadFrom = async (request: NextRequest, existing?: MessageTemplateDoc) => {
  const form = await request.formData();
  const categories = categoryList(form);
  const text = normalizeCopyText(form.get("text"));
  const now = new Date().toISOString();
  return {
    form,
    userId: userIdFrom(request, form),
    payload: {
      title: String(form.get("title") || "Untitled template").trim().slice(0, 90) || "Untitled template",
      category: categories[0],
      categories,
      description: String(form.get("description") || "").trim().slice(0, 360),
      text,
      rawText: text,
      imageUrl: (await imageUrlFrom(form)) || existing?.imageUrl || "",
      tags: tagsFrom(form),
      creatorName: String(form.get("creatorName") || existing?.creatorName || "Community").trim().slice(0, 80) || "Community",
      creatorUserId: String(form.get("creatorUserId") || existing?.creatorUserId || "").trim() || null,
      updatedAt: now,
    },
  };
};

const storageError = (error: unknown) =>
  NextResponse.json({ error: error instanceof Error ? error.message : "Message template storage failed" }, { status: 503 });

export const listTemplates = async (request: NextRequest) => {
  try {
    const col = await collection();
    const url = new URL(request.url);
    const category = url.searchParams.get("category");
    const tag = url.searchParams.get("tag");
    const sort = url.searchParams.get("sort") || "popular";
    const limit = Math.max(1, Math.min(Number(url.searchParams.get("limit") || 80), 100));
    const query: Document = {};
    if (category && category !== "all") {
      query.$or = [{ category }, { categories: category }];
    }
    if (tag) {
      query.tags = { $regex: `^${tag}$`, $options: "i" };
    }
    const sortSpec: [string, -1][] = sort === "recent" ? [["createdAt", -1]] : [["likes", -1], ["shares", -1], ["createdAt", -1]];
    const docs = await col.find(query).sort(sortSpec).limit(limit).toArray();
    return NextResponse.json({ templates: docs.map((doc) => publicTemplate(doc, userIdFrom(request))), favoriteIds: [] });
  } catch (error) {
    return storageError(error);
  }
};

export const createTemplate = async (request: NextRequest) => {
  try {
    const col = await collection();
    const { payload, userId } = await payloadFrom(request);
    const now = payload.updatedAt;
    const template: MessageTemplateDoc = {
      id: crypto.randomUUID(),
      ...payload,
      likes: 0,
      shares: 0,
      createdAt: now,
      builtin: false,
    };
    await col.insertOne(template);
    return NextResponse.json({ template: publicTemplate(template, userId) });
  } catch (error) {
    return storageError(error);
  }
};

export const listUploads = async (request: NextRequest) => {
  try {
    const col = await collection();
    const userId = userIdFrom(request);
    const limit = Math.max(1, Math.min(Number(new URL(request.url).searchParams.get("limit") || 80), 100));
    const query = userId ? { creatorUserId: userId } : {};
    const docs = await col.find(query).sort({ createdAt: -1 }).limit(limit).toArray();
    return NextResponse.json({ templates: docs.map((doc) => publicTemplate(doc, userId)), favoriteIds: [] });
  } catch (error) {
    return storageError(error);
  }
};

export const emptyFavorites = () => NextResponse.json({ templates: [], favoriteIds: [] });

export const updateTemplate = async (request: NextRequest, templateId: string) => {
  try {
    const col = await collection();
    const existing = await col.findOne({ id: templateId });
    if (!existing) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }
    const { payload, userId } = await payloadFrom(request, existing);
    if (existing.creatorUserId && userId && existing.creatorUserId !== userId) {
      return NextResponse.json({ error: "You can only edit your own templates" }, { status: 403 });
    }
    await col.updateOne({ id: templateId }, { $set: payload });
    const updated = await col.findOne({ id: templateId });
    return NextResponse.json({ template: publicTemplate(updated || { ...existing, ...payload }, userId) });
  } catch (error) {
    return storageError(error);
  }
};

export const deleteTemplate = async (request: NextRequest, templateId: string) => {
  try {
    const col = await collection();
    const existing = await col.findOne({ id: templateId });
    if (!existing) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }
    const userId = userIdFrom(request);
    if (existing.creatorUserId && userId && existing.creatorUserId !== userId) {
      return NextResponse.json({ error: "You can only delete your own templates" }, { status: 403 });
    }
    await col.deleteOne({ id: templateId });
    return NextResponse.json({ status: "success" });
  } catch (error) {
    return storageError(error);
  }
};

export const likeTemplate = async (request: NextRequest, templateId: string, delta: 1 | -1) => {
  try {
    const col = await collection();
    await col.updateOne({ id: templateId, ...(delta < 0 ? { likes: { $gt: 0 } } : {}) }, { $inc: { likes: delta } });
    const template = await col.findOne({ id: templateId });
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }
    return NextResponse.json({ template: publicTemplate(template, userIdFrom(request)) });
  } catch (error) {
    return storageError(error);
  }
};

export const shareTemplate = async (request: NextRequest, templateId: string) => {
  try {
    const col = await collection();
    await col.updateOne({ id: templateId }, { $inc: { shares: 1 } });
    const template = await col.findOne({ id: templateId });
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }
    return NextResponse.json({ template: publicTemplate(template, userIdFrom(request)) });
  } catch (error) {
    return storageError(error);
  }
};
