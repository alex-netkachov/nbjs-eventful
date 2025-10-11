import test from 'node:test';
import assert from 'node:assert/strict';
import { eventful } from '../eventful.js';

test(
  'eventful creates an empty event emitter object',
  () => {
    const obj =
      eventful();

    assert.ok(obj);
    assert.equal(typeof obj.on, 'function');
    assert.equal(typeof obj.off, 'function');
    assert.equal(typeof obj.emit, 'function');
    assert.equal(typeof obj.has, 'function');
  });

test(
  'eventful throws when an object has one of the event emitter methods',
  () => {
    for (const method of ['on', 'once', 'off', 'emit', 'has']) {
      assert.throws(
        () => eventful({ [method]: () => { } }));
    }
  });

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
      () => obj.emitAsync('test'));
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
      () => obj.emitAsync('test'));
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
      () => obj.emitAsync('test'));
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
      () => obj.emitAsync('test'));

    assert.equal(ran, 2);
  });  