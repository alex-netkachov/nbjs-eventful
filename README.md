# eventful

> Part of [Nuts&Bolts for JS](docs/nbjs.md) - a set of high-quality and performant JavaScript libraries for everyday use.

Lightweight event helper adding on/off/emit to any object.

## Usage

```bash
npm install nbjs-eventful
```

```js
import eventful from 'nbjs-eventful';

const obj = eventful({ name: 'Alice' });
obj.on('greet', msg => console.log(`${msg}, ${obj.name}!`));
obj.emit('greet', 'Hello'); // Logs: "Hello, Alice!"
```

### With TypeScript

```ts
type MyEvents = {
  test: [id: number];
  ready: [];
};

const obj = eventful<object, MyEvents>({});
obj.on('test', id => { /* id is number */ });
obj.emit('ready');
```

## API

### eventful([target], [options])

Wraps the `target` object with event capabilities. If no target is provided, a new empty object is created.

- `target` (Object): The object to be enhanced with event capabilities.
- `options` (Object): Configuration options.
  - `error` (Function): Custom error handler for listener errors. Defaults to logging to console.
  - `trace` (Function): Custom trace function for event tracking. Defaults to no-op.
  - `strict` (Boolean): If true, throws an error when emitting an event with no listeners. Defaults to false.

### on(event, listener)

Registers a listener for the specified event.

- `event` (String): The event name.
- `listener` (Function): The callback function to be invoked when the event is emitted.

Returns a function to remove the listener.

### once(event, listener)

Registers a one-time listener for the specified event. The listener is removed after its first invocation.

- `event` (String): The event name.
- `listener` (Function): The callback function to be invoked when the event is emitted.

Returns a function to remove the listener.

### off(event, listener)

Removes a listener for the specified event.

- `event` (String): The event name.
- `listener` (Function): The callback function to be removed.

### emit(event, ...args)

Emits the specified event, invoking all registered listeners with the provided arguments.

- `event` (String): The event name.
- `...args` (Any): Arguments to pass to the listeners.

### emitAsync(event, ...args)

Emits the specified event asynchronously, invoking all registered listeners with the provided arguments.

- `event` (String): The event name.
- `...args` (Any): Arguments to pass to the listeners.

Returns a Promise that resolves when all listeners have been invoked.

### has(event)

Checks if there are any listeners registered for the specified event.

- `event` (String): The event name.

Returns `true` if there are listeners, otherwise `false`.

## License

MIT License. See [LICENSE](LICENSE) for details.
