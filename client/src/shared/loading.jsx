import React from 'react';
import { BarLoader } from 'react-spinners';
import Cat from '@/assets/cat.gif';

function LoaderFull() {
  return (
    <div
      className="vh-100 full-loader w-100 d-flex justify-content-center align-items-center"
    >
      <div
        className="d-flex flex-column align-items-center"
      >
        <img
          src={Cat}
          style={{
            width: 50,
          }}
        />
      </div>
    </div>
  )
}

export default LoaderFull;