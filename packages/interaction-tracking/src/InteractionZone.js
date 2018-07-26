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
let isInContinuation: boolean = false;

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
