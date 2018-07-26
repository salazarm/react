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
  getCurrentContext as getZoneCurrentContext,
  startContinuation as startZoneContinuation,
  stopContinuation as stopZoneContinuation,
  track as trackZone,
  wrap as wrapZone,
} from './InteractionZone';

// TODO This package will likely want to override browser APIs (e.g. setTimeout, fetch)
// So that async callbacks are automatically wrapped with the current tracked event info.
// For the initial iteration, async callbacks must be explicitely wrapped with wrap().

type Interactions = Array<Interaction>;

export type Interaction = {|
  children: Interactions | null,
  name: string,
  timestamp: number,
|};

// Normally we would use the current renderer HostConfig's "now" method,
// But since interaction-tracking will be a separate package,
// I instead just copied the approach used by ReactScheduler.
let now;
if (typeof performance === 'object' && typeof performance.now === 'function') {
  const localPerformance = performance;
  now = function() {
    return localPerformance.now();
  };
} else {
  const localDate = Date;
  now = function() {
    return localDate.now();
  };
}

export function startContinuation(interactions: Interactions | null): void {
  startZoneContinuation(interactions);
}

export function stopContinuation(): void {
  stopZoneContinuation();
}

export function track(name: string, callback: Function): void {
  if (!__PROFILE__) {
    callback();
    return;
  }

  const interaction: Interaction = {
    children: null,
    name,
    timestamp: now(),
  };

  // Tracked interactions should stack.
  // To do that, create a new zone with a concatenated (cloned) array.
  let interactions: Interactions | null = getZoneCurrentContext();
  if (interactions === null) {
    interactions = [interaction];
  } else {
    interactions = interactions.concat(interaction);
  }

  trackZone(interactions, callback);
}

export function addContext(name: string): void {
  if (!__PROFILE__) {
    return;
  }

  const interactions: Interactions | null = getZoneCurrentContext();
  invariant(
    interactions !== null && interactions.length > 0,
    'Context cannot be added outside of a tracked event.',
  );

  const context: Interaction = {
    children: null,
    name,
    timestamp: now(),
  };

  const interaction: Interaction = ((interactions: any): Interactions)[
    ((interactions: any): Interactions).length - 1
  ];
  if (interaction.children === null) {
    interaction.children = [context];
  } else {
    interaction.children.push(context);
  }
}

export function wrap(callback: Function): Function {
  if (!__PROFILE__) {
    return callback;
  }

  return wrapZone(callback);
}

export function getCurrentEvents(): Interactions | null {
  if (!__PROFILE__) {
    return null;
  } else {
    return getZoneCurrentContext();
  }
}
