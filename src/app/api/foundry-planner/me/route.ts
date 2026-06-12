import { NextRequest } from "next/server";
import { getMyPlans } from "../store";

export const GET = async (request: NextRequest) => getMyPlans(request);
