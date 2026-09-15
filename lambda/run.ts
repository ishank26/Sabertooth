import {
  getHandler,
  getLftStatsLambda,
  getLftStatsLambdaDev,
  getLftReconcilePaymentsLambda,
  getLftReconcilePaymentsLambdaDev,
} from "./index";
import fetch from "node-fetch";
import { LogUtil } from "./utils/log";
import { buildDi, IDI } from "./utils/di";

// Sabertooth is subscription-free by default. Deployments that intentionally
// want upstream Liftosaur entitlement behavior can override this with
// LFT_REQUIRE_SUBSCRIPTION=true.
if (process.env.LFT_REQUIRE_SUBSCRIPTION == null) {
  process.env.LFT_REQUIRE_SUBSCRIPTION = "false";
}

// Keep raw library/test behavior upstream-compatible while advertising the
// Sabertooth identity from the deployed fork entrypoint.
if (process.env.SABERTOOTH_MCP_SERVER_NAME == null && process.env.MCP_SERVER_NAME == null) {
  process.env.SABERTOOTH_MCP_SERVER_NAME = "sabertooth-mcp";
}

const diBuilder = (): IDI => buildDi(new LogUtil(), fetch);

export const handler = getHandler(diBuilder);

export const LftStatsLambdaDev = getLftStatsLambdaDev(diBuilder);
export const LftStatsLambda = getLftStatsLambda(diBuilder);

export const LftReconcilePaymentsLambdaDev = getLftReconcilePaymentsLambdaDev(diBuilder);
export const LftReconcilePaymentsLambda = getLftReconcilePaymentsLambda(diBuilder);
