import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router';
import { Container } from 'react-bootstrap';
import { socket } from '@/shared/socket';
import { usePresence } from '@/contexts/presence';
import { iceConfig } from './config';
import Video from './video';
import Controls from './controls';

function Call({ 
  users = [], 
  initialVideo = true, 
  initialAudio = true 
}) {
  const { room_id } = useParams();
  const { user_id, username } = usePresence();
  const pc = useRef({});
  const pendingCandidates = useRef({});
  const [local_stream, setLocalStream] = useState(null);
  const [mediaStatus, setMediaStatus] = useState({});

  useEffect(() => {
    let localStream;
    const setUpLocalStream = async () => {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({ 
          video: true,
          audio: true,
        });
        localStream.getVideoTracks().forEach(track => track.enabled = initialVideo);
        localStream.getAudioTracks().forEach(track => track.enabled = initialAudio);
        setLocalStream(localStream);
        const videoEl = document.getElementById("local");
        if (videoEl) videoEl.srcObject = localStream;
        console.log('Local video added');
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
  }, [initialVideo, initialAudio]);

  useEffect(() => {
    const attemptReconnect = async (peerId, retries = 10, delay = 1000) => {
      console.log(`Attempting reconnect to ${peerId}, retries left: ${retries}`);
      const conn = pc.current[peerId];
      const state = conn?.iceConnectionState;

      if (!conn || ["closed", "disconnected", "failed"].includes(state)) {
        return rebuildPeerConnection(peerId);
      }

      if (retries <= 0) {
        console.log("Failed to reconnect", peerId);
        return rebuildPeerConnection(peerId);
      }

      try {
        const offer = await conn.createOffer({ iceRestart: true });
        await conn.setLocalDescription(offer);
        socket.emit("offer", { to: peerId, sdp: offer });
        console.log("ICE restart triggered for", peerId);
      } catch (err) {
        console.error("ICE restart failed, rebuilding connection", err);
        return rebuildPeerConnection(peerId); 
      }

      setTimeout(() => attemptReconnect(peerId, retries - 1, delay), delay);
    };

    const createPeerConnection = (peerId) => {
      console.log('createPeerConnection', peerId);

      if (pc.current[peerId]) return;

      const newPc = new RTCPeerConnection(iceConfig);
      pc.current[peerId] = newPc;

      local_stream?.getTracks().forEach(track => {
        newPc.addTrack(track, local_stream);
      });

      newPc.ontrack = (event) => {
        console.log('new track added: ', peerId);

        const remoteStream = event.streams[0];
        const videoEl = document.getElementById(`remote-${peerId}`);
        if (videoEl) {
          videoEl.srcObject = remoteStream
        };
        pc.current[peerId].remoteStream = remoteStream;
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
      };

      console.log("Created RTCPeerConnection for:", peerId);
    };

    const startConnection = async (peerId) => {
      console.log('startConnection', peerId);
      createPeerConnection(peerId);
      const conn = pc.current[peerId];
      if (!conn) return;

      const offer = await conn.createOffer();
      await conn.setLocalDescription(offer);

      socket.emit("offer", { 
        to: peerId, 
        sdp: offer 
      });
    };

    const rebuildPeerConnection = async (peerId) => {
      console.log('rebuildPeerConnection', peerId);
      if (pc.current[peerId]) {
        pc.current[peerId].close();
        delete pc.current[peerId];
      }
      await startConnection(peerId);
    };

    const handleOffer = async ({ from, sdp }) => {
      console.log('handleOffer', from);
      const conn = pc.current[from] || new RTCPeerConnection(iceConfig);
      if (!pc.current[from]) {
        pc.current[from] = conn;

        local_stream?.getTracks().forEach(track => {
          conn.addTrack(track, local_stream);
        });

        conn.ontrack = (event) => {
          console.log('new track added: ', from);
          const remoteStream = event.streams[0];
          const videoEl = document.getElementById(`remote-${from}`);
          if (videoEl) {
            videoEl.srcObject = remoteStream;
          }
          pc.current[from].remoteStream = remoteStream;
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
      console.log('handleAnswer', from);
      const conn = pc.current[from];
      if (conn) {
        try {
          if (conn.signalingState === "have-local-offer") {
            await conn.setRemoteDescription(new RTCSessionDescription(sdp));
            console.log("Remote answer set for:", from);
          } else {
            console.warn("Skipping answer because state is", conn.signalingState);
          }

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

    const handleIceCandidate = async ({ from, candidate }) => {
      console.log('handleIceCandidate', from);
      const conn = pc.current[from];
      if (!conn) {
        console.warn("Peer connection not found for ICE candidate from:", from);
        return;
      }
      
      if (conn.remoteDescription) {
        try {
          await conn.addIceCandidate(new RTCIceCandidate(candidate));
          console.log("Added ICE candidate from:", from);
        } catch (err) {
          console.error("Error adding ICE candidate", err);
        }
      } else {
        if (!pendingCandidates.current[from]) {
          pendingCandidates.current[from] = [];
        }
        pendingCandidates.current[from].push(candidate);
        console.log("Queued ICE candidate from:", from);
      }
    };

    if (local_stream && users.length > 1) {
      console.log('Users to connect', users);
      setTimeout(() => {
        users
        .filter(item => item[1] !== socket.id)
        .forEach(item => startConnection(item[1]));
      }, 500);
    }
    
    socket.on("offer", handleOffer);
    socket.on("answer", handleAnswer);
    socket.on("ice-candidate", handleIceCandidate);

    return () => {
      socket.off("offer", handleOffer);
      socket.off("answer", handleAnswer);
      socket.off("ice-candidate", handleIceCandidate);
    };
  }, [users, local_stream]);

  useEffect(() => {
    Object.keys(pc.current || {}).forEach(sid => {
      const user = users.find(item => item[1] === sid);
      if (!user) {
        pc.current[sid].close();
        delete pc.current[sid];
      } else {
        const videoEl = document.getElementById(`remote-${sid}`);
        if (videoEl) {
          videoEl.srcObject = pc.current[sid].remoteStream;
        }
      }
    });
  }, [users]);

  useEffect(() => {
    const handleMediaStatus = data => {
      console.log('handleMediaStatus', data);

      setMediaStatus(prevState => ({
        ...prevState,
        [data.socket_id]: data.data
      }));
    };

    socket.on("media-status", handleMediaStatus);

    return () => {
      socket.off("media-status", handleMediaStatus);
    };
  }, []);

  const remotes = users
    .filter(item => item[1] !== socket.id)
    .map(item => ({
      id: `remote-${item[1]}`,
      autoPlay: true,
      playsInline: true,
      user: {
        user_id: item[0],
        socket_id: item[1],
        username: item[2],
        ...(mediaStatus[item[1]] ? mediaStatus[item[1]] : {})
      }
    }))

  const videos = [
    {
      id: 'local',
      autoPlay: true,
      playsInline: true,
      muted: true,
      user: {
        user_id,
        socket_id: socket.id,
        username,
        ...(mediaStatus[socket.id] ? mediaStatus[socket.id] : {})
      }
    },
    ...remotes
  ];

  return (
    <>
      <div className="d-flex flex-wrap justify-content-center align-items-center vh-100 w-100 gap-3">
        {videos.map((item, index) => (
          <Video 
            key={index}
            index={index}
            item={item}
            count={videos.length}
          />
        ))}
      </div>
      {local_stream ? (
        <Controls
          roomId={room_id}
          localStream={local_stream}
        />
      ) : null}
    </>
  );
}

export default Call;