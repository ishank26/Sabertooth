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

const diBuilder = (): IDI => buildDi(new LogUtil(), fetch);

export const handler = getHandler(diBuilder);

export const LftStatsLambdaDev = getLftStatsLambdaDev(diBuilder);
export const LftStatsLambda = getLftStatsLambda(diBuilder);

export const LftReconcilePaymentsLambdaDev = getLftReconcilePaymentsLambdaDev(diBuilder);
export const LftReconcilePaymentsLambda = getLftReconcilePaymentsLambda(diBuilder);
