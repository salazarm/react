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
  getCurrentContext as getCurrentContextZone,
  track as trackZone,
  wrap as wrapZone,
} from './InteractionZone';

// TODO This package will likely want to override browser APIs (e.g. setTimeout, fetch)
// So that async callbacks are automatically wrapped with the current tracked event info.
// For the initial iteration, async callbacks must be explicitely wrapped with wrap().

export type MarkedEvent = {|
  eventName: string,
  nextMarkedEvent: MarkedEvent | null,
  timestamp: number,
|};

export type InteractionContext = {|
  eventName: string,
  firstMarkedEvent: MarkedEvent | null,
  lastMarkedEvent: MarkedEvent | null,
  timestamp: number,
|};

// Normally we would use the current renderer HostConfig's "now" method,
// But since interaction-tracking will be a separate package,
// I instead just copied the approach used by ReactScheduler.
let now;
if (typeof performance === 'object' && typeof performance.now === 'function') {
  const Performance = performance;
  now = function() {
    return Performance.now();
  };
} else {
  const localDate = Date;
  now = function() {
    return localDate.now();
  };
}

export function track(eventName: string, callback: Function): void {
  if (!__PROFILE__) {
    callback();
    return;
  }

  const context: InteractionContext = {
    eventName,
    firstMarkedEvent: null,
    lastMarkedEvent: null,
    timestamp: now(),
  };

  trackZone(context, callback);
}

export function addContext(eventName: string): void {
  if (!__PROFILE__) {
    return;
  }

  const context = ((getCurrentContextZone(): any): InteractionContext);

  if (__DEV__) {
    invariant(
      context !== null,
      'Context cannot be added outside of a tracked event.',
    );
  }

  const markedEvent: MarkedEvent = {
    eventName,
    nextMarkedEvent: null,
    timestamp: now(),
  };
  if (context.lastMarkedEvent !== null) {
    context.lastMarkedEvent.nextMarkedEvent = markedEvent;
    context.lastMarkedEvent = markedEvent;
  } else {
    context.firstMarkedEvent = context.lastMarkedEvent = markedEvent;
  }
}

export function wrap(callback: Function): Function {
  if (!__PROFILE__) {
    return callback;
  }

  return wrapZone(callback);
}

export function getCurrentContext(): InteractionContext | null {
  if (!__PROFILE__) {
    return null;
  } else {
    return getCurrentContextZone();
  }
}
