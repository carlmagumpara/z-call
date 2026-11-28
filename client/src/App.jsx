import { lazy } from 'react';
import { Routes, Route } from 'react-router';
import Wrapper from '@/shared/wrapper';

const Landing = lazy(() => import('./pages/landing'));
const Call = lazy(() => import('./pages/call'));
const Chat = lazy(() => import('./pages/chat'));

function App() {
  return (    
    <Routes>        
      <Route element={<Wrapper />}>
        <Route path="/" element={<Landing />} />
        <Route path="/chat" element={<Chat />} />
      </Route>
      <Route path="/r/:room_id" element={<Call />} />
    </Routes>
  )
}

export default App
