// import React, { useState, useEffect, useRef } from "react";
// import "../MyAuctions/MyAuctions.css";
// import { Link, useNavigate } from "react-router-dom";
// import {
//   Calendar,
//   Clock,
//   Users,
//   Eye,
//   Play,
//   Search,
//   RefreshCw,
//   Gavel,
//   User,
// } from "lucide-react";
// import apiService from "../../../services/apiAuctionService";
// import { BaseAuction } from "../../../types/auction";
// import { useAuth } from "../../../contexts/AuthContext";
// import { API_BASE_URL } from "../../../services/apiConfig";

// const MyParticipatedA: React.FC = () => {
//   const { user } = useAuth();
//   const navigate = useNavigate();

//   const [searchTerm, setSearchTerm] = useState("");
//   const [debouncedSearch, setDebouncedSearch] = useState("");
//   const [statusFilter, setStatusFilter] = useState("all");
//   const [auctions, setAuctions] = useState<BaseAuction[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [apiError, setApiError] = useState<string | null>(null);
//   const [isFetching, setIsFetching] = useState(false);
//   const [now, setNow] = useState<number>(Date.now());

//   const firstLoadRef = useRef(true);

//   // Helper: Check if user created the auction
//   const isCreatedByUser = (auction: BaseAuction) => {
//     if (!user) return false;
//     return (
//       auction.createdBy === user.id ||
//       auction.userId === user.id ||
//       auction.createdBy === user.companyName ||
//       auction.auctioneerCompany === user.companyName ||
//       (auction as any).auctioneerPhone === user.phoneNumber
//     );
//   };

//   // Helper: Check if auction is open to all
//   const isAuctionOpenToAll = (auction: BaseAuction): boolean => {
//     const openToAllValue = auction.open_to_all;

//     if (openToAllValue === undefined || openToAllValue === null) return false;
//     if (typeof openToAllValue === "boolean") return openToAllValue;
//     if (typeof openToAllValue === "number") return openToAllValue === 1;
//     if (typeof openToAllValue === "string") {
//       const normalized = (openToAllValue as string).toLowerCase().trim();
//       return (
//         normalized === "true" || normalized === "1" || normalized === "yes"
//       );
//     }
//     return false;
//   };

//   // Helper: Fetch participants by auction ID
//   const fetchParticipantsByAuctionId = async (auctionId: string | number) => {
//     try {
//       const token =
//         localStorage.getItem("token") || localStorage.getItem("authToken");
//       if (!token) return null;

//       const res = await fetch(
//         `${API_BASE_URL}/auction/${auctionId}/participants`,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//           },
//         }
//       );

//       if (!res.ok) return null;
//       return await res.json();
//     } catch (err) {
//       console.error(
//         `Error fetching participants for auction ${auctionId}:`,
//         err
//       );
//       return null;
//     }
//   };

//   // Check if user is participant via API
//   const isUserParticipantViaAPI = async (
//     auction: BaseAuction
//   ): Promise<boolean> => {
//     if (!user) return false;

//     const auctionId = auction.backendId || auction.id;
//     if (!auctionId) return false;

//     try {
//       const participantsData = await fetchParticipantsByAuctionId(auctionId);
//       if (!participantsData?.participants) return false;

//       const userPhoneVariations = [
//         user.phoneNumber,
//         user.phoneNumber?.replace("+91", ""),
//         user.phoneNumber?.replace("+", ""),
//         "+91" + user.phoneNumber?.replace(/^\+?91?/, ""),
//         user.phoneNumber?.replace(/^(\+91|91)/, ""),
//       ].filter(Boolean);

//       return participantsData.participants.some((participant: any) => {
//         if (!participant) return false;

//         if (typeof participant === "string") {
//           return userPhoneVariations.includes(participant.trim());
//         }

//         if (typeof participant === "object") {
//           const phoneFields = [
//             participant.phone_number,
//             participant.phoneNumber,
//             participant.phone,
//             participant.user_phone,
//             participant.contact_number,
//           ].filter(Boolean);

//           const hasPhoneMatch = phoneFields.some((phone) =>
//             userPhoneVariations.includes(phone)
//           );

//           const userIdFields = [
//             participant.user_id,
//             participant.userId,
//             participant.id,
//           ].filter(Boolean);

//           const hasUserIdMatch = userIdFields.includes(user.id);

//           const emailFields = [
//             participant.email,
//             participant.mail_id,
//             participant.mailId,
//           ].filter(Boolean);

//           const hasEmailMatch = user.email
//             ? emailFields.includes(user.email)
//             : false;

//           return hasPhoneMatch || hasUserIdMatch || hasEmailMatch;
//         }

//         return false;
//       });
//     } catch (error) {
//       console.error(
//         `Error in API participant check for auction ${auctionId}:`,
//         error
//       );
//       return false;
//     }
//   };

//   // Debounce search
//   useEffect(() => {
//     const id = setTimeout(() => setDebouncedSearch(searchTerm), 350);
//     return () => clearTimeout(id);
//   }, [searchTerm]);

//   // Fetch auctions
//   const fetchAuctions = async (signal?: AbortSignal) => {
//     try {
//       let data: BaseAuction[] = [];

//       console.log(
//         `[MyParticipatedAuctions] Fetching auctions for participant: ${user?.phoneNumber}`
//       );

//       const shouldShowInParticipantTab = async (
//         auction: BaseAuction
//       ): Promise<boolean> => {
//         // Never show auctions created by the user
//         if (isCreatedByUser(auction)) {
//           return false;
//         }

//         const isOpen = isAuctionOpenToAll(auction);

//         // If open to all, show it
//         if (isOpen) {
//           return true;
//         }

//         // If NOT open to all, check if user is explicitly invited
//         const isExplicitParticipant = await isUserParticipantViaAPI(auction);
//         return isExplicitParticipant;
//       };

//       // Try filtered endpoint
//       try {
//         const params = {
//           status: statusFilter === "all" ? undefined : statusFilter,
//           search: debouncedSearch,
//           signal,
//         };

//         data = await apiService.fetchFilteredAuctions(params);

//         const filteredData: BaseAuction[] = [];
//         for (const auction of data) {
//           const shouldShow = await shouldShowInParticipantTab(auction);
//           if (shouldShow) {
//             filteredData.push(auction);
//           }
//         }

//         data = filteredData;
//       } catch (filteredErr) {
//         console.warn(
//           "[MyParticipatedAuctions] Filtered endpoint failed:",
//           filteredErr
//         );
//         data = [];
//       }

//       // Fallback to my-auctions endpoint
//       if (data.length === 0) {
//         try {
//           const myAuctions = await apiService.fetchMyAuctions(
//             statusFilter === "all" ? undefined : statusFilter,
//             signal
//           );

//           if (myAuctions.length > 0) {
//             const filteredData: BaseAuction[] = [];
//             for (const auction of myAuctions) {
//               const shouldShow = await shouldShowInParticipantTab(auction);
//               if (shouldShow) {
//                 filteredData.push(auction);
//               }
//             }
//             data = filteredData;
//           }
//         } catch (myAuctionsErr) {
//           console.warn(
//             "[MyParticipatedAuctions] my-auctions endpoint failed:",
//             myAuctionsErr
//           );
//         }
//       }

//       const openAuctions = data.filter((a) => isAuctionOpenToAll(a));
//       const closedAuctions = data.filter((a) => !isAuctionOpenToAll(a));

//       console.log(`[MyParticipatedAuctions] Final breakdown:`);
//       console.log(`  - Open auctions: ${openAuctions.length}`);
//       console.log(
//         `  - Closed auctions (invitation only): ${closedAuctions.length}`
//       );
//       console.log(`  - Total: ${data.length} auctions`);

//       // Double-check: Make sure NO auction was created by user
//       const createdByUserCount = data.filter(isCreatedByUser).length;
//       if (createdByUserCount > 0) {
//         console.warn(
//           `Found ${createdByUserCount} user-created auctions in participated list! Removing...`
//         );
//         data = data.filter((auction) => !isCreatedByUser(auction));
//       }

//       setAuctions(data);
//     } catch (err: any) {
//       console.error("[MyParticipatedAuctions] fetchAuctions failed:", err);
//       setApiError(err?.message || "Failed to load auctions");
//       setAuctions([]);
//     }
//   };

//   useEffect(() => {
//     if (!user) return;
//     setApiError(null);
//     const controller = new AbortController();
//     const immediate = firstLoadRef.current;
//     if (immediate) setLoading(true);
//     else setIsFetching(true);

//     fetchAuctions(controller.signal).finally(() => {
//       if (!controller.signal.aborted) {
//         if (immediate) {
//           setLoading(false);
//           firstLoadRef.current = false;
//         } else {
//           setIsFetching(false);
//         }
//       }
//     });

//     return () => controller.abort();
//   }, [statusFilter, debouncedSearch, user]);

//   const handleManualRefresh = async () => {
//     setIsFetching(true);
//     try {
//       await fetchAuctions();
//     } finally {
//       setIsFetching(false);
//     }
//   };

//   // Date/Time helpers
//   const getAuctionStart = (auction: BaseAuction) => {
//     try {
//       const iso = `${auction.auctionDate}T${auction.auctionStartTime}:00`;
//       return new Date(iso);
//     } catch {
//       return new Date();
//     }
//   };

//   const formatAuctionDate = (dateStr: string) => {
//     const [y, m, d] = dateStr.split("-");
//     return `${d}-${m}-${y}`;
//   };

//   const formatAuctionTime = (time24: string) => {
//     const [h, minute] = time24.split(":").map(Number);
//     const suffix = h >= 12 ? "PM" : "AM";
//     const hour12 = h % 12 || 12;
//     return `${hour12}:${String(minute).padStart(2, "0")} ${suffix}`;
//   };

//   const getAuctionEnd = (auction: BaseAuction) => {
//     const start = getAuctionStart(auction).getTime();
//     let durationInMinutes = auction.duration || 60;
//     if (durationInMinutes > 1440) {
//       durationInMinutes = Math.floor(durationInMinutes / 60);
//     }
//     const durMs = durationInMinutes * 60 * 1000;
//     return new Date(start + durMs);
//   };

//   const getDerivedStatus = (
//     auction: BaseAuction,
//     nowMs: number
//   ): BaseAuction["status"] => {
//     if (auction.status === "completed") return "completed";
//     const start = getAuctionStart(auction).getTime();
//     const end = getAuctionEnd(auction).getTime();
//     if (nowMs < start) return "upcoming";
//     if (nowMs >= end) return "completed";
//     return "live";
//   };

//   // Timer for status monitoring
//   useEffect(() => {
//     const id = setInterval(() => {
//       const currentTime = Date.now();
//       setNow(currentTime);

//       const shouldRefresh = auctions.some((auction) => {
//         const start = getAuctionStart(auction).getTime();
//         const end = getAuctionEnd(auction).getTime();
//         const currentStatus = auction.status;
//         const derivedStatus = getDerivedStatus(auction, currentTime);

//         return (
//           (currentStatus === "upcoming" &&
//             derivedStatus === "live" &&
//             currentTime >= start + 30000) ||
//           (currentStatus === "live" &&
//             derivedStatus === "completed" &&
//             currentTime >= end + 60000)
//         );
//       });

//       if (shouldRefresh) {
//         fetchAuctions();
//       }
//     }, 1000);

//     return () => clearInterval(id);
//   }, [auctions]);

//   // Filter auctions
//   const filterAuctions = (auctions: BaseAuction[]) => {
//     const term = searchTerm.trim().toLowerCase();
//     const nowMs = now;
//     return auctions
//       .filter((auction) => {
//         const derivedStatus = getDerivedStatus(auction, nowMs);
//         const matchesSearch =
//           term === "" ||
//           auction.title.toLowerCase().includes(term) ||
//           auction.auctionNo.toLowerCase().includes(term) ||
//           (auction.auctioneerCompany?.toLowerCase().includes(term) ?? false);
//         const matchesStatus =
//           statusFilter === "all" || derivedStatus === statusFilter;
//         return matchesSearch && matchesStatus;
//       })
//       .sort(
//         (a, b) => getAuctionStart(a).getTime() - getAuctionStart(b).getTime()
//       );
//   };

//   const filteredAuctions = filterAuctions(auctions);

//   const getStatusIcon = (status: string) => {
//     switch (status) {
//       case "live":
//         return <Play className="w-4 h-4" />;
//       case "upcoming":
//         return <Clock className="w-4 h-4" />;
//       case "completed":
//         return <Calendar className="w-4 h-4" />;
//       default:
//         return <Calendar className="w-4 h-4" />;
//     }
//   };

//   const formatCountdown = (ms: number) => {
//     if (ms <= 0) return "00d 00h 00m 00s";
//     const totalSeconds = Math.floor(ms / 1000);
//     const days = Math.floor(totalSeconds / (24 * 3600));
//     const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
//     const minutes = Math.floor((totalSeconds % 3600) / 60);
//     const seconds = totalSeconds % 60;
//     return `${String(days).padStart(2, "0")}d ${String(hours).padStart(
//       2,
//       "0"
//     )}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(
//       2,
//       "0"
//     )}s`;
//   };

//   const remainingToStart = (auction: BaseAuction) =>
//     getAuctionStart(auction).getTime() - now;
//   const remainingToEnd = (auction: BaseAuction) =>
//     getAuctionEnd(auction).getTime() - now;

//   if (loading) {
//     return (
//       <div className="ap-myauctions-wrapper">
//         <div className="ap-myauctions-loading">
//           <div className="ap-skeleton-grid">
//             {Array.from({ length: 6 }).map((_, i) => (
//               <div key={i} className="ap-skel-card">
//                 <div className="ap-skel-line ap-skel-title" />
//                 <div className="ap-skel-badge" />
//                 <div className="ap-skel-line" />
//                 <div className="ap-skel-line" />
//                 <div className="ap-skel-line short" />
//               </div>
//             ))}
//           </div>
//           <p className="ap-skel-text">Loading auctions...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="ap-myauctions-wrapper">
//       {/* Header */}
//       <div className="ap-myauctions-header">
//         <div className="ap-myauctions-header-content">
//           <div className="ap-myauctions-title-section">
//             <h1 className="ap-myauctions-title">
//               <User className="w-8 h-8" />
//               My Participated Auctions
//             </h1>
//             <p className="ap-myauctions-subtitle">
//               Track auctions you're participating in
//             </p>
//           </div>
//         </div>
//       </div>

//       {/* Filters */}
//       <div className="ap-myauctions-filters">
//         <div className="ap-myauctions-filters-content">
//           <div className="ap-myauctions-search-container">
//             <div className="ap-myauctions-search-input-wrapper">
//               <Search className="ap-myauctions-search-icon" />
//               <input
//                 type="text"
//                 placeholder="Search auctions..."
//                 className="ap-myauctions-search-input"
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//               />
//             </div>
//           </div>
//           <div className="ap-myauctions-filter-controls">
//             <select
//               value={statusFilter}
//               onChange={(e) => setStatusFilter(e.target.value)}
//               className="ap-myauctions-filter-select"
//             >
//               <option value="all">All Status</option>
//               <option value="upcoming">Upcoming</option>
//               <option value="live">Live</option>
//               <option value="completed">Completed</option>
//             </select>
//             <button
//               className={`ap-myauctions-filter-btn ${
//                 isFetching ? "opacity-75" : ""
//               }`}
//               onClick={handleManualRefresh}
//               disabled={isFetching}
//             >
//               <RefreshCw
//                 className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`}
//               />
//               <span className="ml-1">
//                 {isFetching ? "Refreshing" : "Refresh"}
//               </span>
//             </button>
//           </div>
//         </div>
//         {apiError && (
//           <div className="ap-myauctions-error-banner">
//             <span>{apiError}</span>
//             <button onClick={() => fetchAuctions()}>Retry</button>
//           </div>
//         )}
//       </div>

//       {/* Auctions List */}
//       <div className="ap-myauctions-content">
//         {isFetching && (
//           <div className="ap-myauctions-loading-inline">
//             Loading latest auctions...
//           </div>
//         )}
//         {filteredAuctions.length > 0 ? (
//           <div className="ap-myauctions-grid">
//             {filteredAuctions.map((auction) => {
//               const derivedStatus = getDerivedStatus(auction, now);
//               const startsInMs = remainingToStart(auction);
//               const endsInMs = remainingToEnd(auction);

//               return (
//                 <div key={auction.id} className="ap-myauctions-card">
//                   <div className="ap-myauctions-card-header">
//                     <div className="ap-myauctions-card-title-section">
//                       <h3 className="ap-myauctions-card-title">
//                         {auction.title}
//                       </h3>
//                       <div className="flex items-center gap-2">
//                         <span
//                           className={`ap-myauctions-status-badge ap-myauctions-status-${derivedStatus}`}
//                         >
//                           {getStatusIcon(derivedStatus)}
//                           {derivedStatus.toUpperCase()}
//                         </span>
//                         {isAuctionOpenToAll(auction) && (
//                           <span className="ap-myauctions-status-badge ap-myauctions-status-open">
//                             <Users className="w-3 h-3" />
//                             OPEN TO ALL
//                           </span>
//                         )}
//                       </div>
//                     </div>
//                     <p className="ap-myauctions-card-subtitle">
//                       Auction No: {auction.auctionNo}
//                       {isAuctionOpenToAll(auction) && " • Open to all users"}
//                     </p>
//                   </div>
//                   <div className="ap-myauctions-card-info">
//                     <div className="ap-myauctions-info-item">
//                       <span className="ap-myauctions-info-label">
//                         Date & Time:
//                       </span>
//                       <p className="ap-myauctions-info-value">
//                         <Calendar className="w-4 h-4" />
//                         {formatAuctionDate(auction.auctionDate)} at{" "}
//                         {formatAuctionTime(auction.auctionStartTime)}
//                       </p>
//                     </div>
//                     {auction.auctioneerCompany && (
//                       <div className="ap-myauctions-info-item">
//                         <span className="ap-myauctions-info-label">
//                           Auctioneer:
//                         </span>
//                         <p className="ap-myauctions-info-value">
//                           <Gavel className="w-4 h-4" />
//                           {auction.auctioneerCompany}
//                         </p>
//                       </div>
//                     )}
//                   </div>
//                   <div className="ap-myauctions-card-meta">
//                     {derivedStatus === "upcoming" && (
//                       <div className="ap-myauctions-countdown">
//                         Starts in: {formatCountdown(startsInMs)}
//                       </div>
//                     )}
//                     {derivedStatus === "live" && (
//                       <div className="ap-myauctions-countdown">
//                         Live • {formatCountdown(Math.max(endsInMs, 0))}
//                       </div>
//                     )}
//                   </div>
//                   <div className="ap-myauctions-card-actions">
//                     <Link
//                       to={`/dashboard/auction/${
//                         auction.backendId || auction.id
//                       }`}
//                       className="ap-myauctions-action-btn ap-myauctions-view-btn"
//                     >
//                       <Eye className="w-4 h-4" />
//                       View Details
//                     </Link>
//                     {derivedStatus === "live" && (
//                       <button
//                         onClick={async (e) => {
//                           e.preventDefault();
//                           if (!auction.backendId && !auction.id) {
//                             console.error(
//                               "[MyParticipatedAuctions] No auction ID found"
//                             );
//                             return;
//                           }
//                           const targetId = auction.backendId || auction.id;
//                           try {
//                             const button = e.currentTarget as HTMLButtonElement;
//                             if (button) {
//                               button.disabled = true;
//                               button.innerText = "Joining...";
//                             }
//                             const { default: newAuctionService } = await import(
//                               "../../../services/newAuctionService"
//                             );
//                             const { joinParticipant } = await import(
//                               "../../../services/apiAuctionService"
//                             );
//                             let joined = false;
//                             try {
//                               const numId = Number(targetId);
//                               if (!isNaN(numId) && user?.phoneNumber) {
//                                 const result =
//                                   await newAuctionService.joinAuction({
//                                     auction_id: numId,
//                                     phone_number: user.phoneNumber,
//                                   });
//                                 joined = !!result?.success;
//                               }
//                             } catch (newErr) {
//                               console.warn(
//                                 "[MyParticipatedAuctions] new join API failed, will try legacy",
//                                 newErr
//                               );
//                             }
//                             if (!joined) {
//                               await joinParticipant(targetId);
//                             }
//                             navigate(
//                               `/dashboard/participant-auction/${targetId}`
//                             );
//                           } catch (err: any) {
//                             console.error(
//                               "[MyParticipatedAuctions] joinParticipant failed:",
//                               err
//                             );
//                             alert(err?.message || "Failed to join auction");
//                           } finally {
//                             const button = e.currentTarget as HTMLButtonElement;
//                             if (button) {
//                               button.disabled = false;
//                               button.innerText = "Join as Participant";
//                             }
//                           }
//                         }}
//                         className="ap-myauctions-action-btn ap-myauctions-join-btn"
//                       >
//                         <Play className="w-4 h-4" />
//                         Join as Participant
//                       </button>
//                     )}
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         ) : (
//           <div className="ap-myauctions-empty">
//             <div className="ap-myauctions-empty-content">
//               <User className="ap-myauctions-empty-icon" />
//               <h3 className="ap-myauctions-empty-title">No auctions found</h3>
//               <p className="ap-myauctions-empty-subtitle">
//                 You haven't participated in any auctions yet. You need to be
//                 added as a participant by the auctioneer to see auctions here.
//               </p>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default MyParticipatedA;


import React, { useState, useEffect, useRef } from "react";
import "../MyAuctions/MyAuctions.css";
import { Link, useNavigate } from "react-router-dom";
import {
  Calendar,
  Clock,
  Users,
  Eye,
  Play,
  Search,
  RefreshCw,
  Gavel,
} from "lucide-react";
import apiService from "../../../services/apiAuctionService";
import { BaseAuction } from "../../../types/auction";
import { useAuth } from "../../../contexts/AuthContext";
import { API_BASE_URL } from "../../../services/apiConfig";

const MyParticipatedAuctions: React.FC = () => {
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

  // Debounce search
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(searchTerm), 350);
    return () => clearTimeout(id);
  }, [searchTerm]);

  // Fetch participants by auction ID
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

  // Check if user created the auction
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

  // Check if auction is open to all
  const isAuctionOpenToAll = (auction: BaseAuction): boolean => {
    const openToAllValue = auction.open_to_all;

    if (openToAllValue === true) return true;
    if (openToAllValue === false) return false;

    const numericValue = Number(openToAllValue);
    if (numericValue === 1) return true;
    if (numericValue === 0) return false;

    return auction.openToAllCompanies;
  };

  // Check if user is participant via API
  const isUserParticipantViaAPI = async (
    auction: BaseAuction
  ): Promise<boolean> => {
    if (!user) return false;

    const auctionId = auction.backendId || auction.id;
    if (!auctionId) return false;

    try {
      const participantsData = await fetchParticipantsByAuctionId(auctionId);
      if (!participantsData || !participantsData.participants) return false;

      const userPhoneVariations = [
        user.phoneNumber,
        user.phoneNumber?.replace("+91", ""),
        user.phoneNumber?.replace("+", ""),
        "+91" + user.phoneNumber?.replace(/^\+?91?/, ""),
        user.phoneNumber?.replace(/^(\+91|91)/, ""),
      ].filter(Boolean);

      return participantsData.participants.some((participant: any) => {
        if (!participant) return false;

        if (typeof participant === "string") {
          const cleanParticipant = participant.trim();
          return userPhoneVariations.includes(cleanParticipant);
        }

        if (typeof participant === "object") {
          const phoneFields = [
            participant.phone_number,
            participant.phoneNumber,
            participant.phone,
            participant.user_phone,
            participant.contact_number,
          ].filter(Boolean);

          const hasPhoneMatch = phoneFields.some((phone) =>
            userPhoneVariations.includes(phone)
          );

          const userIdFields = [
            participant.user_id,
            participant.userId,
            participant.id,
          ].filter(Boolean);

          const hasUserIdMatch = userIdFields.includes(user.id);

          const emailFields = [
            participant.email,
            participant.mail_id,
            participant.mailId,
          ].filter(Boolean);

          const hasEmailMatch = user.email
            ? emailFields.includes(user.email)
            : false;

          return hasPhoneMatch || hasUserIdMatch || hasEmailMatch;
        }

        return false;
      });
    } catch (error) {
      console.error(
        `Error in API participant check for auction ${auctionId}:`,
        error
      );
      return false;
    }
  };

  // Fetch participated auctions
  const fetchAuctions = async (signal?: AbortSignal) => {
    try {
      let data: BaseAuction[] = [];

      console.log(
        `[ParticipatedAuctions] Fetching auctions for user: ${user?.phoneNumber}`
      );

      // Filtering function with API checks
      const shouldShowInParticipantTab = async (
        auction: BaseAuction
      ): Promise<boolean> => {
        // CRITICAL: Never show auctions created by the user
        if (isCreatedByUser(auction)) {
          console.log(
            `[ParticipatedAuctions] ❌ Filtering out user-created auction: ${auction.id}`
          );
          return false;
        }

        const isOpen = isAuctionOpenToAll(auction);

        // If open to all, show it
        if (isOpen) {
          console.log(
            `[ParticipatedAuctions] ✅ Showing OPEN auction: ${auction.id} - ${auction.title}`
          );
          return true;
        }

        // If NOT open to all (invitation only), check if user is explicitly invited
        console.log(
          `[ParticipatedAuctions] 🔒 Checking CLOSED auction: ${auction.id} - ${auction.title}`
        );
        const isExplicitParticipant = await isUserParticipantViaAPI(auction);
        console.log(
          `[ParticipatedAuctions] 🔒 Closed auction ${auction.id} result: user is participant = ${isExplicitParticipant}`
        );

        if (isExplicitParticipant) {
          console.log(
            `[ParticipatedAuctions] ✅ Showing CLOSED auction (user is invited): ${auction.id}`
          );
        } else {
          console.log(
            `[ParticipatedAuctions] ❌ Hiding CLOSED auction (user NOT invited): ${auction.id}`
          );
        }

        return isExplicitParticipant;
      };

      // Fetch from filtered endpoint
      try {
        const params = {
          status: statusFilter === "all" ? undefined : statusFilter,
          search: debouncedSearch,
          signal,
        };

        data = await apiService.fetchFilteredAuctions(params);
        console.log(
          `[ParticipatedAuctions] Initial fetch: ${data.length} auctions`
        );

        // Filter auctions using async checks
        const filteredData: BaseAuction[] = [];
        for (const auction of data) {
          const shouldShow = await shouldShowInParticipantTab(auction);
          if (shouldShow) {
            filteredData.push(auction);
          }
        }

        data = filteredData;
        console.log(
          `[ParticipatedAuctions] After participant filtering: ${data.length} auctions`
        );
      } catch (filteredErr) {
        console.warn(
          "[ParticipatedAuctions] Filtered endpoint failed:",
          filteredErr
        );
        data = [];
      }

      // Fallback to my-auctions endpoint
      if (data.length === 0) {
        try {
          const myAuctions = await apiService.fetchMyAuctions(
            statusFilter === "all" ? undefined : statusFilter,
            signal
          );
          console.log(
            `[ParticipatedAuctions] Fallback: Fetched ${myAuctions.length} auctions`
          );

          if (myAuctions.length > 0) {
            const filteredData: BaseAuction[] = [];
            for (const auction of myAuctions) {
              const shouldShow = await shouldShowInParticipantTab(auction);
              if (shouldShow) {
                filteredData.push(auction);
              }
            }
            data = filteredData;
            console.log(
              `[ParticipatedAuctions] Fallback filtered: ${data.length} auctions`
            );
          }
        } catch (myAuctionsErr) {
          console.warn(
            "[ParticipatedAuctions] Fallback failed:",
            myAuctionsErr
          );
        }
      }

      // Count open vs closed auctions
      const openAuctions = data.filter((a) => isAuctionOpenToAll(a));
      const closedAuctions = data.filter((a) => !isAuctionOpenToAll(a));

      console.log(`[ParticipatedAuctions] FINAL BREAKDOWN:`);
      console.log(
        `[ParticipatedAuctions]   - Open auctions: ${openAuctions.length}`
      );
      console.log(
        `[ParticipatedAuctions]   - Closed auctions (invitation only): ${closedAuctions.length}`
      );
      console.log(`[ParticipatedAuctions]   - Total: ${data.length} auctions`);

      // Double-check: remove any user-created auctions
      const createdByUserCount = data.filter(isCreatedByUser).length;
      if (createdByUserCount > 0) {
        console.warn(
          `[ParticipatedAuctions] ⚠️ Found ${createdByUserCount} user-created auctions! Removing them...`
        );
        data = data.filter((auction) => !isCreatedByUser(auction));
      }

      setAuctions(data);
    } catch (err: any) {
      console.error("[ParticipatedAuctions] fetchAuctions failed:", err);
      setApiError(err?.message || "Failed to load auctions");
      setAuctions([]);
    }
  };

  // Initial load and refresh on filter changes
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

  // Manual refresh handler
  const handleManualRefresh = async () => {
    setIsFetching(true);
    try {
      await fetchAuctions();
    } finally {
      setIsFetching(false);
    }
  };

  // Timer for countdowns and status monitoring
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Helper functions for auction timing
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

  const remainingToStart = (auction: BaseAuction) => {
    return getAuctionStart(auction).getTime() - now;
  };

  const remainingToEnd = (auction: BaseAuction) => {
    return getAuctionEnd(auction).getTime() - now;
  };

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

  // Filter auctions locally
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
      <div className="ap-myauctions-header">
        <div className="ap-myauctions-header-content">
          <div className="ap-myauctions-title-section">
            <h1 className="ap-myauctions-title">
              <Users className="w-8 h-8" />
              My Participated Auctions
            </h1>
            <p className="ap-myauctions-subtitle">
              Track auctions you're participating in
            </p>
          </div>
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
              title={isFetching ? "Refreshing data" : "Click to refresh"}
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
                      <div className="flex items-center gap-2">
                        <span
                          className={`ap-myauctions-status-badge ap-myauctions-status-${derivedStatus}`}
                        >
                          {getStatusIcon(derivedStatus)}
                          {derivedStatus.toUpperCase()}
                        </span>
                        {isAuctionOpenToAll(auction) && (
                          <span className="ap-myauctions-status-badge ap-myauctions-status-open">
                            <Users className="w-3 h-3" />
                            OPEN TO ALL
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="ap-myauctions-card-subtitle">
                      Auction No: {auction.auctionNo}
                      {isAuctionOpenToAll(auction) && " • Open to all users"}
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

                    {auction.auctioneerCompany && (
                      <div className="ap-myauctions-info-item">
                        <span className="ap-myauctions-info-label">
                          Auctioneer:
                        </span>
                        <p className="ap-myauctions-info-value">
                          <Gavel className="w-4 h-4" />
                          {auction.auctioneerCompany}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="ap-myauctions-card-meta">
                    {derivedStatus === "upcoming" && (
                      <div
                        className="ap-myauctions-countdown"
                        title="Time until auction starts"
                      >
                        Starts in: {formatCountdown(startsInMs)}
                      </div>
                    )}
                    {derivedStatus === "live" && (
                      <div
                        className="ap-myauctions-countdown"
                        title="Auction in progress (time remaining)"
                      >
                        Live • {formatCountdown(Math.max(endsInMs, 0))}
                      </div>
                    )}
                  </div>

                  <div className="ap-myauctions-card-actions">
                    <Link
                      to={`/dashboard/auction/${
                        auction.backendId || auction.id
                      }`}
                      className="ap-myauctions-action-btn ap-myauctions-view-btn"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </Link>

                    {derivedStatus === "live" && (
                      <button
                        onClick={async (e) => {
                          e.preventDefault();
                          if (!auction.backendId && !auction.id) {
                            console.error("No auction ID found");
                            return;
                          }
                          const targetId = auction.backendId || auction.id;
                          try {
                            const button = e.currentTarget as HTMLButtonElement;
                            if (button) {
                              button.disabled = true;
                              button.innerText = "Joining...";
                            }
                            const { default: newAuctionService } = await import(
                              "../../../services/newAuctionService"
                            );
                            const { joinParticipant } = await import(
                              "../../../services/apiAuctionService"
                            );

                            let joined = false;
                            try {
                              const numId = Number(targetId);
                              if (!isNaN(numId) && user?.phoneNumber) {
                                const result =
                                  await newAuctionService.joinAuction({
                                    auction_id: numId,
                                    phone_number: user.phoneNumber,
                                  });
                                joined = !!result?.success;
                              }
                            } catch (newErr) {
                              console.warn(
                                "New join API failed, trying legacy",
                                newErr
                              );
                            }

                            if (!joined) {
                              await joinParticipant(targetId);
                            }

                            navigate(
                              `/dashboard/participant-auction/${targetId}`
                            );
                          } catch (err: any) {
                            console.error("Failed to join auction:", err);
                            alert(err?.message || "Failed to join auction");
                          } finally {
                            const button = e.currentTarget as HTMLButtonElement;
                            if (button) {
                              button.disabled = false;
                              button.innerText = "Join as Participant";
                            }
                          }
                        }}
                        className="ap-myauctions-action-btn ap-myauctions-join-btn"
                      >
                        <Play className="w-4 h-4" />
                        Join as Participant
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
              <Users className="ap-myauctions-empty-icon" />
              <h3 className="ap-myauctions-empty-title">No auctions found</h3>
              <p className="ap-myauctions-empty-subtitle">
                You haven't participated in any auctions yet. You need to be
                added as a participant by the auctioneer to see auctions here.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyParticipatedAuctions;