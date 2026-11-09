import React from "react";

const Footer = () => {
    return (
        <footer className="pc-footer">
            <div className="footer-wrapper container-fluid">
                <div className="row">
                    <div className="col my-1 d-flex align-items-center gap-2">
                        <img src="/QBITS_ICON_PRIMARY.png" height={24} alt="Q-BITS" />
                        <span>Q-BITS EDRMS, A product of CodexAI Company Limited</span>
                    </div>
                    <div className="col-md-auto my-1">
                        <ul className="list-inline footer-link mb-0">
                            <li className="list-inline-item tf"><a href="#" target="_blank">Privacy</a></li>
                            <li className="list-inline-item"><a href="#" target="_blank">Documentation</a></li>
                            <li className="list-inline-item tf"><a href="#" target="_blank">Support</a></li>
                        </ul>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
