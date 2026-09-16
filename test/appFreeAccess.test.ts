import "mocha";
import { expect } from "chai";
import { ISubscription } from "../src/types";
import { AppAccessPolicy_hasFullAccess, AppAccessPolicy_requiresSubscription } from "../src/utils/appAccessPolicy";
import { SubscriptionPlan_derive } from "../src/utils/subscriptionPlan";
import { Subscriptions_hasSubscription } from "../src/utils/subscriptions";

type IPolicyGlobal = typeof globalThis & {
  __LFT_REQUIRE_SUBSCRIPTION__?: boolean;
};

function emptySubscription(): ISubscription {
  return { apple: [], google: [] };
}

describe("Sabertooth client free access", () => {
  const policyGlobal = globalThis as IPolicyGlobal;
  let previous: boolean | undefined;

  beforeEach(() => {
    previous = policyGlobal.__LFT_REQUIRE_SUBSCRIPTION__;
    delete policyGlobal.__LFT_REQUIRE_SUBSCRIPTION__;
  });

  afterEach(() => {
    if (previous === undefined) {
      delete policyGlobal.__LFT_REQUIRE_SUBSCRIPTION__;
    } else {
      policyGlobal.__LFT_REQUIRE_SUBSCRIPTION__ = previous;
    }
  });

  it("defaults the client to full access without a subscription", () => {
    expect(AppAccessPolicy_requiresSubscription()).to.equal(false);
    expect(AppAccessPolicy_hasFullAccess()).to.equal(true);
    expect(Subscriptions_hasSubscription(emptySubscription())).to.equal(true);
  });

  it("derives the free-access plan without store receipts", () => {
    expect(
      SubscriptionPlan_derive({
        subscription: emptySubscription(),
        status: [],
        isNative: true,
        isIos: true,
      })
    ).to.deep.equal({ state: "freeaccess" });
  });

  it("can restore Liftosaur-compatible entitlement gating explicitly", () => {
    policyGlobal.__LFT_REQUIRE_SUBSCRIPTION__ = true;

    expect(AppAccessPolicy_requiresSubscription()).to.equal(true);
    expect(AppAccessPolicy_hasFullAccess()).to.equal(false);
    expect(Subscriptions_hasSubscription(emptySubscription())).to.equal(false);
    expect(
      SubscriptionPlan_derive({
        subscription: emptySubscription(),
        status: [],
        isNative: false,
      })
    ).to.deep.equal({ state: "none" });
  });
});
