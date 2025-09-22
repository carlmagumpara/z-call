import { useState, useEffect, useRef } from 'react';
import { socket } from '@/shared/socket';
import { usePresence } from '@/contexts/presence';

export const iceConfig = {
  iceServers: [
    { 
      urls: "stun:stun.l.google.com:19302" 
    },
    {
      urls: 'turn:numb.viagenie.ca',
      credential: 'muazkh',
      username: 'webrtc@live.com'
    },
    {
      urls: 'turn:192.158.29.39:3478?transport=udp',
      credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
      username: '28224511:1379330808'
    },
    {
      urls: 'turn:192.158.29.39:3478?transport=tcp',
      credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
      username: '28224511:1379330808'
    },
    {
      urls: 'turn:turn.bistri.com:80',
      credential: 'homeo',
      username: 'homeo'
    },
    {
      urls: 'turn:turn.anyfirewall.com:443?transport=tcp',
      credential: 'webrtc',
      username: 'webrtc'
    }
  ]
};

function Call() {
  const { user_id, users } = usePresence();


  const pc = useRef(null);
  const channel = useRef(null);
  const targetId = useRef(null);
  const [status, setStatus] = useState("disconnected");
  const [peers, setPeers] = useState({});

  useEffect(() => {
    const startConnection = async () => {
      const offer = await pc.current.createOffer();
      await pc.current.setLocalDescription(offer);
      socket.emit("offer", { to: peerId, sdp: offer });
    };

    // startConnection(peerId);

    console.log(users);
  }, [users]);

  useEffect(() => {
    pc.current = new RTCPeerConnection(iceConfig);

    pc.current.onconnectionstatechange = () => {
      console.log("Connection state:", pc.current.connectionState);
      setStatus(pc.current.connectionState);
    };

    pc.current.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("ice-candidate", { 
          to: targetId.current, 
          candidate: e.candidate 
        });
      }
    };

    socket.on("offer", async ({ from, sdp }) => {
      targetId.current = from;
      pc.current = new RTCPeerConnection(iceConfig);

      pc.current.ondatachannel = (e) => {
        e.channel.onmessage = (msg) => {
        };
      };

      pc.current.onconnectionstatechange = () => {
        console.log("Connection state:", pc.current.connectionState);
        setStatus(pc.current.connectionState);
      };

      pc.current.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit("ice-candidate", { 
            to: targetId.current, 
            candidate: e.candidate 
          });
        }
      };

      await pc.current.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.current.createAnswer();
      await pc.current.setLocalDescription(answer);
      socket.emit("answer", { to: from, sdp: answer });

      console.log('offer');
    });

    socket.on("answer", async ({ sdp }) => {
      await pc.current.setRemoteDescription(new RTCSessionDescription(sdp));

      console.log('answer');
    });

    socket.on("ice-candidate", async ({ candidate }) => {
      try {
        await pc.current.addIceCandidate(new RTCIceCandidate(candidate));

        console.log('ice-candidate');
      } catch (err) {
        console.error("Error adding ICE candidate", err);
      }
    });

    return () => {};
  }, []);

  return null;
}

export default Call;