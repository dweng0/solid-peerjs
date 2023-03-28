# Solid PeerJS P2P Connection Project

## Introduction

This project allows peers to connect to each other in a P2P fashion using PeerJS library. The project exposes a simple interface for establishing a connection and exchanging data between peers. The interface consists of the following methods:

`dataService`: A function that allows peers to send data to each other.

`callService`: A function that allows peers to initiate a call with each other.

`error`: A property that contains the error message if any error occurs during the connection process.

`isConnected`: A property that indicates whether the peer is currently connected to another peer.

`peerReady`: A property that indicates whether the peer is ready to connect to another peer.

`hostReady`: A property that indicates whether the peer is ready to act as a host and receive incoming connections.

## Getting Started

To use this project, you need to install the SolidJS library and PeerJS library. PeerJS is installed as a dependency of this project, so you don't need to install it separately. You can install the SolidJS library using npm:

```sh
npm install solid-js
```

Once you have installed the library, you can import it and create a peer node, only use what you need (only need data, just pull the data service in, want to make calls? use the call service, etc.)

```javascript
import { createSignal, createEffect } from 'solid-js';
import { peerNode } from './peerNode';

const myId = 'my-peer-id';

const {
  dataService,
  callService,
  error,
  isConnected,
  peerReady,
  hostReady,
} = peerNode(myId);

createEffect(() => {
  if (peerReady() && !hostReady()) {
    console.log('Peer ready to connect to other peers.');
  }
});

createEffect(() => {
  if (hostReady()) {
    console.log('Peer ready to act as a host.');
  }
});

callService.onCall(call => {
  // handle incoming call
});

dataService.onData(data => {
  // handle incoming data
});
```

The peerNode function returns an object that contains the methods and properties of the peer node. You can use these methods and properties to establish a connection and exchange data with other peers.

## License

This project is licensed under the MIT License.
