// event-bus.js
export class EventBus {
  constructor(channel = 'lahat-bus') {
    this.subscribers = new Map();
    // Use BroadcastChannel if we can; otherwise, stay local
    this.bc = (typeof BroadcastChannel !== 'undefined')
      ? new BroadcastChannel(channel)
      : null;

    // Fan-in from other windows
    this.bc?.addEventListener('message', ({ data }) => {
      const { event, payload } = data || {};
      if (event) this.#dispatch(event, payload, /*fromRemote*/ true);
    });
  }

  subscribe(event, fn) {
    if (!this.subscribers.has(event)) this.subscribers.set(event, new Set());
    this.subscribers.get(event).add(fn);
    return () => this.subscribers.get(event)?.delete(fn);
  }

  publish(event, payload) {
    this.#dispatch(event, payload, /*fromRemote*/ false);
  }

  once(event, fn) {
    const off = this.subscribe(event, (d) => { off(); fn(d); });
  }

  clear(event) {
    event ? this.subscribers.delete(event) : this.subscribers.clear();
  }

  getSubscriberCount(event) {
    return this.subscribers.get(event)?.size ?? 0;
  }

  close() { this.bc?.close(); }

  /* ––– private ––– */
  #dispatch(event, payload, fromRemote) {
    // 1) local listeners
    this.subscribers.get(event)?.forEach(cb => {
      try { cb(payload); } catch (e) { console.error(e); }
    });
    // 2) cross-window broadcast (only if we originated it)
    if (!fromRemote) this.bc?.postMessage({ event, payload });
  }
}