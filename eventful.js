/**
 * A mixin that adds event emitter capabilities to an object.
 * 
 * - Map<string|symbol, Set<Function>> to store listeners (dedup, insertion order).
 * - Emits asynchronously and in parallel; errors are isolated (not thrown).
 * - Adds non-enumerable methods to avoid polluting key iteration.
 *
 * @param {Object|Function} object The object to enhance.
 * @returns {Object|Function} The enhanced object.
 */
export function eventful(object) {
  if (object == null
      || (typeof object !== 'object'
          && typeof object !== 'function'))
  {
    throw new TypeError(
      'eventful() expects an object');
  }

  for (const method of [ 'on', 'once', 'off', 'emit', 'has' ]) {
    if (method in object) {
      throw new Error(
        `object already has method "${method}"`);
    }
  }

  /** @type {Map<string|symbol, Set<Function>>} */
  const map =
    new Map();

  const add =
    (event, fn) => {
      let set =
        map.get(event);

      if (!set) {
        set = new Set();
        map.set(event, set);
      }

      set.add(fn);
    };

  const remove =
    (event, fn) => {
      const set =
        map.get(event);

      if (!set)
        return false;

      const had =
        set.delete(fn);

      if (set.size === 0)
        map.delete(event);

      return had;
    };

  /**
   * Subscribe to an event.
   *
   * @type {(event: string|symbol, fn: Function) => () => boolean}
   */
  const on =
    (event, fn) => {
      if (typeof fn !== 'function') {
        throw new TypeError(
          'listener must be a function');
      }

      add(event, fn);

      let active = true;

      return () => {
        if (!active)
          return false;

        active = false;

        return remove(
          event,
          fn);
      };
    };

  /**
   * Subscribe to an event for a single occurrence.
   *
   * @type {(event: string|symbol, fn: Function) => () => boolean}
   */
  const once =
    (event, fn) => {
      if (typeof fn !== 'function') {
        throw new TypeError(
          'listener must be a function');
      }

      const off =
        on(
          event,
          (...args) => {
            off();
            fn(...args);
          });

      return off;
    };

  
  /** @type {(event: string|symbol) => boolean} */
  const has =
    event =>
      map.get(event)?.size > 0
        || false;

   /**
   * Emit an event and wait for all listeners (run in parallel).
   * Errors are isolated (ignored) so all listeners run.
   *
   * @param {string|symbol} event
   * @param {...any} args
   * @returns {Promise<void>}
   */
  const emit =
    async (event, ...args) => {
      const set = map.get(event);

      if (!set || set.size === 0)
        return;

      await Promise.allSettled(
        Array.from(set)
          .map(fn => Promise.resolve(fn(...args))));
    };

  /**
   * Unsubscribe from an event.
   *
   * @param {string} event The event name.
   * @param {Function} handler The handling function.
   * @returns {boolean} True if unsubscribed, false if not found.
   */
  const off =
    (event, handler) =>
      remove(
        event,
        handler);

  const attributes =
   { enumerable: false,
     configurable: true,
     writable: true };

  Object.defineProperties(
    object,
    { on: { value: on, ...attributes },
      once: { value: once, ...attributes },
      off: { value: off, ...attributes },
      emit: { value: emit, ...attributes },
      has: { value: has, ...attributes } });

  return object;
}
