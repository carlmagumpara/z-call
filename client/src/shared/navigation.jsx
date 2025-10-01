import { Container, Nav, Navbar, NavDropdown, NavItem, Image } from 'react-bootstrap';
import { Link } from 'react-router';
import Avatar from 'boring-avatars';
import Logo from '@/assets/logo.png'
import { usePresence } from '@/contexts/presence';
import { useGlobalModal, MODAL_TYPES } from '@/contexts/global-modal';
import ThemeToggle from './theme-toggle';

function Navigation() {
  const { handleShow } = useGlobalModal();
  const { username } = usePresence();

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
            alt="logo"
            style={{
              width: 40
            }}
          />
          <span>zCall</span>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            <ThemeToggle />
            <NavDropdown 
              title={
                <>
                  <Avatar 
                    name={username ?? ''}
                    size={30}
                    variant="beam"
                  />
                  <span className="ms-2">{username}</span>
                </>
              }
              align="end"
            >
              <NavDropdown.Item
                onClick={() => handleShow(MODAL_TYPES.SETTINGS)}
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