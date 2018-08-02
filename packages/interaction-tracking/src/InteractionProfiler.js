/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

 import type {Interaction} from './InteractionTracking';

 import {registerInteractionContextObserver} from './InteractionTracking';

if (!__PROFILE__) {
  return;
}

type Block = {
  creationStack: string,
  scheduled: number,
  start: number,
  end: number,
  id: number,
  parentID: ?number,
}

// InteractionData keyed by ContextID
const interactionData: {[key: number]: {
  // Blocks keyed by BlockID (Execution ID)
  blocks: {[key: number]: Block},
}} = {};

const seenContexts = {};
const prevExecutionIDs = {};

let currentExecutionID = null;

registerInteractionContextObserver({
  onContextScheduled(contexts: Array<Interaction>, executionID: number) {
    if (!contexts.length) {
      return;
    }
    const block = {
      creationStack: new Error().stack,
      scheduled: performance.now(),
      start: 0,
      end: 0,
      id: number,
      parentID: currentExecutionID,
    };
    contexts.forEach((context) => {
      const contextID = context.id;
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
      interactionData[contextID].blocks[executionID] = block;
    });
  },

  onContextStarting(contexts: Array<Interaction>, executionID: number): void {
    if (!contexts.length) {
      return;
    }
    const start = performance.now();
    contexts.forEach((context) => {
      if (interactionData[context.id]) {
        interactionData[context.id].blocks[executionID].start = start;
      }
    });
    prevExecutionIDs[executionID] = currentExecutionID;
    currentExecutionID = executionID;
  },

  onContextEnded(contexts: Array<Interaction>, executionID: number): void {
    if (!contexts.length) {
      return;
    }
    const end = performance.now();
    contexts.forEach((context) => {
      interactionData[context.id].blocks[executionID].end = end;
    });
    currentExecutionID = prevExecutionIDs[executionID];
    delete prevExecutionIDs[executionID];
  },
});

function logInteraction(context: Interaction) {
  const data = interactionData[context.id];
  delete interactionData[context.id];
  // Send this data to a server.
  // logToServer(context.name, data)
}
