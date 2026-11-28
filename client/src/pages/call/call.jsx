import 'webrtc-adapter';
import { useState, useEffect, useRef } from 'react';
import { IoCopyOutline, IoCheckmarkOutline, IoPeopleOutline, IoChatbubbleOutline } from 'react-icons/io5';
import { socket } from '@/shared/socket';
import { iceConfig } from './config';
import { useChat } from '@/hooks/use-chat';
import Video from './components/video';
import SingleVideo from './components/single-video';
import VideoControls from './components/video-controls';
import ChatPanel from './components/chat';
import { useRoom } from './room-context';
import { useVideoCall } from './video-call-context';

function Call() {
  const socket_id = socket.id;
  const { roomId, users } = useRoom();
  const { unreadCount } = useChat();
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
  const selectedRef = useRef(null);
  const selectedTrackRef = useRef(null);
  const [selected, setSelected] = useState(null);
  const [copied, setCopied] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [streamsVersion, setStreamsVersion] = useState(0);
  selectedRef.current = selected;

  useEffect(() => {
    // The pre-join screen may have already acquired the camera/mic.
    if (!local_stream) initializeLocalStream();
  }, []);

  const updateRemoteStreams = (peerId, remoteStream) => {
    if (!remoteStream) return;
    const videoTrack = remoteStream.getVideoTracks()[0];
    const audioTrack = remoteStream.getAudioTracks()[0];
    const remoteVideoEl = document.getElementById(`remote-video-${peerId}`);
    const remoteAudioEl = document.getElementById(`remote-audio-${peerId}`);

    if (remoteVideoEl && videoTrack && remoteVideoEl.srcObject?.getVideoTracks?.()[0] !== videoTrack) {
      remoteVideoEl.srcObject = new MediaStream([videoTrack]);
    }
    if (remoteAudioEl && audioTrack && remoteAudioEl.srcObject?.getAudioTracks?.()[0] !== audioTrack) {
      remoteAudioEl.srcObject = new MediaStream([audioTrack]);
    }
  };

  // Re-attach streams whenever the tiles are re-rendered or a track arrives.
  // Without this, a <video> that mounts after ontrack can stay black.
  useEffect(() => {
    const localVideoEl = document.getElementById("local");
    if (localVideoEl && local_stream && localVideoEl.srcObject !== local_stream) {
      localVideoEl.srcObject = local_stream;
    }

    const selectedVideoEl = document.getElementById('selected');
    if (selectedVideoEl) {
      const focusedId = selectedRef.current;
      const selectedId = users.some(user => user.socket_id === focusedId) ? focusedId : null;
      if (!selectedId) {
        // No peer focused: speaker view shows your own camera.
        if (local_stream && selectedVideoEl.srcObject !== local_stream) {
          selectedVideoEl.srcObject = local_stream;
        }
        selectedTrackRef.current = null;
      } else {
        const remoteStream = pc.current[selectedId]?.remoteStream;
        const track = remoteStream?.getVideoTracks?.()[0] || null;
        if (track !== selectedTrackRef.current) {
          selectedTrackRef.current = track;
          selectedVideoEl.srcObject = track ? new MediaStream([track]) : null;
        }
      }
    }

    Object.keys(pc.current || {}).forEach(peerId => {
      const remoteStream = pc.current[peerId].remoteStream;
      updateRemoteStreams(peerId, remoteStream);
    });
  }, [local_stream, layout, users, selected, streamsVersion]);

  useEffect(() => {

    const onTrack = (event, peerId) => {
      console.log('new track added: ', peerId);
      const remoteStream = event.streams[0];
      pc.current[peerId].remoteStream = remoteStream;
      updateRemoteStreams(peerId, remoteStream);
      setStreamsVersion(version => version + 1);
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
        // While sharing, the live screen track replaces the camera track.
        video: video_enabled || screen_sharing,
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
    <div className="flex h-dvh min-h-page flex-col gap-3 bg-call-bg p-3 font-sans text-ink max-[760px]:min-h-0 max-[760px]:gap-2 max-[760px]:p-2">
      <header className="flex min-h-topbar shrink-0 items-center justify-between gap-3 rounded-2xl border border-stroke bg-surface px-4 py-2.5 backdrop-blur-14 max-[760px]:min-h-topbar-sm max-[760px]:px-3 max-[760px]:py-2">
        <div className="flex min-w-0 items-center gap-3">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-success shadow-dot" />
          <div className="flex min-w-0 flex-col">
            <span className="text-11 uppercase tracking-[0.08em] text-muted">Room</span>
            <span className="max-w-[min(52vw,420px)] truncate whitespace-nowrap text-sm font-semibold">{roomId}</span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-13 text-muted [&>svg]:text-[1.1rem] max-[760px]:hidden">
            <IoPeopleOutline />
            {users.length} {users.length === 1 ? 'person' : 'people'}
          </span>
          <button
            type="button"
            className="relative inline-flex min-h-copy cursor-pointer items-center gap-2 rounded-10 border border-stroke bg-surface-strong px-[14px] text-13 font-medium text-ink transition-colors duration-200 hover:border-accent-hover-border hover:bg-accent-hover-bg max-[420px]:px-[11px]"
            onClick={() => setChatOpen(true)}
            aria-label={unreadCount ? `Open chat, ${unreadCount} unread` : 'Open chat'}
          >
            <IoChatbubbleOutline />
            <span className="max-[420px]:hidden">Chat</span>
            {unreadCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 inline-flex min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-10 font-semibold text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
          <button
            type="button"
            className="inline-flex min-h-copy cursor-pointer items-center gap-2 rounded-10 border border-stroke bg-surface-strong px-[14px] text-13 font-medium text-ink transition-colors duration-200 hover:border-accent-hover-border hover:bg-accent-hover-bg max-[420px]:px-[11px]"
            onClick={copyLink}
          >
            {copied ? <IoCheckmarkOutline /> : <IoCopyOutline />}
            <span className="max-[420px]:hidden">{copied ? 'Copied!' : 'Copy link'}</span>
          </button>
        </div>
      </header>

      <div className={`flex min-h-0 flex-1 ${layout === 'grid' ? '' : 'flex-col gap-3'}`}>
        {layout === 'grid' ? (
          <div className="grid h-full w-full grid-cols-[repeat(auto-fit,minmax(min(280px,100%),1fr))] auto-rows-min content-center gap-3 overflow-y-auto p-0.5 [scrollbar-width:thin] max-[760px]:grid-cols-1 max-[760px]:content-start">
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
            <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-18 border border-stroke bg-void">
              {renderSingleVideo()}
            </div>
            <div className="flex max-w-full shrink-0 gap-2.5 overflow-x-auto overflow-y-hidden px-0.5 pb-2 pt-0.5 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] [&>div]:basis-[190px] [&>div]:shrink-0 max-[760px]:[&>div]:basis-[140px]">
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

      <div className="flex shrink-0 justify-center rounded-2xl border border-stroke bg-surface p-2 backdrop-blur-14">
        <VideoControls />
      </div>

      <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}

export default Call;
