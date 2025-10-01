import adapter from 'webrtc-adapter';
import { useState, useEffect, useRef, Fragment } from 'react';
import { Container, Button, ButtonGroup } from 'react-bootstrap';
import { socket } from '@/shared/socket';
import { iceConfig } from './config';
import Video from './components/video';
import SingleVideo from './components/single-video';
import VideoControls from './components/video-controls';
import { useRoom } from './room-context';
import { useVideoCall } from './video-call-context';

function Call() {
  const initilize = useRef(false);
  const socket_id = socket.id;
  const { roomId, users } = useRoom();
  const {
    pc,
    audio,
    video_input_device_id,
    audio_input_device_id,
    audio_output_device_id,
    local_stream,
    screen_stream,
    video_enabled, 
    audio_enabled,
    screen_sharing,
    layout,
    initializeLocalStream,
    setupScreenShare,
    setTrackEnabled,
    setLayout,
    media_status, 
    setMediaStatus,
  } = useVideoCall();
  const pendingCandidates = useRef({});
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    initializeLocalStream();
  }, []);

  const updateRemoteStreams = async (peerId, remoteStream, type) => {
    console.log('updateRemoteStreams', peerId, remoteStream, type);

    if(type === 'main') {
      const videoTrack = remoteStream.getVideoTracks()[0];
      const audioTrack = remoteStream.getAudioTracks()[0];
      const remoteVideoEl = document.getElementById(`remote-video-${peerId}`);
      const remoteAudioEl = document.getElementById(`remote-audio-${peerId}`);
      if (remoteVideoEl) {
        remoteVideoEl.srcObject = new MediaStream([videoTrack]);
      };
      if(remoteAudioEl) {
        remoteAudioEl.srcObject = new MediaStream([audioTrack]);
      }
    }

    if(type === 'screen') {
      const videoTrack = remoteStream.getVideoTracks()[0];
      const remoteVideoEl = document.getElementById(`remote-screen-${peerId}`);
      if (remoteVideoEl) {
        remoteVideoEl.srcObject = new MediaStream([videoTrack]);
      };
    }
  };

  useEffect(() => {
    const localVideoEl = document.getElementById('local-video');
    const localScreenVideoEl = document.getElementById('local-screen');
    if (localVideoEl) {
      localVideoEl.srcObject = local_stream;
    };
    if (localScreenVideoEl) {
      localScreenVideoEl.srcObject = screen_stream;
    };
    Object.keys(pc.current || {}).forEach(peerId => {
      for (const type of ['main', 'screen']) {
        const remoteStream = pc.current[peerId]?.[type]?.remoteStream;
        if(remoteStream) {
          updateRemoteStreams(peerId, remoteStream, type);
        }
      }
    });
  }, [local_stream, screen_stream, layout]);

  const onTrack = (event, peerId, type) => {
    console.log('new track added: ', peerId, type);
    const remoteStream = event.streams[0];
    if(pc.current[peerId]?.[type]) {
      pc.current[peerId][type].remoteStream = remoteStream;
      updateRemoteStreams(peerId, remoteStream, type);
    }
  };

  const onIceCandidate = (event, peerId, type) => {
    if (event.candidate) {
      socket.emit("ice-candidate", { 
        to: peerId, 
        candidate: event.candidate,
        type
      });
    }
  };

  const onIceConnectionStateChange = (conn, peerId, type) => {
    console.log("ICE state:", conn.iceConnectionState, type);
    if (conn.iceConnectionState === "failed" ||
        conn.iceConnectionState === "disconnected") {
      console.warn("Connection failed with", peerId);
      if(type === 'screen') {
        if (pc.current[peerId]) {
          const remoteVideoEl = document.getElementById(`remote-screen-${peerId}`);
          if (remoteVideoEl) {
            remoteVideoEl.srcObject = null;
          };
          if(selected?.[0] === peerId) {
            setSelected(null);
          }
        }
      }
      attemptReconnect(peerId, type);
    }
  };

  const attemptReconnect = async (peerId, type, retries = 10, delay = 1000) => {
    console.log(`Attempting reconnect to ${peerId}, retries left: ${retries}`, type);
    const conn = pc.current[peerId]?.[type];
    const state = conn?.iceConnectionState;

    if (!conn || ["closed", "disconnected", "failed"].includes(state)) {
      return rebuildPeerConnection(peerId, type);
    }

    if (retries <= 0) {
      console.log("Failed to reconnect", peerId, type);
      return rebuildPeerConnection(peerId, type);
    }

    try {
      const offer = await conn.createOffer({ iceRestart: true });
      await conn.setLocalDescription(offer);
      socket.emit("offer", { to: peerId, sdp: offer, type });
      console.log("ICE restart triggered for", peerId, type);
    } catch (err) {
      console.error("ICE restart failed, rebuilding connection", err);
      return rebuildPeerConnection(peerId, type); 
    }

    setTimeout(() => attemptReconnect(peerId, type, retries - 1, delay), delay);
  };

  const createPeerConnection = async (peerId, type) => {
    console.log('createPeerConnection', peerId, type);
    if (pc.current[peerId]?.[type]) return;
    pc.current[peerId] ??= {};
    pc.current[peerId][type] = new RTCPeerConnection(iceConfig);
    const conn = pc.current[peerId][type];
    if(type === 'main') {
      local_stream?.getTracks().forEach(track => conn.addTrack(track, local_stream));
    }
    if(type === 'screen') {
      screen_stream?.getTracks().forEach(track => conn.addTrack(track, screen_stream));
    }
    conn.ontrack = (event) => onTrack(event, peerId, type);
    conn.onicecandidate = (event) => onIceCandidate(event, peerId, type);
    conn.oniceconnectionstatechange = () => onIceConnectionStateChange(conn, peerId, type);
    console.log("Created RTCPeerConnection for:", peerId, type);
  };

  const startConnection = async (peerId, type) => {
    console.log('startConnection', peerId, type);
    createPeerConnection(peerId, type);
    const conn = pc.current[peerId]?.[type];
    if (!conn) return;

    const offer = await conn.createOffer();
    await conn.setLocalDescription(offer);

    socket.emit("offer", { 
      to: peerId, 
      sdp: offer,
      type
    });
  };

  const rebuildPeerConnection = async (peerId, type) => {
    console.log('rebuildPeerConnection', peerId, type);
    if (pc.current[peerId]?.[type]) {
      pc.current[peerId][type].close();
      delete pc.current[peerId];
    }
    await startConnection(peerId, type);
  };

  const initializePeersConnection = async (type) => {
    await Promise.all(
      users
        .filter(item => item.socket_id !== socket_id)
        .map(item => startConnection(item.socket_id, type))
    );
  }

  useEffect(() => {

    const handleOffer = async ({ from, sdp, type }) => {
      try {
        console.log('handleOffer', from, type);
        const conn = pc.current[from]?.[type] || new RTCPeerConnection(iceConfig);

        console.log(conn, !pc.current[from]?.[type]);

        if (!pc.current[from]?.[type]) {
          pc.current[from] ??= {};
          pc.current[from][type] = conn;
          if(type === 'main') {
            local_stream?.getTracks().forEach(track => conn.addTrack(track, local_stream));
          }
          if(type === 'screen') {
            screen_stream?.getTracks().forEach(track => conn.addTrack(track, screen_stream));
          }
          conn.ontrack = (event) => onTrack(event, from, type);
          conn.onicecandidate = (event) => onIceCandidate(event, from, type);
          conn.oniceconnectionstatechange = () => onIceConnectionStateChange(conn, from, type);
        }

        await conn.setRemoteDescription(new RTCSessionDescription(sdp));
        const answer = await conn.createAnswer();
        await conn.setLocalDescription(answer);
        socket.emit("answer", { to: from, sdp: answer, type });

        if (pendingCandidates.current[from]?.[type]?.length) {
          for (const candidate of pendingCandidates.current[from][type]) {
            try {
              const iceCandidate = candidate instanceof RTCIceCandidate 
                ? candidate 
                : new RTCIceCandidate(candidate);

              if (conn.remoteDescription && conn.remoteDescription.type) {
                await conn.addIceCandidate(iceCandidate);
                console.log("Added queued ICE candidate from:", from, type);
              } else {
                console.warn("Remote description not set yet, keeping candidate:", from, type);
                break;
              }
            } catch (err) {
              console.error("Error adding queued candidate", err, candidate);
            }
          }

          delete pendingCandidates.current[from][type];
        }
      } catch (err) {
        console.warn(err);
      }
    };

    const handleAnswer = async ({ from, sdp, type }) => {
      console.log('handleAnswer', from, type);
      const conn = pc.current[from]?.[type];
      if (conn) {
        try {
          if (conn.signalingState === "have-local-offer") {
            await conn.setRemoteDescription(new RTCSessionDescription(sdp));
            console.log("Remote answer set for:", from, type);
          } else {
            console.warn("Skipping answer because state is", conn.signalingState, type);
          }

          if (pendingCandidates.current[from]?.[type]?.length) {
            for (const candidate of pendingCandidates.current[from][type]) {
              try {
                if (!conn.remoteDescription || !conn.remoteDescription.type) {
                  console.warn("Remote description not set yet, skipping candidate:", candidate);
                  continue;
                }

                const iceCandidate = candidate instanceof RTCIceCandidate
                  ? candidate
                  : new RTCIceCandidate(candidate);

                await conn.addIceCandidate(iceCandidate);
                console.log("Added queued ICE candidate from:", from, type);
              } catch (err) {
                console.error("Error adding queued candidate from answer handler", err, type, candidate);
              }
            }

            delete pendingCandidates.current[from][type];
          }
        } catch (err) {
          console.warn("Failed to set remote description for answer", from, err, type);
        }
      }
    };

    const handleIceCandidate = async ({ from, candidate, type }) => {
      console.log('handleIceCandidate', from, type);
      const conn = pc.current[from]?.[type];
      if (!conn) {
        console.warn("Peer connection not found for ICE candidate from:", from, type);
        return;
      }
      
      if (conn.remoteDescription) {
        try {
          await conn.addIceCandidate(new RTCIceCandidate(candidate));
          console.log("Added ICE candidate from:", from, type);
        } catch (err) {
          console.error("Error adding ICE candidate", err);
        }
      } else {
        if (!conn.remoteDescription || !conn.remoteDescription.type) {
          if (!pendingCandidates.current[from]) {
            pendingCandidates.current[from] = {};
          }
          if (!pendingCandidates.current[from][type]) {
            pendingCandidates.current[from][type] = [];
          }
          pendingCandidates.current[from][type].push(candidate);
          console.log("Queued ICE candidate from:", from, type);
        }
      }
    };

    const handleMediaStatus = ({ socket_id, data }) => {
      console.log('handleMediaStatus', data);
      setMediaStatus(prevState => ({
        ...prevState,
        [socket_id]: data
      }));
    };

    if (local_stream && users.length > 1) {
      setTimeout(() => initializePeersConnection('main'), 3000);
    }

    if(screen_stream && users.length > 1) {
      setTimeout(() => initializePeersConnection('screen'), 3000);
    }

    socket.on("offer", handleOffer);
    socket.on("answer", handleAnswer);
    socket.on("ice-candidate", handleIceCandidate);
    socket.on("media-status", handleMediaStatus);

    return () => {
      socket.off("offer", handleOffer);
      socket.off("answer", handleAnswer);
      socket.off("ice-candidate", handleIceCandidate);
      socket.off("media-status", handleMediaStatus);
    };
  }, [users, local_stream, screen_stream]);

  useEffect(() => {
    Object.keys(pc.current || {}).forEach(peerId => {
      const user = users.find(item => item.socket_id === peerId);
      if (!user) {
        console.log('Peer removed: ', peerId);
        for (const type of ['main', 'screen']) {
          pc.current[peerId]?.[type]?.close();
        }
        delete pc.current[peerId];
      }
    });
  }, [users]);

  useEffect(() => {
    console.log('Send media status...');
    socket.emit("media-status", {
      room_id: roomId,
      data: {
        screen_sharing,
        video: video_enabled || false,
        audio: audio_enabled || false,
      }
    });
  }, [users, video_enabled, audio_enabled, screen_sharing]);

  const getVideos = () => {
    const defaultMedia = {
      screen_sharing: false,
      audio: false, 
      video: false 
    };

    return users
    .map(item => ({
      id: item.socket_id,
      myself: item.socket_id === socket_id,
      user: item,
      media: media_status[item.socket_id] || defaultMedia,
    }));
  };

  const renderSingleVideo = () => {
    const localVideo = getVideos().find(item => item.myself);
    const singleVideo = getVideos().find(item => item.id === selected?.[0]);

    return (
      <SingleVideo 
        type={selected?.[1]}
        selected={singleVideo ?? localVideo}
      />
    );
  };

  const onVideoSelect = item => {
    setLayout('single-grid');
    setSelected(item);
  };

  return (
    <div 
      className=""
    >
      <div className="video-call-container">
        {layout === 'grid' ? (
          <div className="video-call-container-grid">
            <div className="video-masonry">
              {getVideos().map(item => (
                <Fragment key={item.id}>
                  <Video
                    type="video"
                    onVideoSelect={onVideoSelect}
                    {...item}
                  />
                  <Video
                    type="screen"
                    onVideoSelect={onVideoSelect}
                    {...item}
                  />
                </Fragment>
              ))}
            </div>
          </div>
        ) : (
          <div className="video-call-container-single-grid">
            <div className="main-video">
              {renderSingleVideo()}
            </div>
            <div className="side-videos">
              {getVideos().map(item => (
                <Fragment key={item.id}>
                  <Video
                    type="video"
                    onVideoSelect={onVideoSelect}
                    {...item}
                  />
                  <Video
                    type="screen"
                    onVideoSelect={onVideoSelect}
                    {...item}
                  />
                </Fragment>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="video-call-controls-container">
        <div
          className=""
        >
          <VideoControls  />
        </div>
      </div>
    </div>
  );
}

export default Call;