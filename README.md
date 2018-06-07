# StatefulEmitter
Simple Stateful Emitter, server side React-like component base class.

StatefulEmitter combines the NodeJS EventEmitter with the concept of state to
provide a base class for building components and component-oriented server-side
applications.

## Use case 1: Chat Server
A good use for StatefulEmitter would be a chat server.  A chat "room" would be a
component that inherits from StatefulEmitter.   When the room's setState()
method is called with a new message posted by someone to the room, a statechange
event is fired to indicate the message should be broadcast to all the sockets
(or whatever) that represent clients who have joined the room.

```javascript
class Room extends StatefulEmitter {
  get initialState() { return { message: null }};
  constructor() {
    super();
    this.on('statechange', (newState, oldState) => {
      this.broadcast(newState.message);
    });
  }

  postMessage(message) {
    this.setState({ message: message });
  }
}
```

## Use case 2: Internet of Things
"Things" are logically StatefulEmitters.  Consider a smart light switch.  It's
state is either off or on.  It's state can be changed by toggling the physical
switch (on the wall), or from any of a number of devices running an app that can
toggle the switch state.  

```javascript
class Switch extends StatefulEmitter {
  get initialState() { return { state: false }};
  constructor() {
    super();
    // when a message is received about the switch:
    MQTT.on('message', /*topic*/ 'switch name', (state) {
      this.setState({state: state});
    });
  }
}
```

## Use case 3: Email
Application needs to poll some URL to determine if there is new email.

```javascript
class EmailChecker extends StatefulEmitter {
  get initialState() { return { unreadMailCount: 0}};

  constructor() {
    super();
    this.setState({ unreadMailCount: 0 });
    setTimeout(this.poll.bind(this), 1);
  }

  async poll() {
    while (1) {
      const results = await http.get(MAIL_URL);
      if (this.state.unreadMailCount !== results.unreadMailCount) {
        this.setState({ unreadMailCount: results.unreadMailCount });
      }
      await this.wait(5 * 60 * 1000);   // check mail every 5 minutes
    }
  }
}

const main = () => {
  const checker = new EMailChecker();
  checker.on('statechange', (newState) => {
    // notify all clients that new mail has arrived
    MQTT.send('mail_status', newstate);
  });
};

main();

```
