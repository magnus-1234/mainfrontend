import { NextRequest } from "next/server";
import { getPlan, updatePlan, deletePlan } from "../store";

export const GET = async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  return getPlan(request, id);
};

export const PATCH = async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  return updatePlan(request, id);
};

export const DELETE = async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  return deletePlan(request, id);
};
