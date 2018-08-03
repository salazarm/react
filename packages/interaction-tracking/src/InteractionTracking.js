/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import invariant from 'shared/invariant';
import {
  __onInteractionsScheduled,
  __onInteractionsStarting,
  __onInteractionsEnded,
} from './InteractionEmitter';

export {registerInteractionObserver} from './InteractionEmitter';

type Interactions = Array<Interaction>;

export type Interaction = {|
  id: number,
  name: string,
  timestamp: number,
|};

export type Continuation = {
  __hasBeenRun: boolean,
  __id: number,
  __interactions: Interactions,
};

// Normally we would use the current renderer HostConfig's "now" method,
// But since interaction-tracking will be a separate package,
// I instead just copied the approach used by ReactScheduler.
let now;
if (typeof performance === 'object' && typeof performance.now === 'function') {
  const localPerformance = performance;
  now = () => localPerformance.now();
} else {
  const localDate = Date;
  now = () => localDate.now();
}

let currentContinuation: Continuation | null = null;
let currentInteractions: Interactions | null = null;
let globalExecutionID: number = 0;
let globalInteractionID: number = 0;

export function getCurrent(): Interactions | null {
  if (!__PROFILE__) {
    return null;
  } else {
    return currentContinuation !== null
      ? currentContinuation.__interactions
      : currentInteractions;
  }
}

export function reserveContinuation(): Continuation | null {
  if (!__PROFILE__) {
    return null;
  }

  if (currentContinuation !== null) {
    const executionID = globalExecutionID++;

    __onInteractionsScheduled(currentContinuation.__interactions, executionID);

    return {
      __hasBeenRun: false,
      __id: executionID,
      __interactions: currentContinuation.__interactions,
    };
  } else if (currentInteractions !== null) {
    const executionID = globalExecutionID++;

    __onInteractionsScheduled(currentInteractions, executionID);

    return {
      __hasBeenRun: false,
      __id: executionID,
      __interactions: currentInteractions,
    };
  } else {
    return null;
  }
}

export function startContinuation(continuation: Continuation | null): void {
  if (!__PROFILE__) {
    return;
  }

  invariant(
    currentContinuation === null,
    'Cannot start a continuation when one is already active.',
  );

  if (continuation === null) {
    return;
  }

  invariant(
    !continuation.__hasBeenRun,
    'A continuation can only be started once',
  );

  continuation.__hasBeenRun = true;
  currentContinuation = continuation;

  __onInteractionsStarting(continuation.__interactions, continuation.__id);
}

export function stopContinuation(continuation: Continuation): void {
  if (!__PROFILE__) {
    return;
  }

  invariant(
    currentContinuation === continuation,
    'Cannot stop a continuation that is not active.',
  );

  if (continuation === null) {
    return;
  }

  __onInteractionsEnded(continuation.__interactions, continuation.__id);

  currentContinuation = null;
}

// TODO How should track() behave if a continuation is active?
// getCurrent() won't reflect the "tracked" value since continuations always mask interactions.
// Should we not support calling track() when a continuation is active?
// Should we change the way continuations work, to not mask interactions?
export function track(name: string, callback: Function): void {
  if (!__PROFILE__) {
    callback();
    return;
  }

  const interaction: Interaction = {
    id: globalInteractionID++,
    name,
    timestamp: now(),
  };

  // Tracked interactions should stack.
  // To do that, create a new zone with a concatenated (cloned) array.
  let interactions: Interactions | null = currentInteractions;
  if (interactions === null) {
    interactions = [interaction];
  } else {
    interactions = interactions.concat(interaction);
  }

  const executionID = globalExecutionID++;
  const prevInteractions = currentInteractions;
  currentInteractions = interactions;

  try {
    __onInteractionsScheduled(currentInteractions, executionID);
    __onInteractionsStarting(currentInteractions, executionID);

    callback();
  } finally {
    __onInteractionsEnded(currentInteractions, executionID);

    currentInteractions = prevInteractions;
  }
}

export function wrap(callback: Function): Function {
  if (!__PROFILE__) {
    return callback;
  }

  if (currentContinuation === null && currentInteractions === null) {
    return callback;
  }

  const executionID = globalExecutionID++;
  const wrappedInteractions =
    currentContinuation !== null
      ? ((currentContinuation.__interactions: any): Interactions)
      : ((currentInteractions: any): Interactions);

  __onInteractionsScheduled(wrappedInteractions, executionID);

  return (...args) => {
    const prevInteractions = currentInteractions;
    currentInteractions = wrappedInteractions;

    try {
      __onInteractionsStarting(currentInteractions, executionID);

      callback(...args);
    } finally {
      __onInteractionsEnded(currentInteractions, executionID);

      currentInteractions = prevInteractions;
    }
  };
}
