import React, { useState, useEffect, useRef } from "react";
import "../MyAuctions/MyAuctions.css";
import { Link, useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  Calendar,
  Clock,
  Users,
  Eye,
  Play,
  Search,
  RefreshCw,
  Plus,
  Gavel,
  Download,
} from "lucide-react";
import apiService from "../../../services/apiAuctionService";
import { BaseAuction } from "../../../types/auction";
import { useAuth } from "../../../contexts/AuthContext";
import { API_BASE_URL } from "../../../services/apiConfig";

const MyCreatedA: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [auctions, setAuctions] = useState<BaseAuction[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [participantCounts, setParticipantCounts] = useState<{
    [key: string]: number;
  }>({});
  const [now, setNow] = useState<number>(Date.now());

  const firstLoadRef = useRef(true);

  // Helper: Check if user created the auction
  const isCreatedByUser = (auction: BaseAuction) => {
    if (!user) return false;
    return (
      auction.createdBy === user.id ||
      auction.userId === user.id ||
      auction.createdBy === user.companyName ||
      auction.auctioneerCompany === user.companyName ||
      (auction as any).auctioneerPhone === user.phoneNumber
    );
  };

  // Helper: Fetch participants by auction ID
  const fetchParticipantsByAuctionId = async (auctionId: string | number) => {
    try {
      const token =
        localStorage.getItem("token") || localStorage.getItem("authToken");
      if (!token) return null;

      const res = await fetch(
        `${API_BASE_URL}/auction/${auctionId}/participants`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.error(
        `Error fetching participants for auction ${auctionId}:`,
        err
      );
      return null;
    }
  };

  // Fetch participant counts for all auctions
  const fetchParticipantCounts = async (auctions: BaseAuction[]) => {
    const counts: { [key: string]: number } = {};
    const batchSize = 5;

    for (let i = 0; i < auctions.length; i += batchSize) {
      const batch = auctions.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (auction) => {
          const auctionId = auction.backendId || auction.id;
          if (auctionId) {
            try {
              const participantsData = await fetchParticipantsByAuctionId(
                auctionId
              );
              if (
                participantsData?.participants &&
                Array.isArray(participantsData.participants)
              ) {
                const validParticipants = participantsData.participants.filter(
                  (p: any) =>
                    p && (typeof p === "string" ? p.trim() !== "" : true)
                );
                counts[auctionId] = validParticipants.length;
              } else {
                counts[auctionId] = auction.participants?.length || 0;
              }
            } catch (error) {
              counts[auctionId] = auction.participants?.length || 0;
            }
          }
        })
      );

      if (i + batchSize < auctions.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    setParticipantCounts(counts);
  };

  const getParticipantCount = (auction: BaseAuction): number => {
    const auctionId = auction.backendId || auction.id;
    const apiCount = participantCounts[auctionId];
    return apiCount !== undefined
      ? apiCount
      : auction.participants?.length ?? 0;
  };

  // Debounce search
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(searchTerm), 350);
    return () => clearTimeout(id);
  }, [searchTerm]);

  // Fetch auctions
  const fetchAuctions = async (signal?: AbortSignal) => {
    try {
      let data: BaseAuction[] = [];

      console.log(
        `[MyCreatedAuctions] Fetching created auctions for user:`,
        user?.id
      );

      if (!debouncedSearch) {
        try {
          data = await apiService.fetchMyAuctions(
            statusFilter === "all" ? undefined : statusFilter,
            signal
          );
        } catch (e) {
          console.warn(
            "[MyCreatedAuctions] fetchMyAuctions failed, falling back",
            e
          );
        }
      }

      if (data.length === 0) {
        const params = {
          status: statusFilter,
          type: "created",
          search: debouncedSearch,
          signal,
        };
        data = await apiService.fetchFilteredAuctions(params);

        if (data.length > 0 && user?.id) {
          data = data.filter(isCreatedByUser);
        }
      }

      const finalCreatedCheck = data.filter(isCreatedByUser);
      if (finalCreatedCheck.length !== data.length) {
        data = finalCreatedCheck;
      }

      setAuctions(data);

      if (data.length > 0) {
        await fetchParticipantCounts(data);
      }
    } catch (err: any) {
      console.error("[MyCreatedAuctions] fetchAuctions failed:", err);
      setApiError(err?.message || "Failed to load auctions");
      setAuctions([]);
    }
  };

  useEffect(() => {
    if (!user) return;
    setApiError(null);
    const controller = new AbortController();
    const immediate = firstLoadRef.current;
    if (immediate) setLoading(true);
    else setIsFetching(true);

    fetchAuctions(controller.signal).finally(() => {
      if (!controller.signal.aborted) {
        if (immediate) {
          setLoading(false);
          firstLoadRef.current = false;
        } else {
          setIsFetching(false);
        }
      }
    });

    return () => controller.abort();
  }, [statusFilter, debouncedSearch, user]);

  const handleManualRefresh = async () => {
    setIsFetching(true);
    try {
      await fetchAuctions();
    } finally {
      setIsFetching(false);
    }
  };

  // Date/Time helpers
  const getAuctionStart = (auction: BaseAuction) => {
    try {
      const iso = `${auction.auctionDate}T${auction.auctionStartTime}:00`;
      return new Date(iso);
    } catch {
      return new Date();
    }
  };

  const formatAuctionDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split("-");
    return `${d}-${m}-${y}`;
  };

  const formatAuctionTime = (time24: string) => {
    const [h, minute] = time24.split(":").map(Number);
    const suffix = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    return `${hour12}:${String(minute).padStart(2, "0")} ${suffix}`;
  };

  const getAuctionEnd = (auction: BaseAuction) => {
    const start = getAuctionStart(auction).getTime();
    let durationInMinutes = auction.duration || 60;
    if (durationInMinutes > 1440) {
      durationInMinutes = Math.floor(durationInMinutes / 60);
    }
    const durMs = durationInMinutes * 60 * 1000;
    return new Date(start + durMs);
  };

  const getDerivedStatus = (
    auction: BaseAuction,
    nowMs: number
  ): BaseAuction["status"] => {
    if (auction.status === "completed") return "completed";
    const start = getAuctionStart(auction).getTime();
    const end = getAuctionEnd(auction).getTime();
    if (nowMs < start) return "upcoming";
    if (nowMs >= end) return "completed";
    return "live";
  };

  // Timer for status monitoring
  useEffect(() => {
    const id = setInterval(() => {
      const currentTime = Date.now();
      setNow(currentTime);

      const shouldRefresh = auctions.some((auction) => {
        const start = getAuctionStart(auction).getTime();
        const end = getAuctionEnd(auction).getTime();
        const currentStatus = auction.status;
        const derivedStatus = getDerivedStatus(auction, currentTime);

        return (
          (currentStatus === "upcoming" &&
            derivedStatus === "live" &&
            currentTime >= start + 30000) ||
          (currentStatus === "live" &&
            derivedStatus === "completed" &&
            currentTime >= end + 60000)
        );
      });

      if (shouldRefresh) {
        fetchAuctions();
      }
    }, 1000);

    return () => clearInterval(id);
  }, [auctions]);

  // Filter auctions
  const filterAuctions = (auctions: BaseAuction[]) => {
    const term = searchTerm.trim().toLowerCase();
    const nowMs = now;
    return auctions
      .filter((auction) => {
        const derivedStatus = getDerivedStatus(auction, nowMs);
        const matchesSearch =
          term === "" ||
          auction.title.toLowerCase().includes(term) ||
          auction.auctionNo.toLowerCase().includes(term) ||
          (auction.auctioneerCompany?.toLowerCase().includes(term) ?? false);
        const matchesStatus =
          statusFilter === "all" || derivedStatus === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort(
        (a, b) => getAuctionStart(a).getTime() - getAuctionStart(b).getTime()
      );
  };

  const filteredAuctions = filterAuctions(auctions);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "live":
        return <Play className="w-4 h-4" />;
      case "upcoming":
        return <Clock className="w-4 h-4" />;
      case "completed":
        return <Calendar className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  const formatCountdown = (ms: number) => {
    if (ms <= 0) return "00d 00h 00m 00s";
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / (24 * 3600));
    const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(days).padStart(2, "0")}d ${String(hours).padStart(
      2,
      "0"
    )}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(
      2,
      "0"
    )}s`;
  };

  const remainingToStart = (auction: BaseAuction) =>
    getAuctionStart(auction).getTime() - now;
  const remainingToEnd = (auction: BaseAuction) =>
    getAuctionEnd(auction).getTime() - now;

  // Download report (same implementation as before)
  const downloadAuctionReport = async (auction: BaseAuction) => {
    try {
      /* 1.  fetch complete auction object */
      const token =
        localStorage.getItem("token") || localStorage.getItem("authToken");
      const res = await fetch(
        `${API_BASE_URL}/auction/${auction.backendId || auction.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Could not fetch auction detail");
      const json = await res.json();
      const full = json.auction;
      if (!full) throw new Error("Empty auction detail");

      /* 2.  build HTML string (A4-safe) */
      const participants = full.participants.map((p: any) => ({
        userId: p.user_id,
        companyName: p.company_name || "—",
        personName: p.person_name || "—",
        phoneNumber: p.phone_number,
        mailId: p.email || "—",
        companyAddress: "—",
        bidAmount: 0,
        lastBidTime: "",
        status: p.status,
        invitedAt: p.invited_at,
        joinedAt: p.joined_at,
      }));

      const winnerBid = full.winner_info
        ? participants.find((x: any) => x.userId === full.winner_info.user_id)
        : null;

      const docRows =
        full.documents
          ?.map(
            (d: any) =>
              `<tr>
             <td>${d.file_name}</td>
             <td><a href="${
               d.file_url
             }" target="_blank" rel="noreferrer">Download</a></td>
             <td>${d.file_type}</td>
             <td>${new Date(d.uploaded_at).toLocaleString()}</td>
           </tr>`
          )
          .join("") || '<tr><td colspan="4">No documents</td></tr>';

      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Auction Report – ${full.auction_no}</title>
  <style>
    @page { size: A4 portrait; margin: 10mm; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      margin: 0;
      padding: 0;
      max-width: 190mm;
      font-size: 10pt;
      color: #333;
    }
    h1 { margin: 0 0 8px; font-size: 20px; color: #4f46e5; }
    h2 { font-size: 16px; margin: 20px 0 6px; color: #4f46e5; }
    .section { border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px; margin-top: 12px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; font-size: 9pt; }
    .label { font-weight: 600; color: #555; }
    table { border-collapse: collapse; width: 100%; margin-top: 6px; font-size: 8pt; }
    th, td { border: 1px solid #ddd; padding: 4px 6px; text-align: left; }
    th { background: #f3f4f6; }
    .badge { color: #0d9488; font-weight: 600; }
  </style>
</head>
<body>
  <h1>${full.title}</h1>
  <div>Generated: ${new Date().toLocaleString()}</div>

  <div class="section">
    <h2>Auction Details</h2>
    <div class="grid">
      <div><span class="label">Auction No:</span> ${full.auction_no}</div>
      <div><span class="label">Status:</span> <span class="badge">${full.status.toUpperCase()}</span></div>
      <div><span class="label">Date:</span> ${full.auction_date}</div>
      <div><span class="label">Time:</span> ${full.formatted_start_time} – ${
        full.formatted_end_time || "—"
      }</div>
      <div><span class="label">Duration:</span> ${full.duration} min</div>
      <div><span class="label">Currency:</span> ${full.currency}</div>
      <div><span class="label">Starting / Current Price:</span> ${
        full.currency
      } ${Number(full.current_price).toLocaleString()}</div>
      <div><span class="label">Reserve Price:</span> ${full.currency} ${Number(
        full.reserve_price || 0
      ).toLocaleString()}</div>
      <div><span class="label">Decremental Value:</span> ${
        full.currency
      } ${Number(full.decremental_value).toLocaleString()}</div>
      <div><span class="label">Pre-bid Allowed:</span> ${
        full.pre_bid_allowed ? "Yes" : "No"
      }</div>
      <div><span class="label">Open to All:</span> ${
        full.open_to_all ? "Yes" : "No"
      }</div>
      <div><span class="label">Total Bids:</span> ${
        full.statistics?.total_bids || 0
      }</div>
      <div><span class="label">Total Participants:</span> ${
        full.statistics?.total_participants || 0
      }</div>
      <div><span class="label">Active Participants:</span> ${
        full.statistics?.active_participants || 0
      }</div>
      <div><span class="label">Highest Bid:</span> ${full.currency} ${Number(
        full.statistics?.highest_bid || 0
      ).toLocaleString()}</div>
      <div><span class="label">Lowest Bid:</span> ${full.currency} ${Number(
        full.statistics?.lowest_bid || 0
      ).toLocaleString()}</div>
    </div>
    <div style="margin-top:8px"><span class="label">Description:</span> ${
      full.description || "—"
    }</div>
  </div>

  <div class="section">
    <h2>Auctioneer</h2>
    <div class="grid">
      <div><span class="label">Company:</span> ${
        full.creator_info?.company_name || "—"
      }</div>
      <div><span class="label">Contact Person:</span> ${
        full.creator_info?.person_name || "—"
      }</div>
      <div><span class="label">Email:</span> ${
        full.creator_info?.email || full.auctioneer_email || "—"
      }</div>
      <div><span class="label">Phone:</span> ${
        full.creator_info?.phone || "—"
      }</div>
    </div>
  </div>

  ${
    winnerBid
      ? `<div class="section">
           <h2>Winning Bid</h2>
           <div class="grid">
             <div><span class="label">Company:</span> ${
               winnerBid.companyName
             }</div>
             <div><span class="label">Amount:</span> ${
               full.currency
             } ${winnerBid.bidAmount.toLocaleString()}</div>
             <div><span class="label">Contact:</span> ${
               winnerBid.personName
             }</div>
             <div><span class="label">Phone:</span> ${
               winnerBid.phoneNumber
             }</div>
           </div>
         </div>`
      : ""
  }

  <div class="section">
    <h2>Participants (${participants.length})</h2>
    ${
      participants.length
        ? `<table>
             <thead><tr>
               <th>#</th><th>Company</th><th>Person</th><th>Phone</th><th>Status</th><th>Invited At</th><th>Joined At</th>
             </tr></thead>
             <tbody>
               ${participants
                 .map(
                   (p: any, i: number) =>
                     `<tr>
                        <td>${i + 1}</td>
                        <td>${p.companyName}</td>
                        <td>${p.personName}</td>
                        <td>${p.phoneNumber}</td>
                        <td>${p.status}</td>
                        <td>${new Date(p.invitedAt).toLocaleString()}</td>
                        <td>${
                          p.joinedAt
                            ? new Date(p.joinedAt).toLocaleString()
                            : "—"
                        }</td>
                      </tr>`
                 )
                 .join("")}`
        : "<div>No participants.</div>"
    }
  </div>

  <div class="section">
    <h2>Documents (${full.documents?.length || 0})</h2>
    <table>
      <thead><tr><th>File Name</th><th>Download</th><th>Type</th><th>Uploaded At</th></tr></thead>
      <tbody>${docRows}</tbody>
    </table>
  </div>
</body>
</html>`;

      /* ---------- 3.  HTML → canvas → PDF (A4) ---------- */
      const container = document.createElement("div");
      container.innerHTML = html;
      container.style.position = "absolute";
      container.style.left = "-9999px";
      document.body.appendChild(container);

      const canvas = await html2canvas(container, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");

      const pdfW = 210; // A4 width mm
      const pdfH = 297; // A4 height mm
      const pdf = new jsPDF("p", "mm", "a4");

      const imgWidth = pdfW - 20; // 10 mm margin each side
      const pageHeight = pdfH - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 10;

      pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      document.body.removeChild(container);

      /* ---------- 4.  auto-download PDF ---------- */
      pdf.save(`Auction_Report_${full.auction_no}.pdf`);
    } catch (e) {
      console.error("Failed to generate PDF", e);
      alert("Could not create PDF report. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="ap-myauctions-wrapper">
        <div className="ap-myauctions-loading">
          <div className="ap-skeleton-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="ap-skel-card">
                <div className="ap-skel-line ap-skel-title" />
                <div className="ap-skel-badge" />
                <div className="ap-skel-line" />
                <div className="ap-skel-line" />
                <div className="ap-skel-line short" />
              </div>
            ))}
          </div>
          <p className="ap-skel-text">Loading auctions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ap-myauctions-wrapper">
      {/* Header */}
      <div className="ap-myauctions-header">
        <div className="ap-myauctions-header-content">
          <div className="ap-myauctions-title-section">
            <h1 className="ap-myauctions-title">
              <Gavel className="w-8 h-8" />
              My Created Auctions
            </h1>
            <p className="ap-myauctions-subtitle">
              Manage your created auctions
            </p>
          </div>
          <Link
            to="/dashboard/new-auction"
            className="ap-myauctions-create-btn"
          >
            <Plus className="w-4 h-4" />
            Create Auction
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="ap-myauctions-filters">
        <div className="ap-myauctions-filters-content">
          <div className="ap-myauctions-search-container">
            <div className="ap-myauctions-search-input-wrapper">
              <Search className="ap-myauctions-search-icon" />
              <input
                type="text"
                placeholder="Search auctions..."
                className="ap-myauctions-search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="ap-myauctions-filter-controls">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="ap-myauctions-filter-select"
            >
              <option value="all">All Status</option>
              <option value="upcoming">Upcoming</option>
              <option value="live">Live</option>
              <option value="completed">Completed</option>
            </select>
            <button
              className={`ap-myauctions-filter-btn ${
                isFetching ? "opacity-75" : ""
              }`}
              onClick={handleManualRefresh}
              disabled={isFetching}
            >
              <RefreshCw
                className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`}
              />
              <span className="ml-1">
                {isFetching ? "Refreshing" : "Refresh"}
              </span>
            </button>
          </div>
        </div>
        {apiError && (
          <div className="ap-myauctions-error-banner">
            <span>{apiError}</span>
            <button onClick={() => fetchAuctions()}>Retry</button>
          </div>
        )}
      </div>

      {/* Auctions List */}
      <div className="ap-myauctions-content">
        {isFetching && (
          <div className="ap-myauctions-loading-inline">
            Loading latest auctions...
          </div>
        )}
        {filteredAuctions.length > 0 ? (
          <div className="ap-myauctions-grid">
            {filteredAuctions.map((auction) => {
              const derivedStatus = getDerivedStatus(auction, now);
              const startsInMs = remainingToStart(auction);
              const endsInMs = remainingToEnd(auction);

              return (
                <div key={auction.id} className="ap-myauctions-card">
                  <div className="ap-myauctions-card-header">
                    <div className="ap-myauctions-card-title-section">
                      <h3 className="ap-myauctions-card-title">
                        {auction.title}
                      </h3>
                      <span
                        className={`ap-myauctions-status-badge ap-myauctions-status-${derivedStatus}`}
                      >
                        {getStatusIcon(derivedStatus)}
                        {derivedStatus.toUpperCase()}
                      </span>
                    </div>
                    {/* <div className="ap-myauctions-card-title-section">
                        <span
                          className={`ap-myauctions-status-badge ap-myauctions-status-${derivedStatus}`}
                        >
                          {getStatusIcon(derivedStatus)}
                          {derivedStatus.toUpperCase()}
                        </span>
                      </div> */}
                    <p className="ap-myauctions-card-subtitle">
                      Auction No: {auction.auctionNo}
                    </p>
                  </div>
                  <div className="ap-myauctions-card-info">
                    <div className="ap-myauctions-info-item">
                      <span className="ap-myauctions-info-label">
                        Date & Time:
                      </span>
                      <p className="ap-myauctions-info-value">
                        <Calendar className="w-4 h-4" />
                        {formatAuctionDate(auction.auctionDate)} at{" "}
                        {formatAuctionTime(auction.auctionStartTime)}
                      </p>
                    </div>
                    <div className="ap-myauctions-info-item">
                      <span className="ap-myauctions-info-label">
                        Participants:
                      </span>
                      <p className="ap-myauctions-info-value">
                        <Users className="w-4 h-4" />
                        {getParticipantCount(auction)}
                      </p>
                    </div>
                  </div>
                  <div className="ap-myauctions-card-meta">
                    {derivedStatus === "upcoming" && (
                      <div className="ap-myauctions-countdown">
                        Starts in: {formatCountdown(startsInMs)}
                      </div>
                    )}
                    {derivedStatus === "live" && (
                      <div className="ap-myauctions-countdown">
                        Live • {formatCountdown(Math.max(endsInMs, 0))}
                      </div>
                    )}
                  </div>
                  <div className="ap-myauctions-card-actions">
                    <Link
                      to={`/dashboard/my-auction/${
                        auction.backendId || auction.id
                      }`}
                      className="ap-myauctions-action-btn ap-myauctions-view-btn"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </Link>
                    {derivedStatus === "live" && (
                      <Link
                        to={`/dashboard/auctioneer-live/${
                          auction.backendId || auction.id
                        }`}
                        className="ap-myauctions-action-btn ap-myauctions-live-btn"
                      >
                        <Gavel className="w-4 h-4" />
                        Join as Auctioneer
                      </Link>
                    )}
                    {derivedStatus === "completed" && (
                      <button
                        onClick={() => downloadAuctionReport(auction)}
                        className="ap-myauctions-action-btn ap-myauctions-download-btn"
                      >
                        <Download className="w-4 h-4" />
                        Download Report
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="ap-myauctions-empty">
            <div className="ap-myauctions-empty-content">
              <Gavel className="ap-myauctions-empty-icon" />
              <h3 className="ap-myauctions-empty-title">No auctions found</h3>
              <p className="ap-myauctions-empty-subtitle">
                You haven't created any auctions yet. Start by creating your
                first auction!
              </p>
              <Link
                to="/dashboard/new-auction"
                className="ap-myauctions-empty-action"
              >
                <Plus className="w-4 h-4" />
                Create First Auction
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyCreatedA;
