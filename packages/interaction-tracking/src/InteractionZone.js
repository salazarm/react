/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// This package could be rolled into InteractionTracker if that simplifies things.

import invariant from 'shared/invariant';
import {
  __onWrappedContextScheduled,
  __onWrappedContextStarting,
  __onWrappedContextEnded,
} from './InteractionContextEmitter';

export type ZoneContext = {
  children: Array<any>,
  id: number,
  name: string,
  timestamp: number,
};

export type SettableZoneContext = {
  __context: Array<ZoneContext>,
  __id: number,
}

let continuationContext: SettableZoneContext | null = null;
let currentContext: Array<ZoneContext> | null = null;
let isInContinuation: boolean = false;
let executionID: number = -1;

export function track(context: Array<ZoneContext>, callback: Function): void {
  if (!__PROFILE__) {
    callback();
    return;
  }

  const prevContext = currentContext;
  currentContext = context;
  const id = ++executionID;
  try {
    __onWrappedContextScheduled(currentContext, id);
    __onWrappedContextStarting(currentContext, id);
    callback();
  } finally {
    __onWrappedContextEnded(currentContext, id);
    currentContext = prevContext;
  }
}

export function wrap(callback: Function): Function {
  if (!__PROFILE__) {
    return callback;
  }

  if (currentContext === null) {
    return callback;
  }

  const wrappedContext = currentContext;
  const id = ++executionID;

  __onWrappedContextScheduled(wrappedContext, id);

  return (...args) => {
    const prevContext = currentContext;
    currentContext = wrappedContext;
    try {
      __onWrappedContextStarting(currentContext, id);
      callback(...args);
    } finally {
      __onWrappedContextEnded(currentContext, id);
      currentContext = prevContext;
    }
  };
}

/**
 * If you call this function then you are promising to call startContinuation
 * with the returned SettableZoneContext exactly once.
 */
export function getSettableContext(): SettableZoneContext | null {
  if (!__PROFILE__) {
    return null;
  }
  const context = isInContinuation ? continuationContext : currentContext;
  const id = ++executionID;
  __onWrappedContextScheduled(context, id);
  return ({
    __context: context,
    __id: id,
    __startCount: 0,
  });
}

export function startContinuation(context: SettableZoneContext): void {
  if (!__PROFILE__) {
    return;
  }
  invariant(
    !isInContinuation,
    'Cannot start a continuation when one is already active.',
  );
  continuationContext = context;
  isInContinuation = true;
  invariant(
    context.__startCount === 0,
    'Cannot start a SettableContext more than once',
  );
  context.__startCount++;
  __onWrappedContextStarting(context.__context, context.__id);
}

export function stopContinuation(): void {
  if (!__PROFILE__) {
    return;
  }
  invariant(
    isInContinuation,
    'Cannot stop a continuation when none is active.',
  );
  __onWrappedContextEnded(
    continuationContext.__context,
    continuationContext.__id
  );
  continuationContext = null;
  isInContinuation = false;
}


export function getCurrentContext(): ZoneContext | null {
  if (!__PROFILE__) {
    return null;
  } else {
    return isInContinuation ? continuationContext : currentContext;
  }
}
