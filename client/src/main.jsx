import '@ant-design/v5-patch-for-react-19';
import './index.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router';
import { unstableSetRender } from 'antd';
import PresenceProvider from './contexts/presence';
import MessageProvider from './contexts/message';
import GlobalModalProvider from './contexts/global-modal';
import App from './App.jsx'

unstableSetRender((node, container) => {
  container._reactRoot ||= createRoot(container);
  const root = container._reactRoot;
  root.render(node);
  return async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
    root.unmount();
  };
});

createRoot(document.getElementById('root')).render(
  <>
    <BrowserRouter>
      <PresenceProvider>
        <MessageProvider>
          <GlobalModalProvider>          
            <App />
          </GlobalModalProvider>
        </MessageProvider>
      </PresenceProvider>
    </BrowserRouter>
  </>,
)