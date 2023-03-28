import { Accessor } from 'solid-js';
import { DataConnection, MediaConnection } from 'peerjs';

export interface PeerDataService {
  useDataStream: <T>(onDataReceived: (data: T) => void, id?: string) => void;
  connectedConsumers: Accessor<DataConnection[]>;
  disconnect: (id: string) => void;
  disconnectAll: () => void;
  send: <T>(id: string, data: T) => void;
  sendAll: <T>(data: T) => void;
  connect: <T>(
    address: string,
    onDataReceived: (data: T) => void
  ) => DataConnection;
}

export interface PeerNode {
  dataService: PeerDataService;
  callService: PeerCallStreamService;
  error: Accessor<string>;
  isConnected: Accessor<boolean>;
  peerReady: Accessor<boolean>;
  hostReady: Accessor<boolean>;
}

/**
 * Problem: I need to be able to know if a call has been answered or not
 * Solution: Create a new type that has a boolean to indicate if the call has been answered
 */
export interface CallStream {
  answered: boolean;
  connection: MediaConnection;
  stream: MediaStream | null;
}

export interface PeerCallStreamService {
  callStreams: Accessor<CallStream[]>;
  onCallEvent: (call: MediaConnection) => void;
  makeCall: (id: string, mediaStream: any) => Promise<void>;
  answerCall: (peerId?: string, mediaStream?: MediaStream) => void;
  disconnectFrom: (callerId: string) => void;
  disconnectAll: () => void;
}

export interface PeerServiceOptions {
  debug?: boolean;
}
