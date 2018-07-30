/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

 import type {ExecutionID, ZoneContext} from './InteractionZone';

 export type InteractionContextObserver {
   onContextScheduled: (
     context: ZoneContext,
     executionID: ExecutionID,
   ) => void;
   onContextStarted: (
     context: ZoneContext,
     executionID: ExecutionID,
   ) => void;
   onContextEnded: (
     context: ZoneContext,
     executionID: ExecutionID,
   ) => void;
 }

 const observers: Array<InteractionContextObserver> = []

export function registerInteractionContextObserver(
  observer: InteractionContextObserver,
): void {
  observers.push(observer);
}

export function __onWrappedContextScheduled(
  context:
): void {
  if (!observers.length) {
    return;
  }
  observers.forEach(observer => {
    observer.onContextScheduled()
  });
}

export function __onWrappedContextStarted() {
  if (!observers.length) {
    return;
  }
  observers.forEach(observer => {
    observer.onContextStarted();
  });
}

export function __onWrappedContextEnded() {
  if (!observers.length) {
    return;
  }
  observers.forEach(observer => {
    observer.onContextEnded();
  });
}
