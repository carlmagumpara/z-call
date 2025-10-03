import './App.scss';
import { lazy } from 'react';
import { Routes, Route } from 'react-router';
import Wrapper from '@/shared/wrapper';

const Landing = lazy(() => import('./pages/landing'));
const Call = lazy(() => import('./pages/call'));

function App() {
  return (    
    <Routes>        
      <Route element={<Wrapper />}>
        <Route path="/" element={<Landing />} />
      </Route>
      <Route path="/r/:room_id" element={<Call />} />
    </Routes>
  )
}

export default App
