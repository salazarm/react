/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

 import type {ExecutionID, ZoneContext} from './InteractionZone';

 export type InteractionContextObserver = {
   onContextScheduled: (
     contexts: Array<ZoneContext>,
     executionID: ExecutionID,
   ) => void;
   onContextStarting: (
     contexts: Array<ZoneContext>,
     executionID: ExecutionID,
   ) => void;
   onContextEnded: (
     contexts: Array<ZoneContext>,
     executionID: ExecutionID,
   ) => void;
 }

const observers: Array<InteractionContextObserver> = [];

export function registerInteractionContextObserver(
  observer: InteractionContextObserver,
): void {
  observers.push(observer);
}

export function __onWrappedContextScheduled(
  contexts: Array<ZoneContext>,
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
  contexts: Array<ZoneContext>,
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
  contexts: Array<ZoneContext>,
  executionID: number,
) {
  if (!observers.length) {
    return;
  }
  observers.forEach(observer => {
    observer.onContextEnded(contexts, executionID);
  });
}
