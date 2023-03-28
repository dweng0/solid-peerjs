import { createSignal } from 'solid-js';
import Peer, { DataConnection } from 'peerjs';
import { PeerDataService, PeerServiceOptions } from '../interface';

export const peerDataStreamingService = (
  peer: Peer,
  options?: PeerServiceOptions
): PeerDataService => {
  if (!peer) {
    throw new Error('peer is undefined, please provide a peer instance');
  }

  const log = (msg: string, ...restArgs: any[]) => {
    if (options?.debug) {
      console.trace(msg, restArgs);
    }
  };

  /**
   * Sets up events for a data connection
   * @param dataConnection
   */
  const setEventsForConnection = (dataConnection: DataConnection) => {
    log('setting up data connection events');
    dataConnection.on('open', () => addConsumer(dataConnection));
    dataConnection.on('close', () => removeConsumer(dataConnection));
    dataConnection.on('data', data =>
      log('Data received, please add a data event', data)
    );
  };

  peer.on('connection', setEventsForConnection);
  /**
   * Hold all of the data connections
   */
  const [connectedConsumers, setConnectedConsumers] = createSignal<
    DataConnection[]
  >([]);

  /**
   * Add to our list of data connections
   * @param dataConnection
   */
  const addConsumer = (dataConnection: DataConnection) => {
    //make sure we are not already connected to this peer
    if (
      !connectedConsumers().find(
        c => c.connectionId === dataConnection.connectionId
      )
    ) {
      setConnectedConsumers(consumers => [...consumers, dataConnection]);
    } else {
      log('already connected to this peer');
    }
  };

  /**
   * Remove from our list of data connections
   * @param dataConnection
   */
  const removeConsumer = (dataConnection: DataConnection) => {
    setConnectedConsumers(consumers =>
      consumers.filter(c => c.connectionId !== dataConnection.connectionId)
    );
  };

  /**
   * Add a data stream even to a specific data connection, or all of them
   * @note this will remove existing "data" events and add a new one
   * @param stream
   * @param id
   */
  const useDataStream = <T>(stream: (data: T) => void, id?: string) => {
    const resetDataEvent = (dataConnection: DataConnection) => {
      //find "data" event, and remove it
      dataConnection.eventNames().includes('data') &&
        dataConnection.off('data');

      // add new data event
      dataConnection.on('data', (data: unknown) => stream(data as T));
    };
    if (id) {
      const dataConnection = connectedConsumers().find(
        c => c.peer === id
      ) as DataConnection;
      resetDataEvent(dataConnection);
    } else {
      console.warn(
        'No id provided, resetting all data events and adding new one'
      );
      connectedConsumers().forEach(c => resetDataEvent(c));
    }
  };

  /**
   * Start a connection with a peer
   * @param address address of the peer to connect to
   * @param dataIn callback for when data is received
   * @returns {@see DataConnection}
   */
  const connect = <T>(
    address: string,
    dataIn: (data: T) => void
  ): DataConnection => {
    const dataConnection = peer.connect(address);
    setEventsForConnection(dataConnection);
    dataConnection.on('data', (data: unknown) => dataIn(data as T));
    return dataConnection;
  };

  /**
   * Disconnect from a peer by peerid
   * @param id
   * @returns
   */
  const disconnect = (id: string) =>
    removeConsumer(
      connectedConsumers().find(c => c.peer === id) as DataConnection
    );

  /**
   * wrapper, to send data to a specific peer
   * @param id peer id
   * @param data data to send
   */
  const send = <T>(id: string, data: T) => {
    const dataConnection = connectedConsumers().find(
      c => c.peer === id
    ) as DataConnection;
    if (dataConnection) dataConnection.send(data);
  };

  /**
   * Send data to all connected peers
   * @param id peer id
   * @param data data to send
   */
  const sendAll = <T>(data: T) => {
    connectedConsumers().forEach(c => c.send(data));
  };

  /**
   * Disconnect from all peers
   * resets the connectedconsumers array
   */
  const disconnectAll = () => {
    connectedConsumers().forEach(c => c.close());
    setConnectedConsumers([]);
  };

  return {
    connectedConsumers,
    useDataStream,
    connect,
    disconnect,
    disconnectAll,
    send,
    sendAll,
  };
};
