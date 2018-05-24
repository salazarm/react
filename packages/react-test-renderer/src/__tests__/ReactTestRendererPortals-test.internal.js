/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

const React = require('react');
const ReactDOM = require('react-dom');

// Isolate test renderer.
jest.resetModules();
jest.mock('shared/ReactFeatureFlags', () =>
  require('shared/forks/ReactFeatureFlags.test-renderer'),
);
const ReactTestRenderer = require('react-test-renderer');

describe('ReactTestRenderer', () => {
  it('should support ReactDOM.createPortal', () => {
    const container = document.createElement('div');
    let rendered = ReactTestRenderer.create(
      <div>
        {ReactDOM.createPortal(<span>ReactDOM portal</span>, container)}
      </div>,
    );
    expect(rendered.toJSON()).toMatchSnapshot();

    rendered.update(
      <div>
        <span>ReactTestRenderer span</span>
        {ReactDOM.createPortal(<span>ReactDOM portal</span>, container)}
      </div>,
    );
    expect(rendered.toJSON()).toMatchSnapshot();
  });
});
