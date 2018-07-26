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

  it('should return a null name when outside of a tracked event', () => {
    expect(InteractionTracking.getCurrentEvents()).toBe(null);
  });

  if (__PROFILE__) {
    describe('profiling bundle', () => {
      it('should report the tracked name from within the track callback', done => {
        advanceTimeBy(100);

        InteractionTracking.track('some event', () => {
          const interactions = InteractionTracking.getCurrentEvents();
          expect(interactions).toEqual([
            {children: null, name: 'some event', timestamp: 100},
          ]);

          done();
        });
      });

      it('should report the tracked name from within wrapped callbacks', done => {
        let wrappedIndirection;

        function indirection() {
          const interactions = InteractionTracking.getCurrentEvents();
          expect(interactions).toEqual([
            {children: null, name: 'some event', timestamp: 100},
          ]);

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

          let interactions = InteractionTracking.getCurrentEvents();
          expect(interactions).toEqual([
            {children: null, name: 'some event', timestamp: 100},
          ]);

          advanceTimeBy(10);

          InteractionTracking.addContext('some context');

          advanceTimeBy(20);

          InteractionTracking.addContext('some more context');

          interactions = InteractionTracking.getCurrentEvents();
          expect(interactions).toEqual([
            {
              children: [
                {children: null, name: 'some context', timestamp: 115},
                {children: null, name: 'some more context', timestamp: 135},
              ],
              name: 'some event',
              timestamp: 100,
            },
          ]);

          done();
        });
      });

      it('should support nested tracked events', done => {
        advanceTimeBy(100);

        let innerIndirectionTracked = false;
        let outerIndirectionTracked = false;

        function innerIndirection() {
          const interactions = InteractionTracking.getCurrentEvents();
          expect(interactions).toEqual([
            {children: null, name: 'outer event', timestamp: 100},
            {children: null, name: 'inner event', timestamp: 150},
          ]);

          innerIndirectionTracked = true;
        }

        function outerIndirection() {
          const interactions = InteractionTracking.getCurrentEvents();
          expect(interactions).toEqual([
            {children: null, name: 'outer event', timestamp: 100},
          ]);

          outerIndirectionTracked = true;
        }

        InteractionTracking.track('outer event', () => {
          // Verify the current tracked event
          let interactions = InteractionTracking.getCurrentEvents();
          expect(interactions).toEqual([
            {children: null, name: 'outer event', timestamp: 100},
          ]);

          advanceTimeBy(50);

          const wrapperOuterIndirection = InteractionTracking.wrap(
            outerIndirection,
          );

          let wrapperInnerIndirection;
          let innerEventTracked = false;

          // Verify that a nested event is properly tracked
          InteractionTracking.track('inner event', () => {
            interactions = InteractionTracking.getCurrentEvents();
            expect(interactions).toEqual([
              {children: null, name: 'outer event', timestamp: 100},
              {children: null, name: 'inner event', timestamp: 150},
            ]);

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
          interactions = InteractionTracking.getCurrentEvents();
          expect(interactions).toEqual([
            {children: null, name: 'outer event', timestamp: 100},
          ]);

          // Verify that a wrapped nested callback is properly tracked
          wrapperInnerIndirection();
          expect(innerIndirectionTracked).toBe(true);

          done();
        });
      });

      describe('continuations', () => {
        it('should always override interactions when active and restore interactions when completed', () => {
          let oldEvents;

          advanceTimeBy(5);
          InteractionTracking.track('old event', () => {
            oldEvents = InteractionTracking.getCurrentEvents();
          });

          advanceTimeBy(10);
          InteractionTracking.track('new event', () => {
            expect(InteractionTracking.getCurrentEvents()).toEqual([
              {children: null, name: 'new event', timestamp: 15},
            ]);

            InteractionTracking.startContinuation(oldEvents);
            expect(InteractionTracking.getCurrentEvents()).toEqual(oldEvents);
            InteractionTracking.stopContinuation();

            InteractionTracking.startContinuation(undefined);
            expect(InteractionTracking.getCurrentEvents()).toEqual(undefined);
            InteractionTracking.stopContinuation();

            InteractionTracking.startContinuation(null);
            expect(InteractionTracking.getCurrentEvents()).toEqual(null);
            InteractionTracking.stopContinuation();

            expect(InteractionTracking.getCurrentEvents()).toEqual([
              {children: null, name: 'new event', timestamp: 15},
            ]);
          });
        });

        it('should error if started or stopped multiple times', () => {
          InteractionTracking.startContinuation();
          expect(() => {
            InteractionTracking.startContinuation();
          }).toThrow('Cannot start a continuation when one is already active.');

          InteractionTracking.stopContinuation();
          expect(() => {
            InteractionTracking.stopContinuation();
          }).toThrow('Cannot stop a continuation when none is active.');
        });
      });

      describe('error handling', () => {
        it('should reset state appropriately when an error occurs in a track callback', done => {
          advanceTimeBy(100);

          InteractionTracking.track('outer event', () => {
            expect(() => {
              InteractionTracking.track('inner event', () => {
                throw Error('intentional');
              });
            }).toThrow();

            const interactions = InteractionTracking.getCurrentEvents();
            expect(interactions).toEqual([
              {children: null, name: 'outer event', timestamp: 100},
            ]);

            done();
          });
        });

        it('should reset state appropriately when an error occurs in a wrapped callback', done => {
          advanceTimeBy(100);

          InteractionTracking.track('outer event', () => {
            let wrappedCallback;

            InteractionTracking.track('inner event', () => {
              wrappedCallback = InteractionTracking.wrap(() => {
                throw Error('intentional');
              });
            });

            expect(wrappedCallback).toThrow();

            const interactions = InteractionTracking.getCurrentEvents();
            expect(interactions).toEqual([
              {children: null, name: 'outer event', timestamp: 100},
            ]);

            done();
          });
        });

        it('should reset state appropriately when an error occurs in a retracked callback', done => {
          let expiredInteractions;

          advanceTimeBy(2);
          InteractionTracking.track('outer event', () => {
            advanceTimeBy(5);
            InteractionTracking.track('inner event', () => {
              expiredInteractions = InteractionTracking.getCurrentEvents();
            });
          });

          advanceTimeBy(3);

          InteractionTracking.track('new event', () => {
            expect(() => {
              InteractionTracking.retrack(expiredInteractions, () => {
                throw Error('expected error');
              });
            });

            const interactions = InteractionTracking.getCurrentEvents();
            expect(interactions).toEqual([
              {children: null, name: 'new event', timestamp: 10},
            ]);

            done();
          });
        });
      });
    });
  } else {
    describe('production bundle', () => {
      it('should execute tracked callbacks', done => {
        InteractionTracking.track('some event', () => {
          expect(InteractionTracking.getCurrentEvents()).toBe(null);

          done();
        });
      });

      it('should execute wrapped callbacks', done => {
        const wrappedCallback = InteractionTracking.wrap(() => {
          expect(InteractionTracking.getCurrentEvents()).toBe(null);

          done();
        });

        wrappedCallback();
      });
    });
  }
});
