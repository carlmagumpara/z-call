import adapter from 'webrtc-adapter';
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
  mediaStatus = {},
  initialVideo = true, 
  initialAudio = true
}) {
  const { room_id } = useParams();
  const socket_id = socket.id;
  const { user_id, username } = usePresence();
  const pc = useRef({});
  const pendingCandidates = useRef({});
  const [local_stream, setLocalStream] = useState(null);
  const [local_audio, setLocalAudio] = useState([]);
  const [local_video, setLocalVideo] = useState([]);

  const getStreamTrackStatus = () => {
    if (!local_stream) return;

    const audioTracks = local_stream.getAudioTracks();
    const videoTracks = local_stream.getVideoTracks();

    const summarize = (track) => ({
      id: track.id,
      kind: track.kind,
      enabled: track.enabled,
      muted: track.muted ?? false,
      readyState: track.readyState,
      label: track.label,
    });

    setLocalAudio(audioTracks.map(summarize));
    setLocalVideo(videoTracks.map(summarize));
  };

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
        // socket.emit("media-status", { 
        //   user_id,
        //   username,
        //   room_id,
        //   data: {
        //     video: initialVideo,
        //     audio: initialAudio,
        //   }
        // });
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
        .filter(item => item.user_id !== user_id)
        .forEach(item => startConnection(item.socket_id));
      }, 3000);
    }

    getStreamTrackStatus();
    
    socket.on("offer", handleOffer);
    socket.on("answer", handleAnswer);
    socket.on("ice-candidate", handleIceCandidate);

    return () => {
      Object.values(pc.current).forEach(conn => conn.close());
      pc.current = {};
      socket.off("offer", handleOffer);
      socket.off("answer", handleAnswer);
      socket.off("ice-candidate", handleIceCandidate);
    };
  }, [user_id, users, local_stream]);

  useEffect(() => {
    console.log('Send media status...');
    socket.emit("media-status", { 
      user_id,
      username,
      room_id,
      data: {
        video: local_video?.[0]?.enabled || false,
        audio: local_audio?.[0]?.enabled || false,
      }
    });
  }, [local_audio, local_video, users]);

  useEffect(() => {
    Object.keys(pc.current || {}).forEach(sid => {
      const user = users.find(item => item.socket_id === sid);
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

  const videos = [
    {
      id: 'local',
      autoPlay: true,
      playsInline: true,
      muted: true,
      myself: true,
      media: mediaStatus[user_id] || { audio: false, video: false },
    },
    ...(users
    .filter(item => item.user_id !== user_id)
    .map(item => ({
      id: `remote-${item.socket_id}`,
      autoPlay: true,
      playsInline: true,
      user: item,
      myself: false,
      media: mediaStatus[item.user_id] || { audio: false, video: false },
    })))
  ];

  return (
    <div className="d-flex flex-column w-100 vh-100">
      <div className="flex-grow-1 w-100 overflow-auto">
        <div class="video-masonry">
          {videos.map((item, index) => (
            <Video 
              key={index}
              index={index}
              item={item}
              count={videos.length}
            />
          ))}
        </div>
      </div>
      {local_stream ? (
        <Controls
          localAudio={local_audio}
          localVideo={local_video}
          localStream={local_stream}
          getStreamTrackStatus={getStreamTrackStatus}
        />
      ) : null}
    </div>
  );
}

export default Call;