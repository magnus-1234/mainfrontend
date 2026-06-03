import { ApiReference } from "@scalar/nextjs-api-reference";

export const GET = ApiReference({
  pageTitle: "Whiteout Survival API Documentation | WhiteoutSurvival.dev",
  url: "/api-docs/openapi.json",
  theme: "moon",
  layout: "modern",
  defaultHttpClient: {
    targetKey: "shell",
    clientKey: "curl",
  },
});
