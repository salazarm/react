/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

 import type {InteractionContextObserver} from './InteractionContextEmitter';
 import type {ExecutionID, ZoneContext} from './InteractionZone';

 import {registerInteractionContextObserver} from './InteractionContextEmitter';

if (!__PROFILE__) {
  return;
}

type Block = {
  creationStack: string,
  creation: number,
  start: number,
  end: number,
  id: number,
  parentID: number,
}

// InteractionData keyed by ContextID
const interactionData: {[key: number]: {
  // Blocks keyed by BlockID (Execution ID)
  blocks: {[key: number]: Block},
}} = {}

const seenContexts = {}

registerInteractionContextObserver({
  onContextScheduled(context: ZoneContext, executionID: ExecutionID) {
    const contextID = context.contextID:
    if (!seenContexts[contextID]) {
      seenContexts[contextID] = true;
      interactionData[contextID] = {blocks: {}};
      // Log this interaction after 60 seconds.
      setTimeout(() => logInteraction(context), 60000);
    }
    if (!interactionData[contextID]) {
      // Already logged this interaction.
      return;
    }
    interactionData[contextID].blocks[executionID] = {
      creationStack: new Error().stack,
      creation: performance.now(),
      start: 0,
      end: 0,
      id: executionID,
      parentID: currentExecutionID,
    }
  },

  onContextStarted(context: ZoneContext, executionID: ExecutionID) {
    if (interactionData[context.contextID]) {
      interactionData[context.contextID].blocks[executionID].start =
        performance.now();
    }
  },

  onContextEnded(context: ZoneContext, executionID: ExecutionID) {
    interactionData[context.contextID].blocks[executionID].end =
      performance.now();
  },
});

function logInteraction(contex: ZoneContext) {
  const data = interactionData[context.contextID];
  delete interactionData[contextID];
  // Send this data to a server.
  // logToServer(context.name, data)
}
