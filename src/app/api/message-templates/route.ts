import { NextRequest } from "next/server";
import { createTemplate, listTemplates } from "./store";

export const GET = (request: NextRequest) => listTemplates(request);
export const POST = (request: NextRequest) => createTemplate(request);
