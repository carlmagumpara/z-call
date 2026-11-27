import 'webrtc-adapter';
import { useState, useEffect, useRef } from 'react';
import { IoCopyOutline, IoCheckmarkOutline, IoPeopleOutline } from 'react-icons/io5';
import { socket } from '@/shared/socket';
import { iceConfig } from './config';
import Video from './components/video';
import SingleVideo from './components/single-video';
import VideoControls from './components/video-controls';
import { useRoom } from './room-context';
import { useVideoCall } from './video-call-context';
import './video.scss';

function Call() {
  const socket_id = socket.id;
  const { roomId, users } = useRoom();
  const {
    pc,
    local_stream,
    video_enabled,
    audio_enabled,
    screen_sharing,
    layout,
    initializeLocalStream,
    setLayout,
    media_status,
    setMediaStatus
  } = useVideoCall();
  const pendingCandidates = useRef({});
  const [selected, setSelected] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // The pre-join screen may have already acquired the camera/mic.
    if (!local_stream) initializeLocalStream();
  }, []);

  const updateRemoteStreams = async (peerId, remoteStream) => {
    if (!remoteStream) return;
    const videoTrack = remoteStream.getVideoTracks()[0];
    const audioTrack = remoteStream.getAudioTracks()[0];
    const remoteVideoEl = document.getElementById(`remote-video-${peerId}`);
    const remoteAudioEl = document.getElementById(`remote-audio-${peerId}`);
    if (remoteVideoEl && videoTrack) {
      remoteVideoEl.srcObject = new MediaStream([videoTrack]);
    }
    if (remoteAudioEl && audioTrack) {
      remoteAudioEl.srcObject = new MediaStream([audioTrack]);
    }
  };

  useEffect(() => {
    const localVideoEl = document.getElementById("local");
    if (localVideoEl) {
      localVideoEl.srcObject = local_stream;
    }

    Object.keys(pc.current || {}).forEach(peerId => {
      const remoteStream = pc.current[peerId].remoteStream;
      updateRemoteStreams(peerId, remoteStream);
    });
  }, [local_stream, layout]);

  useEffect(() => {

    const onTrack = (event, peerId) => {
      console.log('new track added: ', peerId);
      const remoteStream = event.streams[0];
      pc.current[peerId].remoteStream = remoteStream;
      updateRemoteStreams(peerId, remoteStream);
    };

    const onIceCandidate = (event, peerId) => {
      if (event.candidate) {
        socket.emit("ice-candidate", {
          to: peerId,
          candidate: event.candidate
        });
      }
    };

    const onIceConnectionStateChange = (newPc, peerId) => {
      console.log("ICE state:", newPc.iceConnectionState);
      if (newPc.iceConnectionState === "failed" ||
          newPc.iceConnectionState === "disconnected") {
        console.warn("Connection failed with", peerId);
        attemptReconnect(peerId);
      }
    };

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
      local_stream?.getTracks().forEach(track => newPc.addTrack(track, local_stream));
      newPc.ontrack = (event) => onTrack(event, peerId);
      newPc.onicecandidate = (event) => onIceCandidate(event, peerId);
      newPc.oniceconnectionstatechange = () => onIceConnectionStateChange(newPc, peerId);

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
        local_stream?.getTracks().forEach(track => conn.addTrack(track, local_stream));
        conn.ontrack = (event) => onTrack(event, from);
        conn.onicecandidate = (event) => onIceCandidate(event, from);
        conn.oniceconnectionstatechange = () => onIceConnectionStateChange(conn, from);
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

    const handleMediaStatus = ({ socket_id, data }) => {
      console.log('handleMediaStatus', data);
      setMediaStatus(prevState => ({
        ...prevState,
        [socket_id]: data
      }));
    };

    if (local_stream && users.length > 1) {
      setTimeout(() => {
        users
        .filter(item => item.socket_id !== socket_id)
        .forEach(item => startConnection(item.socket_id));
      }, 3000);
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
  }, [users, local_stream]);

  useEffect(() => {
    Object.keys(pc.current || {}).forEach(peerId => {
      const user = users.find(item => item.socket_id === peerId);
      if (!user) {
        console.log('Peer removed: ', peerId);
        pc.current[peerId].close();
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
  }, [video_enabled, audio_enabled, screen_sharing]);

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
    const defaultMedia = { screen_sharing: false, audio: false, video: false };
    const localVideo = getVideos().find(item => item.myself) || {
      id: socket_id,
      myself: true,
      user: { username: 'You' },
      media: defaultMedia,
    };
    const singleVideo = getVideos().find(item => item.id === selected);

    return (
      <SingleVideo
        selected={(selected && singleVideo) ? singleVideo : localVideo}
      />
    );
  };

  const onVideoSelect = item => {
    setLayout('single-grid');
    setSelected(item);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="call-page">
      <header className="call-topbar">
        <div className="call-topbar__room">
          <span className="call-topbar__dot" />
          <div>
            <span className="call-topbar__label">Room</span>
            <span className="call-topbar__code">{roomId}</span>
          </div>
        </div>

        <div className="call-topbar__right">
          <span className="call-topbar__count">
            <IoPeopleOutline />
            {users.length} {users.length === 1 ? 'person' : 'people'}
          </span>
          <button type="button" className="call-copy" onClick={copyLink}>
            {copied ? <IoCheckmarkOutline /> : <IoCopyOutline />}
            <span>{copied ? 'Copied!' : 'Copy link'}</span>
          </button>
        </div>
      </header>

      <div className={`call-stage call-stage--${layout}`}>
        {layout === 'grid' ? (
          <div className="call-grid">
            {getVideos().map(item => (
              <Video
                key={item.id}
                onVideoSelect={onVideoSelect}
                {...item}
              />
            ))}
          </div>
        ) : (
          <>
            <div className="main-video">{renderSingleVideo()}</div>
            <div className="side-videos">
              {getVideos().map(item => (
                <Video
                  key={item.id}
                  onVideoSelect={onVideoSelect}
                  {...item}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="call-dock">
        <VideoControls />
      </div>
    </div>
  );
}

export default Call;
