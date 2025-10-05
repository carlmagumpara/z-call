import { useEffect } from 'react';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { MdSend } from 'react-icons/md';
import { BeatLoader } from 'react-spinners';
import { useChat } from '../chat-context';
import { usePresence } from '@/contexts/presence';
import Avatar from '@/assets/avatar-3814081_1280.png';
import moment from 'moment';

function Chat() {
  const { messages, sendMessage, isTyping, typing, bottomRef, scrollToBottom } = useChat();
  const { user_id, username } = usePresence();

  useEffect(() => {
    scrollToBottom('auto');
  }, []);

  const onSubmit = async (values, { setSubmitting, resetForm }) => {
    sendMessage(values.message);
    scrollToBottom();
    resetForm();
  };

  const formatTime = (date) => {
    const diffInSeconds = moment().diff(moment(date), "seconds");
    if (diffInSeconds < 5) {
      return "just now";
    }

    return moment(date).fromNow();
  };

  return (
    <div className="vc-chat-container">
      <div className="vc-chat-history">
        {messages.map(item => (
          <div 
            key={item.id}
            className={`chat-bubble-wrapper ${item.user_id === user_id ? 'right-message' : 'left-message'}`}
          >
            <div className="chat-bubble">
              <div className="chat-avatar">
                <div className="avatar-container">
                  <img
                    src={Avatar}
                  />
                </div>
              </div>
              <div className="chat-content">
                <p className="username">{`${item.user_id === user_id ? 'You' : item.username}, ${formatTime(item.datetime)}`}</p>
                <div className="message">
                  <p><pre>{item.message}</pre></p>
                </div>
              </div>
            </div>
          </div>
        ))}
        {typing.map(item => (
          <div 
            key={item.id}
            className="chat-bubble-wrapper right-message"
          >
            <div className="chat-bubble">
              <div className="chat-avatar">
                <img
                  src={Avatar}
                />
              </div>
              <div className="chat-content">
                <div className="message">
                  <p><BeatLoader size={5} /></p>
                </div>
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <Formik
        initialValues={{
          message: ''
        }}
        validationSchema={() =>
          Yup.object().shape({
            message: Yup.string().required('Required'),
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
            <div className="vc-chat-input input-group">
              <textarea
                type="text"
                name="message" 
                autoComplete="off"
                spellCheck="false"
                placeholder="Write your message..." 
                value={values.message}
                onChange={event => {
                  isTyping();
                  setFieldValue(
                    event.target.name, 
                    event.target.value
                  );
                }}
                onBlur={handleBlur}
                rows="2" 
                // cols="50"
                className={`input px-3 py-2 ${errors.message && touched.message && 'is-invalid'}`}
              ></textarea>
              <button
                type="submit"
                className="btn px-2"
              >
                <MdSend />
              </button>
            </div>
          </form>
        )}
      </Formik>
    </div>
  )
}

export default Chat;