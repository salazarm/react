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
const ReactTestRenderer = require('react-test-renderer');

describe('ReactTestRenderer', () => {
  it('should support ReactDOM portal usage', () => {
    const container = document.createElement('div');
    let rendered = ReactTestRenderer.create(
      <div>
        {ReactDOM.createPortal(<span>Rendered by ReactDOM</span>, container)}
      </div>,
    );
    expect(rendered.toJSON()).toMatchSnapshot();

    rendered.update(
      <div>
        <span>Rendered by ReactTestRenderer</span>
        {ReactDOM.createPortal(<span>Rendered by ReactDOM</span>, container)}
      </div>,
    );
    expect(rendered.toJSON()).toMatchSnapshot();
  });
});
