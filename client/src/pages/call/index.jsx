import './video.scss';
import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { Container, Row, Col, Form, Button } from 'react-bootstrap';
import { socket } from '@/shared/socket';
import { usePresence } from '@/contexts/presence';
import Loading from '@/shared/loading';
import { Formik } from 'formik';
import * as Yup from 'yup';
import Call from './call';

function Room() {
  const { room_id } = useParams();
  const { user_id, username, setUserName } = usePresence();
  const [users, setUsers] = useState([]);
  const [joined, setJoined] = useState(false);
  const [media_status, setMediaStatus] = useState({});
  const [settings, setSettings] = useState({
    initialVideo: false,
    initialAudio: false,
  });

  useEffect(() => {
    
    const handleJoined = () => {
      console.log('handleUserJoin');
      setJoined(true);
    };

    const handleJoinRoom = data => {
      console.log('handleJoinRoom', );
      setUsers(prevState => ([
        ...prevState,
        data,
      ]));
    };

    const handleLeftRoom = data => {
      console.log('handleLeftRoom', data);
      setUsers(prevState => prevState.filter(item => item.user_id !== data.user_id));
    };

    const handleRoomUsers = data => {
      console.log('handleRoomUsers', data);
      setUsers(data);
    };

    const handleMediaStatus = ({ user_id, data }) => {
      setMediaStatus(prevState => ({
        ...prevState,
        [user_id]: data
      }));
    };

    const handleBeforeUnload = () => {
      socket.emit("leave", { 
        room_id,
        user_id,
        username
      });
    };

    socket.on("joining", handleJoinRoom);
    socket.on("leaving", handleLeftRoom);
    socket.on("here", handleRoomUsers);
    socket.on("joined", handleJoined);
    socket.on("media-status", handleMediaStatus);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      socket.off("joining", handleJoinRoom);
      socket.off("leaving", handleLeftRoom);
      socket.off("here", handleRoomUsers);
      socket.off("joined", handleJoined);
      socket.off("media-status", handleMediaStatus);
      handleBeforeUnload();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [room_id, user_id, username]);

  const onSubmit = async (values, { setSubmitting, setErrors }) => {
    setSettings({
      initialVideo: values.video,
      initialAudio: values.audio,
    });
    localStorage.setItem("username", values.username);
    setUserName(values.username);
    socket.emit("join", { 
      room_id, 
      user_id,
      username
    });
  };

  return (
    <div className="call-container">
      {!joined ? (
        <Container>
          <Formik
            initialValues={{
              username,
              video: false,
              audio: false,
            }}
            validationSchema={() => Yup.object().shape({
              username: Yup.string().required('Required'),
            })}
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
            setValues
           }) => (
              <Form 
                onSubmit={handleSubmit} 
                autoComplete="off"
              >
                <Row>
                  <Col 
                    md={{ span: 4, offset: 4 }} 
                    className="vh-100 d-flex justify-content-center align-items-center"
                  >
                    <div className="w-100">
                      <Form.Group className="mb-3">
                        <Form.Label>Username</Form.Label>
                        <Form.Control 
                          name="username"
                          placeholder="Username"
                          value={values.username}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          className={errors.username && touched.username && 'is-invalid'}
                        />
                        {errors.username && touched.username && <Form.Control.Feedback type="invalid">{errors.username}</Form.Control.Feedback>}
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Check
                          type="switch"
                          label="Enable Video"
                          checked={values.video}
                          onChange={() => setFieldValue('video', !values.video)}
                        />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Check
                          type="switch"
                          label="Enable Audio"
                          checked={values.audio}
                          onChange={() => setFieldValue('audio', !values.audio)}
                        />
                      </Form.Group>
                      <div
                        className="d-flex justify-content-end align-items-center"
                      >
                        <Button 
                          disabled={isSubmitting}
                          type="submit"
                          variant="danger"
                          className="w-100"
                        >
                          {isSubmitting ? 'Please wait...' : 'Join Room'}
                        </Button>
                      </div>
                    </div>
                  </Col>
                </Row>
              </Form>
            )}
          </Formik>
        </Container>
      ) : (
        <>
          {!users.length ? <Loading /> : (
            <Call
              {...settings}
              users={users}
              mediaStatus={media_status}
            />
          )}
        </>
      )}
    </div>
  )
}

export default Room;