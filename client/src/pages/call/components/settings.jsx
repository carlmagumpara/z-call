import React from 'react';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { Container, Row, Col, Form, Button, ButtonGroup, Image } from 'react-bootstrap';
import { FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash } from 'react-icons/fa';
import Logo from '@/assets/logo.png'

function Settings() {

  const onSubmit = async (values, { setSubmitting, setErrors }) => {
    // setVideo(values.video);
    // setAudio(values.audio);
    // setUserName(values.username);
    // localStorage.setItem("username", values.username);
    // socket.emit("join", { 
    //   room_id, 
    //   user_id,
    //   username
    // });
  };

  return (
    <Container>
      <Formik
        initialValues={{
          username: '',
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
  )
}