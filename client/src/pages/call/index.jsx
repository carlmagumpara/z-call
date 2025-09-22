import { useState, useEffect, useRef } from 'react';
import { socket } from '@/shared/socket';
import { usePresence } from '@/contexts/presence';

const iceConfig = {
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
  const pc = useRef({}); // peers
  const videoRef = useRef(null);
  const pendingCandidates = useRef({});
  const reconnectAttempts = useRef({});
  const [remote_streams, setRemoteStreams] = useState({});
  const [local_stream, setLocalStream] = useState(null);

  useEffect(() => {
    let localStream;
    const setUpLocalStream = async () => {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(localStream);
      } catch (err) {
        console.error("Failed to get local stream", err);
      }
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
    const attemptReconnect = async (peerId) => {
      const conn = pc.current[peerId];
      if (!conn) return;

      reconnectAttempts.current[peerId] = (reconnectAttempts.current[peerId] || 0) + 1;
      if (reconnectAttempts.current[peerId] > 3) {
        console.warn("Too many reconnect attempts for", peerId, "— rebuilding...");
        return rebuildPeerConnection(peerId);
      }

      try {
        const offer = await conn.createOffer({ iceRestart: true });
        await conn.setLocalDescription(offer);
        socket.emit("offer", { to: peerId, sdp: offer });
        console.log("ICE restart triggered for", peerId);
      } catch (err) {
        console.error("ICE restart failed, rebuilding connection", err);
        rebuildPeerConnection(peerId);
      }
    };

    const createPeerConnection = (peerId) => {
      if (pc.current[peerId]) return;

      const newPc = new RTCPeerConnection(iceConfig);
      pc.current[peerId] = newPc;

      if (local_stream) {
        local_stream.getTracks().forEach(track => {
          newPc.addTrack(track, local_stream);
        });
      }

      newPc.ontrack = (event) => {
        const remoteStream = event.streams[0];
        setRemoteStreams(prev => ({ ...prev, [peerId]: remoteStream }));
      };

      newPc.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit("ice-candidate", { to: peerId, candidate: e.candidate });
        }
      };

      newPc.oniceconnectionstatechange = () => {
        console.log("ICE state:", newPc.iceConnectionState);

        if (newPc.iceConnectionState === "failed" ||
            newPc.iceConnectionState === "disconnected") {
          console.warn("Connection failed with", peerId);
          attemptReconnect(peerId);
        }
        if (newPc.iceConnectionState === "connected") {
          reconnectAttempts.current[peerId] = 0; // reset counter
        }
      };

      console.log("Created RTCPeerConnection for:", peerId);
    };

    const startConnection = async (peerId) => {
      createPeerConnection(peerId);
      const conn = pc.current[peerId];
      if (!conn) return;

      const offer = await conn.createOffer();
      await conn.setLocalDescription(offer);

      socket.emit("offer", { to: peerId, sdp: offer });
    };

    const rebuildPeerConnection = async (peerId) => {
      if (pc.current[peerId]) {
        pc.current[peerId].close();
        delete pc.current[peerId];
      }
      reconnectAttempts.current[peerId] = 0;
      await startConnection(peerId);
    };

    // Start connections
    users
      .filter(item => item[1] !== socket.id)
      .forEach(item => {
        if (!pc.current[item[1]]) {
          startConnection(item[1]);
        }
      });
  }, [users, local_stream]);

  useEffect(() => {
    const handleOffer = async ({ from, sdp }) => {
      const conn = pc.current[from] || new RTCPeerConnection(iceConfig);
      if (!pc.current[from]) {
        pc.current[from] = conn;
        if (local_stream) {
          local_stream.getTracks().forEach(track => conn.addTrack(track, local_stream));
        }

        conn.ontrack = (event) => {
          setRemoteStreams(prev => ({ ...prev, [from]: event.streams[0] }));
        };

        conn.onicecandidate = (e) => {
          if (e.candidate) {
            socket.emit("ice-candidate", { to: from, candidate: e.candidate });
          }
        };
      }

      await conn.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await conn.createAnswer();
      await conn.setLocalDescription(answer);
      socket.emit("answer", { to: from, sdp: answer });

      // After setting remote description, process any pending candidates
      if (pendingCandidates.current[from]) {
        for (const candidate of pendingCandidates.current[from]) {
          try {
            await conn.addIceCandidate(new RTCIceCandidate(candidate));
            console.log("Added queued ICE candidate from:", from);
          } catch (err) {
            console.error("Error adding queued candidate", err);
          }
        }
        delete pendingCandidates.current[from];
      }
    };

    const handleAnswer = async ({ from, sdp }) => {
      const conn = pc.current[from];
      if (conn) {
        try {
          if (conn.signalingState === "have-local-offer") {
            await conn.setRemoteDescription(new RTCSessionDescription(sdp));
            console.log("Remote answer set for:", from);
          } else {
            console.warn("Skipping answer because state is", conn.signalingState);
          }

          // Process queued ICE candidates
          if (pendingCandidates.current[from]) {
            for (const candidate of pendingCandidates.current[from]) {
              try {
                await conn.addIceCandidate(new RTCIceCandidate(candidate));
              } catch (err) {
                console.error("Error adding queued candidate from answer handler", err);
              }
            }
            delete pendingCandidates.current[from];
          }
        } catch (err) {
          console.warn("Failed to set remote description for answer", from, err);
        }
      }
    };

    // const handleAnswer = async ({ from, sdp }) => {
    //   const conn = pc.current[from];
    //   if (conn) {
    //     try {
    //       await conn.setRemoteDescription(new RTCSessionDescription(sdp));
    //       // Process any pending candidates
    //       if (pendingCandidates.current[from]) {
    //         for (const candidate of pendingCandidates.current[from]) {
    //           try {
    //             await conn.addIceCandidate(new RTCIceCandidate(candidate));
    //           } catch (err) {
    //             console.error("Error adding queued candidate from answer handler", err);
    //           }
    //         }
    //         delete pendingCandidates.current[from];
    //       }
    //     } catch (err) {
    //       console.warn("Failed to set remote description for answer", from, err);
    //     }
    //   }
    // };

    const handleIceCandidate = async ({ from, candidate }) => {
      const conn = pc.current[from];
      if (!conn) {
        console.warn("Peer connection not found for ICE candidate from:", from);
        return;
      }
      
      // Check if remote description is set before adding the candidate
      if (conn.remoteDescription) {
        try {
          await conn.addIceCandidate(new RTCIceCandidate(candidate));
          console.log("Added ICE candidate from:", from);
        } catch (err) {
          console.error("Error adding ICE candidate", err);
        }
      } else {
        // If not set, queue the candidate
        if (!pendingCandidates.current[from]) {
          pendingCandidates.current[from] = [];
        }
        pendingCandidates.current[from].push(candidate);
        console.log("Queued ICE candidate from:", from);
      }
    };

    socket.on("offer", handleOffer);
    socket.on("answer", handleAnswer);
    socket.on("ice-candidate", handleIceCandidate);

    return () => {
      socket.off("offer", handleOffer);
      socket.off("answer", handleAnswer);
      socket.off("ice-candidate", handleIceCandidate);
    };
  }, [local_stream]);

  return (
    <>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ width: 300, height: 200 }}
      />
      {Object.entries(remote_streams).map(([peerId, stream]) => (
        <video
          key={peerId}
          autoPlay
          playsInline
          ref={video => { if (video) video.srcObject = stream; }}
          style={{ width: 300, height: 200 }}
        />
      ))}
    </>
  );
}

export default Call;