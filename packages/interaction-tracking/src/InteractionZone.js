/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// This package could be rolled into InteractionTracker if that simplifies things.

type ZoneContext = any;

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

export function getCurrentContext(): ZoneContext | null {
  if (!__PROFILE__) {
    return null;
  } else {
    return currentContext;
  }
}
