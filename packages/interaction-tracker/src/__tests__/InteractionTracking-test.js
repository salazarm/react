/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @jest-environment node
 */
'use strict';

describe('InteractionTracking', () => {
  let InteractionTracking;

  let advanceTimeBy;

  beforeEach(function() {
    jest.resetModules();
    jest.useFakeTimers();

    let currentTime = 0;
    Date.now = jest.fn().mockImplementation(() => currentTime);

    advanceTimeBy = amount => {
      currentTime += amount;
    };

    InteractionTracking = require('interaction-tracking/src/InteractionTracking');
  });

  it('should return a null eventName when outside of a tracked event', () => {
    expect(InteractionTracking.getCurrentContext()).toBe(null);
  });

  if (__PROFILE__) {
    describe('profiling bundle', () => {
      it('should report the tracked eventName from within the track callback', done => {
        advanceTimeBy(100);

        InteractionTracking.track('some event', () => {
          const context = InteractionTracking.getCurrentContext();
          expect(context.eventName).toBe('some event');
          expect(context.timestamp).toBe(100);

          done();
        });
      });

      it('should report the tracked eventName from within wrapped callbacks', done => {
        let wrappedIndirection;

        function indirection() {
          const context = InteractionTracking.getCurrentContext();
          expect(context.eventName).toBe('some event');
          expect(context.timestamp).toBe(100);

          done();
        }

        advanceTimeBy(100);

        InteractionTracking.track('some event', () => {
          wrappedIndirection = InteractionTracking.wrap(indirection);
        });

        advanceTimeBy(50);

        wrappedIndirection();
      });

      it('should throw when context is added outisde of a tracked event', () => {
        expect(() => InteractionTracking.addContext('some context')).toThrow(
          'Context cannot be added outside of a tracked event.',
        );
      });

      it('should accumulate additional event context', done => {
        advanceTimeBy(100);

        InteractionTracking.track('some event', () => {
          advanceTimeBy(5);

          let context = InteractionTracking.getCurrentContext();
          expect(context.eventName).toBe('some event');
          expect(context.timestamp).toBe(100);
          expect(context.firstMarkedEvent).toBeNull();

          advanceTimeBy(10);

          InteractionTracking.addContext('some context');

          advanceTimeBy(20);

          InteractionTracking.addContext('some more context');

          context = InteractionTracking.getCurrentContext();
          expect(context.eventName).toBe('some event');
          expect(context.timestamp).toBe(100);
          expect(context.firstMarkedEvent).not.toBeNull();
          expect(context.firstMarkedEvent.eventName).toBe('some context');
          expect(context.firstMarkedEvent.timestamp).toBe(115);
          expect(context.lastMarkedEvent).not.toBeNull();
          expect(context.lastMarkedEvent).toBe(
            context.firstMarkedEvent.nextMarkedEvent,
          );
          expect(context.lastMarkedEvent).not.toBe(context.firstMarkedEvent);
          expect(context.lastMarkedEvent.eventName).toBe('some more context');
          expect(context.lastMarkedEvent.timestamp).toBe(135);

          done();
        });
      });

      it('should support nested tracked events', done => {
        advanceTimeBy(100);

        let innerIndirectionTracked = false;
        let outerIndirectionTracked = false;

        function innerIndirection() {
          const context = InteractionTracking.getCurrentContext();
          expect(context.eventName).toBe('inner event');
          expect(context.timestamp).toBe(150);

          innerIndirectionTracked = true;
        }

        function outerIndirection() {
          const context = InteractionTracking.getCurrentContext();
          expect(context.eventName).toBe('outer event');
          expect(context.timestamp).toBe(100);

          outerIndirectionTracked = true;
        }

        InteractionTracking.track('outer event', () => {
          // Verify the current tracked event
          let context = InteractionTracking.getCurrentContext();
          expect(context.eventName).toBe('outer event');
          expect(context.timestamp).toBe(100);

          advanceTimeBy(50);

          const wrapperOuterIndirection = InteractionTracking.wrap(
            outerIndirection,
          );

          let wrapperInnerIndirection;
          let innerEventTracked = false;

          // Verify that a nested event is properly tracked
          InteractionTracking.track('inner event', () => {
            context = InteractionTracking.getCurrentContext();
            expect(context.eventName).toBe('inner event');
            expect(context.timestamp).toBe(150);

            // Verify that a wrapped outer callback is properly tracked
            wrapperOuterIndirection();
            expect(outerIndirectionTracked).toBe(true);

            wrapperInnerIndirection = InteractionTracking.wrap(
              innerIndirection,
            );

            innerEventTracked = true;
          });

          expect(innerEventTracked).toBe(true);

          // Verify that the original event is restored
          context = InteractionTracking.getCurrentContext();
          expect(context.eventName).toBe('outer event');
          expect(context.timestamp).toBe(100);

          // Verify that a wrapped nested callback is properly tracked
          wrapperInnerIndirection();
          expect(innerIndirectionTracked).toBe(true);

          done();
        });
      });
    });
  } else {
    describe('production bundle', () => {
      it('should execute tracked callbacks', done => {
        InteractionTracking.track('some event', () => {
          expect(InteractionTracking.getCurrentContext()).toBe(null);

          done();
        });
      });

      it('should execute wrapped callbacks', done => {
        const wrappedCallback = InteractionTracking.wrap(() => {
          expect(InteractionTracking.getCurrentContext()).toBe(null);

          done();
        });

        wrappedCallback();
      });
    });
  }
});
