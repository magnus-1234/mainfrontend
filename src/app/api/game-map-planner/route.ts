import { NextRequest } from "next/server";
import { createPlan } from "./store";

export const POST = async (request: NextRequest) => createPlan(request);
