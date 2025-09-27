import { createContext, useContext, useState, useEffect } from 'react';

const Context = createContext();

export const useVideoCall = () => useContext(Context);

function VideoCallProvider({ children }) {

  // const [videoInputs, setVideoInputs] = useState([]);
  // const [audioInputs, setAudioInputs] = useState([]);
  // const [audioOutputs, setAudioOutputs] = useState([]);
  // const [localStream, setLocalStream] = useState(null);

  // const getMediaDevices = async (kind) => {
  //   if(!kind) return [];
  //   const devices = await navigator.mediaDevices.enumerateDevices();
  //   return devices.filter(device => device.kind === kind);
  // };

  // const getLocalStream = async () => {
  //   try {
  //     const localStream = await navigator.mediaDevices.getUserMedia({ 
  //       video: {
  //         width: { ideal: 1280 },
  //         height: { ideal: 720 },
  //         frameRate: { ideal: 30, max: 60 }
  //       },
  //       audio: true,
  //     });
  //     setLocalStream(localStream);
  //   } catch (err) {
  //     console.error("Failed to get local stream", err);
  //   }
  // };

  // useEffect(() => {
  //   const initMediaDevices = async () => {
  //     const videoinputs = await getMediaDevices('videoinput');
  //     const audioinputs = await getMediaDevices('audioinput');
  //     const audiooutputs = await getMediaDevices('audiooutput');

  //     setVideoInputs(videoinputs);
  //     setAudioInputs(audioinputs);
  //     setAudioOutputs(audiooutputs);
  //   };

  //   initMediaDevices();
  // }, []);

  return (
    <Context.Provider
      value={{
        // videoInputs,
        // audioInputs,
        // audioOutputs,
        // localStream,
        // getLocalStream
      }}
    >
      {children}
    </Context.Provider>
  )
}

export default VideoCallProvider;