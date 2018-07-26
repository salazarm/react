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

type ZoneContext = any;

let continuationContext: ZoneContext | null = null;
let currentContext: ZoneContext | null = null;

export function track(context: ZoneContext, callback: Function): void {
  if (!__PROFILE__) {
    callback();
    return;
  }

  const prevContext = currentContext;
  currentContext = context;
  try {
    callback();
  } finally {
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

  return (...args) => {
    const prevContext = currentContext;
    currentContext = wrappedContext;
    try {
      callback(...args);
    } finally {
      currentContext = prevContext;
    }
  };
}

export function startContinuation(context: ZoneContext): void {
  if (!__PROFILE__) {
    return;
  }
  if (__DEV__) {
    invariant(
      continuationContext === null,
      'Cannot start a continuation when one is already active.',
    );
  }
  continuationContext = context;
}

export function stopContinuation(): void {
  if (!__PROFILE__) {
    return;
  }
  if (__DEV__) {
    invariant(
      continuationContext !== null,
      'Cannot stop a continuation when none is active.',
    );
  }
  continuationContext = null;
}

export function getCurrentContext(): ZoneContext | null {
  if (!__PROFILE__) {
    return null;
  } else {
    return continuationContext !== null ? continuationContext : currentContext;
  }
}
