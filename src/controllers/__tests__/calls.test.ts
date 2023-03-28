/**
 * Mock the peerjs API
 */
jest.mock('peerjs', () => {
  const EventEmitter = require('events');
  const emitter = new EventEmitter();
  return function() {
    return {
      emitter,
      connect: () => {
        return emitter.emit('connection', emitter);
      },
      on: (event: string, callback: () => void) => {
        emitter.on(event, callback);
      },
    };
  };
});

describe('Calls', () => {
  it('Should compile JIT', () => {
    expect(true).toBe(true);
  });
});
