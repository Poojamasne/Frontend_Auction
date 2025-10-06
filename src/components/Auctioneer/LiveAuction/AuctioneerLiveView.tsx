import React, { useRef, useState, useEffect, useCallback } from "react";
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
  Calendar,
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
import apiDencrimentValue from "../../../services/apiDencrimentValue";

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
  bid_time: string;
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
  documents: any[];
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
  const [lastBidCount, setLastBidCount] = useState<number>(0);

  const [newDecrementValue, setNewDecrementValue] = useState<number | string>(
    ""
  );
  const [updatingDecrement, setUpdatingDecrement] = useState(false);
  const [isEditDecrementOpen, setIsEditDecrementOpen] = useState(false);
  const [rejectingBidId, setRejectingBidId] = useState<number | null>(null);
  const [lastAutoExtendTime, setLastAutoExtendTime] = useState<number>(0);
  const [currentEndTime, setCurrentEndTime] = useState<Date | null>(null);
  const [isAutoExtending, setIsAutoExtending] = useState(false);

  const prevBidCountRef = useRef(0);

  const fetchAuctionData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const token =
        localStorage.getItem("authToken") || localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/auction/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.message || "Could not retrieve auction details.");

      setAuction(data.auction);

      if (data.auction.auction_date && data.auction.end_time) {
        const newEnd = new Date(
          `${data.auction.auction_date}T${data.auction.end_time}`
        );
        setCurrentEndTime(newEnd);
      }

      // Set bid count for initial/load
      if (lastBidCount === 0) setLastBidCount(data.auction.bids.length);

      if (data.auction.status === "completed")
        toast.success("This auction has been completed.", { icon: "🏁" });
      setError(null);
    } catch (err) {
      setError(error);
      toast.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuctionData();
    const interval = setInterval(fetchAuctionData, 15000);
    return () => clearInterval(interval);
  }, [id]);

  const handleExtendTimeAPI = useCallback(
    async (reason = "manual") => {
      setIsAutoExtending(true);
      try {
        const token =
          localStorage.getItem("authToken") || localStorage.getItem("token");
        const response = await fetch(`${API_BASE_URL}/auction/${id}/extend`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ additional_minutes: 3 }),
        });
        const result = await response.json();
        if (!response.ok || !result.success)
          throw new Error(result.message || "Failed to extend time.");

        toast.success(
          reason === "auto"
            ? "⏱️ New bid detected! Time automatically extended by 3 minutes."
            : "Time extended successfully by 3 minutes!"
        );

        if (currentEndTime)
          setCurrentEndTime(new Date(currentEndTime.getTime() + 3 * 60 * 1000));
        setLastAutoExtendTime(Date.now());
        setTimeout(fetchAuctionData, 2000);
      } catch (err) {
        toast.error(error);
      } finally {
        setIsAutoExtending(false);
      }
    },
    [id, currentEndTime]
  );

  // Separate function for auto-extend
  const handleAutoExtendTime = useCallback(async () => {
    if (!id || isAutoExtending) return;

    console.log("🔄 AUTO-EXTENDING TIME BY 3 MINUTES");
    setIsAutoExtending(true);

    try {
      const token =
        localStorage.getItem("authToken") || localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/auction/${id}/extend`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ additional_minutes: 3 }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        console.log("✅ Auto-extend successful!");
        toast.success(
          "⏱️ New bid detected! Time automatically extended by 3 minutes.",
          {
            duration: 5000,
          }
        );

        // Immediately update the local end time by adding 3 minutes
        if (currentEndTime) {
          const newEndTime = new Date(currentEndTime.getTime() + 3 * 60 * 1000);
          setCurrentEndTime(newEndTime);
          console.log("📅 New end time set:", newEndTime.toLocaleTimeString());
        }

        setLastAutoExtendTime(Date.now());

        // Refresh auction data to get updated end_time from server
        setTimeout(() => {
          fetchAuctionData();
        }, 2000);
      } else {
        throw new Error(result.message || "Failed to extend time.");
      }
    } catch (err: any) {
      console.error("❌ Auto-extend failed:", err);
      toast.error(err.message);
    } finally {
      setIsAutoExtending(false);
    }
  }, [id, currentEndTime, isAutoExtending]);

  // Auto-extend time when new bid is placed in last 2 minutes
  useEffect(() => {
    if (!auction || auction.status !== "live" || isPaused || !currentEndTime)
      return;
    const curBids = auction.bids.length;
    const prevBids = prevBidCountRef.current;

    const now = new Date();
    const remainingSeconds = Math.floor(
      (currentEndTime.getTime() - now.getTime()) / 1000
    );
    const cooldownEnough = Date.now() - lastAutoExtendTime > 30000;

    if (
      curBids > prevBids &&
      prevBids > 0 &&
      remainingSeconds > 0 &&
      remainingSeconds <= 120 &&
      cooldownEnough &&
      !isAutoExtending
    ) {
      handleExtendTimeAPI("auto");
    }

    prevBidCountRef.current = curBids;
    setLastBidCount(curBids);
  }, [
    auction?.bids,
    auction,
    isPaused,
    handleExtendTimeAPI,
    lastAutoExtendTime,
    currentEndTime,
    isAutoExtending,
  ]);

  // Countdown timer using currentEndTime
  useEffect(() => {
    if (!auction || auction.status !== "live" || isPaused || !currentEndTime) {
      if (auction?.status === "completed")
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      return;
    }
    const timer = setInterval(() => {
      const now = new Date();
      const diff = currentEndTime.getTime() - now.getTime();
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
  }, [auction, isPaused, currentEndTime]);

  // Reset when auction status changes
  useEffect(() => {
    if (auction?.status !== "live") {
      setLastAutoExtendTime(0);
    }
  }, [auction?.status]);

  const handlePauseAuction = () => setIsPaused(!isPaused);

  const handleEndAuction = async () => {
    if (!id || !window.confirm("Are you sure you want to end this auction?")) {
      return;
    }

    setIsEndingAuction(true);
    try {
      const token =
        localStorage.getItem("authToken") || localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/auction/${id}/close`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setAuction((prev) => (prev ? { ...prev, status: "completed" } : null));
        toast.success(
          result.message || "Auction has been successfully ended.",
          {
            icon: "🛑",
          }
        );
        fetchAuctionData();
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
      const response = await fetch(`${API_BASE_URL}/auction/${id}/extend`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ additional_minutes: 3 }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success("Time extended successfully by 3 minutes!");

        // Immediately update local end time
        if (currentEndTime) {
          const newEndTime = new Date(currentEndTime.getTime() + 3 * 60 * 1000);
          setCurrentEndTime(newEndTime);
          console.log(
            "📅 Manual extend - new end time:",
            newEndTime.toLocaleTimeString()
          );
        }

        setLastAutoExtendTime(Date.now());
        fetchAuctionData();
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

  // Updated reject bid function - using bid ID instead of auction ID
  const handleRejectBid = async (bidId: number) => {
    if (
      !window.confirm(
        "Are you sure you want to reject this bid? This action cannot be undone."
      )
    ) {
      return;
    }

    setRejectingBidId(bidId);
    try {
      const token =
        localStorage.getItem("authToken") || localStorage.getItem("token");

      // Correct API endpoint - using bid ID instead of auction ID
      const response = await fetch(
        `${API_BASE_URL}/auction/prebid/${bidId}/reject`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            bid_id: bidId,
          }),
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success(result.message || "Bid has been rejected successfully.");
        fetchAuctionData(); // Refresh data to update the bids list
      } else {
        throw new Error(result.message || "Failed to reject bid.");
      }
    } catch (err: any) {
      toast.error(err.message);
      console.error("Failed to reject bid:", err);
    } finally {
      setRejectingBidId(null);
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

  // Calculate if we're in auto-extend window
  const isInAutoExtendWindow =
    timeLeft.minutes < 2 &&
    timeLeft.days === 0 &&
    timeLeft.hours === 0 &&
    auction.status === "live";

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
          {/* Debug info - remove in production */}
          <div style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}>
            | Auto-extend: {isInAutoExtendWindow ? "ACTIVE" : "INACTIVE"}
          </div>
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
          <div
            className="prebuild-modal-overlay"
            role="dialog"
            aria-modal="true"
          >
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
                    const num = Number(newDecrementValue);
                    if (Number.isNaN(num) || num <= 0) {
                      toast.error("Please enter a valid positive number");
                      return;
                    }
                    setUpdatingDecrement(true);
                    try {
                      const resp =
                        await apiDencrimentValue.updateAuctionDecrement(
                          id || "",
                          num
                        );
                      if (resp && resp.success) {
                        toast.success("Decrement value updated");
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
            <div className="alv-countdown-info">
              <h3>
            <Timer className="alv-countdown-icon mr-2" />
                {auction.status === "completed"
                  ? "Auction Closed"
                  : "Auction will be Closed in"}
              </h3>
              <p className="alv-countdown-subtitle">
                {isPaused && "Auction is currently paused"}
                {!isPaused && isInAutoExtendWindow && (
                  <span style={{ color: "#f59e0b", fontWeight: "bold" }}>
                    ⚠️ Auto-extend ACTIVE
                  </span>
                )}
                {!isPaused &&
                  !isInAutoExtendWindow &&
                  auction.status === "live" && (
                    <span style={{ color: "#10b981", fontWeight: "bold" }}>
                      ✅ Auto-extend will activate in last 2 minutes
                    </span>
                  )}
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
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(bid.bid_time).toLocaleDateString("en-GB")}
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
                    <button
                      className="btn btn-danger"
                      onClick={() => handleRejectBid(bid.id)}
                      disabled={rejectingBidId === bid.id}
                    >
                      {rejectingBidId === bid.id
                        ? "Rejecting..."
                        : "Reject Bid"}
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
