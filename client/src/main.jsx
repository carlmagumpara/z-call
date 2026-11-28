import './index.css'

import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router';
import PresenceProvider from './contexts/presence';
import ChatProvider from './contexts/chat';
import GlobalModalProvider from './contexts/global-modal';
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <>
    <BrowserRouter>
      <PresenceProvider>
        <ChatProvider>
          <GlobalModalProvider>
            <App />
          </GlobalModalProvider>
        </ChatProvider>
      </PresenceProvider>
    </BrowserRouter>
  </>,
)
