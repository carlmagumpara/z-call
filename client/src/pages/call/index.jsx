import { useState, useEffect, useRef } from 'react';
import { socket } from '@/shared/socket';
import { usePresence } from '@/contexts/presence';

const iceConfig = {
  iceServers: [
    {
      urls: "stun:openrelay.metered.ca:80"
    },
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject"
    },
    {
      urls: "turn:openrelay.metered.ca:443",
      username: "openrelayproject",
      credential: "openrelayproject"
    },
    {
      urls: "turn:openrelay.metered.ca:443?transport=tcp",
      username: "openrelayproject",
      credential: "openrelayproject"
    }
  ]
};

function Call() {
  const { user_id, users } = usePresence();
  const pc = useRef({}); // peers
  const channel = useRef(null);
  const videoRef = useRef(null);
  const [peers, setPeers] = useState({});
  const [peer_status, setPeerStatus] = useState({});
  const [remote_streams, setRemoteStreams] = useState([]);
  const [local_stream, setLocalStream] = useState(null);

  useEffect(() => {
    let localStream;

    const setUpLocalStream = async () => {
      localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(localStream);

      localStream.getTracks().forEach(track => {
        Object.values(pc.current || {}).forEach(conn => {
          conn.addTrack(track, localStream);
        });
      });
    };

    setUpLocalStream();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (videoRef.current && local_stream) {
      videoRef.current.srcObject = local_stream; 
    }
  }, [local_stream]);

  useEffect(() => {
    const createPeerConnection = (peerId) => {
      if (!pc.current[peerId]) {
        pc.current[peerId] = new RTCPeerConnection(iceConfig);

        if (local_stream) {
          local_stream.getTracks().forEach(track => {
            pc.current[peerId].addTrack(track, local_stream);
          });
        }

        pc.current[peerId].ontrack = (event) => {
          const remoteStream = event.streams[0];
          setRemoteStreams(prev => ({
            ...prev,
            [peerId]: remoteStream
          }));
        };

        pc.current[peerId].onconnectionstatechange = () => {
          setPeerStatus(prevState => ({
            ...prevState,
            [peerId]: pc.current[peerId].connectionState
          }));
        };

        pc.current[peerId].onicecandidate = (e) => {
          if (e.candidate) {
            socket.emit("ice-candidate", { 
              to: peerId,
              candidate: e.candidate 
            });
          }
        };

        console.log("Created RTCPeerConnection for:", peerId);
      }
    };

    const startConnection = async (peerId) => {
      createPeerConnection(peerId);

      const offer = await pc.current[peerId].createOffer();
      await pc.current[peerId].setLocalDescription(offer);

      socket.emit("offer", { 
        to: peerId, 
        sdp: offer 
      });
    };

    users
      .filter(item => item[1] !== socket.id)
      .forEach(item => {
        if (!pc.current[item[1]]) {
          startConnection(item[1]);
        }
      });
  }, [users]);

  useEffect(() => {
    socket.on("offer", async ({ from, sdp }) => {
      if (!pc.current[from]) {
        pc.current[from] = new RTCPeerConnection(iceConfig);

        pc.current[from].ontrack = (event) => {
          console.log("Received remote track from", from, event.streams);

          // karaniwang may 1 stream lang (event.streams[0])
          const remoteStream = event.streams[0];

          // save sa state para magamit sa <video> or <audio> tag
          setRemoteStreams(prev => ({
            ...prev,
            [from]: remoteStream
          }));
        };

        pc.current[from].ondatachannel = (e) => {
          e.channel.onmessage = (msg) => {
            console.log("Message from", from, msg.data);
          };
        };

        pc.current[from].onconnectionstatechange = () => {
          setPeerStatus(prevState => ({
            ...prevState,
            [from]: pc.current[from].connectionState
          }));
        };

        pc.current[from].onicecandidate = (e) => {
          if (e.candidate) {
            socket.emit("ice-candidate", { 
              to: from, 
              candidate: e.candidate 
            });
          }
        };
      }

      await pc.current[from].setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.current[from].createAnswer();
      await pc.current[from].setLocalDescription(answer);

      socket.emit("answer", { to: from, sdp: answer });

      console.log("Processed offer from:", from);
    });

    // handle answer
    socket.on("answer", async ({ from, sdp }) => {
      const conn = pc.current[from];
      if (conn) {
        if (conn.signalingState === "have-local-offer") {
          await conn.setRemoteDescription(new RTCSessionDescription(sdp));
          console.log("Processed answer from:", from);
        } else {
          console.warn("Skipping answer from", from, "wrong state:", conn.signalingState);
        }
      }
    });

    // handle ice candidate
    socket.on("ice-candidate", async ({ from, candidate }) => {
      if (pc.current[from]) {
        try {
          await pc.current[from].addIceCandidate(new RTCIceCandidate(candidate));
          console.log("Added ICE candidate from:", from);
        } catch (err) {
          console.error("Error adding ICE candidate", err);
        }
      }
    });

    return () => {
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
    };
  }, []);

  console.log(peer_status);

  return (
    <>
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        muted
        style={{
          width: 300,
          height: 200,
        }}
      />
      {Object.entries(remote_streams).map(([peerId, stream]) => (
        <video 
          key={peerId} 
          autoPlay 
          playsInline 
          ref={video => { if (video) video.srcObject = stream; }} 
          style={{
            width: 300,
            height: 200,
          }}
        />
      ))}
    </>
  );
}

export default Call;