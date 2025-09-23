import { useNavigate } from 'react-router';
import { Container, Button } from 'react-bootstrap';
import { IoHeart } from 'react-icons/io5';
import { BsFillSendArrowUpFill } from 'react-icons/bs';
import { IoDocumentLock } from 'react-icons/io5';
import CountUp from 'react-countup';
import { usePresence } from '@/contexts/presence';
import { useGlobalModal, MODAL_TYPES } from '@/contexts/global-modal';
import { v4 as uuidv4 } from 'uuid';

function Landing() {
  const navigate = useNavigate();
  const { handleShow } = useGlobalModal();
  const { user_id, users } = usePresence();

  return (
    <div className="radar-container">
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
            <div className="text-center">
              <h1 className="display-1 animate__animated animate__flipInX fw-bolder">zCall</h1>
              <h3 className="mb-5 animate__animated animate__flipInX animate__delay-1s">
                lorem ipsum dolor sit amet, consectetur adipiscing elit.
              </h3>
              <div className="mb-2">
                <Button
                  size="lg"
                  onClick={() => navigate(`/r/${uuidv4()}`)}
                >
                  <BsFillSendArrowUpFill /> Get Started
                </Button>
              </div>
            </div>
          </div>
        </div>
        <footer className="text-center">
          <p className="footer-heart">
            Made with <IoHeart color="#ff0000" /> by <a target="_blank" rel="noopener" href="https://github.com/carlmagumpara">carlmagumpara</a>
          </p>
        </footer>
      </div>
    </div>
  )
}

export default Landing;