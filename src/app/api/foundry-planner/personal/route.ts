import { NextRequest } from "next/server";
import { getPersonalPlan, savePersonalPlan } from "../store";

export const GET = async (request: NextRequest) => {
  return getPersonalPlan(request);
};

export const POST = async (request: NextRequest) => {
  return savePersonalPlan(request);
};
