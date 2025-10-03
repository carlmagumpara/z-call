import React from 'react';
import { Formik } from 'formik';
import { IoHeart } from 'react-icons/io5';
import * as Yup from 'yup';
import { MdMic, MdMicOff, MdVideocam, MdVideocamOff } from 'react-icons/md';

import { useRoom } from '../room-context';
import { useVideoCall } from '../video-call-context';

function VideoSettings({ user }) {
  const { joinRoom } = useRoom();
  const { setVideoEnabled, setAudioEnabled } = useVideoCall();

  const onSubmit = async (values, { setSubmitting }) => {
    setVideoEnabled(values.video);
    setAudioEnabled(values.audio);
    joinRoom(user.user_id, values.username);
  };

  return (
    <div className="vc-settings">
      <div
        className="w-100 vh-100 d-flex flex-column"
      >
        <div 
          className="w-100 flex-grow-1"
          style={{
            zIndex: 999
          }}
        >
          <div className="w-100 d-flex justify-content-center align-items-center h-100">

              <Formik
                initialValues={{
                  ...user,
                  video: false,
                  audio: false,
                }}
                validationSchema={() =>
                  Yup.object().shape({
                    username: Yup.string().required('Required'),
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
                  <form onSubmit={handleSubmit} autoComplete="off">
                    <div className="w-100">
                      <div className="input-group mb-3" style={{ height: 50 }}>
                        <input
                          name="username"
                          placeholder="Username"
                          value={values.username}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          className={`input px-3 ${errors.username && touched.username && 'is-invalid'}`}
                        />
                        <button
                          type="button"
                          className="btn px-3"
                          onClick={() => setFieldValue('audio', !values.audio)}
                        >
                          {values.audio ? <MdMic /> : <MdMicOff />}
                        </button>
                        <button
                          type="button"
                          className="btn px-3"
                          onClick={() => setFieldValue('video', !values.video)}
                        >
                          {values.video ? <MdVideocam /> : <MdVideocamOff />}
                        </button>
                      </div>

{/*                      {errors.username && touched.username && (
                        <span type="invalid">
                          {errors.username}
                        </span>
                      )}*/}
                      <>
                      </>
                      <div className="d-flex justify-content-end align-items-center">
                        <button
                          type="submit"
                          className="btn px-3 py-2"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? 'Please wait...' : 'Join Call'}
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </Formik>

          </div>
        </div>
        <footer className="text-center">
          <p className="footer-heart">
            Made with <IoHeart color="#ff0000" className="svg-inline" /> by <a target="_blank" rel="noopener" href="https://github.com/carlmagumpara">carlmagumpara</a>
          </p>
        </footer>
      </div>
    </div>
  );
}

export default VideoSettings;
