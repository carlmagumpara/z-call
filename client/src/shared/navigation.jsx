import { Container, Nav, Navbar, NavDropdown, Image } from 'react-bootstrap';
import { Link } from 'react-router';
import Avatar from 'boring-avatars';
import Logo from '@/assets/logo.png'
import { usePresence } from '@/contexts/presence';
import { useGlobalModal, MODAL_TYPES } from '@/contexts/global-modal';

function Navigation() {
  const { handleShow } = useGlobalModal();
  const { user_id } = usePresence();

  return (
    <Navbar
      expand="lg"
      fixed="top"
    >
      <Container
        fluid
      >
        <Navbar.Brand 
          as={Link} 
          to={`/`} 
          className="cursor-pointer d-flex justify-content-center align-items-center gap-2"
        >
          <Image 
            className="" 
            src={Logo}
            alt="lexmeet"
            style={{
              width: 40
            }}
          />
          <span>zCall</span>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            <NavDropdown 
              title={
                <>
                  <Avatar 
                    name={user_id}
                    size={30}
                    variant="beam"
                  />
                  <span className="ms-2">{user_id}</span>
                </>
              }
              align="end"
            >
              <NavDropdown.Item
                onClick={() => {}}
              >
                Settings
              </NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default Navigation;