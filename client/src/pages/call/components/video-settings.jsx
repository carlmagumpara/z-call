import { useEffect, useRef } from 'react';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { MdMic, MdMicOff, MdVideocam, MdVideocamOff } from 'react-icons/md';
import Logo from '@/assets/logo.png';

import { useRoom } from '../room-context';
import { useVideoCall } from '../video-call-context';

function VideoSettings({ user }) {
  const { roomId, joinRoom } = useRoom();
  const {
    local_stream,
    initializeLocalStream,
    setVideoEnabled,
    setAudioEnabled
  } = useVideoCall();
  const previewRef = useRef(null);

  useEffect(() => {
    initializeLocalStream();
  }, []);

  useEffect(() => {
    if (previewRef.current && local_stream) {
      previewRef.current.srcObject = local_stream;
    }
  }, [local_stream]);

  const onSubmit = async (values, { setSubmitting }) => {
    setVideoEnabled(values.video);
    setAudioEnabled(values.audio);
    joinRoom(user.user_id, values.username);
    setSubmitting(false);
  };

  return (
    <div className="prejoin">
      <Formik
        initialValues={{
          ...user,
          video: false,
          audio: false,
        }}
        validationSchema={() =>
          Yup.object().shape({
            username: Yup.string().required('Please enter your name'),
          })
        }
        onSubmit={onSubmit}
      >
        {({
          values,
          errors,
          touched,
          handleChange,
          handleBlur,
          handleSubmit,
          isSubmitting,
          setFieldValue,
        }) => (
          <form className="prejoin__card" onSubmit={handleSubmit} autoComplete="off">
            <img className="prejoin__logo" src={Logo} alt="zCall" />
            <h1 className="prejoin__title">Ready to join?</h1>
            <p className="prejoin__subtitle">Check your camera and mic before entering the room.</p>

            <div className="settings-video-container">
              <video ref={previewRef} muted autoPlay playsInline />
            </div>

            <div className="prejoin__field">
              <label htmlFor="username">Your name</label>
              <input
                id="username"
                name="username"
                placeholder="How should we call you?"
                value={values.username}
                onChange={handleChange}
                onBlur={handleBlur}
                className={errors.username && touched.username ? 'is-invalid' : ''}
              />
              {errors.username && touched.username && (
                <p className="prejoin__error">{errors.username}</p>
              )}
            </div>

            <div className="prejoin__toggles">
              <button
                type="button"
                className={`prejoin__toggle ${values.audio ? 'is-on' : 'is-off'}`}
                onClick={() => setFieldValue('audio', !values.audio)}
              >
                {values.audio ? <MdMic /> : <MdMicOff />}
                {values.audio ? 'Mic on' : 'Mic off'}
              </button>
              <button
                type="button"
                className={`prejoin__toggle ${values.video ? 'is-on' : 'is-off'}`}
                onClick={() => setFieldValue('video', !values.video)}
              >
                {values.video ? <MdVideocam /> : <MdVideocamOff />}
                {values.video ? 'Camera on' : 'Camera off'}
              </button>
            </div>

            <button type="submit" className="prejoin__submit" disabled={isSubmitting}>
              {isSubmitting ? 'Joining…' : `Join room ${roomId.slice(0, 8)}`}
            </button>
          </form>
        )}
      </Formik>
    </div>
  );
}

export default VideoSettings;
