import { lazy } from 'react';
import { Routes, Route } from 'react-router';
import Wrapper from '@/shared/wrapper';

const Call = lazy(() => import('./pages/call'));

function App() {
  return (    
    <Routes>        
      <Route element={<Wrapper />}>
        <Route path="/" element={<Call />} />
      </Route>
    </Routes>
  )
}

export default App
