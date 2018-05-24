/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import invariant from 'fbjs/lib/invariant';

// Exports ReactDOM.createRoot
export const enableUserTimingAPI = __DEV__;

// Experimental error-boundary API that can recover from errors within a single
// render phase
export const enableGetDerivedStateFromCatch = false;
// Suspense
export const enableSuspense = false;
// Helps identify side effects in begin-phase lifecycle hooks and setState reducers:
export const debugRenderPhaseSideEffects = false;

// In some cases, StrictMode should also double-render lifecycles.
// This can be confusing for tests though,
// And it can be bad for performance in production.
// This feature flag can be used to control the behavior:
export const debugRenderPhaseSideEffectsForStrictMode = __DEV__;

// To preserve the "Pause on caught exceptions" behavior of the debugger, we
// replay the begin phase of a failed component inside invokeGuardedCallback.
export const replayFailedUnitOfWorkWithInvokeGuardedCallback = __DEV__;

// Warn about deprecated, async-unsafe lifecycles; relates to RFC #6:
export const warnAboutDeprecatedLifecycles = false;

// Warn about legacy context API
export const warnAboutLegacyContextAPI = false;

// Gather advanced timing metrics for Profiler subtrees.
export const enableProfilerTimer = __DEV__;

// Fires getDerivedStateFromProps for state *or* props changes
export const fireGetDerivedStateFromPropsOnStateUpdates = true;

// Return a fragment from createPortal()
// This enables TestRenderer to consume portals from e.g. ReactDOM
export const convertPortalsToFragments = false;

// Only used in www builds.
export function addUserTimingListener() {
  invariant(false, 'Not implemented.');
}
