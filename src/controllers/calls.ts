import Peer, { MediaConnection } from 'peerjs';

import { createSignal } from 'solid-js';
import {
  CallStream,
  PeerCallStreamService,
  PeerServiceOptions,
} from '../interface';

/**
 * Create a new call stream object
 * @param id
 * @param connection
 * @param stream
 * @returns
 */
const getLocalCallStream = (
  connection: MediaConnection,
  stream: MediaStream
): CallStream => {
  return {
    answered: true,
    connection,
    stream,
  };
};

/**
 * @usage to initiate a call, call "makeCall" and pass ing the id of the peer you want to call and your media stream
 * @usage to answer a call, call "answerCall" and pass in the id of the peer you want to answer and your media stream
 * @usage to disconnect from a call, call "disconnectFrom" and pass in the id of the peer you want to disconnect from
 */
export const peerCallStreamingService = (
  peer: Peer,
  options?: PeerServiceOptions
): PeerCallStreamService => {
  if (!peer) {
    throw new Error('peer is undefined, please provide a peer instance');
  }

  const log = (msg: string, ...restArgs: any[]) => {
    if (options?.debug) {
      console.trace(msg, restArgs);
    }
  };

  const [inboundStreams, setInboundStreams] = createSignal<CallStream[]>([]);

  const onCallEvent = (call: MediaConnection) => {
    log(`Inbound call from ${call.peer}`);
    setInboundStreams(streams => [
      ...streams,
      { answered: false, connection: call, stream: null },
    ]);
  };

  const setStreamEvents = (
    call: CallStream,
    localStream?: MediaStream
  ): Promise<CallStream> => {
    return new Promise((resolve, reject) => {
      log('setting stream events', 2);
      console.log('call', call);
      call.connection.on('stream', remotePeerStream => {
        log(`stream received from ${call.connection.peer}`, 2);

        call.stream = remotePeerStream;
        resolve(call);
      });
      call.connection.on('error', reject);
      call.connection.on('close', () => {
        log(`stream closed from ${call.connection.peer}`, 2);
        setInboundStreams(streams =>
          streams.filter(s => s.connection.peer !== call.connection.peer)
        );
        call.connection.close();
      });
      call.connection.answer(localStream);
      call.answered = true;
      log('Call answered', 2);
    });
  };

  //handles connecting to streams
  // returns a stream that can be passed into the srcObject of a video element
  // you must pass in a media stream to the function "navigator.mediaDevices.getUserMedia({video: true, audio: true})"
  const makeCall = (id: string, mediaStream: MediaStream): Promise<void> => {
    log(`making call to ${id} with media stream ${mediaStream}`);
    if (!mediaStream)
      throw new Error('Media stream is required to make a call');
    return new Promise((resolve, reject) => {
      const call = peer.call(id, mediaStream);
      const localStream = getLocalCallStream(call, mediaStream);
      setStreamEvents(localStream, mediaStream)
        .then(callStream => {
          log(`call to ${id} was successful`, 2);
          setInboundStreams(streams => [...streams, callStream]);
          resolve();
        })
        .catch(err => {
          log(`Failed to set stream events ${err.message}`, 2);
          return reject(err);
        });
    });
  };

  const connectStreams = (peerId?: string, stream?: MediaStream) => async (
    call: CallStream
  ) => {
    log(`connecting stream from ${call.connection.peer}`, 2);
    if (
      (!peerId && !call.answered) ||
      (peerId && call.connection.peer === peerId)
    ) {
      const connectedCall = await setStreamEvents(call, stream);
      console.log('returning connected call', connectedCall);
      return connectedCall;
    }
    return call;
  };

  // answer a call from a peer, if no peerid is provided, answers all unanswered calls
  const answerCall = (peerId?: string, stream?: MediaStream) => {
    log(`answering call from ${peerId}, using stream ${stream}`);

    if (inboundStreams() === null) {
      log(`There are no inbound streams`, 2);
      return;
    }

    Promise.all(inboundStreams().map(connectStreams(peerId, stream)))
      .then(setInboundStreams)
      .catch(err => log(err.message, 2));
  };

  const disconnectFrom = (callerId: string) => {
    log(`disconnecting from ${callerId}`);
    const call = inboundStreams().find(c => c.connection.peer === callerId);
    if (call) {
      log('stream found, closing', 2);
      call.connection.close();
      setInboundStreams(streams =>
        streams.filter(s => s.connection.peer !== callerId)
      );
    }
  };

  const disconnectAll = () => {
    inboundStreams().forEach(c => c.connection.close());
  };

  return {
    callStreams: inboundStreams,
    onCallEvent,
    makeCall,
    answerCall,
    disconnectFrom,
    disconnectAll,
  };
};
