/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ExpirationTime} from './ReactFiberExpirationTime';
import type {
  FiberRoot,
  Interactions,
  PendingInteractionMap,
} from './ReactFiberRoot';

import {getCurrentEvents} from 'interaction-tracking';
import {enableProfilerTimer} from 'shared/ReactFeatureFlags';

export function getInteractionsForExpirationTime(
  root: FiberRoot,
  committedExpirationTime: ExpirationTime,
  deleteFromMap: boolean,
): Interactions | null {
  if (!enableProfilerTimer) {
    return null;
  }

  const pendingInteractionMap = ((root.pendingInteractionMap: any): PendingInteractionMap);
  let interactions: Interactions | null = null;

  pendingInteractionMap.forEach((events, expirationTime) => {
    if (expirationTime <= committedExpirationTime) {
      if (interactions !== null) {
        events.forEach(event => {
          ((interactions: any): Interactions).add(event);
        });
      } else {
        interactions = new Set(events);
      }

      if (deleteFromMap) {
        pendingInteractionMap.delete(expirationTime);
      }
    }
  });

  return interactions;
}

export function recordInteractionsForExpirationTime(
  root: FiberRoot,
  expirationTime: ExpirationTime,
): void {
  if (!enableProfilerTimer) {
    return;
  }

  const pendingInteractionMap = ((root.pendingInteractionMap: any): PendingInteractionMap);
  const interactions = getCurrentEvents();
  if (interactions !== null) {
    if (pendingInteractionMap.has(expirationTime)) {
      // eslint-disable-next-line no-var
      const profilerSet = ((pendingInteractionMap.get(
        expirationTime,
      ): any): Interactions);
      interactions.forEach(interaction => profilerSet.add(interaction));
    } else {
      pendingInteractionMap.set(expirationTime, new Set(interactions));
    }
  }
}
