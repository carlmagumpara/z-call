import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import Avatar from 'boring-avatars';
import Logo from '@/assets/logo.png';
import { usePresence } from '@/contexts/presence';
import { useGlobalModal, MODAL_TYPES } from '@/contexts/global-modal';

function Navigation() {
  const { handleShow } = useGlobalModal();
  const { username } = usePresence();
  const [expanded, setExpanded] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, []);

  const openSettings = () => {
    setDropdownOpen(false);
    setExpanded(false);
    handleShow(MODAL_TYPES.SETTINGS);
  };

  return (
    <nav className="fixed inset-x-0 top-0 z-50" aria-label="Main navigation">
      <div className="mx-auto flex w-full flex-wrap items-center justify-between px-4 py-2">
        <Link
          to="/"
          className="flex cursor-pointer items-center justify-center gap-2 text-white"
        >
          <img className="w-10" src={Logo} alt="logo" />
          <span>zCall</span>
        </Link>

        <button
          type="button"
          className="cursor-pointer rounded-md p-2 text-white hover:bg-white/10 lg:hidden"
          aria-controls="basic-navbar-nav"
          aria-expanded={expanded}
          aria-label="Toggle navigation"
          onClick={() => setExpanded((value) => !value)}
        >
          <span className="block h-0.5 w-5 bg-current" />
          <span className="mt-1 block h-0.5 w-5 bg-current" />
          <span className="mt-1 block h-0.5 w-5 bg-current" />
        </button>

        <div
          id="basic-navbar-nav"
          className={`${expanded ? 'flex' : 'hidden'} w-full flex-col gap-2 lg:flex lg:w-auto lg:flex-row lg:items-center`}
        >
          <div className="relative lg:ml-auto" ref={dropdownRef}>
            <button
              type="button"
              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-white hover:bg-white/10"
              aria-haspopup="menu"
              aria-expanded={dropdownOpen}
              onClick={() => setDropdownOpen((value) => !value)}
            >
              <Avatar name={username ?? ''} size={30} variant="beam" />
              <span>{username}</span>
            </button>

            {dropdownOpen && (
              <div
                className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-lg border border-stroke bg-[#0e1422] py-1 shadow-xl"
                role="menu"
              >
                <button
                  type="button"
                  className="block w-full cursor-pointer px-4 py-2 text-left text-sm text-ink hover:bg-white/10"
                  role="menuitem"
                  onClick={openSettings}
                >
                  Settings
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
