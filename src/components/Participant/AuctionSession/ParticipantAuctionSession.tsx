import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./ParticipantAuctionSession.css";
import {
  Timer,
  Users,
  IndianRupee,
  TrendingDown,
  Send,
  Building,
  MapPin,
  Clock,
  AlertTriangle,
  Crown,
  ArrowLeft,
  Info,
  Activity,
  Zap,
} from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import toast from "react-hot-toast";
import newAuctionService from "../../../services/newAuctionService";

// Interfaces based on the API response
interface Bid {
  id: number;
  user_id: number;
  amount: string;
  created_at: string;
  user?: {
    person_name: string;
    company_name: string;
  } | null;
  time_ago?: string;
}

interface BidRanking {
  user_id: number;
  person_name: string;
  company_name: string;
  bid_count: number;
  last_bid_time: string;
  rank: number;
  amount: string;
}

interface Statistics {
  total_participants: number;
  active_participants: number;
  total_bids: number;
  lowest_bid: number | null;
}

interface Auction {
  id: number;
  title: string;
  description: string;
  auction_date: string;
  start_time: string;
  end_time: string;
  duration?: number;
  currency: string;
  decremental_value: string;
  current_price?: string;
  pre_bid_allowed?: number; // 1 = allowed, 0 = not allowed
  status: "upcoming" | "live" | "completed";
  auction_no: string;
  bids: Bid[];
  statistics: Statistics;
  time_value?: string;
  time_status?: string;
}

const ParticipantAuctionSession: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [auction, setAuction] = useState<Auction | null>(null);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [bidRanking, setBidRanking] = useState<BidRanking[]>([]);
  const [bidAmount, setBidAmount] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isSubmittingBid, setIsSubmittingBid] = useState(false);
  const [isSubmittingPreBid, setIsSubmittingPreBid] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isJoined, setIsJoined] = useState(false);

  const calculateNextBid = (currentAuction: Auction): string => {
    const lowestBid = currentAuction.statistics?.lowest_bid;
    const decrement = parseFloat(currentAuction.decremental_value);
    if (lowestBid !== null && lowestBid !== undefined) {
      return (lowestBid - decrement).toString();
    }
    return "";
  };

  const fetchAuctionData = useCallback(async () => {
    if (!id) return;
    console.log(
      "[ParticipantAuctionSession] Fetching auction data for ID:",
      id
    );
    try {
      const token =
        localStorage.getItem("authToken") || localStorage.getItem("token");
      const response = await fetch(
        `https://auction-development.onrender.com/api/auction/${id}/participants`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      console.log(
        "[ParticipantAuctionSession] Fetch response status:",
        response.status
      );
      if (!response.ok) {
        setIsJoined(false);
        throw new Error(
          `Failed to fetch auction details. Status: ${response.status}`
        );
      }

      const data = await response.json();
      console.log("[ParticipantAuctionSession] Auction data received:", data);
      if (data.success && data.auction) {
        setAuction(data.auction);
        setStatistics(data.statistics);
        setBidRanking(data.bid_ranking || []);
        const nextBid = calculateNextBid(data.auction);
        setBidAmount(nextBid);
        setError(null);
        console.log(
          "[ParticipantAuctionSession] Auction data set successfully"
        );
      } else {
        throw new Error(data.message || "Invalid auction data received");
      }
    } catch (err: any) {
      console.error("[ParticipantAuctionSession] Fetch failed:", err);
      setError(err.message);
      setAuction(null);
      if (err.message.includes("Status: 403")) {
        setIsJoined(false);
        toast.error("Access denied. You may need to join the auction first.");
      } else {
        toast.error(err.message);
      }
    }
  }, [id]);

  const joinAuction = useCallback(async () => {
    if (!id || !user) return false;
    console.log(
      "[ParticipantAuctionSession] Starting joinAuction for auction:",
      id
    );
    setLoading(true);
    try {
      const token =
        localStorage.getItem("authToken") || localStorage.getItem("token");
      console.log(
        "[ParticipantAuctionSession] Joining auction with token:",
        token ? "Present" : "Missing"
      );
      const response = await fetch(
        "https://auction-development.onrender.com/api/auction/join",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            auction_id: Number(id),
            phone_number: user.phoneNumber,
          }),
        }
      );
      const result = await response.json();
      console.log("[ParticipantAuctionSession] Join response:", result);
      if (
        response.ok &&
        (result.success || result.message?.includes("already joined"))
      ) {
        toast.success(result.message || "Successfully joined auction!");
        setIsJoined(true);
        console.log(
          "[ParticipantAuctionSession] Successfully joined, fetching auction data..."
        );
        await fetchAuctionData();
        setLoading(false);
        console.log(
          "[ParticipantAuctionSession] Join process completed successfully"
        );
        return true;
      }
      throw new Error(
        result.message || `Failed to join auction. Status: ${response.status}`
      );
    } catch (err: any) {
      console.error("[ParticipantAuctionSession] Join failed:", err);
      setError(err.message);
      toast.error(err.message);
      setIsJoined(false);
      setLoading(false);
      return false;
    }
  }, [id, user, fetchAuctionData]);

  useEffect(() => {
    console.log(
      "[ParticipantAuctionSession] useEffect triggered with id:",
      id,
      "user:",
      user?.id
    );
    if (id && user) {
      joinAuction();
    }
  }, [id, user, joinAuction]);

  // Separate timeout effect
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading && !auction) {
        console.error(
          "[ParticipantAuctionSession] Loading timeout reached, forcing error state"
        );
        setLoading(false);
        setError("Loading timeout - please try again");
      }
    }, 30000); // 30 second timeout

    return () => clearTimeout(timeout);
  }, []); // Run only once on mount

  // Ensure loading is false when we have auction data
  useEffect(() => {
    if (auction && loading) {
      console.log(
        "[ParticipantAuctionSession] Auction data available, setting loading to false"
      );
      setLoading(false);
    }
  }, [auction, loading]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isJoined) {
        fetchAuctionData();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isJoined, fetchAuctionData]);

  useEffect(() => {
    if (!auction || auction.status !== "live") {
      setTimeLeft(0);
      return;
    }

    const timer = setInterval(() => {
      const endTime = new Date(`${auction.auction_date}T${auction.end_time}`);
      const now = new Date();
      const diff = endTime.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft(0);
        clearInterval(timer);
        if (auction.status !== "completed") {
          setAuction((prev) =>
            prev ? { ...prev, status: "completed" } : null
          );
        }
        return;
      }
      setTimeLeft(diff);
    }, 1000);

    return () => clearInterval(timer);
  }, [auction]);

  const formatTimeRemaining = (milliseconds: number) => {
    if (milliseconds <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    const totalSeconds = Math.floor(milliseconds / 1000);
    const days = Math.floor(totalSeconds / (24 * 60 * 60));
    const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
    const seconds = totalSeconds % 60;
    return { days, hours, minutes, seconds };
  };

  const handleSubmitBid = async () => {
    if (!auction || !user || !bidAmount) return;

    const bidValue = parseFloat(bidAmount);
    if (isNaN(bidValue) || bidValue <= 0) {
      toast.error("Please enter a valid bid amount.");
      return;
    }

    const lowestBid = auction.statistics.lowest_bid;
    if (lowestBid !== null && bidValue >= lowestBid) {
      toast.error("Your bid must be lower than the current lowest price.");
      return;
    }

    setIsSubmittingBid(true);
    try {
      const result = await newAuctionService.placeBid({
        auction_id: Number(auction.id),
        amount: Number(bidValue),
      });

      if (result?.success) {
        toast.success(result.message || "Bid submitted successfully!");
        fetchAuctionData();
      } else {
        const msg = result?.message || "Failed to submit bid.";
        toast.error(msg);
        throw new Error(msg);
      }
    } catch (error: any) {
      console.error("[ParticipantAuctionSession] Bid submit error:", error);
      const msg = error?.message || "Failed to submit bid.";
      if (/forbidden|not allowed|401|403/i.test(msg)) {
        toast.error("Not allowed to bid. Make sure you joined this auction.");
        setIsJoined(false);
      } else {
        toast.error(msg);
      }
    } finally {
      setIsSubmittingBid(false);
    }
  };

  const handlePreBid = async () => {
    if (!auction || !user || !bidAmount) return;

    const bidValue = parseFloat(bidAmount);
    if (isNaN(bidValue) || bidValue <= 0) {
      toast.error("Please enter a valid bid amount.");
      return;
    }

    const lowestBid = auction.statistics?.lowest_bid;
    if (
      lowestBid !== null &&
      lowestBid !== undefined &&
      bidValue >= lowestBid
    ) {
      toast.error("Your bid must be lower than the current lowest price.");
      return;
    }

    setIsSubmittingPreBid(true);
    try {
      const token =
        localStorage.getItem("authToken") || localStorage.getItem("token");
      const response = await fetch(
        "https://auction-development.onrender.com/api/auction/bid",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            auction_id: Number(auction.id),
            amount: Number(bidValue),
          }),
        }
      );

      const result = await response.json();

      if (response.ok && result?.success) {
        toast.success(result.message || "Pre-bid submitted successfully!");
        fetchAuctionData();
      } else {
        const msg = result?.message || "Failed to submit pre-bid.";
        toast.error(msg);
        throw new Error(msg);
      }
    } catch (error: any) {
      console.error("[ParticipantAuctionSession] Pre-bid submit error:", error);
      const msg = error?.message || "Failed to submit pre-bid.";
      if (/forbidden|not allowed|401|403/i.test(msg)) {
        toast.error(
          "Not allowed to pre-bid. Make sure you joined this auction."
        );
        setIsJoined(false);
      } else {
        toast.error(msg);
      }
    } finally {
      setIsSubmittingPreBid(false);
    }
  };

  console.log("[ParticipantAuctionSession] Render state:", {
    loading,
    error,
    isJoined,
    auction: !!auction,
  });

  if (loading && !auction) {
    console.log("[ParticipantAuctionSession] Rendering loading state");
    return (
      <div className="participant-auction-loading">
        <div className="loading-card">
          <div className="loading-spinner" />
          <p>Joining and loading auction...</p>
        </div>
      </div>
    );
  }

  if (error && !isJoined) {
    console.log("[ParticipantAuctionSession] Rendering error state:", error);
    return (
      <div className="participant-auction-error">
        <div className="error-card">
          <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
          <h2>Access Denied</h2>
          <p>{error}</p>
          <button onClick={joinAuction} className="error-back-btn">
            <Users className="w-4 h-4" />
            Retry Joining Auction
          </button>
        </div>
      </div>
    );
  }

  if (!auction) {
    console.log("[ParticipantAuctionSession] Rendering no auction state");
    return (
      <div className="participant-auction-error">
        <div className="error-card">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mb-4" />
          <h2>Waiting for Auction Data</h2>
          <p>Successfully joined. Waiting to retrieve auction details...</p>
          <div className="loading-spinner mt-4" />
        </div>
      </div>
    );
  }

  const timeRemaining = formatTimeRemaining(timeLeft);
  const currentLowest = auction.statistics?.lowest_bid;
  const rankedBids = [...(auction.bids || [])].sort(
    (a, b) => parseFloat(a.amount) - parseFloat(b.amount)
  );

  return (
    <div className="participant-auction-session">
      <div className="session-header">
        <button
          onClick={() => navigate("/dashboard/auctions")}
          className="back-button"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="session-title-section">
          <h1 className="session-title">
            <Activity className="w-6 h-6" />
            {auction.title}
          </h1>
          <p className="session-subtitle">Auction No: {auction.auction_no}</p>
        </div>
        <div className={`auction-status ${auction.status}`}>
          <Zap className="w-4 h-4" />
          {auction.time_status || auction.status.toUpperCase()}
        </div>
      </div>

      <div className="status-grid">
        <div className="status-card auction-details-card">
          <div className="status-header">
            <Info className="w-6 h-6 text-indigo-500" />
            <span>Auction Details</span>
          </div>
          <div className="auction-details-grid">
            {/* <div className="detail-row">
              <span className="detail-label">Auction No:</span>
              <span className="detail-value">{auction.auction_no}</span>
            </div> */}
            <div className="detail-row description-row">
              <span className="detail-label">Description:</span>
              <span className="detail-value description-text">
                {auction.description || "—"}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Date:</span>
              <span className="detail-value">
                {new Date(
                  auction.auction_date + "T00:00:00"
                ).toLocaleDateString()}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Start Time:</span>
              <span className="detail-value">
                {new Date(
                  `${auction.auction_date}T${auction.start_time}`
                ).toLocaleTimeString()}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">End Time:</span>
              <span className="detail-value">
                {new Date(
                  `${auction.auction_date}T${auction.end_time}`
                ).toLocaleTimeString()}
              </span>
            </div>
            {/* <div className="detail-row">
              <span className="detail-label">Duration:</span>
              <span className="detail-value">
                {auction.duration ? `${auction.duration} min` : "—"}
              </span>
            </div> */}
            {/* <div className="detail-row">
              <span className="detail-label">Start Price:</span>
              <span className="detail-value">
                {auction.currency}{" "}
                {auction.current_price
                  ? parseFloat(auction.current_price).toLocaleString()
                  : "—"}
              </span>
            </div> */}
            <div className="detail-row">
              <span className="detail-label">Current Lowest (L1):</span>
              <span className="detail-value">
                {currentLowest !== null && currentLowest !== undefined
                  ? `${auction.currency} ${currentLowest.toLocaleString()}`
                  : auction.current_price
                  ? `${auction.currency} ${parseFloat(
                      auction.current_price
                    ).toLocaleString()}`
                  : "No bids yet"}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Decremental Value:</span>
              <span className="detail-value">
                {auction.currency}{" "}
                {parseFloat(auction.decremental_value).toLocaleString()}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Pre-Bid Allowed:</span>
              <span className="detail-value">
                {auction.pre_bid_allowed === 1 ? "Yes" : "No"}
              </span>
            </div>
          </div>
        </div>

        <div className="status-card timer-card">
          <div className="status-header">
            <Timer className="w-6 h-6 text-red-500" />
            <div className="timer-header-content">
              <span>
                {auction.status === "completed"
                  ? "Auction Ended"
                  : "Auction Closes In"}
              </span>
              {auction.status !== "completed" && (
                <span className="closing-time">
                  Closes on{" "}
                  {new Date(
                    `${auction.auction_date}T${auction.end_time}`
                  ).toLocaleDateString()}{" "}
                  at{" "}
                  {new Date(
                    `${auction.auction_date}T${auction.end_time}`
                  ).toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
          <div className="timer-display">
            <div className="time-unit">
              <span className="time-value">{timeRemaining.days}</span>
              <span className="time-label">Days</span>
            </div>
            <div className="time-separator">:</div>
            <div className="time-unit">
              <span className="time-value">
                {timeRemaining.hours.toString().padStart(2, "0")}
              </span>
              <span className="time-label">Hours</span>
            </div>
            <div className="time-separator">:</div>
            <div className="time-unit">
              <span className="time-value">
                {timeRemaining.minutes.toString().padStart(2, "0")}
              </span>
              <span className="time-label">Min</span>
            </div>
            <div className="time-separator">:</div>
            <div className="time-unit">
              <span className="time-value">
                {timeRemaining.seconds.toString().padStart(2, "0")}
              </span>
              <span className="time-label">Sec</span>
            </div>
          </div>
        </div>
      </div>

      {auction.status === "live" ? (
        <div className="bid-card">
          <div className="card-header">
            <h2 className="card-title">
              <Send className="w-5 h-5" />
              Submit Your Bid
            </h2>
          </div>
          <div className="card-content">
            <div className="bid-form">
              <div className="bid-input-section">
                <div className="form-group">
                  <label htmlFor="bidAmount">
                    Your Bid Price ({auction.currency})
                  </label>
                  <input
                    type="number"
                    id="bidAmount"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    className="bid-input"
                    placeholder="Enter your bid amount"
                  />
                </div>
              </div>
              <div className="bid-buttons">
                <button
                  onClick={handlePreBid}
                  disabled={isSubmittingPreBid || isSubmittingBid}
                  className="pre-bid-btn"
                >
                  {isSubmittingPreBid ? (
                    <div className="loading-spinner" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Place-Bid
                    </>
                  )}
                </button>
                {/* <button
                  onClick={handleSubmitBid}
                  disabled={isSubmittingBid || isSubmittingPreBid}
                  className="submit-bid-btn"
                >
                  {isSubmittingBid ? (
                    <div className="loading-spinner" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Submit Bid
                    </>
                  )}
                </button> */}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="auction-ended-card">
          <div className="card-content">
            <h3>
              {auction.status === "completed"
                ? "Auction Completed"
                : "Auction Not Active"}
            </h3>
            <p>
              This auction has{" "}
              {auction.status === "completed" ? "ended" : "not started yet"}.
            </p>
          </div>
        </div>
      )}

      <div className="rankings-card">
        <div className="card-header">
          <h2 className="card-title">
            <Crown className="w-5 h-5" />
            Live Bidding Rankings
          </h2>
          <p className="card-subtitle">
            Total Bids: {statistics?.total_bids || 0} • Active Participants:{" "}
            {statistics?.active_participants || 0}
          </p>
        </div>
        <div className="card-content">
          <div className="rankings-list">
            {bidRanking.length > 0 ? (
              bidRanking.map((bid, index) => (
                <div
                  key={bid.user_id}
                  className={`ranking-item ${
                    bid.user_id === Number(user?.id) ? "current-user" : ""
                  } ${index === 0 ? "winner" : ""}`}
                >
                  <div className="ranking-left">
                    <div className="rank-section">
                      <span className="rank-text">L{bid.rank}</span>
                    </div>
                    <div className="participant-info">
                      <div className="company-name">
                        <Building className="w-4 h-4" />
                        {bid.company_name || bid.person_name || "Unknown User"}
                        {bid.user_id === Number(user?.id) && (
                          <span className="user-badge">You</span>
                        )}
                      </div>
                      <div className="company-address">
                        <MapPin className="w-3 h-3" />
                        {bid.person_name || "Unknown"}
                      </div>
                    </div>
                  </div>
                  <div className="ranking-right">
                    <div
                      className={`offered-price ${index === 0 ? "lowest" : ""}`}
                    >
                      {auction.currency}{" "}
                      {parseFloat(bid.amount).toLocaleString()}
                    </div>
                    <div className="bid-time">
                      <Clock className="w-3 h-3" />
                      {/* {new Date(bid.last_bid_time).toLocaleTimeString()} */}

                      {new Date(
                        `${auction.auction_date}T${auction.end_time}`
                      ).toLocaleDateString()}

                      {/*  we fatching when create de auction date */}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-participants">
                <Users className="w-12 h-12 text-gray-400 mb-4" />
                <h4>No Bids Placed Yet</h4>
                <p>Be the first to place a bid in this auction!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParticipantAuctionSession;