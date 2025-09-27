import './video.scss';
import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { Container, Row, Col, Form, Button, Image, ButtonGroup } from 'react-bootstrap';
import { 
  FaVideo, 
  FaVideoSlash, 
  FaMicrophone, 
  FaMicrophoneSlash,
} from 'react-icons/fa';
import { socket } from '@/shared/socket';
import { usePresence } from '@/contexts/presence';
import Loading from '@/shared/loading';
import { Formik } from 'formik';
import * as Yup from 'yup';
import Call from './call';
import Logo from '@/assets/logo.png'

import VideoCallProvider from './video-call-context';
import RoomProvider from './room-context';

function Room() {
  const { room_id } = useParams();
  const { user_id, username, setUserName } = usePresence();
  const [users, setUsers] = useState([]);
  const [joined, setJoined] = useState(false);

  const [video, setVideo] = useState(false);
  const [audio, setAudio] = useState(false);

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
      setUsers(prevState => prevState.filter(item => item.socket_id !== data.socket_id));
    };

    const handleRoomUsers = data => {
      console.log('handleRoomUsers', data);
      setUsers(data);
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
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      socket.off("joining", handleJoinRoom);
      socket.off("leaving", handleLeftRoom);
      socket.off("here", handleRoomUsers);
      socket.off("joined", handleJoined);
      handleBeforeUnload();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [room_id, user_id, username]);

  const onSubmit = async (values, { setSubmitting, setErrors }) => {
    setVideo(values.video);
    setAudio(values.audio);
    setUserName(values.username);
    localStorage.setItem("username", values.username);
    socket.emit("join", { 
      room_id, 
      user_id,
      username
    });
  };

  return (
    <VideoCallProvider>
      <RoomProvider
        roomId={room_id}
        user={{
          user_id, 
          username,
        }}
      >
        

        <div>
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
                          <div
                            className="d-flex justify-content-center align-items-center mb-5"
                          >
                            <Image 
                              className="" 
                              src={Logo}
                              alt="logo"
                              style={{
                                width: 150
                              }}
                            />
                          </div>
                          <Form.Group className="mb-3">
                            <Form.Label className="text-white">Username</Form.Label>
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
                          <ButtonGroup
                            size="lg"
                            className=""
                          >
                            <Button
                              variant="secondary"
                              onClick={() => setFieldValue('audio', !values.audio)}
                            >
                              {values.audio ? <FaMicrophone /> : <FaMicrophoneSlash />}
                            </Button>
                            <Button
                              variant="secondary"
                              onClick={() => setFieldValue('video', !values.video)}
                            >
                              {values.video ? <FaVideo /> : <FaVideoSlash />}
                            </Button>
                          </ButtonGroup>
                          <div
                            className="d-flex justify-content-end align-items-center"
                          >
                            <Button 
                              type="submit"
                              variant="danger"
                              disabled={isSubmitting}
                            >
                              {isSubmitting ? 'Please wait...' : 'Join Call'}
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
                  initialVideo={video}
                  initialAudio={audio}
                  users={users}
                />
              )}
            </>
          )}
        </div>


      </RoomProvider>
    </VideoCallProvider>
  )
}

export default Room;