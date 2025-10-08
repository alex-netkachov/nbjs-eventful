import test from 'node:test';
import assert from 'node:assert/strict';
import { eventful } from '../eventful.js';

test(
  'exceptions in listeners are suppressed by default',
  async () => {
    const obj =
      eventful(
        { },
        { error: () => { } });

    obj.on(
      'test',
      () => { throw new Error('test error'); });

    await assert.doesNotReject(
      () => obj.emit('test'));
  });

test(
  'strict mode propagates exceptions in listeners',
  async () => {
    const obj =
      eventful(
        { },
        { error: () => { },
          strict: true });

    obj.on(
      'test',
      () => { throw new Error('test error'); });

    await assert.rejects(
      () => obj.emit('test'));
  });

test(
  'async listener rejection is suppressed by default',
  async () => {
    const obj =
      eventful(
        { },
        { error: () => {} });

    obj.on(
      'test',
      async () => { throw new Error('async fail'); });

    await assert.doesNotReject(
      () => obj.emit('test'));
  });

test(
  'non-strict runs other listeners even if one fails',
  async () => {
    const obj =
      eventful(
        { },
        { error: () => {} });

    let ran = 0;

    obj.on(
      'test',
      () => { ran += 1; });

    obj.on(
      'test',
      () => { throw new Error('boom'); });

    obj.on(
      'test',
      () => { ran += 1; });

    await assert.doesNotReject(
      () => obj.emit('test'));

    assert.equal(ran, 2);
  });  