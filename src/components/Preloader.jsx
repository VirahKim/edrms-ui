import React from "react";
import '../App.css';

const Preloader = () => {
  return (
    <div className="loader-bg h-100 d-flex flex-column">
        <div className="loader-track">
            <div className="loader-fill" />
        </div>
        <div className="flex-grow-1 d-flex flex column align-items-center">
          <div className="d-flex w-100 justify-content-center">
            <img src="/favicon.png" height={140} alt="QBITS AI" className="zoom-pulse" />
          </div>
        </div>
    </div>

  );
};

export default Preloader;
