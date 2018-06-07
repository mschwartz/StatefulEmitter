/**
 * StatefulEmitter
 *
 * This base class provides EventEmitter and per instance state.
 *
 */
const EventEmitter = require("events").EventEmitter;

// state for each instance of StatefulEmitter are truly private so we can truly
// assure state is immutable through this API.
const PrivateStates = {
  id: 0,
  states: {}
};

/**
 * StatefulEmitter
 */
class StatefulEmitter extends EventEmitter {
  get initial_state() {
    return null;
  }
  constructor() {
    super();
    // The only "private" variable we expose is _id, which is just a number.
    // Code that inherits from StatefulEmitter or uses it cannot gain access to
    // the state data.
    this._id = ++PrivateStates.id;
    PrivateStates.states[this._id] = this.initialState;
  }

  /**
   * state getter.
   *
   * This is consistent with React components that access the "state" member
   * within methods.
   *
   * @example:
   * ```javascript
   * console.log(e.state);
   * ```
   */
  get state() {
    const s = PrivateStates.states[this._id];
    return s ? Object.assign({}, s) : s;
  }

  /**
   * setState(value)
   *
   * Server-side workalike for React component's setState() method.
   *
   * In React, when you call setState(), the component is re-rendered.  On the
   * server side, calling setState() triggers a 'statechange' event to be fired,
   * with the newState and oldState as parameters.  Additionally, a 'change'
   * event is fired for each member in newState that is different from the same
   * member in the previous state.
   *
   * In React, the value does not replace the state.  The members of the value
   * are simply applied to the existing state, adding new members specified in
   * the value Object, and replacing, or updating, existing members' values.
   * StatefulEmitter's setState() method does the same thing.
   */
  setState(value) {
    const oldState = PrivateStates.states[this._id],
      newState = Object.assign({}, oldState || {}, value);

    PrivateStates.states[this._id] = newState;
    this.emit("statechange", newState, oldState);
    for (const key in Object.keys(value)) {
      const o = oldState[key],
        n = newState[key];
      if (n !== o) {
        this.emit("change", n, o);
      }
    }
  }

  /**
   * await this.wait(millseconds)
   *
   * It could be a common case that your component needs to periodically poll or
   * otherwise update its state.  This method makes expressing these kinds of
   * periodic polling/updating quite clean:
   *
   * @example
   * ```javascript
   * while (true) {
   *   await this.wait(60*1000); // sleep 60 seconds
   *   await this.poll();        // poll/update
   * }
   * ```
   *
   * If you were to use setInterval(), you could potentially end up with
   * multiple this.poll() calls stacked, should this.poll() take more than the
   * 60 seconds.
   */
  async wait(time) {
    return new Promise((resolve /*,reject*/) => {
      setTimeout(() => {
        resolve();
      }, time);
    });
  }
}

module.exports = StatefulEmitter;
