/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber, ProfilerStateNode} from './ReactFiber';
import type {StackCursor} from './ReactFiberStack';

import {enableProfilerTimer} from 'shared/ReactFeatureFlags';
import {createCursor, push, pop} from './ReactFiberStack';

// The Profiler's stateNode is used to associate tracked interactions,
// With React renders and their subsequent commits.
// This stack is used for class components with commit phase lifecycles,
// So that cascading updates can also be associated with the original events.
// This stack is only used for profiling builds.
let profilerStateNodeCursor: StackCursor<ProfilerStateNode | null> = createCursor(
  null,
);

export function getProfilerStateNode(): ProfilerStateNode | null {
  if (!enableProfilerTimer) {
    return null;
  }
  return profilerStateNodeCursor.current;
}

export function pushProfilerStateNode(
  fiber: Fiber,
  profilerStateNode: ProfilerStateNode,
): void {
  if (!enableProfilerTimer) {
    return;
  }
  push(profilerStateNodeCursor, profilerStateNode, fiber);
}

export function popProfilerStateNode(fiber: Fiber): void {
  if (!enableProfilerTimer) {
    return;
  }
  pop(profilerStateNodeCursor, fiber);
}
