type IAppAccessPolicyGlobal = typeof globalThis & {
  __LFT_REQUIRE_SUBSCRIPTION__?: boolean;
};

/**
 * Client-side entitlement policy for Sabertooth.
 *
 * Sabertooth is subscription-free by default. A deployment or test can opt
 * back into Liftosaur-compatible client gating by setting the runtime global
 * `__LFT_REQUIRE_SUBSCRIPTION__ = true` before entitlement checks run.
 *
 * This policy controls only client feature/paywall behavior. Authentication and
 * server-side authorization are handled separately by the backend access policy.
 */
export function AppAccessPolicy_requiresSubscription(): boolean {
  const configured = (globalThis as IAppAccessPolicyGlobal).__LFT_REQUIRE_SUBSCRIPTION__;
  return configured === true;
}

export function AppAccessPolicy_hasFullAccess(): boolean {
  return !AppAccessPolicy_requiresSubscription();
}
