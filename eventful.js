/**
 * A mixin that adds event emitter capabilities to an object.
 * 
 * @param {Object|Function}* object The object to enhance.
 * @param {Object}* options The options to configure the event emitter.
 * @returns {Object|Function} The enhanced object.
 */
const eventful =
  (object, options) => {
    if (typeof object !== 'undefined'
        && (object == null
            || (typeof object !== 'object'
                && typeof object !== 'function')))
    {
      throw new TypeError(
        'eventful() expects an object');
    }
  
    if (typeof object === 'undefined')
      object = Object.create(null);
  
    const { strict = false,
            trace = null,
            error = null } =
      options
      || { };
  
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
  
        (trace || eventful.trace)(
          'on',
          { object,
            event,
            fn });
  
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
     * Emit an event synchronously.
     * All listeners run in order.
     * Errors are isolated (ignored) unless `strict` is true.
     *
     * @param {string|symbol} event
     * @param {...any} args
     */
    const emit =
      (event, ...args) => {
        const set =
          map.get(event);

        (trace || eventful.trace)(
          'emit',
          set || [],
          { object,
            event,
            args });

        if (!set || set.size === 0)
          return;
          
        for (const fn of set) {
          try {
            fn(...args);
          } catch (err) {
            (error || eventful.error)(err);
            if (strict)
              throw err;
          }
        }
      };
    
    /**
     * Emit an event and wait for all listeners (run in parallel).
     * Errors are isolated (ignored) so all listeners run.
     *
     * @param {string|symbol} event
     * @param {...any} args
     * @returns {Promise<void>}
     */
    const emitAsync =
      async (event, ...args) => {
        const set =
          map.get(event);

        (trace || eventful.trace)(
          `emitAsync`,
          set || [],
          { object,
            event,
            args });
          
        if (!set || set.size === 0)
          return;
  
        const calls =
          Array.from(set)
            .map(fn => {
              return new Promise(
                (resolve, reject) => {
                  try {
                    Promise.resolve(fn(...args))
                      .then(resolve, reject);
                  } catch (err) {
                    (error || eventful.error)(err);
                    reject(err);
                  }
                });
            });
  
        if (strict)
          await Promise.all(calls);
        else
          await Promise.allSettled(calls);
      };
  
    /**
     * Unsubscribe from an event.
     *
     * @param {string} event The event name.
     * @param {Function} handler The handling function.
     * @returns {boolean} True if unsubscribed, false if not found.
     */
    const off =
      (event, handler) => {
        (trace || eventful.trace)(
          'off',
          { object,
            event,
            handler });
  
        return remove(
          event,
          handler);
      };
  
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
        emitAsync: { value: emitAsync, ...attributes },
        has: { value: has, ...attributes } });
  
    return object;
  };

eventful.trace = () => { };
eventful.error = err => console.error(err);

export { eventful };
