// import React, { useState, useEffect, useRef } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import "./MyCreatedAuctionView.css";
//  import BusinessIcon from "@mui/icons-material/Business";
// import {
//   Calendar,
//   Clock,
//   Users,
//   FileText,
//   Download,
//   Building,
//   Mail,
//   Phone,
//   MapPin,
//   User,
//   CheckCircle,
//   XCircle,
//   IndianRupee,
//   Timer,
//   ArrowLeft,
//   RefreshCw,
//   Play,
//   Gavel,
//   Edit,
//   Settings,
// } from "lucide-react";
// import { useAuth } from "../../../contexts/AuthContext";
// import { API_BASE_URL } from "../../../services/apiConfig";
// import toast from "react-hot-toast";
// import { format } from "date-fns";
// import AuctionService from "../../../services/auctionService";
// import apiDencrimentValue from "../../../services/apiDencrimentValue";
// import apiAuctionService from "../../../services/apiAuctionService";
// import newAuctionService from "../../../services/newAuctionService";
// import { BaseAuction, AuctionParticipant } from "../../../types/auction";
// import auctionDeleteService from "../../../services/auctionDeleteService";



// /* 🔧 ADD-1  helper – add minutes to HH:MM  */
// /* 🔧 FIXED helper – add minutes to 12-hour string */
// const addMinutesToTime = (time12: string, mins: number): string => {
//   const d = new Date();
//   const [time, modifier] = time12.split(' ');
//   let [h, m] = time.split(':').map(Number);
//   if (modifier === 'PM' && h < 12) h += 12;
//   if (modifier === 'AM' && h === 12) h = 0;
//   d.setHours(h, m + mins, 0, 0);
//   return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
// };

// const MyCreatedAuctionView: React.FC = () => {
//   const { id } = useParams<{ id: string }>();
//   const navigate = useNavigate();
//   const [auction, setAuction] = useState<BaseAuction | null>(null);
//   const [participants, setParticipants] = useState<AuctionParticipant[]>([]);
//   const [auctioneer, setAuctioneer] = useState<any>(null);
//   const [userDetails, setUserDetails] = useState<any>(null);
//   const [loading, setLoading] = useState(true);
//   const [preBids, setPreBids] = useState<any[]>([]);
//   const [preBidsLoading, setPreBidsLoading] = useState(false);
//   const [isLiveUpdating, setIsLiveUpdating] = useState(false);
//   const [liveUpdatesEnabled, setLiveUpdatesEnabled] = useState(true);
//   const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
//   const [allParticipants, setAllParticipants] = useState<any[]>([]);
//   const [isEditDecrementOpen, setIsEditDecrementOpen] = useState(false);
//   const [newDecrementValue, setNewDecrementValue] = useState<number | string>(
//     ""
//   );
//   const [updatingDecrement, setUpdatingDecrement] = useState(false);
//   const [participantsLoading, setParticipantsLoading] = useState(false);
//   const isMountedRef = useRef(true);
//   const { user } = useAuth();
//   const inputRef = useRef<HTMLInputElement>(null);


//   const [showDeleteModal, setShowDeleteModal] = useState(false);
//   const [deleteLoading, setDeleteLoading] = useState(false);
//   const [deleteConfirmText, setDeleteConfirmText] = useState("");







//   const handleDeleteAuction = async () => {
//     if (!auction || !id) return;

//     // Additional confirmation
//     if (deleteConfirmText !== "DELETE") {
//       toast.error('Please type "DELETE" to confirm deletion');
//       return;
//     }

//     setDeleteLoading(true);
//     try {
//       const result = await auctionDeleteService.deleteAuction(id);

//       if (result.success) {
//         toast.success(result.message || "Auction deleted successfully");

//         // Navigate back to auctions list after a short delay
//         setTimeout(() => {
//           navigate("/dashboard/MyCreatedA");
//         }, 1500);
//       }
//     } catch (error: any) {
//       console.error("[MyCreatedAuctionView] Error deleting auction:", error);
//       toast.error(error.message || "Failed to delete auction");
//     } finally {
//       setDeleteLoading(false);
//       setShowDeleteModal(false);
//       setDeleteConfirmText("");
//     }
//   };

//   // Add this function to check if auction can be deleted
//   const canDeleteAuction = () => {
//     if (!auction) return false;

//     // Only allow deletion for upcoming auctions
//     // You can modify this logic based on your requirements
//     return auction.status === "upcoming";
//   };

//   // Add this function to get delete button text based on status
//   const getDeleteButtonText = () => {
//     if (!auction) return "Delete Auction";

//     switch (auction.status) {
//       case "completed":
//         return "Cannot Delete Completed Auction";
//       case "live":
//         return "Cannot Delete Live Auction";
//       case "upcoming":
//         return "Delete Auction";
//       default:
//         return "Delete Auction";
//     }
//   };



//   // Initial data load - only runs once when component mounts or ID changes
//   useEffect(() => {
//     console.log("[MyCreatedAuctionView] Initial load for auction ID:", id);
//     loadAuctionDetails();
//     fetchUserDetails();
//     fetchPreBids();
//     fetchAllParticipants();
//   }, [id]);

//   useEffect(() => {
//     if (isEditDecrementOpen && inputRef.current) {
//       // Wait for modal render, then focus
//       setTimeout(() => {
//         inputRef.current?.focus();
//       }, 100);
//     }
//   }, [isEditDecrementOpen]);


//   // Separate useEffect for live monitoring - runs when auction data is available
//   useEffect(() => {
//     if (!auction) return;

//     // Set up real-time monitoring for live auction updates
//     const liveMonitor = setInterval(() => {
//       // Check if component is still mounted
//       if (!isMountedRef.current) return;

//       const now = new Date();

//       // Check for status changes (upcoming -> live)
//       if (auction.status === "upcoming") {
//         const startTime = new Date(
//           `${auction.auctionDate}T${auction.auctionStartTime}:00`
//         );
//         if (now >= startTime) {
//           console.log(
//             "[MyCreatedAuctionView] Auction start time reached, updating status"
//           );
//           loadAuctionDetails();
//           return;
//         }
//       }

//       // For live auctions, continuously update data without full refresh
//       if (auction.status === "live" && liveUpdatesEnabled) {
//         console.log("[MyCreatedAuctionView] Updating live auction data...");
//         updateLiveAuctionData();
//       }

//       // Check for auction end time
//       if (
//         auction.status === "live" &&
//         auction.auctionDate &&
//         auction.auctionEndTime
//       ) {
//         const endTime = new Date(
//           `${auction.auctionDate}T${auction.auctionEndTime}:00`
//         );
//         if (now >= endTime) {
//           console.log(
//             "[MyCreatedAuctionView] Auction end time reached, updating status"
//           );
//           loadAuctionDetails();
//         }
//       }
//     }, 5000); // Update every 5 seconds to balance real-time feel with performance

//     return () => clearInterval(liveMonitor);
//   }, [auction?.id, auction?.status, liveUpdatesEnabled]); // Only respond to auction ID, status, or user preference changes

//   // Cleanup effect
//   useEffect(() => {
//     return () => {
//       isMountedRef.current = false;
//     };
//   }, []);

//   const fetchUserDetails = async () => {
//     try {
//       const token =
//         localStorage.getItem("authToken") ||
//         localStorage.getItem("token") ||
//         localStorage.getItem("accessToken");
//       if (!token) return;

//       const response = await fetch(`${API_BASE_URL}/auth/profile`, {
//         method: "GET",
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "application/json",
//         },
//       });

//       if (response.ok) {
//         const result = await response.json();
//         if (result.success && result.user) {
//           setUserDetails(result.user);
//           console.log(
//             "[MyCreatedAuctionView] User details fetched:",
//             result.user
//           );
//         }
//       }
//     } catch (error) {
//       console.error(
//         "[MyCreatedAuctionView] Failed to fetch user details:",
//         error
//       );
//     }
//   };

//   // Update live auction data without full page refresh
//   const updateLiveAuctionData = async () => {
//     if (!id || !auction) return;

//     setIsLiveUpdating(true);
//     try {
//       const token =
//         localStorage.getItem("authToken") ||
//         localStorage.getItem("token") ||
//         localStorage.getItem("accessToken");
//       if (!token) return;

//       // Fetch updated auction data quietly
//       const response = await fetch(`${API_BASE_URL}/auction/${id}`, {
//         method: "GET",
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "application/json",
//         },
//       });

//       if (response.ok) {
//         const data = await response.json();
//         if (data.success && data.auction && isMountedRef.current) {
//           // Only update the dynamic parts, preserve loading states
//           setAuction((prevAuction) => ({
//             ...prevAuction,
//             ...data.auction,
//             // Keep existing static data if new data doesn't include it
//             title: data.auction.title || prevAuction?.title,
//           }));

//           console.log(
//             "[MyCreatedAuctionView] Live data updated - Bids:",
//             data.auction.statistics?.total_bids || 0
//           );
//           setLastUpdated(new Date());
//         }
//       }

//       // Also update pre-bids and participants if they might have changed (but only if not already loading)
//       if (!preBidsLoading) {
//         const preBidsResponse = await fetch(
//           `${API_BASE_URL}/auction/${id}/prebids`,
//           {
//             method: "GET",
//             headers: {
//               Authorization: `Bearer ${token}`,
//               "Content-Type": "application/json",
//             },
//           }
//         );

//         if (preBidsResponse.ok) {
//           const preBidsResult = await preBidsResponse.json();
//           if (
//             preBidsResult.success &&
//             preBidsResult.prebids &&
//             isMountedRef.current
//           ) {
//             setPreBids(preBidsResult.prebids);
//           }
//         }
//       }

//       // Update participants data if not already loading
//       if (!participantsLoading) {
//         const participantsResponse = await fetch(
//           `${API_BASE_URL}/auction/${id}/participants`,
//           {
//             method: "GET",
//             headers: {
//               Authorization: `Bearer ${token}`,
//               "Content-Type": "application/json",
//             },
//           }
//         );

//         if (participantsResponse.ok) {
//           const participantsResult = await participantsResponse.json();
//           if (
//             participantsResult.success &&
//             participantsResult.participants &&
//             isMountedRef.current
//           ) {
//             setAllParticipants(participantsResult.participants);
//           }
//         }
//       }
//     } catch (error) {
//       console.error("[MyCreatedAuctionView] Error updating live data:", error);
//       // Don't show error to user for background updates
//     } finally {
//       setIsLiveUpdating(false);
//     }
//   };

//   // Fetch all participants for this auction with complete information
//   // Replace the fetchAllParticipants function with:
// const fetchAllParticipants = async () => {
//   if (!id) return;
//   setParticipantsLoading(true);
//   try {
//     const token = localStorage.getItem("authToken") || localStorage.getItem("token") || localStorage.getItem("accessToken");
//     if (!token) return;

//     const response = await fetch(`${API_BASE_URL}/auction/${id}/participants`, {
//       method: "GET",
//       headers: {
//         Authorization: `Bearer ${token}`,
//         "Content-Type": "application/json",
//       },
//     });

//     if (response.ok) {
//       const result = await response.json();
//       console.log("Participants API Response:", result); // Debug log
      
//       if (result.success && result.participants && Array.isArray(result.participants)) {
//         setAllParticipants(result.participants);
//       } else if (result.success && Array.isArray(result.data)) {
//         // Handle different API response structure
//         setAllParticipants(result.data);
//       }
//     } else {
//       console.error("Failed to fetch participants:", response.status);
//     }
//   } catch (error) {
//     console.error("Error fetching participants:", error);
//   } finally {
//     setParticipantsLoading(false);
//   }
// };
  
//   // Fetch pre-bids for this auction
//   const fetchPreBids = async () => {
//     if (!id) return;
//     setPreBidsLoading(true);
//     try {
//       const token =
//         localStorage.getItem("authToken") ||
//         localStorage.getItem("token") ||
//         localStorage.getItem("accessToken");
//       if (!token) return;

//       const response = await fetch(`${API_BASE_URL}/auction/${id}/prebids`, {
//         method: "GET",
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "application/json",
//         },
//       });

//       if (response.ok) {
//         const result = await response.json();
//         if (result.success && result.prebids) {
//           setPreBids(result.prebids);
//           console.log(
//             "[MyCreatedAuctionView] Pre-bids fetched:",
//             result.prebids
//           );
//         }
//       } else {
//         console.warn(
//           "[MyCreatedAuctionView] Failed to fetch pre-bids:",
//           response.status
//         );
//       }
//     } catch (error) {
//       console.error("[MyCreatedAuctionView] Error fetching pre-bids:", error);
//     } finally {
//       setPreBidsLoading(false);
//     }
//   };

//   // Handle pre-bid approval/rejection
//   const handlePreBidAction = async (
//     preBidId: string,
//     action: "approve" | "reject"
//   ) => {
//     try {
//       const token =
//         localStorage.getItem("authToken") ||
//         localStorage.getItem("token") ||
//         localStorage.getItem("accessToken");
//       if (!token) return;

//       const response = await fetch(
//         `${API_BASE_URL}/auction/prebid/${preBidId}/${action}`,
//         {
//           method: "POST",
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//           },
//         }
//       );

//       if (response.ok) {
//         const result = await response.json();
//         if (result.success) {
//           toast.success(`Pre-bid ${action}d successfully`);
//           fetchPreBids(); // Refresh the pre-bids list
//           fetchAllParticipants(); // Refresh participants data
//           // Also update live auction data to get latest statistics
//           if (auction?.status === "live" || auction?.status === "upcoming") {
//             updateLiveAuctionData();
//           }
//         } else {
//           toast.error(result.message || `Failed to ${action} pre-bid`);
//         }
//       } else {
//         toast.error(`Failed to ${action} pre-bid`);
//       }
//     } catch (error) {
//       console.error(
//         `[MyCreatedAuctionView] Error ${action}ing pre-bid:`,
//         error
//       );
//       toast.error(`Failed to ${action} pre-bid`);
//     }
//   };

//   const loadAuctionDetails = async () => {
//     if (!id) {
//       navigate("/dashboard/auctions");
//       return;
//     }
//     setLoading(true);
//     try {
//       let auctionData: BaseAuction | null = null;

//       // Try new auction details API first
//       try {
//         const AUCTION_API_BASE_URL = `${API_BASE_URL}/auction`;
//         const token =
//           localStorage.getItem("authToken") ||
//           localStorage.getItem("token") ||
//           localStorage.getItem("accessToken");

//         const response = await fetch(`${API_BASE_URL}/auction/${id}`, {
//           method: "GET",
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//           },
//         });

//         if (response.ok) {
//           const result = await response.json();
//           if (result.success && result.auction) {
//             const rawAuction = result.auction;

//             // Map the new API response to BaseAuction format
//             auctionData = {
//               id: rawAuction.id.toString(),
//               backendId: rawAuction.id.toString(),
//               title: rawAuction.title,
//               auctionNo: rawAuction.auction_no,
//               auctionDate: rawAuction.auction_date, // live
//               auctionStartTime: rawAuction.formatted_start_time, // live
//               auctionEndTime: rawAuction.formatted_end_time, // live (may be null)
//               duration: rawAuction.duration, // live
//               currency: rawAuction.currency as "INR" | "USD", // live
//               auctionDetails: rawAuction.description,
//               openToAllCompanies: Boolean(rawAuction.open_to_all), // live (0/1 → false/true)
//               preBidOfferAllowed: Boolean(rawAuction.pre_bid_allowed), // live (0/1 → false/true)
//               decrementalValue: Number(rawAuction.decremental_value),
//               startingPrice: Number(rawAuction.current_price),
//               reservePrice: undefined,
//               status: rawAuction.status as "upcoming" | "live" | "completed",
//               participants:
//                 rawAuction.participants?.map((p: any) => p.phone_number) || [],
//               documents:
//                 rawAuction.documents?.map((d: any) => ({
//                   name: d.file_name,
//                   url: d.file_url,
//                   size: d.file_type,
//                 })) || [],
//               createdBy: rawAuction.created_by.toString(),
//               createdAt: rawAuction.created_at,
//               updatedAt: rawAuction.updated_at,

//               auctioneerCompany: rawAuction.creator_info?.company_name,
//               auctioneerPhone: rawAuction.creator_info?.phone,
//               auctioneerAddress: "",
//             } as BaseAuction;

//             // (auctionData as any).backend = { ...rawAuction, user: rawAuction.creator_info };

//             // Store raw backend data for additional fields
//             (auctionData as any).backend = {
//               ...rawAuction,
//               user: result.user,
//               auctioneer: result.auctioneer || result.user,
//               creator_info: result.user,
//             };

//             // Store auctioneer company details
//             auctionData.auctioneerCompany =
//               rawAuction.auctioneer_company_name || rawAuction.company_name;
//             auctionData.auctioneerPhone =
//               rawAuction.auctioneer_phone || rawAuction.phone_number;
//             auctionData.auctioneerAddress =
//               rawAuction.auctioneer_address || rawAuction.company_address;
//             (auctionData as any).auctioneerEmail =
//               rawAuction.auctioneer_email || rawAuction.email;
//             (auctionData as any).auctioneerPerson =
//               result.user?.person_name || rawAuction.person_name;

//             if (result.user) {
//               setUserDetails({
//                 company_name:
//                   rawAuction.auctioneer_company_name ||
//                   result.user.company_name,
//                 person_name: result.user.person_name,
//                 email: rawAuction.auctioneer_email || result.user.email,
//                 phone_number:
//                   rawAuction.auctioneer_phone || result.user.phone_number,
//                 company_address:
//                   rawAuction.auctioneer_address || result.user.company_address,
//               });
//             }

//             console.log(
//               "[MyCreatedAuctionView] New API fetch successful:",
//               auctionData
//             );
//           }
//         }
//       } catch (newApiErr: any) {
//         console.warn(
//           "[MyCreatedAuctionView] New auction details API failed, trying legacy:",
//           newApiErr
//         );
//       }

//       // Fallback to legacy API if new API failed
//       if (!auctionData) {
//         try {
//           auctionData = await apiAuctionService.fetchAuctionById(id);
//           console.log(
//             "[MyCreatedAuctionView] Legacy API fetch successful:",
//             auctionData
//           );
//         } catch (apiErr: any) {
//           console.warn(
//             "Legacy API fetch failed, falling back to local storage:",
//             apiErr
//           );
//           auctionData = AuctionService.getAuctionById(id);
//         }
//       }

//       if (!auctionData) {
//         toast.error("Auction not found");
//         navigate("/dashboard/auctions");
//         return;
//       }

//       setAuction(auctionData);

//       /* 🔧 ADD-2  fix end-time only for upcoming auctions */
// if (auctionData && auctionData.status === 'upcoming') {
//   auctionData.auctionEndTime = addMinutesToTime(
//     auctionData.auctionStartTime,
//     auctionData.duration
//   );
//   console.log('[MyCreatedAuctionView] Upcoming end-time corrected ->', auctionData.auctionEndTime);
// }
      
//       const participantData = AuctionService.getParticipantsByAuction(id);
//       setParticipants(participantData);
//       const auctioneerData = AuctionService.getUserById(auctionData.createdBy);
//       setAuctioneer(auctioneerData);

//       // Refresh pre-bids when auction details are loaded
//       fetchPreBids();
//     } catch (error) {
//       console.error("Error loading auction details:", error);
//       toast.error("Failed to load auction details");
//       navigate("/dashboard/auctions");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // const handleDownloadDocument = (doc: { name: string; url: string }) => {
//   //   toast.success(`Downloading ${doc.name}`);
//   //   console.log(`Download: ${doc.name} from ${doc.url}`);
//   // };
  
//   const handleDownloadDocument = (doc: { name: string; url: string }) => {
//   if (!doc.url) {
//     toast.error("Download link is missing");
//     return;
//   }

//   // Create a temporary anchor element
//   const link = document.createElement("a");
//   link.href = doc.url;
//   link.download = doc.name || "download"; // Force download with filename
//   link.target = "_blank"; // Fallback for cross-origin
//   link.rel = "noopener noreferrer";

//   // Append to body (required for Firefox), click, then remove
//   document.body.appendChild(link);
//   link.click();
//   document.body.removeChild(link);

//   toast.success(`Downloading ${doc.name}...`);
// };

//   const handleEditAuction = () => {
//     if (auction?.status === "upcoming") {
//       navigate(`/dashboard/edit-auction/${auction.id}`);
//       toast.success("Redirecting to edit auction...");
//     } else {
//       toast.error("Only upcoming auctions can be edited");
//     }
//   };

//   const handleStartAuction = () => {
//     if (auction?.status === "upcoming") {
//       navigate(`/dashboard/auctioneer-live/${auction.id}`);
//       toast.success("Starting auction...");
//     } else {
//       toast.error("Auction cannot be started");
//     }
//   };

//   const formatDate = (dateString: string) => {
//     try {
//       const date = new Date(dateString);
//       const day = date.getDate().toString().padStart(2, "0");
//       const month = (date.getMonth() + 1).toString().padStart(2, "0");
//       const year = date.getFullYear();
//       return `${day}/${month}/${year}`;
//     } catch {
//       return dateString;
//     }
//   };

//   if (loading) {
//     return (
//       <div className="view-auction-container">
//         <div className="auction-details-card">
//           <div className="loading-spinner">
//             <p>Loading auction details...</p>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (!auction) {
//     return (
//       <div className="view-auction-container">
//         <div className="auction-details-card">
//           <div className="error-message">
//             <XCircle className="w-5 h-5" />
//             <div>
//               <h3>Auction Not Found</h3>
//               <p>The requested auction could not be found.</p>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   // Helper: backend meta if present
//   const backendMeta: any = (auction as any).backend;
//   const backendParticipants =
//     allParticipants.length > 0
//       ? allParticipants
//       : backendMeta?.participantsList || [];
//   const bidHistory = backendMeta?.bidHistory || [];

//   return (
//     <div className="view-auction-container">
//       {/* Header */}
//       <div className="view-auction-header">
//         <div>
//           <h1 className="auction-title">
//             {auction.title}: {auction.auctionNo}
//           </h1>
//           <p className="auction-subtitle">
//             Manage your auction details and monitor participants
//           </p>
//         </div>
//         <span className={`auction-status-badge status-${auction.status}`}>
//           {auction.status.toUpperCase()}
//         </span>
//       </div>

//       {/* Company Details */}
//       <div className="auction-details-card">
//         <h2 className="card-title">
//           <BusinessIcon className="w-5 h-5" />
//           Your Company Details
//         </h2>
//         <div className="auction-info-grid">
//           <div className="info-item">
//             <label className="info-label">Company Name</label>
//             <div className="info-value">
//               {userDetails?.company_name ||
//                 backendMeta?.user?.company_name ||
//                 backendMeta?.creator_info?.company_name ||
//                 auctioneer?.companyName ||
//                 auction.auctioneerCompany ||
//                 "Unknown Company"}
//             </div>
//           </div>
//           <div className="info-item">
//             <label className="info-label">Person Name</label>
//             <div className="info-value">
//               {userDetails?.person_name ||
//                 backendMeta?.user?.person_name ||
//                 backendMeta?.creator_info?.person_name ||
//                 auctioneer?.personName ||
//                 backendMeta?.auctioneerPerson ||
//                 "Unknown Person"}
//             </div>
//           </div>
//           <div className="info-item">
//             <label className="info-label">Mail Id</label>
//             <div className="info-value">
//               {userDetails?.email ||
//                 backendMeta?.user?.email ||
//                 backendMeta?.creator_info?.email ||
//                 auctioneer?.email ||
//                 auctioneer?.mailId ||
//                 backendMeta?.auctioneerEmail ||
//                 "Unknown Email"}
//             </div>
//           </div>
//           <div className="info-item">
//             <label className="info-label">Company Address</label>
//             <div className="info-value">
//               {userDetails?.company_address ||
//                 backendMeta?.user?.company_address ||
//                 backendMeta?.creator_info?.company_address ||
//                 auctioneer?.companyAddress ||
//                 backendMeta?.auctioneerAddress ||
//                 "Unknown Address"}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Auction Information */}
//       <div className="auction-details-card">
//         <h2 className="card-title">
//           <Calendar className="w-5 h-5" />
//           Auction Information
//         </h2>
//         <div className="auction-info-grid">
//           <div className="info-item">
//             <label className="info-label">Auction Date</label>
//             <div className="info-value">
//               {auction.rawAuctionDate
//                 ? formatDate(auction.rawAuctionDate)
//                 : formatDate(auction.auctionDate)}
//             </div>
//           </div>
//           <div className="info-item">
//             <label className="info-label">Start Time</label>
//             <div className="info-value">{auction.auctionStartTime}</div>
//           </div>
//           <div className="info-item">
//             <label className="info-label">End Time</label>
//             <div className="info-value">{auction.auctionEndTime || "—"}</div>
//           </div>
//           <div className="info-item">
//             <label className="info-label">Duration</label>
//             <div className="info-value">{auction.duration} minutes</div>
//           </div>
//           <div className="info-item">
//             <label className="info-label">Currency</label>
//             <div className="info-value price">
//               {auction.currency === "INR" ? "INR" : auction.currency}
//             </div>
//           </div>
//           <div className="info-item">
//             <label className="info-label">Open to All Companies</label>
//             <div className="info-value">
//               {auction.openToAllCompanies ? <span>Yes</span> : <span>No</span>}
//             </div>
//           </div>
//           <div className="info-item">
//             <label className="info-label">Pre-Bid Offer Allowed</label>
//             <div className="info-value">
//               {auction.preBidOfferAllowed ? <span>Yes</span> : <span>No</span>}
//             </div>
//           </div>
//           {backendMeta?.basePrice !== undefined && (
//             <div className="info-item">
//               <label className="info-label">Base Price</label>
//               <div className="info-value price">
//                 {auction.currency} {backendMeta.basePrice.toLocaleString()}
//               </div>
//             </div>
//           )}
//           {backendMeta?.currentPrice !== undefined && (
//             <div className="info-item">
//               <label className="info-label">Current Price</label>
//               <div className="info-value price">
//                 {auction.currency} {backendMeta.currentPrice.toLocaleString()}
//               </div>
//             </div>
//           )}
//           {backendMeta?.statistics && (
//             <>
//               <div className="info-item">
//                 <label className="info-label">
//                   Total Bids
//                   {isLiveUpdating && <span className="live-indicator">🔄</span>}
//                   {auction?.status === "live" &&
//                     !isLiveUpdating &&
//                     liveUpdatesEnabled && (
//                       <span className="live-indicator">🟢</span>
//                     )}
//                   {auction?.status === "live" && !liveUpdatesEnabled && (
//                     <span className="live-indicator">⏸️</span>
//                   )}
//                 </label>
//                 <div className="info-value">
//                   {backendMeta.statistics.total_bids || 0}
//                   {lastUpdated && auction?.status === "live" && (
//                     <small
//                       style={{
//                         fontSize: "0.7rem",
//                         opacity: 0.7,
//                         marginLeft: "0.5rem",
//                       }}
//                     >
//                       Updated: {lastUpdated.toLocaleTimeString()}
//                     </small>
//                   )}
//                 </div>
//               </div>
//               <div className="info-item">
//                 <label className="info-label">Active Participants</label>
//                 <div className="info-value">
//                   {backendMeta.statistics.active_participants || 0}
//                 </div>
//               </div>
//               {backendMeta.statistics.lowest_bid && (
//                 <div className="info-item">
//                   <label className="info-label">Lowest Bid</label>
//                   <div className="info-value price">
//                     {auction.currency}{" "}
//                     {Number(backendMeta.statistics.lowest_bid).toLocaleString()}
//                   </div>
//                 </div>
//               )}
//             </>
//           )}
//         </div>

//         {auction.decrementalValue && (
//           <div className="auction-description">
//             <h4>Decremental Value</h4>
//             <p>
//               {auction.currency} {auction.decrementalValue.toLocaleString()}
//               <span> (Minimum bid reduction amount)</span>
//             </p>
//             <div style={{ marginTop: 8 }}>
//               <button
//                 className="btn btn-secondary"
//                 onClick={() => {
//                   setNewDecrementValue(auction.decrementalValue || 0);
//                   setIsEditDecrementOpen(true);
//                 }}
//               >
//                 <Edit className="w-4 h-4" /> Edit Decrement
//               </button>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Edit Decrement Modal */}
//       {/* {isEditDecrementOpen && (
//         <div className="prebuild-modal-overlay" role="dialog" aria-modal="true">
//           <div className="prebuild-modal">
//             <h3 className="prebuild-modal-title">Edit Decrement Value</h3>
//             <div style={{ marginTop: 8 }}>
//               <label className="modal-label">
//                 Value ({auction?.currency || "₹"})
//               </label>
//               <input
//                 type="number"
//                 className="prebuild-input"
//                 value={String(newDecrementValue)}
//                 onChange={(e) => setNewDecrementValue(e.target.value)}
//                 disabled={updatingDecrement}
//               />
//             </div>
//             <div className="prebuild-modal-actions">
//               <button
//                 className="btn btn-secondary"
//                 onClick={() => setIsEditDecrementOpen(false)}
//                 disabled={updatingDecrement}
//               >
//                 Cancel
//               </button>
//               <button
//                 className="btn btn-primary"
//                 onClick={async () => {
//                   // validation
//                   const num = Number(newDecrementValue);
//                   if (Number.isNaN(num) || num <= 0) {
//                     toast.error("Please enter a valid positive number");
//                     return;
//                   }
//                   setUpdatingDecrement(true);
//                   try {
//                     const resp =
//                       await apiDencrimentValue.updateAuctionDecrement(
//                         id || "",
//                         num
//                       );
//                     if (resp && resp.success) {
//                       toast.success("Decrement value updated");
//                       // refresh auction details
//                       await loadAuctionDetails();
//                       setIsEditDecrementOpen(false);
//                     } else {
//                       toast.error(
//                         resp?.message || "Failed to update decrement"
//                       );
//                     }
//                   } catch (err: any) {
//                     console.error("Update decrement error", err);
//                     toast.error(err?.message || "Failed to update decrement");
//                   } finally {
//                     setUpdatingDecrement(false);
//                   }
//                 }}
//                 disabled={updatingDecrement}
//               >
//                 {updatingDecrement ? "Updating..." : "Save"}
//               </button>
//             </div>
//           </div>
//         </div>
//       )} */}
//       <input
//         type="number"
//         ref={inputRef}
//         className="prebuild-input"
//         value={String(newDecrementValue)}
//         onChange={(e) => setNewDecrementValue(e.target.value)}
//         disabled={updatingDecrement}
//       />


//       {/* Auction Details/Description */}
//       <div className="auction-details-card">
//         <h2 className="card-title">
//           <FileText className="w-5 h-5" />
//           Auction Details / Description
//         </h2>
//         <div className="auction-description">
//           <p>{auction.auctionDetails}</p>
//         </div>
//       </div>

//       {/* Auction Documents */}
//       {auction.documents.length > 0 && (
//         <div className="auction-details-card">
//           <h2 className="card-title">
//             <FileText className="w-5 h-5" />
//             Auction Documents
//           </h2>
//           <div className="participants-list">
//             {auction.documents.map((doc, index) => (
//               <div key={index} className="participant-item">
//                 <div
//                   className="participant-info"
//                   style={{ flex: 1, minWidth: 0 }}
//                 >
//                   <FileText className="w-5 h-5" style={{ flexShrink: 0 }} />
//                   <div
//                     className="participant-details"
//                     style={{ minWidth: 0, overflow: "hidden" }}
//                   >
//                     <h4
//                       style={{
//                         overflow: "hidden",
//                         textOverflow: "ellipsis",
//                         whiteSpace: "wrap",
//                         maxWidth: "80%",
//                       }}
//                     >
//                       {doc.name}
//                     </h4>
//                     <p>{doc.size}</p>
//                   </div>
//                 </div>
//                 <button
//                   onClick={() => handleDownloadDocument(doc)}
//                   className="btn btn-secondary"
//                   style={{ flexShrink: 0, marginLeft: "1rem" }}
//                 >
//                   <Download className="w-4 h-4" />
//                   Download
//                 </button>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}

//       {/* Pre-bid Management Section */}
//       <div className="auction-details-card">
//         <h2 className="card-title">
//           <Gavel className="w-5 h-5" />
//           Pre-bid Management
//           <span className="participants-count">({preBids.length})</span>
//         </h2>
//         {preBidsLoading ? (
//           <div className="loading-spinner">
//             <p>Loading pre-bids...</p>
//           </div>
//         ) : preBids.length > 0 ? (
//           <div className="participants-list">
//             {preBids.map((preBid: any, index: number) => (
//               <div
//                 key={preBid.id || index}
//                 className="participant-item prebid-item"
//               >
//                 <div className="participant-info">
//                   <div className="participant-avatar">
//                     {(preBid.person_name || preBid.company_name || "B")
//                       .charAt(0)
//                       .toUpperCase()}
//                   </div>
//                   <div className="participant-details">
//                     <h4>
//                       {preBid.person_name || preBid.company_name || "Bidder"}
//                     </h4>
//                     <p>{preBid.company_name || preBid.phone_number || "N/A"}</p>
//                     <p className="prebid-amount">
//                       <IndianRupee className="w-4 h-4" />
//                       {auction?.currency}{" "}
//                       {Number(
//                         preBid.amount || preBid.bid_amount
//                       ).toLocaleString()}
//                     </p>
//                     <p className="prebid-time">
//                       {preBid.created_at || preBid.bid_time
//                         ? new Date(
//                             preBid.created_at || preBid.bid_time
//                           ).toLocaleString()
//                         : "Unknown time"}
//                     </p>
//                   </div>
//                 </div>
//                 <div className="prebid-actions">
//                   {/* <div
//                     className={`participant-status ${
//                       preBid.status === "approved"
//                         ? "status-active"
//                         : preBid.status === "rejected"
//                         ? "status-inactive"
//                         : "status-pending"
//                     }`}
//                   >
//                     {preBid.status || "pending"}
//                   </div> */}
//                   {(!preBid.status || preBid.status === "pending") && (
//                     <div className="prebid-action-buttons">
//                       {/*                       <button
//                         type="button"
//                         onClick={() => handlePreBidAction(preBid.id, "approve")}
//                         className="btn btn-primary btn-sm"
//                         title="Approve pre-bid"
//                       >
//                         <CheckCircle className="w-4 h-4" />
//                         Approve
//                       </button> */}
//                       <button
//                         type="button"
//                         onClick={() => handlePreBidAction(preBid.id, "reject")}
//                         className="btn btn-secondary btn-sm"
//                         title="Reject pre-bid"
//                       >
//                         <XCircle className="w-4 h-4" />
//                         Reject
//                       </button>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             ))}
//           </div>
//         ) : (
//           <div className="join-form">
//             <Gavel className="w-12 h-12" />
//             <h3>No Pre-bids Yet</h3>
//             <p>No pre-bids have been submitted for this auction yet</p>
//           </div>
//         )}
//       </div>

//       {/* Registered Participants */}
//       <div className="participants-section">
//         <div className="participants-header">
//           <h2 className="card-title">
//             <Users className="w-5 h-5" />
//             Registered Participants
//             {/*             <span className="participants-count">
//               ({backendParticipants.length} total,{" "}
//               {
//                 backendParticipants.filter((p: any) => p.status === "joined")
//                   .length
//               }{" "}
//               active)
//             </span> */}
//           </h2>
//           <button
//             type="button"
//             onClick={fetchAllParticipants}
//             className="btn btn-secondary btn-sm"
//             title="Refresh participants data"
//           >
//             <RefreshCw className="w-4 h-4" />
//             Refresh
//           </button>
//         </div>

//         {backendParticipants.length > 0 ? (
//           <>
//             {/* Participants Summary */}

//             {/*             <div className="participants-summary">

//             {/* <div className="participants-summary">

//               <div className="summary-stat">
//                 <span className="stat-label">Total Invited</span>
//                 <span className="stat-value">{backendParticipants.length}</span>
//               </div>
//               <div className="summary-stat">
//                 <span className="stat-label">Joined</span>
//                 <span className="stat-value stat-success">
//                   {
//                     backendParticipants.filter(
//                       (p: any) => p.status === "joined"
//                     ).length
//                   }
//                 </span>
//               </div>
//               <div className="summary-stat">
//                 <span className="stat-label">Pending</span>
//                 <span className="stat-value stat-warning">
//                   {backendParticipants.filter((p: any) => p.status === 'invited' || !p.status).length}
//                 </span>
//               </div>
//             </div> */}

//             <div className="participants-list">
//               {backendParticipants
//                 .filter((p: any) =>
//                   ["invited", "joined"].includes(p.status || "invited")
//                 )
//                 .map((participant: any, index: number) => (
//                   <div
//                     key={participant.id || index}
//                     className="participant-item"
//                   >
//                     <div className="participant-info">
//                       <div className="participant-avatar">
//                         {(
//                           participant.person_name ||
//                           participant.phone_number ||
//                           "?"
//                         )
//                           .charAt(0)
//                           .toUpperCase()}
//                       </div>
//                       <div className="participant-details">
//                         <h4>{participant.person_name || "N/A"}</h4>
//                         <p className="participant-company">
//                           {participant.company_name
//                             ? `${participant.company_name} • `
//                             : ""}
//                           {participant.phone_number}
//                         </p>
//                         {participant.user_id && (
//                           <p className="participant-id">
//                             User ID: {participant.user_id}
//                           </p>
//                         )}
//                         <div className="participant-timestamps">
//                           {participant.invited_at && (
//                             <span className="timestamp">
//                               📧 Invited:{" "}
//                               {new Date(
//                                 participant.invited_at
//                               ).toLocaleDateString()}
//                             </span>
//                           )}
//                           {participant.joined_at && (
//                             <span className="timestamp">
//                               ✅ Joined:{" "}
//                               {new Date(
//                                 participant.joined_at
//                               ).toLocaleDateString()}{" "}
//                               {new Date(
//                                 participant.joined_at
//                               ).toLocaleTimeString()}
//                             </span>
//                           )}
//                         </div>
//                       </div>
//                     </div>
//                     <div className="participant-actions">
//                       <div
//                         className={`participant-status status-${
//                           participant.status || "invited"
//                         }`}
//                       >
//                         {participant.status || "invited"}
//                       </div>
//                       {participant.status === "joined" && (
//                         <div className="participant-badge status-active">
//                           Active
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 ))}
//             </div>
//           </>
//         ) : participants.length === 0 ? (
//           <div className="join-form">
//             <Users className="w-12 h-12" />
//             <h3>No Participants Yet</h3>
//             <p>No participants registered for this auction yet</p>
//           </div>
//         ) : (
//           <div className="participants-list">
//             {participants.map((participant, index) => (
//               <div key={index} className="participant-item">
//                 <div className="participant-info">
//                   <div className="participant-avatar">
//                     {participant.personName.charAt(0).toUpperCase()}
//                   </div>
//                   <div className="participant-details">
//                     <h4>{participant.personName}</h4>
//                     <p>{participant.companyName}</p>
//                   </div>
//                 </div>
//                 <div className="participant-status status-active">Active</div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* Bid History (Backend) */}
//       {bidHistory.length > 0 && (
//         <div className="auction-details-card">
//           <h2 className="card-title">
//             <Clock className="w-5 h-5" />
//             Bid History
//           </h2>
//           <div className="participants-list">
//             {bidHistory
//               .slice()
//               .sort(
//                 (a: any, b: any) =>
//                   new Date(b.bid_time).getTime() -
//                   new Date(a.bid_time).getTime()
//               )
//               .map((b: any) => (
//                 <div key={b.id} className="participant-item">
//                   <div className="participant-info">
//                     <div className="participant-avatar">
//                       {(b.person_name || "B").charAt(0)}
//                     </div>
//                     <div className="participant-details">
//                       <h4>{b.company_name || b.person_name || "Bidder"}</h4>
//                       <p>{new Date(b.bid_time).toLocaleString()}</p>
//                     </div>
//                   </div>
//                   <div
//                     className={`participant-status ${
//                       b.is_winning ? "status-active" : ""
//                     }`}
//                   >
//                     {b.amount}
//                   </div>
//                 </div>
//               ))}
//           </div>
//         </div>
//       )}

//       {/* Action Buttons */}
//       {/* Action Buttons */}
//       <div className="auction-details-card">
//         <div className="flex flex-wrap items-center justify-center gap-4 p-4 md:p-6">
//           <button
//             onClick={() => navigate("/dashboard/MyCreatedA")}
//             className="btn btn-secondary"
//           >
//             <ArrowLeft className="w-4 h-4" />
//             Back to Auctions
//           </button>
//           {/* Delete Auction Button */}
//           <button
//             onClick={() => setShowDeleteModal(true)}
//             disabled={!canDeleteAuction()}
//             className={`btn ${
//               canDeleteAuction() ? "btn-danger" : "btn-disabled"
//             }`}
//             title={
//               canDeleteAuction()
//                 ? "Delete this auction"
//                 : "Only upcoming auctions can be deleted"
//             }
//           >
//             <XCircle className="w-4 h-4" />
//             {getDeleteButtonText()}
//           </button>
//         </div>
//       </div>
//       {/* Delete Confirmation Modal */}
//       {showDeleteModal && auction && (
//         <div
//           className="prebuild-modal-overlay"
//           onClick={() => !deleteLoading && setShowDeleteModal(false)}
//         >
//           <div
//             className="prebuild-modal"
//             onClick={(e) => e.stopPropagation()}
//             style={{ maxWidth: "500px" }}
//           >
//             <div className="prebuild-modal-header">
//               <XCircle className="w-6 h-6 text-red-500" />
//               <h3 className="prebuild-modal-title">Delete Auction</h3>
//             </div>

//             <div className="prebuild-modal-content">
//               <div className="delete-warning">
//                 <p className="warning-text">
//                   <strong>Warning: This action cannot be undone!</strong>
//                 </p>
//                 <p className="auction-to-delete">
//                   <strong>"{auction.title}"</strong> (ID: {auction.auctionNo})
//                 </p>

//                 <div className="delete-consequences">
//                   <h4>This will permanently delete:</h4>
//                   <ul>
//                     <li>All auction data and settings</li>
//                   </ul>
//                 </div>

//                 <div className="confirmation-input">
//                   <label htmlFor="deleteConfirm" className="modal-label">
//                     Type <strong>DELETE</strong> to confirm:
//                   </label>
//                   <input
//                     id="deleteConfirm"
//                     type="text"
//                     className="prebuild-input"
//                     value={deleteConfirmText}
//                     onChange={(e) => setDeleteConfirmText(e.target.value)}
//                     placeholder="Type DELETE to confirm"
//                     disabled={deleteLoading}
//                     autoComplete="off"
//                   />
//                 </div>
//               </div>
//             </div>

//             <div className="prebuild-modal-actions">
//               <button
//                 onClick={() => {
//                   setShowDeleteModal(false);
//                   setDeleteConfirmText("");
//                 }}
//                 className="btn btn-secondary"
//                 disabled={deleteLoading}
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleDeleteAuction}
//                 disabled={deleteLoading || deleteConfirmText !== "DELETE"}
//                 className="btn btn-danger"
//               >
//                 {deleteLoading ? (
//                   <>
//                     <RefreshCw className="w-4 h-4 animate-spin" />
//                     Deleting...
//                   </>
//                 ) : (
//                   <>
//                     <XCircle className="w-4 h-4" />
//                     Delete Auction Permanently
//                   </>
//                 )}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };  

// export default MyCreatedAuctionView;

// // --- Insert modal and handlers ---

import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./MyCreatedAuctionView.css";
import BusinessIcon from "@mui/icons-material/Business";
import {
  Calendar,
  Clock,
  Users,
  FileText,
  Download,
  Building,
  Mail,
  Phone,
  MapPin,
  User,
  CheckCircle,
  XCircle,
  IndianRupee,
  Timer,
  ArrowLeft,
  RefreshCw,
  Play,
  Gavel,
  Edit,
  Settings,
} from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { API_BASE_URL } from "../../../services/apiConfig";
import toast from "react-hot-toast";
import { format } from "date-fns";
import AuctionService from "../../../services/auctionService";
import apiDencrimentValue from "../../../services/apiDencrimentValue";
import apiAuctionService from "../../../services/apiAuctionService";
import newAuctionService from "../../../services/newAuctionService";
import { BaseAuction, AuctionParticipant } from "../../../types/auction";
import auctionDeleteService from "../../../services/auctionDeleteService";

/* 🔧 FIXED helper – add minutes to 12-hour string */
const addMinutesToTime = (time12: string, mins: number): string => {
  const d = new Date();
  const [time, modifier] = time12.split(" ");
  let [h, m] = time.split(":").map(Number);
  if (modifier === "PM" && h < 12) h += 12;
  if (modifier === "AM" && h === 12) h = 0;
  d.setHours(h, m + mins, 0, 0);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const MyCreatedAuctionView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [auction, setAuction] = useState<BaseAuction | null>(null);
  const [participants, setParticipants] = useState<AuctionParticipant[]>([]);
  const [auctioneer, setAuctioneer] = useState<any>(null);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [preBids, setPreBids] = useState<any[]>([]);
  const [preBidsLoading, setPreBidsLoading] = useState(false);
  const [isLiveUpdating, setIsLiveUpdating] = useState(false);
  const [liveUpdatesEnabled, setLiveUpdatesEnabled] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [allParticipants, setAllParticipants] = useState<any[]>([]);
  const [isEditDecrementOpen, setIsEditDecrementOpen] = useState(false);
  const [newDecrementValue, setNewDecrementValue] = useState<number | string>(
    ""
  );
  const [updatingDecrement, setUpdatingDecrement] = useState(false);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const isMountedRef = useRef(true);
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const handleDeleteAuction = async () => {
    if (!auction || !id) return;

    // Additional confirmation
    if (deleteConfirmText !== "DELETE") {
      toast.error('Please type "DELETE" to confirm deletion');
      return;
    }

    setDeleteLoading(true);
    try {
      const result = await auctionDeleteService.deleteAuction(id);

      if (result.success) {
        toast.success(result.message || "Auction deleted successfully");

        // Navigate back to auctions list after a short delay
        setTimeout(() => {
          navigate("/dashboard/MyCreatedA");
        }, 1500);
      }
    } catch (error: any) {
      console.error("[MyCreatedAuctionView] Error deleting auction:", error);
      toast.error(error.message || "Failed to delete auction");
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
      setDeleteConfirmText("");
    }
  };

  // Add this function to check if auction can be deleted
  const canDeleteAuction = () => {
    if (!auction) return false;

    // Only allow deletion for upcoming auctions
    // You can modify this logic based on your requirements
    return auction.status === "upcoming";
  };

  // Add this function to get delete button text based on status
  const getDeleteButtonText = () => {
    if (!auction) return "Delete Auction";

    switch (auction.status) {
      case "completed":
        return "Cannot Delete Completed Auction";
      case "live":
        return "Cannot Delete Live Auction";
      case "upcoming":
        return "Delete Auction";
      default:
        return "Delete Auction";
    }
  };

  // Initial data load - only runs once when component mounts or ID changes
  useEffect(() => {
    console.log("[MyCreatedAuctionView] Initial load for auction ID:", id);
    loadAuctionDetails();
    fetchUserDetails();
    fetchPreBids();
    fetchAllParticipants();
  }, [id]);

  useEffect(() => {
    if (isEditDecrementOpen && inputRef.current) {
      // Wait for modal render, then focus
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isEditDecrementOpen]);

  // Separate useEffect for live monitoring - runs when auction data is available
  useEffect(() => {
    if (!auction) return;

    // Set up real-time monitoring for live auction updates
    const liveMonitor = setInterval(() => {
      // Check if component is still mounted
      if (!isMountedRef.current) return;

      const now = new Date();

      // Check for status changes (upcoming -> live)
      if (auction.status === "upcoming") {
        const startTime = new Date(
          `${auction.auctionDate}T${auction.auctionStartTime}:00`
        );
        if (now >= startTime) {
          console.log(
            "[MyCreatedAuctionView] Auction start time reached, updating status"
          );
          loadAuctionDetails();
          return;
        }
      }

      // For live auctions, continuously update data without full refresh
      if (auction.status === "live" && liveUpdatesEnabled) {
        console.log("[MyCreatedAuctionView] Updating live auction data...");
        updateLiveAuctionData();
      }

      // Check for auction end time
      if (
        auction.status === "live" &&
        auction.auctionDate &&
        auction.auctionEndTime
      ) {
        const endTime = new Date(
          `${auction.auctionDate}T${auction.auctionEndTime}:00`
        );
        if (now >= endTime) {
          console.log(
            "[MyCreatedAuctionView] Auction end time reached, updating status"
          );
          loadAuctionDetails();
        }
      }
    }, 5000); // Update every 5 seconds to balance real-time feel with performance

    return () => clearInterval(liveMonitor);
  }, [auction?.id, auction?.status, liveUpdatesEnabled]); // Only respond to auction ID, status, or user preference changes

  // Cleanup effect
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchUserDetails = async () => {
    try {
      const token =
        localStorage.getItem("authToken") ||
        localStorage.getItem("token") ||
        localStorage.getItem("accessToken");
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.user) {
          setUserDetails(result.user);
          console.log(
            "[MyCreatedAuctionView] User details fetched:",
            result.user
          );
        }
      }
    } catch (error) {
      console.error(
        "[MyCreatedAuctionView] Failed to fetch user details:",
        error
      );
    }
  };

  // Update live auction data without full page refresh
  const updateLiveAuctionData = async () => {
    if (!id || !auction) return;

    setIsLiveUpdating(true);
    try {
      const token =
        localStorage.getItem("authToken") ||
        localStorage.getItem("token") ||
        localStorage.getItem("accessToken");
      if (!token) return;

      // Fetch updated auction data quietly
      const response = await fetch(`${API_BASE_URL}/auction/${id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.auction && isMountedRef.current) {
          // Only update the dynamic parts, preserve loading states
          setAuction((prevAuction) => ({
            ...prevAuction,
            ...data.auction,
            // Keep existing static data if new data doesn't include it
            title: data.auction.title || prevAuction?.title,
          }));

          console.log(
            "[MyCreatedAuctionView] Live data updated - Bids:",
            data.auction.statistics?.total_bids || 0
          );
          setLastUpdated(new Date());
        }
      }

      // Also update pre-bids and participants if they might have changed (but only if not already loading)
      if (!preBidsLoading) {
        const preBidsResponse = await fetch(
          `${API_BASE_URL}/auction/${id}/prebids`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (preBidsResponse.ok) {
          const preBidsResult = await preBidsResponse.json();
          if (
            preBidsResult.success &&
            preBidsResult.prebids &&
            isMountedRef.current
          ) {
            setPreBids(preBidsResult.prebids);
          }
        }
      }

      // Update participants data if not already loading
      if (!participantsLoading) {
        const participantsResponse = await fetch(
          `${API_BASE_URL}/auction/${id}/participants`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (participantsResponse.ok) {
          const participantsResult = await participantsResponse.json();
          if (
            participantsResult.success &&
            participantsResult.participants &&
            isMountedRef.current
          ) {
            setAllParticipants(participantsResult.participants);
          }
        }
      }
    } catch (error) {
      console.error("[MyCreatedAuctionView] Error updating live data:", error);
      // Don't show error to user for background updates
    } finally {
      setIsLiveUpdating(false);
    }
  };

  // Fetch all participants for this auction with complete information
  // Replace the fetchAllParticipants function with:
  const fetchAllParticipants = async () => {
    if (!id) return;
    setParticipantsLoading(true);
    try {
      const token =
        localStorage.getItem("authToken") ||
        localStorage.getItem("token") ||
        localStorage.getItem("accessToken");
      if (!token) return;

      const response = await fetch(
        `${API_BASE_URL}/auction/${id}/participants`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log("Participants API Response:", result); // Debug log

        if (
          result.success &&
          result.participants &&
          Array.isArray(result.participants)
        ) {
          setAllParticipants(result.participants);
        } else if (result.success && Array.isArray(result.data)) {
          // Handle different API response structure
          setAllParticipants(result.data);
        }
      } else {
        console.error("Failed to fetch participants:", response.status);
      }
    } catch (error) {
      console.error("Error fetching participants:", error);
    } finally {
      setParticipantsLoading(false);
    }
  };

  // Fetch pre-bids for this auction
  const fetchPreBids = async () => {
    if (!id) return;
    setPreBidsLoading(true);
    try {
      const token =
        localStorage.getItem("authToken") ||
        localStorage.getItem("token") ||
        localStorage.getItem("accessToken");
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/auction/${id}/prebids`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.prebids) {
          setPreBids(result.prebids);
          console.log(
            "[MyCreatedAuctionView] Pre-bids fetched:",
            result.prebids
          );
        }
      } else {
        console.warn(
          "[MyCreatedAuctionView] Failed to fetch pre-bids:",
          response.status
        );
      }
    } catch (error) {
      console.error("[MyCreatedAuctionView] Error fetching pre-bids:", error);
    } finally {
      setPreBidsLoading(false);
    }
  };

  // Handle pre-bid approval/rejection
  const handlePreBidAction = async (
    preBidId: string,
    action: "approve" | "reject"
  ) => {
    try {
      const token =
        localStorage.getItem("authToken") ||
        localStorage.getItem("token") ||
        localStorage.getItem("accessToken");
      if (!token) return;

      const response = await fetch(
        `${API_BASE_URL}/auction/prebid/${preBidId}/${action}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          toast.success(`Pre-bid ${action}d successfully`);
          fetchPreBids(); // Refresh the pre-bids list
          fetchAllParticipants(); // Refresh participants data
          // Also update live auction data to get latest statistics
          if (auction?.status === "live" || auction?.status === "upcoming") {
            updateLiveAuctionData();
          }
        } else {
          toast.error(result.message || `Failed to ${action} pre-bid`);
        }
      } else {
        toast.error(`Failed to ${action} pre-bid`);
      }
    } catch (error) {
      console.error(
        `[MyCreatedAuctionView] Error ${action}ing pre-bid:`,
        error
      );
      toast.error(`Failed to ${action} pre-bid`);
    }
  };

  const loadAuctionDetails = async () => {
    if (!id) {
      navigate("/dashboard/auctions");
      return;
    }
    setLoading(true);
    try {
      let auctionData: BaseAuction | null = null;

      // Try new auction details API first
      try {
        const AUCTION_API_BASE_URL = `${API_BASE_URL}/auction`;
        const token =
          localStorage.getItem("authToken") ||
          localStorage.getItem("token") ||
          localStorage.getItem("accessToken");

        const response = await fetch(`${API_BASE_URL}/auction/${id}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.auction) {
            const rawAuction = result.auction;

            // Map the new API response to BaseAuction format
            auctionData = {
              id: rawAuction.id.toString(),
              backendId: rawAuction.id.toString(),
              title: rawAuction.title,
              auctionNo: rawAuction.auction_no,
              auctionDate: rawAuction.auction_date, // live
              auctionStartTime: rawAuction.formatted_start_time, // live
              auctionEndTime: rawAuction.formatted_end_time, // live (may be null)
              duration: rawAuction.duration, // live
              currency: rawAuction.currency as "INR" | "USD", // live
              auctionDetails: rawAuction.description,
              openToAllCompanies: Boolean(rawAuction.open_to_all), // live (0/1 → false/true)
              preBidOfferAllowed: Boolean(rawAuction.pre_bid_allowed), // live (0/1 → false/true)
              decrementalValue: Number(rawAuction.decremental_value),
              startingPrice: Number(rawAuction.current_price),
              reservePrice: undefined,
              status: rawAuction.status as "upcoming" | "live" | "completed",
              participants:
                rawAuction.participants?.map((p: any) => p.phone_number) || [],
              documents:
                rawAuction.documents?.map((d: any) => ({
                  name: d.file_name,
                  url: d.file_url,
                  size: d.file_type,
                })) || [],
              createdBy: rawAuction.created_by.toString(),
              createdAt: rawAuction.created_at,
              updatedAt: rawAuction.updated_at,

              auctioneerCompany: rawAuction.creator_info?.company_name,
              auctioneerPhone: rawAuction.creator_info?.phone,
              auctioneerAddress: "",
            } as BaseAuction;

            // (auctionData as any).backend = { ...rawAuction, user: rawAuction.creator_info };

            // Store raw backend data for additional fields
            (auctionData as any).backend = {
              ...rawAuction,
              user: result.user,
              auctioneer: result.auctioneer || result.user,
              creator_info: result.user,
            };

            // Store auctioneer company details
            auctionData.auctioneerCompany =
              rawAuction.auctioneer_company_name || rawAuction.company_name;
            auctionData.auctioneerPhone =
              rawAuction.auctioneer_phone || rawAuction.phone_number;
            auctionData.auctioneerAddress =
              rawAuction.auctioneer_address || rawAuction.company_address;
            (auctionData as any).auctioneerEmail =
              rawAuction.auctioneer_email || rawAuction.email;
            (auctionData as any).auctioneerPerson =
              result.user?.person_name || rawAuction.person_name;

            if (result.user) {
              setUserDetails({
                company_name:
                  rawAuction.auctioneer_company_name ||
                  result.user.company_name,
                person_name: result.user.person_name,
                email: rawAuction.auctioneer_email || result.user.email,
                phone_number:
                  rawAuction.auctioneer_phone || result.user.phone_number,
                company_address:
                  rawAuction.auctioneer_address || result.user.company_address,
              });
            }

            console.log(
              "[MyCreatedAuctionView] New API fetch successful:",
              auctionData
            );
          }
        }
      } catch (newApiErr: any) {
        console.warn(
          "[MyCreatedAuctionView] New auction details API failed, trying legacy:",
          newApiErr
        );
      }

      // Fallback to legacy API if new API failed
      if (!auctionData) {
        try {
          auctionData = await apiAuctionService.fetchAuctionById(id);
          console.log(
            "[MyCreatedAuctionView] Legacy API fetch successful:",
            auctionData
          );
        } catch (apiErr: any) {
          console.warn(
            "Legacy API fetch failed, falling back to local storage:",
            apiErr
          );
          auctionData = AuctionService.getAuctionById(id);
        }
      }

      if (!auctionData) {
        toast.error("Auction not found");
        navigate("/dashboard/auctions");
        return;
      }

      setAuction(auctionData);

      /* 🔧 ADD-2  fix end-time only for upcoming auctions */
      if (auctionData && auctionData.status === "upcoming") {
        auctionData.auctionEndTime = addMinutesToTime(
          auctionData.auctionStartTime,
          auctionData.duration
        );
        console.log(
          "[MyCreatedAuctionView] Upcoming end-time corrected ->",
          auctionData.auctionEndTime
        );
      }

      const participantData = AuctionService.getParticipantsByAuction(id);
      setParticipants(participantData);
      const auctioneerData = AuctionService.getUserById(auctionData.createdBy);
      setAuctioneer(auctioneerData);

      // Refresh pre-bids when auction details are loaded
      fetchPreBids();
    } catch (error) {
      console.error("Error loading auction details:", error);
      toast.error("Failed to load auction details");
      navigate("/dashboard/auctions");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadDocument = (doc: { name: string; url: string }) => {
    if (!doc.url) {
      toast.error("Download link is missing");
      return;
    }

    // Create a temporary anchor element
    const link = document.createElement("a");
    link.href = doc.url;
    link.download = doc.name || "download"; // Force download with filename
    link.target = "_blank"; // Fallback for cross-origin
    link.rel = "noopener noreferrer";

    // Append to body (required for Firefox), click, then remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Downloading ${doc.name}...`);
  };

  const handleEditAuction = () => {
    if (auction?.status === "upcoming") {
      navigate(`/dashboard/edit-auction/${auction.id}`);
      toast.success("Redirecting to edit auction...");
    } else {
      toast.error("Only upcoming auctions can be edited");
    }
  };

  const handleStartAuction = () => {
    if (auction?.status === "upcoming") {
      navigate(`/dashboard/auctioneer-live/${auction.id}`);
      toast.success("Starting auction...");
    } else {
      toast.error("Auction cannot be started");
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateString;
    }
  };

  // Handle decrement value update
  const handleUpdateDecrement = async () => {
    if (!id || !auction) return;

    const num = Number(newDecrementValue);
    if (Number.isNaN(num) || num <= 0) {
      toast.error("Please enter a valid positive number");
      return;
    }

    setUpdatingDecrement(true);
    try {
      const resp = await apiDencrimentValue.updateAuctionDecrement(id, num);
      if (resp && resp.success) {
        toast.success("Decrement value updated");
        // refresh auction details
        await loadAuctionDetails();
        setIsEditDecrementOpen(false);
        setNewDecrementValue("");
      } else {
        toast.error(resp?.message || "Failed to update decrement");
      }
    } catch (err: any) {
      console.error("Update decrement error", err);
      toast.error(err?.message || "Failed to update decrement");
    } finally {
      setUpdatingDecrement(false);
    }
  };

  // Cancel decrement edit
  const handleCancelDecrementEdit = () => {
    setIsEditDecrementOpen(false);
    setNewDecrementValue("");
  };

  if (loading) {
    return (
      <div className="view-auction-container">
        <div className="auction-details-card">
          <div className="loading-spinner">
            <p>Loading auction details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="view-auction-container">
        <div className="auction-details-card">
          <div className="error-message">
            <XCircle className="w-5 h-5" />
            <div>
              <h3>Auction Not Found</h3>
              <p>The requested auction could not be found.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Helper: backend meta if present
  const backendMeta: any = (auction as any).backend;
  const backendParticipants =
    allParticipants.length > 0
      ? allParticipants
      : backendMeta?.participantsList || [];
  const bidHistory = backendMeta?.bidHistory || [];

  return (
    <div className="view-auction-container">
      {/* Header */}
      <div className="view-auction-header">
        <div>
          <h1 className="auction-title">
            {auction.title}: {auction.auctionNo}
          </h1>
          <p className="auction-subtitle">
            Manage your auction details and monitor participants
          </p>
        </div>
        <span className={`auction-status-badge status-${auction.status}`}>
          {auction.status.toUpperCase()}
        </span>
      </div>

      {/* Company Details */}
      <div className="auction-details-card">
        <h2 className="card-title">
          <BusinessIcon className="w-5 h-5" />
          Your Company Details
        </h2>
        <div className="auction-info-grid">
          <div className="info-item">
            <label className="info-label">Company Name</label>
            <div className="info-value">
              {userDetails?.company_name ||
                backendMeta?.user?.company_name ||
                backendMeta?.creator_info?.company_name ||
                auctioneer?.companyName ||
                auction.auctioneerCompany ||
                "Unknown Company"}
            </div>
          </div>
          <div className="info-item">
            <label className="info-label">Person Name</label>
            <div className="info-value">
              {userDetails?.person_name ||
                backendMeta?.user?.person_name ||
                backendMeta?.creator_info?.person_name ||
                auctioneer?.personName ||
                backendMeta?.auctioneerPerson ||
                "Unknown Person"}
            </div>
          </div>
          <div className="info-item">
            <label className="info-label">Mail Id</label>
            <div className="info-value">
              {userDetails?.email ||
                backendMeta?.user?.email ||
                backendMeta?.creator_info?.email ||
                auctioneer?.email ||
                auctioneer?.mailId ||
                backendMeta?.auctioneerEmail ||
                "Unknown Email"}
            </div>
          </div>
          <div className="info-item">
            <label className="info-label">Company Address</label>
            <div className="info-value">
              {userDetails?.company_address ||
                backendMeta?.user?.company_address ||
                backendMeta?.creator_info?.company_address ||
                auctioneer?.companyAddress ||
                backendMeta?.auctioneerAddress ||
                "Unknown Address"}
            </div>
          </div>
        </div>
      </div>

      {/* Auction Information */}
      <div className="auction-details-card">
        <h2 className="card-title">
          <Calendar className="w-5 h-5" />
          Auction Information
        </h2>
        <div className="auction-info-grid">
          <div className="info-item">
            <label className="info-label">Auction Date</label>
            <div className="info-value">
              {auction.rawAuctionDate
                ? formatDate(auction.rawAuctionDate)
                : formatDate(auction.auctionDate)}
            </div>
          </div>
          <div className="info-item">
            <label className="info-label">Start Time</label>
            <div className="info-value">{auction.auctionStartTime}</div>
          </div>
          <div className="info-item">
            <label className="info-label">End Time</label>
            <div className="info-value">{auction.auctionEndTime || "—"}</div>
          </div>
          <div className="info-item">
            <label className="info-label">Duration</label>
            <div className="info-value">{auction.duration} minutes</div>
          </div>
          <div className="info-item">
            <label className="info-label">Currency</label>
            <div className="info-value price">
              {auction.currency === "INR" ? "INR" : auction.currency}
            </div>
          </div>
          <div className="info-item">
            <label className="info-label">Open to All Companies</label>
            <div className="info-value">
              {auction.openToAllCompanies ? <span>Yes</span> : <span>No</span>}
            </div>
          </div>
          <div className="info-item">
            <label className="info-label">Pre-Bid Offer Allowed</label>
            <div className="info-value">
              {auction.preBidOfferAllowed ? <span>Yes</span> : <span>No</span>}
            </div>
          </div>
          {backendMeta?.basePrice !== undefined && (
            <div className="info-item">
              <label className="info-label">Base Price</label>
              <div className="info-value price">
                {auction.currency} {backendMeta.basePrice.toLocaleString()}
              </div>
            </div>
          )}
          {backendMeta?.currentPrice !== undefined && (
            <div className="info-item">
              <label className="info-label">Current Price</label>
              <div className="info-value price">
                {auction.currency} {backendMeta.currentPrice.toLocaleString()}
              </div>
            </div>
          )}
          {backendMeta?.statistics && (
            <>
              <div className="info-item">
                <label className="info-label">
                  Total Bids
                  {isLiveUpdating && <span className="live-indicator">🔄</span>}
                  {auction?.status === "live" &&
                    !isLiveUpdating &&
                    liveUpdatesEnabled && (
                      <span className="live-indicator">🟢</span>
                    )}
                  {auction?.status === "live" && !liveUpdatesEnabled && (
                    <span className="live-indicator">⏸️</span>
                  )}
                </label>
                <div className="info-value">
                  {backendMeta.statistics.total_bids || 0}
                  {lastUpdated && auction?.status === "live" && (
                    <small
                      style={{
                        fontSize: "0.7rem",
                        opacity: 0.7,
                        marginLeft: "0.5rem",
                      }}
                    >
                      Updated: {lastUpdated.toLocaleTimeString()}
                    </small>
                  )}
                </div>
              </div>
              <div className="info-item">
                <label className="info-label">Active Participants</label>
                <div className="info-value">
                  {backendMeta.statistics.active_participants || 0}
                </div>
              </div>
              {backendMeta.statistics.lowest_bid && (
                <div className="info-item">
                  <label className="info-label">Lowest Bid</label>
                  <div className="info-value price">
                    {auction.currency}{" "}
                    {Number(backendMeta.statistics.lowest_bid).toLocaleString()}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {auction.decrementalValue && (
          <div className="auction-description">
            <h4>Decremental Value</h4>
            <p>
              {auction.currency} {auction.decrementalValue.toLocaleString()}
              <span> (Minimum bid reduction amount)</span>
            </p>

            {/* Inline Edit Decrement Section */}
            {isEditDecrementOpen ? (
              <div className="edit-decrement-inline">
                <div className="decrement-input-group">
                  <label className="modal-label">
                    New Decrement Value ({auction?.currency || "₹"})
                  </label>
                  <input
                    type="number"
                    ref={inputRef}
                    className="prebuild-input"
                    value={String(newDecrementValue)}
                    onChange={(e) => setNewDecrementValue(e.target.value)}
                    disabled={updatingDecrement}
                    placeholder="Enter new decrement value"
                  />
                </div>
                <div className="decrement-action-buttons">
                  <button
                    className="btn btn-secondary  mt-2 mr-2"
                    onClick={handleCancelDecrementEdit}
                    disabled={updatingDecrement}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary mt-2"
                    onClick={handleUpdateDecrement}
                    disabled={updatingDecrement}
                  >
                    {updatingDecrement ? "Updating..." : "Save"}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ marginTop: 8 }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setNewDecrementValue(auction.decrementalValue || 0);
                    setIsEditDecrementOpen(true);
                  }}
                >
                  <Edit className="w-4 h-4" /> Edit Decrement
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Auction Details/Description */}
      <div className="auction-details-card">
        <h2 className="card-title">
          <FileText className="w-5 h-5" />
          Auction Details / Description
        </h2>
        <div className="auction-description">
          <p>{auction.auctionDetails}</p>
        </div>
      </div>

      {/* Auction Documents */}
      {auction.documents.length > 0 && (
        <div className="auction-details-card">
          <h2 className="card-title">
            <FileText className="w-5 h-5" />
            Auction Documents
          </h2>
          <div className="participants-list">
            {auction.documents.map((doc, index) => (
              <div key={index} className="participant-item">
                <div
                  className="participant-info"
                  style={{ flex: 1, minWidth: 0 }}
                >
                  <FileText className="w-5 h-5" style={{ flexShrink: 0 }} />
                  <div
                    className="participant-details"
                    style={{ minWidth: 0, overflow: "hidden" }}
                  >
                    <h4
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "wrap",
                        maxWidth: "100%",
                      }}
                    >
                      {doc.name}
                    </h4>
                    <p>{doc.size}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDownloadDocument(doc)}
                  className="btn btn-secondary"
                  style={{ flexShrink: 0, marginLeft: "1rem" }}
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pre-bid Management Section */}
      <div className="auction-details-card">
        <h2 className="card-title">
          <Gavel className="w-5 h-5" />
          Pre-bid Management
          <span className="participants-count">({preBids.length})</span>
        </h2>
        {preBidsLoading ? (
          <div className="loading-spinner">
            <p>Loading pre-bids...</p>
          </div>
        ) : preBids.length > 0 ? (
          <div className="participants-list">
            {preBids.map((preBid: any, index: number) => (
              <div
                key={preBid.id || index}
                className="participant-item prebid-item"
              >
                <div className="participant-info">
                  <div className="participant-avatar">
                    {(preBid.person_name || preBid.company_name || "B")
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                  <div className="participant-details">
                    <h4>
                      {preBid.person_name || preBid.company_name || "Bidder"}
                    </h4>
                    <p>{preBid.company_name || preBid.phone_number || "N/A"}</p>
                    <p className="prebid-amount">
                      <IndianRupee className="w-4 h-4" />
                      {auction?.currency}{" "}
                      {Number(
                        preBid.amount || preBid.bid_amount
                      ).toLocaleString()}
                    </p>
                    <p className="prebid-time">
                      {preBid.created_at || preBid.bid_time
                        ? new Date(
                            preBid.created_at || preBid.bid_time
                          ).toLocaleString()
                        : "Unknown time"}
                    </p>
                  </div>
                </div>
                <div className="prebid-actions">
                  {(!preBid.status || preBid.status === "pending") && (
                    <div className="prebid-action-buttons">
                      <button
                        type="button"
                        onClick={() => handlePreBidAction(preBid.id, "reject")}
                        className="btn btn-secondary btn-sm"
                        title="Reject pre-bid"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="join-form">
            <Gavel className="w-12 h-12" />
            <h3>No Pre-bids Yet</h3>
            <p>No pre-bids have been submitted for this auction yet</p>
          </div>
        )}
      </div>

      {/* Registered Participants */}
      <div className="participants-section">
        <div className="participants-header">
          <h2 className="card-title">
            <Users className="w-5 h-5" />
            Registered Participants
          </h2>
          <button
            type="button"
            onClick={fetchAllParticipants}
            className="btn btn-secondary btn-sm"
            title="Refresh participants data"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {backendParticipants.length > 0 ? (
          <div className="participants-list">
            {backendParticipants
              .filter((p: any) =>
                ["invited", "joined"].includes(p.status || "invited")
              )
              .map((participant: any, index: number) => (
                <div key={participant.id || index} className="participant-item">
                  <div className="participant-info">
                    <div className="participant-avatar">
                      {(
                        participant.person_name ||
                        participant.phone_number ||
                        "?"
                      )
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                    <div className="participant-details">
                      <h4>{participant.person_name || "N/A"}</h4>
                      <p className="participant-company">
                        {participant.company_name
                          ? `${participant.company_name} • `
                          : ""}
                        {participant.phone_number}
                      </p>
                      {participant.user_id && (
                        <p className="participant-id">
                          User ID: {participant.user_id}
                        </p>
                      )}
                      <div className="participant-timestamps">
                        {participant.invited_at && (
                          <span className="timestamp">
                            📧 Invited:{" "}
                            {new Date(
                              participant.invited_at
                            ).toLocaleDateString()}
                          </span>
                        )}
                        {participant.joined_at && (
                          <span className="timestamp">
                            ✅ Joined:{" "}
                            {new Date(
                              participant.joined_at
                            ).toLocaleDateString()}{" "}
                            {new Date(
                              participant.joined_at
                            ).toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="participant-actions">
                    <div
                      className={`participant-status status-${
                        participant.status || "invited"
                      }`}
                    >
                      {participant.status || "invited"}
                    </div>
                    {participant.status === "joined" && (
                      <div className="participant-badge status-active">
                        Active
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        ) : participants.length === 0 ? (
          <div className="join-form">
            <Users className="w-12 h-12" />
            <h3>No Participants Yet</h3>
            <p>No participants registered for this auction yet</p>
          </div>
        ) : (
          <div className="participants-list">
            {participants.map((participant, index) => (
              <div key={index} className="participant-item">
                <div className="participant-info">
                  <div className="participant-avatar">
                    {participant.personName.charAt(0).toUpperCase()}
                  </div>
                  <div className="participant-details">
                    <h4>{participant.personName}</h4>
                    <p>{participant.companyName}</p>
                  </div>
                </div>
                <div className="participant-status status-active">Active</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bid History (Backend) */}
      {bidHistory.length > 0 && (
        <div className="auction-details-card">
          <h2 className="card-title">
            <Clock className="w-5 h-5" />
            Bid History
          </h2>
          <div className="participants-list">
            {bidHistory
              .slice()
              .sort(
                (a: any, b: any) =>
                  new Date(b.bid_time).getTime() -
                  new Date(a.bid_time).getTime()
              )
              .map((b: any) => (
                <div key={b.id} className="participant-item">
                  <div className="participant-info">
                    <div className="participant-avatar">
                      {(b.person_name || "B").charAt(0)}
                    </div>
                    <div className="participant-details">
                      <h4>{b.company_name || b.person_name || "Bidder"}</h4>
                      <p>{new Date(b.bid_time).toLocaleString()}</p>
                    </div>
                  </div>
                  <div
                    className={`participant-status ${
                      b.is_winning ? "status-active" : ""
                    }`}
                  >
                    {b.amount}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="auction-details-card">
        <div className="flex flex-wrap items-center justify-center gap-4 p-4 md:p-6">
          <button
            onClick={() => navigate("/dashboard/MyCreatedA")}
            className="btn btn-secondary"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Auctions
          </button>
          {/* Delete Auction Button */}
          <button
            onClick={() => setShowDeleteModal(true)}
            disabled={!canDeleteAuction()}
            className={`btn ${
              canDeleteAuction() ? "btn-danger" : "btn-disabled"
            }`}
            title={
              canDeleteAuction()
                ? "Delete this auction"
                : "Only upcoming auctions can be deleted"
            }
          >
            <XCircle className="w-4 h-4" />
            {getDeleteButtonText()}
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && auction && (
        <div
          className="prebuild-modal-overlay"
          onClick={() => !deleteLoading && setShowDeleteModal(false)}
        >
          <div
            className="prebuild-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "500px" }}
          >
            <div className="prebuild-modal-header">
              <XCircle className="w-6 h-6 text-red-500" />
              <h3 className="prebuild-modal-title">Delete Auction</h3>
            </div>

            <div className="prebuild-modal-content">
              <div className="delete-warning">
                <p className="warning-text">
                  <strong>Warning: This action cannot be undone!</strong>
                </p>
                <p className="auction-to-delete">
                  <strong>"{auction.title}"</strong> (ID: {auction.auctionNo})
                </p>

                <div className="delete-consequences">
                  <h4>This will permanently delete:</h4>
                  <ul>
                    <li>All auction data and settings</li>
                  </ul>
                </div>

                <div className="confirmation-input">
                  <label htmlFor="deleteConfirm" className="modal-label">
                    Type <strong>DELETE</strong> to confirm:
                  </label>
                  <input
                    id="deleteConfirm"
                    type="text"
                    className="prebuild-input"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="Type DELETE to confirm"
                    disabled={deleteLoading}
                    autoComplete="off"
                  />
                </div>
              </div>
            </div>

            <div className="prebuild-modal-actions">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText("");
                }}
                className="btn btn-secondary"
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAuction}
                disabled={deleteLoading || deleteConfirmText !== "DELETE"}
                className="btn btn-danger"
              >
                {deleteLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    Delete Auction Permanently
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyCreatedAuctionView;