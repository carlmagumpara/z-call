import { Link } from 'react-router';
import Avatar from 'boring-avatars';
import Logo from '@/assets/logo.png'
import { usePresence } from '@/contexts/presence';
import { useGlobalModal, MODAL_TYPES } from '@/contexts/global-modal';
import ThemeToggle from './theme-toggle';

function Navigation() {
  const { handleShow } = useGlobalModal();
  const { username } = usePresence();

  return null;
}

export default Navigation;