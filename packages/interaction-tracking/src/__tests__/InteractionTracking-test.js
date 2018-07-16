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
    expect(InteractionTracking.getCurrentEvent()).toBe(null);
  });

  if (__PROFILE__) {
    describe('profiling bundle', () => {
      it('should report the tracked eventName from within the track callback', done => {
        advanceTimeBy(100);

        InteractionTracking.track('some event', () => {
          const context = InteractionTracking.getCurrentEvent();
          expect(context.eventName).toBe('some event');
          expect(context.timestamp).toBe(100);

          done();
        });
      });

      it('should report the tracked eventName from within wrapped callbacks', done => {
        let wrappedIndirection;

        function indirection() {
          const context = InteractionTracking.getCurrentEvent();
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

          let context = InteractionTracking.getCurrentEvent();
          expect(context.eventName).toBe('some event');
          expect(context.timestamp).toBe(100);
          expect(context.firstContext).toBeNull();

          advanceTimeBy(10);

          InteractionTracking.addContext('some context');

          advanceTimeBy(20);

          InteractionTracking.addContext('some more context');

          context = InteractionTracking.getCurrentEvent();
          expect(context.eventName).toBe('some event');
          expect(context.timestamp).toBe(100);
          expect(context.firstContext).not.toBeNull();
          expect(context.firstContext.eventName).toBe('some context');
          expect(context.firstContext.timestamp).toBe(115);
          expect(context.lastContext).not.toBeNull();
          expect(context.lastContext).toBe(context.firstContext.nextContext);
          expect(context.lastContext).not.toBe(context.firstContext);
          expect(context.lastContext.eventName).toBe('some more context');
          expect(context.lastContext.timestamp).toBe(135);

          done();
        });
      });

      it('should support nested tracked events', done => {
        advanceTimeBy(100);

        let innerIndirectionTracked = false;
        let outerIndirectionTracked = false;

        function innerIndirection() {
          const context = InteractionTracking.getCurrentEvent();
          expect(context.eventName).toBe('inner event');
          expect(context.timestamp).toBe(150);

          innerIndirectionTracked = true;
        }

        function outerIndirection() {
          const context = InteractionTracking.getCurrentEvent();
          expect(context.eventName).toBe('outer event');
          expect(context.timestamp).toBe(100);

          outerIndirectionTracked = true;
        }

        InteractionTracking.track('outer event', () => {
          // Verify the current tracked event
          let context = InteractionTracking.getCurrentEvent();
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
            context = InteractionTracking.getCurrentEvent();
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
          context = InteractionTracking.getCurrentEvent();
          expect(context.eventName).toBe('outer event');
          expect(context.timestamp).toBe(100);

          // Verify that a wrapped nested callback is properly tracked
          wrapperInnerIndirection();
          expect(innerIndirectionTracked).toBe(true);

          done();
        });
      });

      describe('error handling', () => {
        it('should reset state appropriately when an error occurs in a track callback', done => {
          advanceTimeBy(100);

          InteractionTracking.track('outer event', () => {
            let context;

            expect(() => {
              InteractionTracking.track('inner event', () => {
                throw Error('intentional');
              });
            }).toThrow();

            context = InteractionTracking.getCurrentEvent();
            expect(context.eventName).toBe('outer event');
            expect(context.timestamp).toBe(100);

            done();
          });
        });

        it('should reset state appropriately when an error occurs in a wrap callback', done => {
          advanceTimeBy(100);

          InteractionTracking.track('outer event', () => {
            let context;
            let wrappedCallback;

            InteractionTracking.track('inner event', () => {
              wrappedCallback = InteractionTracking.wrap(() => {
                throw Error('intentional');
              });
            });

            expect(wrappedCallback).toThrow();

            context = InteractionTracking.getCurrentEvent();
            expect(context.eventName).toBe('outer event');
            expect(context.timestamp).toBe(100);

            done();
          });
        });
      });
    });
  } else {
    describe('production bundle', () => {
      it('should execute tracked callbacks', done => {
        InteractionTracking.track('some event', () => {
          expect(InteractionTracking.getCurrentEvent()).toBe(null);

          done();
        });
      });

      it('should execute wrapped callbacks', done => {
        const wrappedCallback = InteractionTracking.wrap(() => {
          expect(InteractionTracking.getCurrentEvent()).toBe(null);

          done();
        });

        wrappedCallback();
      });
    });
  }
});
