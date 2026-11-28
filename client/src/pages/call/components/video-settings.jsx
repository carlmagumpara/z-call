import { useEffect, useRef } from 'react';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { MdMic, MdMicOff, MdVideocam, MdVideocamOff } from 'react-icons/md';
import Logo from '@/assets/logo.png';

import { useRoom } from '../room-context';
import { useVideoCall } from '../video-call-context';
import PrejoinToggle from './prejoin-toggle';

function VideoSettings({ user }) {
  const { roomId, joinRoom } = useRoom();
  const {
    local_stream,
    initializeLocalStream,
    setTrackEnabled
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

  const toggleTrack = (type, enabled, setFieldValue) => {
    setFieldValue(type, enabled);
    // Enable/disable the real track so the preview shows video immediately.
    setTrackEnabled(type, enabled);
  };

  const onSubmit = async (values, { setSubmitting }) => {
    setTrackEnabled('audio', values.audio);
    setTrackEnabled('video', values.video);
    joinRoom(user.user_id, values.username);
    setSubmitting(false);
  };

  return (
    <div className="grid min-h-dvh place-items-center bg-prejoin-bg p-6 text-ink">
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
          <form
            className="w-full max-w-440 rounded-3xl border border-stroke bg-surface-soft p-8 shadow-prejoin-card backdrop-blur-lg max-[420px]:px-5 max-[420px]:py-6"
            onSubmit={handleSubmit}
            autoComplete="off"
          >
            <img className="mx-auto mb-[18px] block w-[84px]" src={Logo} alt="zCall" />
            <h1 className="m-0 text-center text-[1.8rem] font-750 tracking-[-0.03em]">Ready to join?</h1>
            <p className="mb-6 mt-2 text-center text-[0.92rem] text-muted">Check your camera and mic before entering the room.</p>

            <div className="aspect-video w-full overflow-hidden rounded-14 border border-stroke bg-void">
              <video className="block h-full w-full -scale-x-100 object-cover" ref={previewRef} muted autoPlay playsInline />
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-[0.85rem] text-slate-label" htmlFor="username">Your name</label>
              <input
                id="username"
                name="username"
                className={`min-h-input w-full rounded-10 border bg-surface-input px-[14px] text-[0.95rem] text-ink outline-none focus:border-accent-input-border ${
                  errors.username && touched.username ? 'border-danger' : 'border-stroke-strong'
                }`}
                placeholder="How should we call you?"
                value={values.username}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              {errors.username && touched.username && (
                <p className="mb-0 mt-1.5 text-[0.82rem] text-danger-soft">{errors.username}</p>
              )}
            </div>

            <div className="mb-[22px] mt-[18px] flex gap-2.5">
              <PrejoinToggle
                active={values.audio}
                onClick={() => toggleTrack('audio', !values.audio, setFieldValue)}
                onIcon={<MdMic />}
                offIcon={<MdMicOff />}
                onLabel="Mic on"
                offLabel="Mic off"
              />
              <PrejoinToggle
                active={values.video}
                onClick={() => toggleTrack('video', !values.video, setFieldValue)}
                onIcon={<MdVideocam />}
                offIcon={<MdVideocamOff />}
                onLabel="Camera on"
                offLabel="Camera off"
              />
            </div>

            <button
              type="submit"
              className="min-h-submit w-full cursor-pointer rounded-xl border-0 bg-cta text-base font-semibold text-white disabled:cursor-wait disabled:opacity-60"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Joining…' : `Join room ${roomId.slice(0, 8)}`}
            </button>
          </form>
        )}
      </Formik>
    </div>
  );
}

export default VideoSettings;
