// import React from "react";
// import "./TermsModal.css";
// import { X } from "lucide-react";

// interface TermsModalProps {
//   isOpen: boolean;
//   onClose: () => void;
// }

// const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose }) => {
//   if (!isOpen) return null;

//   return (
//     <div className="modal-overlay">
//       <div className="modal-content">
//         <div className="modal-header">
//           <h2>Terms & Conditions</h2>
//           <button className="close-button" onClick={onClose}>
//             <X className="w-6 h-6" />
//           </button>
//         </div>
//         <div className="modal-body">
//           <h3>1. Acceptance of Terms</h3>
//           <p>
//             By accessing and participating in our auction platform, you agree to
//             be bound by these terms and conditions.
//           </p>

//           <h3>2. Registration</h3>
//           <p>
//             Users must register with valid information to participate in
//             auctions. All provided information must be accurate and up-to-date.
//           </p>

//           <h3>3. Auction Rules</h3>
//           <ul>
//             <li>All bids are final and binding</li>
//             <li>Bidders must be registered users</li>
//             <li>The highest valid bid wins the auction</li>
//             <li>Time extensions may apply in the final minutes</li>
//           </ul>

//           <h3>4. Payment Terms</h3>
//           <p>
//             Winning bidders must complete payment within the specified timeframe
//             using approved payment methods.
//           </p>

//           <h3>5. Bidding</h3>
//           <p>
//             Participants must ensure they have the authority and means to make
//             bids. Invalid or fraudulent bids will be removed.
//           </p>

//           <h3>6. Privacy</h3>
//           <p>
//             User information will be handled according to our privacy policy and
//             applicable laws.
//           </p>

//           <h3>7. Modifications</h3>
//           <p>
//             We reserve the right to modify these terms at any time. Users will
//             be notified of significant changes.
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default TermsModal;






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
            <h3>1. Acceptance of Terms</h3>
            <p>
              By accessing and participating in Quickauction's vehicle auctions,
              users agree to all terms below.
            </p>
          </section>
          <section>
            <h3>2. Registration</h3>
            <p>
              All users must register with accurate information. Quickauction
              reserves the right to verify and suspend accounts in case of
              fraudulent or inaccurate data.
            </p>
          </section>
          <section>
            <h3>3. Auction Rules</h3>
            <ul>
              <li>All bids are final and binding upon the bidder.</li>
              <li>Bidders must be registered and approved users.</li>
              <li>
                The highest valid bid at closure wins the auctioned vehicle.
              </li>
              <li>
                Bid increments and auction time extensions apply per auction
                notice.
              </li>
            </ul>
          </section>
          <section>
            <h3>4. Payment Terms</h3>
            <p>
              Winning bidders must complete payment within the specified
              deadline using authorized payment modes. Failure may result in
              cancellation and penalties.
            </p>
          </section>
          <section>
            <h3>5. Bidding Conduct</h3>
            <ul>
              <li>Only authorized participants can bid.</li>
              <li>
                Invalid or fraudulent bids will be disqualified and removed.
              </li>
              <li>
                Quickauction reserves the right to ban users for persistent
                misconduct.
              </li>
            </ul>
          </section>
          <section>
            <h3>6. Liability & Disputes</h3>
            <p>
              Quickauction does not arbitrate disputes directly but will support
              resolution efforts. All vehicles are typically sold “as-is,” and
              buyers must inspect before bidding.
            </p>
          </section>
          <section>
            <h3>7. Privacy Policy</h3>
            <p>
              User data is protected per the platform’s privacy policy and
              applicable law.
            </p>
          </section>
          <section>
            <h3>8. Modifications</h3>
            <p>
              Terms can be updated. Material changes will be communicated to
              users.
            </p>
          </section>
          <div className="modal-footer">
            <em>Last updated: September 2025</em>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsModal;

