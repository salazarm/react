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

import {createCursor, push, pop} from './ReactFiberStack';

let profilerStateNodeCursor: StackCursor<ProfilerStateNode | null> = createCursor(
  null,
);

export function getProfilerStateNode(): ProfilerStateNode | null {
  return profilerStateNodeCursor.current;
}

export function pushProfilerStateNode(
  fiber: Fiber,
  profilerStateNode: ProfilerStateNode,
): void {
  push(profilerStateNodeCursor, profilerStateNode, fiber);
}

export function popProfilerStateNode(fiber: Fiber): void {
  pop(profilerStateNodeCursor, fiber);
}
