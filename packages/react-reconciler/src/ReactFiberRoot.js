/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from './ReactFiber';
import type {ExpirationTime} from './ReactFiberExpirationTime';
import type {TimeoutHandle, NoTimeout} from './ReactFiberHostConfig';
import type {Interaction} from 'interaction-tracking/src/InteractionTracking';

import {getCurrentEvents} from 'interaction-tracking';
import {noTimeout} from './ReactFiberHostConfig';
import {isDevToolsPresent} from './ReactFiberDevToolsHook';
import {createHostRootFiber} from './ReactFiber';
import {NoWork} from './ReactFiberExpirationTime';
import {
  requestCurrentTime,
  computeExpirationForFiber,
} from './ReactFiberScheduler';
import {enableProfilerTimer} from 'shared/ReactFeatureFlags';

// TODO: This should be lifted into the renderer.
export type Batch = {
  _defer: boolean,
  _expirationTime: ExpirationTime,
  _onComplete: () => mixed,
  _next: Batch | null,
};

export type CommittedInteractions = Set<Interaction>;
export type PendingInteractionMap = Map<ExpirationTime, Set<Interaction>>;

export type FiberRoot = {
  // Any additional information from the host associated with this root.
  containerInfo: any,
  // Used only by persistent updates.
  pendingChildren: any,
  // The currently active root fiber. This is the mutable root of the tree.
  current: Fiber,

  // The following priority levels are used to distinguish between 1)
  // uncommitted work, 2) uncommitted work that is suspended, and 3) uncommitted
  // work that may be unsuspended. We choose not to track each individual
  // pending level, trading granularity for performance.
  //
  // The earliest and latest priority levels that are suspended from committing.
  earliestSuspendedTime: ExpirationTime,
  latestSuspendedTime: ExpirationTime,
  // The earliest and latest priority levels that are not known to be suspended.
  earliestPendingTime: ExpirationTime,
  latestPendingTime: ExpirationTime,
  // The latest priority level that was pinged by a resolved promise and can
  // be retried.
  latestPingedTime: ExpirationTime,

  // If an error is thrown, and there are no more updates in the queue, we try
  // rendering from the root one more time, synchronously, before handling
  // the error.
  didError: boolean,

  pendingCommitExpirationTime: ExpirationTime,
  // A finished work-in-progress HostRoot that's ready to be committed.
  finishedWork: Fiber | null,
  // Timeout handle returned by setTimeout. Used to cancel a pending timeout, if
  // it's superseded by a new one.
  timeoutHandle: TimeoutHandle | NoTimeout,
  // Top context object, used by renderSubtreeIntoContainer
  context: Object | null,
  pendingContext: Object | null,
  // Determines if we should attempt to hydrate on the initial mount
  +hydrate: boolean,
  // Remaining expiration time on this root.
  // TODO: Lift this into the renderer
  nextExpirationTimeToWorkOn: ExpirationTime,
  expirationTime: ExpirationTime,
  // List of top-level batches. This list indicates whether a commit should be
  // deferred. Also contains completion callbacks.
  // TODO: Lift this into the renderer
  firstBatch: Batch | null,
  // Linked-list of roots
  nextScheduledRoot: FiberRoot | null,

  // The HostRoot's stateNode is only used by profiling builds (i.e. when enableProfilerTimer is true),
  // And only when the React DevTools are detected (i.e. isDevToolsPresent is true).
  // Interaction metadata is stored on the stateNode in this case so that DevTools can record it during commit.
  committedInteractions?: CommittedInteractions,
  pendingInteractionMap?: PendingInteractionMap,
};

export function createFiberRoot(
  containerInfo: any,
  isAsync: boolean,
  hydrate: boolean,
): FiberRoot {
  // Cyclic construction. This cheats the type system right now because
  // stateNode is any.
  const uninitializedFiber = createHostRootFiber(isAsync);
  const root = {
    current: uninitializedFiber,
    containerInfo: containerInfo,
    pendingChildren: null,

    earliestPendingTime: NoWork,
    latestPendingTime: NoWork,
    earliestSuspendedTime: NoWork,
    latestSuspendedTime: NoWork,
    latestPingedTime: NoWork,

    didError: false,

    pendingCommitExpirationTime: NoWork,
    finishedWork: null,
    timeoutHandle: noTimeout,
    context: null,
    pendingContext: null,
    hydrate,
    nextExpirationTimeToWorkOn: NoWork,
    expirationTime: NoWork,
    firstBatch: null,
    nextScheduledRoot: null,
  };

  if (enableProfilerTimer) {
    if (isDevToolsPresent) {
      const currentTime = requestCurrentTime();
      const expirationTime = computeExpirationForFiber(
        currentTime,
        uninitializedFiber,
      );

      // Store interactions on the root fiber if DevTools are present.
      // This enables DevTools to record interactions for each commit batch,
      // For the entire tree.
      const pendingInteractionMap = new Map();

      // Map of expiration time to interaction events.
      // Populated when state updates are enqueued during a tracked interaction.
      ((root: any): FiberRoot).committedInteractions = new Set();
      ((root: any): FiberRoot).pendingInteractionMap = pendingInteractionMap;

      // If we are currently tracking an interaction, register it with the HostRoot.
      // This covers root renderers (e.g. ReactDOM.render(...)) for the initial mount.
      const interactions = getCurrentEvents();
      if (interactions !== null) {
        pendingInteractionMap.set(expirationTime, new Set(interactions));
      }
    }
  }

  uninitializedFiber.stateNode = root;
  return root;
}
