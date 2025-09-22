import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../../services/apiConfig";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Clock,
  Users,
  IndianRupee,
  Gavel,
  Trophy,
  AlertCircle,
  CheckCircle,
  Timer,
  Eye,
  Activity,
  TrendingDown,
  Download,
  Pause,
  Play,
  StopCircle,
  Contact,
  MapPin,
  Edit,
} from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import "./AuctioneerLiveView.css";
// Import the API utility for updating decrement value
// import { updateAuctionDecrement } from "../../../services/apiDecrementValue";
import apiDencrimentValue from "../../../services/apiDencrimentValue";

// Define interfaces for the API response structure
interface AuctionCreator {
  company_name: string;
  person_name: string;
  phone: string;
}

interface AuctionParticipant {
  id: number;
  user_id: number | null;
  phone_number: string;
  status: string;
  invited_at: string;
  joined_at: string | null;
  person_name: string | null;
  company_name: string | null;
}

interface Bid {
  id: number;
  user_id: number;
  amount: string;
  created_at: string;
  person_name?: string;
  company_name?: string;
  user?: {
    person_name: string;
    company_name: string;
  } | null;
}

interface Auction {
  id: number;
  title: string;
  description: string;
  auction_date: string;
  start_time: string;
  end_time: string;
  duration: number;
  currency: string;
  current_price: string;
  decremental_value: string;
  status: "upcoming" | "live" | "completed";
  auction_no: string;
  formatted_start_time: string;
  formatted_end_time: string;
  time_remaining: number;
  creator_info: AuctionCreator;
  participants: AuctionParticipant[];
  bids: Bid[];
  documents: any[]; // Define if needed
  statistics: {
    total_participants: number;
    total_bids: number;
    active_participants: number;
    highest_bid: number | null;
    lowest_bid: number | null;
  };
}

const AuctioneerLiveView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [auction, setAuction] = useState<Auction | null>(null);
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isPaused, setIsPaused] = useState(false);
  const [isEndingAuction, setIsEndingAuction] = useState(false);
  const [isExtendingTime, setIsExtendingTime] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newDecrementValue, setNewDecrementValue] = useState<number | string>(
      ""
    );
  const [updatingDecrement, setUpdatingDecrement] = useState(false);
  const [isEditDecrementOpen, setIsEditDecrementOpen] = useState(false);

  const fetchAuctionData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const token =
        localStorage.getItem("authToken") || localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE_URL}/auction/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch auction data.");
      }

      const data = await response.json();
      if (data.success) {
        setAuction(data.auction);
        if (data.auction.status === "completed") {
          toast.success("This auction has been completed.", { icon: "🏁" });
        }
      } else {
        throw new Error(data.message || "Could not retrieve auction details.");
      }
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  


  useEffect(() => {
    fetchAuctionData();
    // Set up polling to refresh data every 15 seconds
    const interval = setInterval(fetchAuctionData, 15000);
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    if (!auction || auction.status !== "live" || isPaused) {
      if (auction?.status === "completed") {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
      return;
    }

    const timer = setInterval(() => {
      const endTime = new Date(`${auction.auction_date}T${auction.end_time}`);
      const now = new Date();
      const diff = endTime.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        clearInterval(timer);
        if (auction.status !== "completed") {
          setAuction((prev) =>
            prev ? { ...prev, status: "completed" } : null
          );
          toast.success("Auction time has ended!", { icon: "🏁" });
        }
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(timer);
  }, [auction, isPaused]);

  const handlePauseAuction = () => setIsPaused(!isPaused);
  const handleEndAuction = async () => {
    if (!id || !window.confirm("Are you sure you want to end this auction?")) {
      return;
    }

    setIsEndingAuction(true);
    try {
      const token =
        localStorage.getItem("authToken") || localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE_URL}/auction/${id}/close`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        setAuction((prev) => (prev ? { ...prev, status: "completed" } : null));
        toast.success(
          result.message || "Auction has been successfully ended.",
          {
            icon: "🛑",
          }
        );
        fetchAuctionData(); // Refresh data to get final state
      } else {
        throw new Error(result.message || "Failed to end the auction.");
      }
    } catch (err: any) {
      toast.error(err.message);
      console.error("Failed to end auction:", err);
    } finally {
      setIsEndingAuction(false);
    }
  };

  const handleExtendTime = async () => {
    if (!id) return;

    setIsExtendingTime(true);
    try {
      const token =
        localStorage.getItem("authToken") || localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE_URL}/auction/${id}/extend`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ additional_minutes: 3 }),
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success(
          result.message || "Time extended successfully by 3 minutes!"
        );
        fetchAuctionData(); // Refresh data to get updated end time
      } else {
        throw new Error(result.message || "Failed to extend time.");
      }
    } catch (err: any) {
      toast.error(err.message);
      console.error("Failed to extend time:", err);
    } finally {
      setIsExtendingTime(false);
    }
  };

  // Add reject participant function with the correct API endpoint
  const handleRejectParticipant = async (userId: number) => {
    if (!id || !window.confirm("Are you sure you want to reject this participant?")) {
      return;
    }

    try {
      const token =
        localStorage.getItem("authToken") || localStorage.getItem("token");
      
      // Use the correct API endpoint for rejecting a participant
      const response = await fetch(
        `https://auction-development.onrender.com/api/auction/prebid/${id}/reject`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ user_id: userId }),
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success(
          result.message || "Participant has been rejected successfully."
        );
        fetchAuctionData(); // Refresh data to update the participant list
      } else {
        throw new Error(result.message || "Failed to reject participant.");
      }
    } catch (err: any) {
      toast.error(err.message);
      console.error("Failed to reject participant:", err);
    }
  };

  if (loading && !auction) {
    return (
      <div className="alv-loading">
        <div className="alv-loading-spinner" />
        <p>Loading live auction monitoring...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alv-error">
        <AlertCircle className="alv-error-icon" />
        <h2>Access Denied</h2>
        <p>{error}</p>
        <button
          onClick={() => navigate("/dashboard/auctions")}
          className="alv-back-btn"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to My Auctions
        </button>
      </div>
    );
  }

  
  if (!auction) {
    return (
      <div className="alv-error">
        <AlertCircle className="alv-error-icon" />
        <h2>Auction Not Found</h2>
        <p>The requested auction could not be found.</p>
        <button
          onClick={() => navigate("/dashboard/auctions")}
          className="alv-back-btn"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to My Auctions
        </button>
      </div>
    );
  }

  const rankedBids = auction.bids.sort(
    (a, b) => parseFloat(a.amount) - parseFloat(b.amount)
  );

  return (
    <div className="alv-container">
      <div className="alv-header">
        <button onClick={() => navigate(-1)} className="alv-back-btn">
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="alv-header-info">
          <h1 className="alv-title">{auction.title}</h1>
          <p className="alv-auction-no">Auction No: {auction.auction_no}</p>
        </div>
        <div className="alv-header-actions">
          <div className="alv-status-badge">
            <div
              className={`alv-live-indicator ${
                auction.status !== "live" ? "alv-paused" : ""
              }`}
            />
            {isPaused ? "PAUSED" : auction.status.toUpperCase()}
          </div>
        </div>
      </div>

      <div className="alv-control-panel">
        <div className="alv-control-header">
          <h3>Auction Controls</h3>
        </div>
        <div className="alv-control-actions">

{/*           <button

          {/* <button

            onClick={handlePauseAuction}
            className="alv-control-btn alv-pause-btn"
            disabled={auction.status !== "live"}
          >
            {isPaused ? (
              <Play className="w-4 h-4" />
            ) : (
              <Pause className="w-4 h-4" />
            )}
            {isPaused ? "Resume Auction" : "Pause Auction"}
          </button> */}
          <button
            onClick={handleExtendTime}
            className="alv-control-btn alv-extend-btn"
            disabled={auction.status !== "live" || isExtendingTime}
          >
            {isExtendingTime ? (
              <div className="alv-loading-spinner-small" />
            ) : (
              <Clock className="w-4 h-4" />
            )}
            {isExtendingTime ? "Extending..." : "Extend Time by 3 Min"}
          </button>
          <button
            onClick={handleEndAuction}
            className="alv-control-btn alv-end-btn"
            disabled={auction.status === "completed" || isEndingAuction}
          >
            {isEndingAuction ? (
              <div className="alv-loading-spinner-small" />
            ) : (
              <StopCircle className="w-4 h-4" />
            )}
            {isEndingAuction ? "Ending..." : "End Auction"}
          </button>
        </div>
      </div>

      <div className="alv-main-content">
        <div className="alv-details-card">
          <div className="alv-details-header">
            <Gavel className="alv-details-icon" />
            <h3>Auction Details</h3>
          </div>
          <div className="alv-details-grid">
            <div className="alv-detail-item">
              <span className="alv-detail-label">Start Price:</span>
              <span className="alv-detail-value">
                {auction.currency}{" "}
                {parseFloat(auction.current_price).toLocaleString()}
              </span>
            </div>
            <div className="alv-detail-item">
              <span className="alv-detail-label">Description:</span>
              <span className="alv-detail-value">{auction.description}</span>
            </div>
            <div className="alv-detail-item">
              <span className="alv-detail-label">Current Lowest:</span>
              <span className="alv-detail-value alv-current-price">
                {auction.statistics.lowest_bid !== null
                  ? `${
                      auction.currency
                    } ${auction.statistics.lowest_bid.toLocaleString()}`
                  : "No bids yet"}
              </span>
            </div>
            <div className="alv-detail-item">
              <span className="alv-detail-label">Decremental Value:</span>
              <span className="alv-detail-value">
                {auction.currency}{" "}
                {parseFloat(auction.decremental_value).toLocaleString()}
              </span>
            </div>

            <div style={{ marginTop: 8 }}>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setNewDecrementValue(auction.decremental_value || 0);
                  setIsEditDecrementOpen(true);
                }}
              >
                <Edit className="w-4 h-4" /> Edit Decrement
              </button>
            </div>

          </div>
        </div>

        {isEditDecrementOpen && (
                <div className="prebuild-modal-overlay" role="dialog" aria-modal="true">
                  <div className="prebuild-modal">
                    <h3 className="prebuild-modal-title">Edit Decrement Value</h3>
                    <div style={{ marginTop: 8 }}>
                      <label className="modal-label">
                        Value ({auction?.currency || "₹"})
                      </label>
                      <input
                        type="number"
                        className="prebuild-input"
                        value={String(newDecrementValue)}
                        onChange={(e) => setNewDecrementValue(e.target.value)}
                        disabled={updatingDecrement}
                      />
                    </div>
                    <div className="prebuild-modal-actions">
                      <button
                        className="btn btn-secondary"
                        onClick={() => setIsEditDecrementOpen(false)}
                        disabled={updatingDecrement}
                      >
                        Cancel
                      </button>
                      <button
                        className="btn btn-primary"
                        onClick={async () => {
                          // validation
                          const num = Number(newDecrementValue);
                          if (Number.isNaN(num) || num <= 0) {
                            toast.error("Please enter a valid positive number");
                            return;
                          }
                          setUpdatingDecrement(true);
                          try {
                            const resp = await apiDencrimentValue.updateAuctionDecrement(
                              id || "",
                              num
                            );
                            if (resp && resp.success) {
                              toast.success("Decrement value updated");
                              // refresh auction details
                              await fetchAuctionData();
                              setIsEditDecrementOpen(false);
                            } else {
                              toast.error(
                                resp?.message || "Failed to update decrement"
                              );
                            }
                          } catch (err: any) {
                            console.error("Update decrement error", err);
                            toast.error(err?.message || "Failed to update decrement");
                          } finally {
                            setUpdatingDecrement(false);
                          }
                        }}
                        disabled={updatingDecrement}
                      >
                        {updatingDecrement ? "Updating..." : "Save"}
                      </button>
                    </div>
                  </div>
                </div>
              )}


        <div className="alv-countdown-card">
          <div className="alv-countdown-header">
            <Timer className="alv-countdown-icon" />
            <div className="alv-countdown-info">
              <h3>
                {auction.status === "completed"
                  ? "Auction Closed"
                  : "Auction will be Closed in"}
              </h3>
              <p className="alv-countdown-subtitle">
                {isPaused && "Auction is currently paused"}
              </p>
            </div>
          </div>
          <div className="alv-countdown-display">
            <div className="alv-countdown-segment">
              <span className="alv-countdown-number">{timeLeft.days}</span>
              <span className="alv-countdown-label">Days</span>
            </div>
            <div className="alv-countdown-separator">:</div>
            <div className="alv-countdown-segment">
              <span className="alv-countdown-number">
                {timeLeft.hours.toString().padStart(2, "0")}
              </span>
              <span className="alv-countdown-label">Hours</span>
            </div>
            <div className="alv-countdown-separator">:</div>
            <div className="alv-countdown-segment">
              <span className="alv-countdown-number">
                {timeLeft.minutes.toString().padStart(2, "0")}
              </span>
              <span className="alv-countdown-label">Min</span>
            </div>
            <div className="alv-countdown-separator">:</div>
            <div className="alv-countdown-segment">
              <span className="alv-countdown-number">
                {timeLeft.seconds.toString().padStart(2, "0")}
              </span>
              <span className="alv-countdown-label">Sec</span>
            </div>
          </div>
        </div>

        <div className="alv-participants-card">
          <div className="alv-participants-header">
            <Trophy className="alv-participants-icon" />
            <h3>Live Bids</h3>
            <div className="alv-participants-meta">
              <span className="alv-participant-count">
                <Users className="w-4 h-4" />
                {auction.statistics.active_participants} /{" "}
                {auction.statistics.total_participants} Participants
              </span>
              <span className="alv-live-status">
                <Activity className="w-4 h-4" />
                {auction.statistics.total_bids} Bids
              </span>
            </div>
          </div>

          <div className="alv-ranking-subtitle">
            <TrendingDown className="w-4 h-4" />
            Offered Price - Lowest to Highest
          </div>

          <div className="alv-participants-list">
            {rankedBids.length > 0 ? (
              rankedBids.map((bid, index) => (
                <div
                  key={bid.id}
                  className={`alv-participant-item ${
                    index < 3 ? `alv-participant-l${index + 1}` : ""
                  }`}
                >
                  <div className="alv-participant-rank">
                    <div className={`alv-rank-badge alv-rank-l${index + 1}`}>
                      L{index + 1}
                    </div>
                    {index < 3 && <Trophy className="alv-rank-trophy" />}
                  </div>

                  <div className="alv-participant-company">
                    <div className="alv-company-info">
                      <div className="alv-company-name">
                        <Contact className="w-4 h-4" />
                        <span>
                          {bid.person_name ||
                            bid.user?.person_name ||
                            "Unknown"}
                        </span>
                      </div>
                      <div className="alv-company-address">
                        <MapPin className="w-4 h-4" />
                        <span>
                          {bid.company_name ||
                            bid.user?.company_name ||
                            bid.person_name ||
                            bid.user?.person_name ||
                            "Unknown User"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="alv-participant-bid">
                    <div className="alv-bid-amount">
                      <IndianRupee className="w-4 h-4" />
                      <span className="alv-price-value">
                        {auction.currency}{" "}
                        {parseFloat(bid.amount).toLocaleString()}
                      </span>
                    </div>
                    <div className="alv-bid-time">
                      <Clock className="w-4 h-4" />
                      <span>
                        {/* {new Date(bid.created_at).toLocaleTimeString()} */}
                        {new Date(
                          `${auction.auction_date}T${auction.end_time}`
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="alv-participant-status">
                    {index === 0 ? (
                      <div className="alv-status-leading">
                        <CheckCircle className="w-4 h-4" />
                        <span>Leading</span>
                      </div>
                    ) : (
                      <div className="alv-status-active">
                        <Eye className="w-4 h-4" />
                        <span>Active</span>
                      </div>
                    )}
                  </div>

                  <div>
                    {/* Reject button for rejecting user from Bid */}
                    <button
                      className="btn btn-danger"
                      onClick={() => handleRejectParticipant(bid.user_id)}
                    >
                      Reject
                    </button> 
                  </div>

                </div>
              ))
            ) : (
              <div className="alv-no-participants">
                <Users className="alv-no-participants-icon" />
                <h4>No Bids Yet</h4>
                <p>Waiting for participants to place bids...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctioneerLiveView;
