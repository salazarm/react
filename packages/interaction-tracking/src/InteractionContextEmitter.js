/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

 import type {Interaction} from './InteractionTracking';

 export type InteractionContextObserver = {
   onContextScheduled: (
     contexts: $ReadOnly<Array<$ReadOnly<Interaction>>>,
     executionID: number,
   ) => void;
   onContextStarting: (
     contexts: $ReadOnly<Array<$ReadOnly<Interaction>>>,
     executionID: number,
   ) => void;
   onContextEnded: (
     contexts: $ReadOnly<Array<$ReadOnly<Interaction>>>,
     executionID: number,
   ) => void;
 }

const observers: Array<InteractionContextObserver> = [];

export function registerInteractionContextObserver(
  observer: InteractionContextObserver,
): void {
  observers.push(observer);
}

export function __onWrappedContextScheduled(
  contexts: $ReadOnly<Array<$ReadOnly<Interaction>>>,
  executionID: number,
): void {
  if (!observers.length) {
    return;
  }
  observers.forEach(observer => {
    observer.onContextScheduled(contexts, executionID);
  });
}

export function __onWrappedContextStarting(
  contexts: $ReadOnly<Array<$ReadOnly<Interaction>>>,
  executionID: number,
) {
  if (!observers.length) {
    return;
  }
  observers.forEach(observer => {
    observer.onContextStarting(contexts, executionID);
  });
}

export function __onWrappedContextEnded(
  contexts: $ReadOnly<Array<$ReadOnly<Interaction>>>,
  executionID: number,
) {
  if (!observers.length) {
    return;
  }
  observers.forEach(observer => {
    observer.onContextEnded(contexts, executionID);
  });
}
