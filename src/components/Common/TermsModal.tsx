import React, { useEffect, useRef } from "react";
import "./TermsModal.css";
import { X } from "lucide-react";

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      if (modalRef.current) modalRef.current.focus();
    }
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    // Accessibility: role="dialog", aria-modal="true", keyboard ESC support
    <div
      className="modal-overlay"
      tabIndex={-1}
      aria-modal="true"
      role="dialog"
    >
      <div className="modal-content" ref={modalRef}>
        <div className="modal-header">
          <h2>Terms & Conditions</h2>
          <button className="close-button" onClick={onClose} title="Close">
            <X className="w-6 h-6" aria-label="Close modal" />
          </button>
        </div>
        <div className="modal-body">
  <section>
    <h3>Terms and Conditions</h3>
    <p>
      This is an e-auction platform for Auctioneers & Participants.
    </p>
    <p>
      Every Participant should follow Terms & Conditions set by the Auctioneer for the respective Auction.
    </p>
    <p>
      It is the responsibility of the Auctioneer to set Terms & Conditions for the respective Auction.
    </p>
    <p>
      There is no liability of the website for any dispute, however the website will support to resolve disputes if any.
    </p>
    <p>
      Using the website is considered as unconditional acceptance of the Terms & Conditions of the website.
    </p>
    <p>
      Website management reserves the right to modify Terms & Conditions at any time.
    </p>
  </section>

  {/* <div className="modal-footer">
    <em>Last updated: September 2025</em>
  </div> */}
</div>

      </div>
    </div>
  );
};

export default TermsModal;

