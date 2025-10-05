import { useNavigate } from 'react-router';
import { IoHeart } from 'react-icons/io5';
import { usePresence } from '@/contexts/presence';
import { useGlobalModal, MODAL_TYPES } from '@/contexts/global-modal';
import { v4 as uuidv4 } from 'uuid';
import Logo from '@/assets/logo.png';

function Landing() {
  const navigate = useNavigate();
  const { handleShow } = useGlobalModal();
  const { user_id, users } = usePresence();

  return (
    <div
      className="w-100 vh-100 d-flex flex-column"
    >
      <div 
        className="w-100 flex-grow-1"
        style={{
          zIndex: 999
        }}
      >
        <div className="d-flex justify-content-center align-items-center h-100 w-100">
          <div className="text-center p-3">
            <div className="d-flex justify-content-center align-items-center mb-3">
              <img
                src={Logo}
                alt="logo"
                style={{ 
                  width: 150,
                  height: 150
                }}
              />
            </div>
            <h3 className="mb-3 text-center">
              Free video. Secure screens. Instant chat.
            </h3>
            <button
              className="btn px-3 py-2"
              onClick={() => navigate(`/r/${uuidv4()}`)}
            >
              Get Started
            </button>
          </div>
        </div>
      </div>
      <footer className="text-center">
        <p className="footer-heart">
          Made with <IoHeart color="#ff0000" className="svg-inline" /> by <a target="_blank" rel="noopener" href="https://github.com/carlmagumpara">carlmagumpara</a>
        </p>
      </footer>
    </div>
  )
}

export default Landing;