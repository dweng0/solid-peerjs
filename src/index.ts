import Peer from 'peerjs';
import { createSignal, createEffect } from 'solid-js';
import { peerCallStreamingService } from './controllers/calls';
import { peerDataStreamingService } from './controllers/datum';
import { PeerNode } from './interface';

/**
 * Creates a consumer peer that can connect to other peers, and receive data
 * @returns
 */
export const peerNode = (myId: string): PeerNode => {
  const [error, setError] = createSignal<string>('');
  const [peerReady, setPeerReady] = createSignal<boolean>(false);
  const [hostReady, setHostReady] = createSignal<boolean>(false);

  const peer = new Peer(myId);
  const callService = peerCallStreamingService(peer);
  const dataService = peerDataStreamingService(peer);
  setPeerReady(true);

  createEffect(() => {
    if (peerReady() && !hostReady()) {
      // setup general events for the peer
      peer.on('error', err => setError(err.message));
      peer.on('call', callService.onCallEvent);
      setHostReady(true);
    }
  });

  return {
    dataService,
    callService,
    error,
    peerReady,
    hostReady,
  };
};
