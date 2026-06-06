import { NextRequest } from "next/server";
import { proxyAdminRequest } from "../proxy";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  return proxyAdminRequest(request, "track");
}
