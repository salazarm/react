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
  __onWrappedContextStarted,
  __onWrappedContextEnded,
} from './InteractionContextEmitter';

export type ZoneContext = {
  contextName: string,
  contextID: number,
};
export type ExecutionID = number;

let continuationContext: ZoneContext | null = null;
let currentContext: ZoneContext | null = null;
let isInContinuation: boolean = false;
let executionID: ExecutionID = 0;
let idCounter: number = 0;

export function track(contextName: string, callback: Function): void {
  if (!__PROFILE__) {
    callback();
    return;
  }

  const context = {
    name: contextName,
    contextID: idCounter++,
  };

  const prevContext = currentContext;
  currentContext = context;
  try {
    __onWrappedContextScheduled(currentContext, ++executionID);
    __onWrappedContextStarted(currentContext, executionID);
    callback();
  } finally {
    __onWrappedContextEnded(currentContext, executionID);
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
      __onWrappedContextStarted(currentContext, id)
      callback(...args);
    } finally {
      __onWrappedContextEnded(currentContext, id);
      currentContext = prevContext;
    }
  };
}

export function startContinuation(context: ZoneContext | null): void {
  if (!__PROFILE__) {
    return;
  }
  invariant(
    !isInContinuation,
    'Cannot start a continuation when one is already active.',
  );
  continuationContext = context;
  isInContinuation = true;
}

export function stopContinuation(): void {
  if (!__PROFILE__) {
    return;
  }
  invariant(
    isInContinuation,
    'Cannot stop a continuation when none is active.',
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
