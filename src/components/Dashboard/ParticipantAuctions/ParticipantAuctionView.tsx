import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./ParticipantAuctionView.css";
import { format, parse, isValid, addMinutes } from "date-fns";
import {
  Calendar,
  Clock,
  Users,
  FileText,
  Download,
  IndianRupee,
  Timer,
  ArrowLeft,
  RefreshCw,
  Play,
  Gavel,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { API_BASE_URL } from "../../../services/apiConfig";
import toast from "react-hot-toast";
// Utility to format time string
const formatTime = (timeStr: string | undefined) => {
  if (!timeStr) return "N/A";

  try {
    let parsed = parse(timeStr, "HH:mm:ss", new Date());
    if (!isValid(parsed)) {
      parsed = parse(timeStr, "HH:mm", new Date());
    }
    if (!isValid(parsed)) {
      const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
      if (timeMatch) {
        const [, hours, minutes] = timeMatch;
        parsed = parse(`${hours}:${minutes}`, "HH:mm", new Date());
      }
    }

    if (isValid(parsed)) {
      return format(parsed, "hh:mm a");
    }
  } catch (error) {
    console.warn("[formatTime] Error parsing time:", timeStr, error);
  }

  return timeStr.replace(/:\d{2}$/, "");
};

// Utility to format duration
const formatDuration = (duration: number | undefined) => {
  if (!duration || duration === 0) return "N/A";

  const minutes = duration > 1440 ? Math.floor(duration / 60) : duration;

  if (minutes < 60) {
    return `${minutes} minutes`;
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0
      ? `${hours}h ${remainingMinutes}m`
      : `${hours} hours`;
  }
};

interface AuctionData {
  id: number;
  auction_title: string;
  auction_number: string;
  auction_date: string;
  start_time: string;
  end_time: string;
  duration: number;
  currency: string;
  description: string;
  open_to_all: number;
  pre_bid_allowed: number;
  decremental_value: number;
  starting_price: number;
  reserve_price: number | null;
  status: "upcoming" | "live" | "completed";
  documents: any[];
  created_by: number;
  created_at: string;
  updated_at: string;
  bids: any[];
  participants: any[];
}

const ParticipantAuctionView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [auction, setAuction] = useState<AuctionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Pre-bid functionality states
  const [showPreBuildModal, setShowPreBuildModal] = useState(false);
  const [preBuildInput, setPreBuildInput] = useState("");
  const [preBuildError, setPreBuildError] = useState<string | null>(null);
  const [preBuildLoading, setPreBuildLoading] = useState(false);

  // Live bidding states
  const [showLiveBidModal, setShowLiveBidModal] = useState(false);
  const [liveBidInput, setLiveBidInput] = useState("");
  const [liveBidError, setLiveBidError] = useState<string | null>(null);
  const [liveBidLoading, setLiveBidLoading] = useState(false);

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (id) {
      loadAuctionDetails();
    }
  }, [id]);

  const getAuthToken = () => {
    return (
      localStorage.getItem("authToken") ||
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken")
    );
  };

  const loadAuctionDetails = async (isManualRefresh = false) => {
    if (!id || !isMountedRef.current) {
      navigate("/dashboard/auctions");
      return;
    }

    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("No authentication token found");
      }

      // Fetch auction details from the correct API endpoint
      const response = await fetch(`${API_BASE_URL}/auction/${id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.auction) {
        const auctionData = result.auction;

        // Transform the API data to match our interface
        const transformedAuction: AuctionData = {
          id: auctionData.id,
          auction_title: auctionData.title || "Untitled Auction",
          // auction_title:rawAuction.title || rawAuction.auction_title || "Untitled Auction",
          auction_number: auctionData.auction_number || `AUC-${auctionData.id}`,
          auction_date: auctionData.auction_date || "",
          start_time:
            auctionData.start_time || auctionData.formatted_start_time || "",
          end_time:
            auctionData.status === "upcoming"
              ? (() => {
                  const s = parse(
                    auctionData.start_time!,
                    "HH:mm:ss",
                    new Date()
                  );
                  const e = addMinutes(s, auctionData.duration || 0);
                  return format(e, "hh:mm a");
                })()
              : auctionData.formatted_end_time || auctionData.end_time || "",
          duration: parseInt(auctionData.duration) || 0,
          currency: auctionData.currency || "INR",
          description:
            auctionData.description ||
            auctionData.auction_details ||
            "No description available",
          open_to_all: auctionData.open_to_all || 0,
          pre_bid_allowed: auctionData.pre_bid_allowed || 0,
          decremental_value: parseFloat(auctionData.decremental_value) || 0,
          starting_price: parseFloat(auctionData.starting_price) || 0,
          reserve_price: auctionData.reserve_price
            ? parseFloat(auctionData.reserve_price)
            : null,
          status: auctionData.status || "upcoming",
          documents: Array.isArray(auctionData.documents)
            ? auctionData.documents
            : [],
          created_by: auctionData.created_by,
          created_at: auctionData.created_at,
          updated_at: auctionData.updated_at,
          bids: Array.isArray(auctionData.bids) ? auctionData.bids : [],
          participants: Array.isArray(auctionData.participants)
            ? auctionData.participants
            : [],
        };

        console.log(
          "[ParticipantAuctionView] Transformed auction data:",
          transformedAuction
        );

        if (isMountedRef.current) {
          setAuction(transformedAuction);
        }
      } else {
        throw new Error(result.message || "Failed to load auction data");
      }
    } catch (error) {
      console.error(
        "[ParticipantAuctionView] Error loading auction details:",
        error
      );
      if (isMountedRef.current) {
        toast.error(
          "Failed to load auction details. Please try refreshing the page."
        );
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  const handleDownloadDocument = async (doc: {
    file_name?: string;
    file_url?: string;
    file_type?: string;
    name?: string;
    url?: string;
  }) => {
    try {
      const token = getAuthToken();

      // Use the correct field names from your API response
      const documentUrl = doc.file_url || doc.url;
      const filename = doc.file_name || doc.name || "document";

      if (!documentUrl) {
        toast.error("Document URL not available");
        return;
      }

      // Force download for all file types
      const response = await fetch(documentUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success(`Downloading ${filename}`);
    } catch (error) {
      console.error("[handleDownloadDocument] Failed to download:", error);

      // Fallback: open in new tab
      const documentUrl = doc.file_url || doc.url;
      if (documentUrl) {
        window.open(documentUrl, "_blank");
        toast.error(
          "Unable to download file directly. Opened in new tab instead."
        );
      } else {
        toast.error("Unable to access document");
      }
    }
  };

  const handleJoinAuction = async () => {
    if (!auction || !user) return;

    try {
      const token = getAuthToken();
      if (!token) {
        toast.error("Authentication required");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/auction/${auction.id}/participants`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone_number: user.phoneNumber,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          toast.success("Successfully joined the auction!");
          loadAuctionDetails();
        } else {
          toast.error(result.message || "Failed to join auction");
        }
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error joining auction:", error);
      toast.error("Failed to join auction");
    }
  };

  const handleSavePreBuild = async () => {
    if (!auction) return;
    setPreBuildError(null);

    const val = Number(preBuildInput);

    if (isNaN(val) || val <= 0) {
      setPreBuildError("Please enter a valid positive number");
      return;
    }

    // Calculate current lowest bid and minimum allowed bid
    const existingBids = auction.bids || [];
    const activeBids = existingBids.filter(
      (bid: any) =>
        bid.status === "approved" ||
        bid.status === null ||
        bid.status === undefined
    );

    const currentLowestBid =
      activeBids.length > 0
        ? Math.min(
            ...activeBids.map((bid: any) =>
              parseFloat(bid.amount || auction.starting_price)
            )
          )
        : auction.starting_price;

    // Next bid target = Current Lowest Bid - Decremental Value (reverse auction)
    const minAllowedBid = currentLowestBid - auction.decremental_value;

    // Validation 1: bid must be lower than current lowest bid

    // ✅ Only enforce decremental rule if there are existing active bids
    if (activeBids.length > 0) {
      if (val >= currentLowestBid) {
        setPreBuildError(`Your bid must be lower than the current lowest bid`);
        return;
      }
      if (val > minAllowedBid) {
        setPreBuildError(
          `Your bid is too high. Maximum allowed is ${formatCurrency(
            minAllowedBid,
            auction.currency
          )}`
        );
        return;
      }
    }

    setPreBuildLoading(true);
    try {
      const token = getAuthToken();
      if (!token) {
        toast.error("Authentication required");
        return;
      }

      // Use the same API endpoint for both pre-bids and live bids
      const response = await fetch(`${API_BASE_URL}/auction/bid`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          auction_id: auction.id,
          amount: val,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success || result.status === true) {
          toast.success(
            auction.status === "upcoming"
              ? "Pre-bid submitted successfully!"
              : "Bid placed successfully!"
          );
          setShowPreBuildModal(false);
          setPreBuildInput("");
          loadAuctionDetails();
        } else {
          setPreBuildError(result.message || "Failed to submit bid");
        }
      } else {
        const errorResult = await response.json().catch(() => null);
        throw new Error(
          errorResult?.message || `HTTP error! status: ${response.status}`
        );
      }
    } catch (error) {
      console.error("Error submitting bid:", error);
      setPreBuildError(
        error instanceof Error ? error.message : "Failed to submit bid"
      );
      toast.error("Failed to submit bid");
    } finally {
      setPreBuildLoading(false);
    }
  };
  const formatCurrency = (amount: number | undefined, currency: string) => {
    return `${currency} ${amount?.toLocaleString() || 0}`;
  };

  const handleLiveBid = async () => {
    if (!auction || !user) return;
    setLiveBidError(null);

    const bidAmount = Number(liveBidInput);

    if (isNaN(bidAmount) || bidAmount <= 0) {
      setLiveBidError("Please enter a valid positive number");
      return;
    }

    // Calculate current lowest bid and minimum allowed bid
    const existingBids = auction.bids || [];
    const activeBids = existingBids.filter(
      (bid: any) =>
        bid.status === "approved" ||
        bid.status === null ||
        bid.status === undefined
    );

    const currentLowestBid =
      activeBids.length > 0
        ? Math.min(
            ...activeBids.map((bid: any) =>
              parseFloat(bid.amount || auction.starting_price)
            )
          )
        : auction.starting_price;

    // Next bid target = Current Lowest Bid - Decremental Value (reverse auction)
    const minAllowedBid = currentLowestBid - auction.decremental_value;

    // ✅ Only enforce decremental rule if there are existing active bids
    if (activeBids.length > 0) {
      if (bidAmount >= currentLowestBid) {
        setLiveBidError(`Your bid must be lower than the current lowest bid`);
        return;
      }
      if (bidAmount > minAllowedBid) {
        setLiveBidError(
          `Your bid is too high. Maximum allowed is ${formatCurrency(
            minAllowedBid,
            auction.currency
          )}`
        );
        return;
      }
    }

    setLiveBidLoading(true);
    try {
      const token = getAuthToken();
      const response = await fetch(
        `${API_BASE_URL}/auction/${auction.id}/bid`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: bidAmount,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          toast.success("Bid placed successfully!");
          setShowLiveBidModal(false);
          setLiveBidInput("");
          loadAuctionDetails();
        } else {
          setLiveBidError(result.message || "Failed to place bid");
        }
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error placing live bid:", error);
      setLiveBidError("Failed to place bid");
    } finally {
      setLiveBidLoading(false);
    }
  };

  const handleJoinSession = () => {
    if (auction?.status !== "live") return;
    navigate(`/dashboard/auctions/${id}/session`);
  };

  if (loading) {
    return (
      <div className="auction-view-container">
        <div className="loading-spinner">
          <RefreshCw className="animate-spin w-8 h-8 text-blue-600" />
          <p>Loading auction details...</p>
        </div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="auction-view-container">
        <div className="error-state">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">
            Auction Not Found
          </h2>
          <p className="text-gray-500 mb-4">
            The requested auction could not be found.
          </p>
          <button
            onClick={() => navigate("/dashboard/auctions")}
            className="btn btn-primary"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Auctions
          </button>
        </div>
      </div>
    );
  }

  // Calculate bidding information
  const activeBids = auction.bids.filter(
    (bid: any) =>
      bid.status === "approved" ||
      bid.status === null ||
      bid.status === undefined
  );
  const currentLowestBid =
    activeBids.length > 0
      ? Math.min(
          ...activeBids.map((bid: any) =>
            parseFloat(bid.amount || auction.starting_price)
          )
        )
      : auction.starting_price;
  const totalBids = activeBids.length;

  // CORRECTED: Minimum allowed bid = Current Lowest Bid - Decremental Value
  const minAllowedBid = currentLowestBid - auction.decremental_value;

  // Check if user is participant
  const isParticipant = auction.participants.some(
    (p: any) => p.phone_number === user?.phoneNumber || p.user_id === user?.id
  );

  return (
    <div className="view-auction-container">
      <div className="view-auction-header">
        <div>
          <h1 className="auction-title">{auction.auction_title}</h1>
          <p className="auction-subtitle">#{auction.auction_number}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {/* <button
            onClick={() => loadAuctionDetails(true)}
            className="btn btn-secondary"
            disabled={refreshing}
            style={{
              padding: "0.5rem",
              minWidth: "auto",
              background: "rgba(255, 255, 255, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              opacity: refreshing ? 0.6 : 1,
              cursor: refreshing ? "not-allowed" : "pointer",
            }}
            title="Refresh auction data"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            />
          </button> */}
          <div
            className={`auction-status-badge ${
              auction.status === "upcoming"
                ? "status-upcoming"
                : auction.status === "live"
                ? "status-live"
                : "status-completed"
            }`}
          >
            {auction.status === "upcoming" && <Clock className="w-4 h-4" />}
            {auction.status === "live" && <Play className="w-4 h-4" />}
            {auction.status === "completed" && (
              <CheckCircle className="w-4 h-4" />
            )}
            {auction.status.charAt(0).toUpperCase() + auction.status.slice(1)}
          </div>
        </div>
      </div>

      {/* Auction Details Card */}
      <div className="auction-details-card">
        <h2 className="card-title">
          <FileText className="w-5 h-5" />
          Auction Details
        </h2>
        <div className="auction-info-grid">
          <div className="info-item">
            <span className="info-label">Date</span>
            <div className="info-value">
              <Calendar className="w-4 h-4" />
              {auction.auction_date
                ? format(new Date(auction.auction_date), "dd MMM yyyy")
                : "Date not specified"}
            </div>
          </div>

          <div className="info-item">
            <span className="info-label">Start Time</span>
            <div className="info-value">
              <Clock className="w-4 h-4" />
              {formatTime(auction.start_time)}
            </div>
          </div>

          <div className="info-item">
            <span className="info-label">End Time</span>
            <div className="info-value">
              <Clock className="w-4 h-4" />
              {formatTime(auction.end_time)}
            </div>
          </div>

          <div className="info-item">
            <span className="info-label">Duration</span>
            <div className="info-value">
              <Timer className="w-4 h-4" />
              {formatDuration(auction.duration)}
            </div>
          </div>

          <div className="info-item">
            <span className="info-label">Decremental Value</span>
            <div className="info-value">
              <Gavel className="w-4 h-4" />
              {formatCurrency(auction.decremental_value, auction.currency)}
            </div>
          </div>

          <div className="info-item">
            <span className="info-label">Participants</span>
            <div className="info-value">
              <Users className="w-4 h-4" />
              {auction.participants.length} registered
            </div>
          </div>
        </div>

        <div className="auction-description">
          <h4>Description</h4>
          <p>{auction.description}</p>
        </div>
      </div>

      {/* Current Bidding Status */}
      {(auction.status === "live" || auction.status === "upcoming") && (
        <div className="auction-details-card">
          <h2 className="card-title">
            <Gavel className="w-5 h-5" />
            {auction.status === "live"
              ? "Live Bidding Status"
              : "Auction Bidding Info"}
          </h2>
          <div className="auction-info-grid">
            <div className="info-item">
              <span className="info-label">Current Lowest Bid</span>
              <div className="info-value">
                <IndianRupee className="w-4 h-4" />
                {formatCurrency(currentLowestBid, auction.currency)}
              </div>
            </div>
            <div className="info-item">
              <span className="info-label">Total Bids</span>
              <div className="info-value">
                <Gavel className="w-4 h-4" />
                {totalBids} bids placed
              </div>
            </div>
            <div className="info-item">
              <span className="info-label">Minimum Next Bid</span>
              <div className="info-value">
                <IndianRupee className="w-4 h-4" />
                {formatCurrency(minAllowedBid, auction.currency)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Documents */}
      {/* Documents */}
      {auction && auction.documents && auction.documents.length > 0 && (
        <div className="auction-details-card">
          <h2 className="card-title">
            <FileText className="w-5 h-5" />
            Auction Documents
          </h2>
          <div className="documents-grid">
            {auction.documents.map((doc, index) => (
              <div key={index} className="document-card">
                <div className="document-icon">
                  <FileText className="w-8 h-8" />
                </div>
                <div className="document-details">
                  <div className="document-info">
                    <h4>{doc.file_name || "Document"}</h4>
                    <p>{doc.file_type || "PDF Document"}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDownloadDocument(doc)}
                  className="btn btn-primary download-btn"
                  title={`Download ${doc.file_name || "document"}`}
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Participation Status */}
      {isParticipant && (
        <div className="auction-details-card">
          <div className="participation-status">
            <CheckCircle className="w-5 h-5" />
            <span>You are registered for this auction</span>
          </div>
        </div>
      )}

      {/* Join Auction Button */}
      {!isParticipant && auction.status !== "completed" && (
        <div className="auction-details-card">
          <div className="join-form">
            <h3>Join This Auction</h3>
            <p>Register to participate in this auction</p>
            <button onClick={handleJoinAuction} className="btn btn-secondary">
              <Users className="w-4 h-4" />
              Register as Participant
            </button>
          </div>
        </div>
      )}

      {/* Pre-Bid Section */}
      {/* Pre-Bid Section */}
      {auction.pre_bid_allowed && auction.status !== "completed" && (
        <div className="auction-details-card">
          <div className="prebuild-content">
            <div>
              <h3>
                {auction.status === "upcoming"
                  ? "Pre-Bid Submission"
                  : "Place Your Bid"}
              </h3>
              <p>
                {auction.status === "upcoming"
                  ? "Submit your bid before the auction goes live"
                  : "The auction is live! Place your bid now."}
              </p>
            </div>
            <button
              onClick={() => setShowPreBuildModal(true)}
              className={`btn ${
                auction.status === "upcoming" ? "btn-secondary" : "btn-primary"
              } prebuild-btn`}
            >
              <Gavel className="w-4 h-4" />
              {auction.status === "upcoming"
                ? "Submit Pre-Bid"
                : "Place Bid Now"}
            </button>
          </div>
        </div>
      )}

      {/* Live Bidding Section */}
      {/* {(auction.status === "live" || auction.status === "upcoming") && (
            <div className="auction-details-card">
              <div className="prebuild-content">
                <div>
                  <h3>
                    {auction.status === "live"
                      ? "🔴 LIVE: Place Your Bid Now!"
                      : "📅 Ready to Bid"}
                  </h3>
                  <p>
                    {auction.status === "live"
                      ? "The auction is live! Place your bid now to participate."
                      : "Auction will start soon. You can bid when it goes live."}
                  </p>
                </div>
                <button
                  onClick={() => setShowLiveBidModal(true)}
                  disabled={auction.status !== "live"}
                  className="btn btn-primary prebuild-btn"
                >
                  <Gavel className="w-4 h-4" />
                  {auction.status === "live"
                    ? "Place Bid Now!"
                    : "Bidding Available When Live"}
                </button>
              </div>
            </div>
          )} */}

      {/* Live Session Button */}
      {/* {auction.status === "live" && (
            <div className="auction-details-card">
              <div className="prebuild-content">
                <div>
                  <h3>Live Auction Session</h3>
                  <p>
                    Join the full live session interface for real-time bidding.
                  </p>
                </div>
                <button
                  onClick={handleJoinSession}
                  className="btn btn-primary prebuild-btn"
                >
                  <Play className="w-4 h-4" />
                  Join Live Session
                </button>
              </div>
            </div>
          )} */}

      {/* Pre-Bid Modal */}
      {showPreBuildModal && auction && (
        <div
          className="prebuild-modal-overlay"
          onClick={() => setShowPreBuildModal(false)}
        >
          <div className="prebuild-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="prebuild-modal-title">Submit Pre-Bid</h3>

            {/* <div className="bid-info">
                  <p>
                    <strong>Current Lowest Bid:</strong>{" "}
                    {formatCurrency(currentLowestBid, auction.currency)}
                  </p>
                  <p>
                    <strong>Decremental Value:</strong>{" "}
                    {formatCurrency(
                      auction.decremental_value,
                      auction.currency
                    )}
                  </p>
                  <p>
                    <strong>Minimum Allowed Bid:</strong>{" "}
                    {formatCurrency(minAllowedBid, auction.currency)}
                  </p>
                  <p>
                    <strong>Valid Bid Rule:</strong> Your bid must be at or
                    below {formatCurrency(minAllowedBid, auction.currency)} (at
                    least the decrement lower than current lowest).
                  </p>
                  <p>
                    <strong>Logic:</strong> Current lowest (
                    {formatCurrency(currentLowestBid, auction.currency)}) -
                    Decremental value (
                    {formatCurrency(
                      auction.decremental_value,
                      auction.currency
                    )}
                    ) = {formatCurrency(minAllowedBid, auction.currency)}
                  </p>
                </div> */}

            <input
              type="number"
              value={preBuildInput}
              onChange={(e) => setPreBuildInput(e.target.value)}
              placeholder={`Enter bid amount (${auction.currency})`}
              className="prebuild-input"
            />

            {preBuildError && (
              <div className="prebuild-error">
                {preBuildError.split("\n").map((line, index) => (
                  <div key={index}>{line}</div>
                ))}
              </div>
            )}

            <div className="prebuild-modal-actions">
              <button
                onClick={() => setShowPreBuildModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePreBuild}
                disabled={preBuildLoading}
                className="btn btn-primary"
              >
                {preBuildLoading ? "Submitting..." : "Submit Pre-Bid"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Bid Modal */}
      {showLiveBidModal && auction && (
        <div
          className="prebuild-modal-overlay"
          onClick={() => setShowLiveBidModal(false)}
        >
          <div className="prebuild-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="prebuild-modal-title">Place Live Bid</h3>

            <div className="bid-info">
              <p>
                <strong>Current Lowest Bid:</strong>{" "}
                {formatCurrency(currentLowestBid, auction.currency)}
              </p>
              <p>
                <strong>Decremental Value:</strong>{" "}
                {formatCurrency(auction.decremental_value, auction.currency)}
              </p>
              <p>
                <strong>Minimum Allowed Bid:</strong>{" "}
                {formatCurrency(minAllowedBid, auction.currency)}
              </p>
              <p>
                <strong>Valid Bid Rule:</strong> Your bid must be at or below{" "}
                {formatCurrency(minAllowedBid, auction.currency)} (at least the
                decrement lower than current lowest).
              </p>
            </div>

            <input
              type="number"
              value={liveBidInput}
              onChange={(e) => setLiveBidInput(e.target.value)}
              placeholder={`Enter bid amount (${auction.currency})`}
              className="prebuild-input"
            />

            {liveBidError && (
              <div className="prebuild-error">{liveBidError}</div>
            )}

            <div className="prebuild-modal-actions">
              <button
                onClick={() => setShowLiveBidModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleLiveBid}
                disabled={liveBidLoading}
                className="btn btn-primary"
              >
                {liveBidLoading ? "Placing Bid..." : "Place Bid"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParticipantAuctionView;
