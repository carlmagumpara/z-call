import { Suspense } from 'react';
import { Outlet } from 'react-router';
import Loading from '@/shared/loading';

function Wrapper() {
  return (
    <>
      <Suspense fallback={<Loading />}>
        <Outlet />
      </Suspense>
    </>
  );
}

export default Wrapper;