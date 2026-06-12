import { MongoClient, type Collection, type Document } from "mongodb";
import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

type FoundryPlanDoc = {
  id: string;
  creatorUserId?: unknown;
  payload: string;
  access: "editable" | "view-only";
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
};

let envFileValues: Record<string, string> | null = null;

const readEnvFileValues = () => {
  if (envFileValues) {
    return envFileValues;
  }

  envFileValues = {};
  const candidates = [
    process.cwd(),
    path.resolve(process.cwd(), ".."),
    path.resolve(process.cwd(), "..", ".."),
  ].flatMap((dir) => [path.join(dir, ".env.local"), path.join(dir, ".env.production"), path.join(dir, ".env")]);

  for (const filePath of candidates) {
    if (!fs.existsSync(filePath)) {
      continue;
    }
    const content = fs.readFileSync(filePath, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
        continue;
      }
      const [key, ...rest] = trimmed.split("=");
      const value = rest.join("=").trim().replace(/^['"]|['"]$/g, "");
      if (key && !(key in envFileValues)) {
        envFileValues[key.trim()] = value;
      }
    }
  }

  return envFileValues;
};

const envValue = (...names: string[]) => {
  const fromProcess = names.map((name) => process.env[name]).find((value) => value && value.trim());
  if (fromProcess) {
    return fromProcess;
  }
  const fromFile = readEnvFileValues();
  return names.map((name) => fromFile[name]).find((value) => value && value.trim()) || "";
};

const mongoUri = envValue("MONGODB_URI", "MONGO_URI", "MONGO_URI_FALLBACK");
const mongoDbName = envValue("MONGODB_DB", "MONGO_DB", "MONGO_DB_NAME", "MONGO_DB_WOS") || "wosbot";
const backendCandidates = [
  envValue("BACKEND_URL"),
  envValue("NEXT_PUBLIC_API_BASE_URL"),
  "http://140.245.201.209:3001",
]
  .map((value) => value.trim().replace(/\/+$/, ""))
  .filter(Boolean);

declare global {
  var foundryPlannerMongoClient: MongoClient | undefined;
}

const collection = async (): Promise<Collection<FoundryPlanDoc>> => {
  if (!mongoUri) {
    throw new Error("Storage is not configured");
  }
  if (!globalThis.foundryPlannerMongoClient) {
    globalThis.foundryPlannerMongoClient = new MongoClient(mongoUri);
  }
  await globalThis.foundryPlannerMongoClient.connect();
  return globalThis.foundryPlannerMongoClient.db(mongoDbName).collection<FoundryPlanDoc>("foundry_plans");
};

export const proxyToBackend = async (request: NextRequest, path = "") => {
  const sourceUrl = new URL(request.url);
  const backendBase = Array.from(new Set(backendCandidates)).find((candidate) => {
    try {
      return new URL(candidate).origin !== sourceUrl.origin;
    } catch {
      return false;
    }
  });

  if (!backendBase) {
    throw new Error("Backend storage is not configured");
  }

  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  const userId = request.headers.get("x-user-id");
  const cookie = request.headers.get("cookie");
  if (contentType) {
    headers.set("content-type", contentType);
  }
  if (userId) {
    headers.set("x-user-id", userId);
  }
  if (cookie) {
    headers.set("cookie", cookie);
  }
  headers.set("accept", "application/json");

  const target = `${backendBase}/api/foundry-planner${path}${sourceUrl.search}`;
  const body = request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer();
  const response = await fetch(target, {
    method: request.method,
    headers,
    body,
    cache: "no-store",
  });
  const responseBody = await response.arrayBuffer();
  return new NextResponse(responseBody, {
    status: response.status,
    statusText: response.statusText,
    headers: {
      "content-type": response.headers.get("content-type") || "application/json",
    },
  });
};

const storageError = (error: unknown) =>
  NextResponse.json({ error: error instanceof Error ? error.message : "Storage failed" }, { status: 503 });

export const getPlan = async (request: NextRequest, id: string) => {
  try {
    if (!mongoUri) {
      return proxyToBackend(request, `/${encodeURIComponent(id)}`);
    }
    const col = await collection();
    const doc = await col.findOne({ id });
    if (!doc || !doc.isActive) {
      return NextResponse.json({ error: "Foundry plan not found or no longer active" }, { status: 404 });
    }
    const { _id, creatorUserId, ...publicDoc } = doc as any;
    return NextResponse.json({ plan: publicDoc });
  } catch (error) {
    return storageError(error);
  }
};

export const createPlan = async (request: NextRequest) => {
  try {
    if (!mongoUri) {
      return proxyToBackend(request);
    }
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Sign in to share foundry plans" }, { status: 401 });
    }

    const body = await request.json();
    const { payload, access } = body;
    if (typeof payload !== "string" || !payload) {
      return NextResponse.json({ error: "Missing plan payload" }, { status: 400 });
    }

    const col = await collection();
    const now = new Date();
    const nanoid = crypto.randomUUID().replace(/-/g, "").slice(0, 10);

    const doc: FoundryPlanDoc = {
      id: nanoid,
      creatorUserId: userId, // Simplification; frontend stores as string
      payload,
      access: access === "view-only" ? "view-only" : "editable",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    await col.insertOne(doc as any);
    const { _id, creatorUserId, ...publicDoc } = doc as any;
    return NextResponse.json({ plan: publicDoc }, { status: 201 });
  } catch (error) {
    return storageError(error);
  }
};

export const updatePlan = async (request: NextRequest, id: string) => {
  try {
    if (!mongoUri) {
      return proxyToBackend(request, `/${encodeURIComponent(id)}`);
    }
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Sign in to update foundry plans" }, { status: 401 });
    }

    const col = await collection();
    const doc = await col.findOne({ id });
    if (!doc) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    if (String(doc.creatorUserId) !== String(userId)) {
      return NextResponse.json({ error: "You can only edit your own plans" }, { status: 403 });
    }

    const body = await request.json();
    const updates: Partial<FoundryPlanDoc> = { updatedAt: new Date() };
    if (body.access === "view-only" || body.access === "editable") {
      updates.access = body.access;
    }
    if (typeof body.isActive === "boolean") {
      updates.isActive = body.isActive;
    }

    await col.updateOne({ id }, { $set: updates });
    const updated = await col.findOne({ id });
    const { _id, creatorUserId, ...publicDoc } = (updated || doc) as any;
    return NextResponse.json({ plan: publicDoc });
  } catch (error) {
    return storageError(error);
  }
};

export const deletePlan = async (request: NextRequest, id: string) => {
  try {
    if (!mongoUri) {
      return proxyToBackend(request, `/${encodeURIComponent(id)}`);
    }
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Sign in to delete foundry plans" }, { status: 401 });
    }

    const col = await collection();
    const doc = await col.findOne({ id });
    if (!doc) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    if (String(doc.creatorUserId) !== String(userId)) {
      return NextResponse.json({ error: "You can only delete your own plans" }, { status: 403 });
    }

    await col.deleteOne({ id });
    return NextResponse.json({ deleted: true });
  } catch (error) {
    return storageError(error);
  }
};

export const getMyPlans = async (request: NextRequest) => {
  try {
    if (!mongoUri) {
      return proxyToBackend(request, "/me");
    }
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ plans: [] });
    }

    const col = await collection();
    const docs = await col.find({ creatorUserId: userId }).sort({ createdAt: -1 }).toArray();
    return NextResponse.json({
      plans: docs.map((doc) => {
        const { _id, creatorUserId, ...publicDoc } = doc as any;
        return publicDoc;
      }),
    });
  } catch (error) {
    return storageError(error);
  }
};
