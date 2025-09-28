import { useEffect } from "react";

function useStreamTrackEvents(localStream) {
  useEffect(() => {
    if (!localStream) return;

    localStream.onaddtrack = (event) => {
      console.log("Track added:", event.track.kind);
      attachTrackListeners(event.track);
    };

    localStream.onremovetrack = (event) => {
      console.log("Track removed:", event.track.kind);
    };

    localStream.getTracks().forEach(track => {
      attachTrackListeners(track);
    });

    function attachTrackListeners(track) {
      track.onmute = () => console.log(`${track.kind} muted`);
      track.onunmute = () => console.log(`${track.kind} unmuted`);
      track.onended = () => console.log(`${track.kind} ended`);
    }

    return () => {
      localStream.getTracks().forEach(track => {
        track.onmute = null;
        track.onunmute = null;
        track.onended = null;
      });
      localStream.onaddtrack = null;
      localStream.onremovetrack = null;
    };
  }, [localStream]);
}

export default useStreamTrackEvents;
