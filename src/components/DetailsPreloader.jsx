import React from "react";
import TablePreloader from "./TablePreloader";

const DetailsPreloader = () => {
  return (
    <div className="row">
        <div className="col-12">
            <div className="d-print-none card mb-3">
                <div className="card-body p-3">
                    <div className="d-flex">
                        <div className="flex-grow-1 d-flex gap-2 align-items-center">
                            <div className="flex-shrink-0">
                                <div className="avtar avtar-s bg-light-primary">
                                    <i className="ti ti-circel f-18"></i>
                                </div>
                            </div>
                            <div>
                                <p className="card-text placeholder-glow">
                                    <span className="placeholder col-12 placeholder-lg"></span>
                                </p>
                            </div>
                        </div>
                        <ul className="list-inline ms-auto mb-0 d-flex justify-content-end flex-wrap">
                            <p className="card-text placeholder-glow">
                                <span className="placeholder col-12 placeholder-lg"></span>
                            </p>
                            <p className="card-text placeholder-glow">
                                <span className="placeholder col-12 placeholder-lg"></span>
                            </p>
                            <p className="card-text placeholder-glow">
                                <span className="placeholder col-12 placeholder-lg"></span>
                            </p>
                            <p className="card-text placeholder-glow">
                                <span className="placeholder col-12 placeholder-lg"></span>
                            </p>
                            <p className="card-text placeholder-glow">
                                <span className="placeholder col-12 placeholder-lg"></span>
                            </p>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
        <div className="col-12">
            <div className="card">
                <div className="card-body">
                    <TablePreloader/>
                </div>
            </div>
        </div>
    </div>
  );
};

export default DetailsPreloader;