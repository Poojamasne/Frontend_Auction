



import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./ParticipantAuctionView.css";
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
import { format, parse, isValid } from 'date-fns';
import AuctionService from "../../../services/auctionService";
import apiAuctionService from "../../../services/apiAuctionService";
import newAuctionService from "../../../services/newAuctionService";
import { BaseAuction, AuctionParticipant } from "../../../types/auction";

// Utility to format time string (HH:mm or HH:mm:ss) to readable format
const formatTime = (timeStr: string | undefined) => {
  if (!timeStr) return "N/A";
  
  // Handle different time formats
  try {
    // Try parsing as HH:mm:ss
    let parsed = parse(timeStr, "HH:mm:ss", new Date());
    if (!isValid(parsed)) {
      // Try parsing as HH:mm
      parsed = parse(timeStr, "HH:mm", new Date());
    }
    if (!isValid(parsed)) {
      // Try extracting time from ISO string or full datetime
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
  
  // Fallback: return original string or clean it up
  return timeStr.replace(/:\d{2}$/, ''); // Remove seconds if present
};

// Utility to format duration properly
const formatDuration = (duration: number | undefined) => {
  if (!duration || duration === 0) return "N/A";
  
  // If duration is in seconds, convert to minutes
  const minutes = duration > 1440 ? Math.floor(duration / 60) : duration;
  
  if (minutes < 60) {
    return `${minutes} minutes`;
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours} hours`;
  }
};

const ParticipantAuctionView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [auction, setAuction] = useState<BaseAuction | null>(null);
  const [participants, setParticipants] = useState<AuctionParticipant[]>([]);
  const [auctioneer, setAuctioneer] = useState<any>(null);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isParticipant, setIsParticipant] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);

  // Pre-bid functionality states
  const [showPreBuildModal, setShowPreBuildModal] = useState(false);
  const [preBuildInput, setPreBuildInput] = useState("");
  const [preBuildError, setPreBuildError] = useState<string | null>(null);
  const [preBuildLoading, setPreBuildLoading] = useState(false);
  const [existingPreBid, setExistingPreBid] = useState<any>(null);
  const [hasPreBid, setHasPreBid] = useState(false);

  // Live bidding states
  const [showLiveBidModal, setShowLiveBidModal] = useState(false);
  const [liveBidInput, setLiveBidInput] = useState("");
  const [liveBidError, setLiveBidError] = useState<string | null>(null);
  const [liveBidLoading, setLiveBidLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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
      fetchUserDetails();
    }
  }, [id]);

  // Load user's existing pre-bid when auction loads
  useEffect(() => {
    if (auction && user) {
      loadUserPreBid();
    }
  }, [auction?.id, user?.id]);

  // Removed automatic refresh intervals to prevent constant page refreshing
  // Manual refresh is available via the refresh button in the UI

  useEffect(() => {
    // Check if current user is already a participant
    if (auction && user) {
      const isUserParticipant =
        participants.some((p) => p.userId === user.id) ||
        auction.participants.some((p) => p === user.phoneNumber);
      setIsParticipant(isUserParticipant);
    }
  }, [auction, participants, user]);

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
            "[ParticipantAuctionView] User details fetched:",
            result.user
          );
        }
      }
    } catch (error) {
      console.error(
        "[ParticipantAuctionView] Failed to fetch user details:",
        error
      );
    }
  };

  const loadUserPreBid = async () => {
    if (!auction || !user) return;

    try {
      const backendId = (auction as any).backendId || auction.id;
      const numId = Number(backendId);

      if (!isNaN(numId)) {
        const result = await newAuctionService.getMyPreBid(numId);
        if (result.success) {
          setHasPreBid(result.hasPrebid);
          setExistingPreBid(result.prebid);
          console.log("[ParticipantAuctionView] User pre-bid loaded:", result);
        }
      }
    } catch (error) {
      console.warn(
        "[ParticipantAuctionView] Failed to load user pre-bid:",
        error
      );
    }
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
      let auctionData: BaseAuction | null = null;

      // Try new auction details API first
      try {
        const token =
          localStorage.getItem("authToken") ||
          localStorage.getItem("token") ||
          localStorage.getItem("accessToken");

        if (!token) {
          throw new Error("No authentication token found");
        }

        // Try multiple API endpoints for auction details
        let response = await fetch(`${API_BASE_URL}/auctions/${id}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        // If first endpoint fails, try alternative endpoint
        if (!response.ok) {
          response = await fetch(`${API_BASE_URL}/${id}`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });
        }

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.auction) {
            const rawAuction = result.auction;
            console.log("[ParticipantAuctionView] Raw auction data from API:", rawAuction);
            console.log("[ParticipantAuctionView] Available user/auctioneer data:", {
              user: result.user,
              auctioneer: result.auctioneer,
              creator: result.creator
            });

            // Map the new API response to BaseAuction format with robust handling
            auctionData = {
              id: rawAuction.id?.toString() || id,
              backendId: rawAuction.id?.toString(),
              title: rawAuction.title || rawAuction.auction_title || "Untitled Auction",
              auctionNo: rawAuction.auction_no || rawAuction.auction_number || `AUC-${rawAuction.id || id}`,
              auctionDate: rawAuction.auction_date || rawAuction.date || "",
              auctionStartTime: rawAuction.formatted_start_time || 
                                rawAuction.start_time || 
                                rawAuction.auction_start_time || 
                                rawAuction.startTime || "", 
              auctionEndTime: rawAuction.formatted_end_time || 
                              rawAuction.end_time || 
                              rawAuction.auction_end_time || 
                              rawAuction.endTime || "",
              duration: parseInt(rawAuction.duration) || parseInt(rawAuction.auction_duration) || 0,
              currency: (rawAuction.currency as "INR" | "USD") || "INR",
              auctionDetails: rawAuction.description || rawAuction.auction_description || rawAuction.details || "No description available",
              openToAllCompanies: rawAuction.open_to_all === 1 || rawAuction.openToAllCompanies !== false,
              preBidOfferAllowed: rawAuction.pre_bid_allowed === 1 || rawAuction.pre_bid_allowed === true,
              decrementalValue: parseFloat(rawAuction.decremental_value || rawAuction.decremental || rawAuction.decrement_value) || 0,
              startingPrice: parseFloat(rawAuction.current_price || rawAuction.starting_price || rawAuction.start_price) || 0,
              reservePrice: rawAuction.reserve_price ? parseFloat(rawAuction.reserve_price) : undefined,
              status: (rawAuction.status as "upcoming" | "live" | "completed") || "upcoming",
              participants: Array.isArray(rawAuction.participants) 
                ? rawAuction.participants.map((p: any) => p.phone_number || p.user_id?.toString() || p.phoneNumber || p.userId?.toString())
                : [],
              documents: Array.isArray(rawAuction.documents) ? rawAuction.documents : [],
              createdBy: rawAuction.created_by?.toString() || rawAuction.createdBy?.toString() || "",
              createdAt: rawAuction.created_at || rawAuction.createdAt || "",
              updatedAt: rawAuction.updated_at || rawAuction.updatedAt || "",
            } as BaseAuction;

            // Store raw backend data for additional fields
            (auctionData as any).backend = {
              ...rawAuction,
              user: result.user,
              auctioneer: result.auctioneer || result.user,
              creator_info: result.user,
              bids: rawAuction.bids || [],
            };

            // Enhanced auctioneer details mapping with multiple fallbacks
            const auctioneerInfo = result.user || result.auctioneer || result.creator || {};
            
            // First check for the correct backend fields: creator_company and creator_name
            auctionData.auctioneerCompany =
              rawAuction.creator_company || 
              auctioneerInfo.creator_company ||
              rawAuction.auctioneer_company_name || 
              rawAuction.company_name || 
              auctioneerInfo.company_name ||
              auctioneerInfo.companyName ||
              null; // Use null instead of placeholder text
              
            auctionData.auctioneerPhone =
              rawAuction.auctioneer_phone || 
              rawAuction.phone_number || 
              auctioneerInfo.phone_number ||
              auctioneerInfo.phoneNumber ||
              auctioneerInfo.phone ||
              null;
              
            auctionData.auctioneerAddress =
              rawAuction.auctioneer_address || 
              rawAuction.company_address || 
              auctioneerInfo.company_address ||
              auctioneerInfo.address ||
              null;
              
            (auctionData as any).auctioneerEmail =
              rawAuction.auctioneer_email || 
              rawAuction.email || 
              auctioneerInfo.email ||
              auctioneerInfo.emailAddress ||
              null;
              
            (auctionData as any).auctioneerPerson =
              rawAuction.creator_name ||
              auctioneerInfo.creator_name ||
              result.user?.person_name || 
              rawAuction.person_name ||
              auctioneerInfo.person_name ||
              auctioneerInfo.personName ||
              auctioneerInfo.name ||
              auctioneerInfo.full_name ||
              null;

            console.log("[ParticipantAuctionView] Raw backend fields:", {
              creator_company: rawAuction.creator_company,
              creator_name: rawAuction.creator_name,
              company_name: rawAuction.company_name,
              person_name: rawAuction.person_name,
              userInfo: auctioneerInfo
            });
            
            console.log("[ParticipantAuctionView] Auctioneer details mapped:", {
              company: auctionData.auctioneerCompany,
              person: (auctionData as any).auctioneerPerson,
              email: (auctionData as any).auctioneerEmail,
              phone: auctionData.auctioneerPhone,
              address: auctionData.auctioneerAddress
            });

            // Store comprehensive user details for auctioneer information
            if (result.user || result.auctioneer || result.creator) {
              const userInfo = result.user || result.auctioneer || result.creator || {};
              setUserDetails({
                company_name: auctionData.auctioneerCompany,
                person_name: (auctionData as any).auctioneerPerson,
                email: (auctionData as any).auctioneerEmail,
                phone_number: auctionData.auctioneerPhone,
                company_address: auctionData.auctioneerAddress,
                // Additional fields that might be useful
                user_id: userInfo.id || userInfo.user_id || rawAuction.created_by,
                designation: userInfo.designation || "Auctioneer",
                role: userInfo.role || "Auction Creator"
              });
              
              console.log("[ParticipantAuctionView] User details set:", {
                company_name: auctionData.auctioneerCompany,
                person_name: (auctionData as any).auctioneerPerson,
                email: (auctionData as any).auctioneerEmail,
                phone_number: auctionData.auctioneerPhone
              });
            }

            console.log(
              "[ParticipantAuctionView] New API fetch successful:",
              auctionData
            );
          }
        } else if (response.status === 403) {
          console.log(
            "[ParticipantAuctionView] Direct API returned 403 (expected for participants), using fallback"
          );
        }
      } catch (newApiErr: any) {
        if (
          !newApiErr?.message?.includes("403") &&
          !newApiErr?.message?.includes("Forbidden")
        ) {
          console.warn(
            "[ParticipantAuctionView] New auction details API failed, trying legacy:",
            newApiErr
          );
        } else {
          console.log(
            "[ParticipantAuctionView] Direct API access denied (expected for participants), using fallback"
          );
        }
      }

      // Fallback to legacy API if new API failed
      if (!auctionData) {
        try {
          auctionData = await apiAuctionService.fetchAuctionById(id);
          console.log(
            "[ParticipantAuctionView] Legacy API fetch successful:",
            auctionData
          );
        } catch (apiErr: any) {
          if (
            !apiErr?.message?.includes("403") &&
            !apiErr?.message?.includes("Forbidden")
          ) {
            console.warn(
              "Legacy API fetch failed, falling back to local storage:",
              apiErr
            );
          } else {
            console.log(
              "[ParticipantAuctionView] API access denied, trying local storage fallback"
            );
          }
          auctionData = AuctionService.getAuctionById(id);
        }
      }

      if (!auctionData) {
        console.error("[ParticipantAuctionView] No auction data found for ID:", id);
        toast.error("Auction not found or access denied");
        navigate("/dashboard/auctions");
        return;
      }

        // Only update state if component is still mounted
        if (isMountedRef.current) {
          setAuction(auctionData);        // Load participants data
        try {
          const participantData = AuctionService.getParticipantsByAuction(id);
          setParticipants(participantData);
        } catch (participantError) {
          console.warn("[ParticipantAuctionView] Failed to load participants:", participantError);
          setParticipants([]);
        }

        // Load auctioneer data if available - try multiple sources
        if (auctionData.createdBy) {
          try {
            // First try local service
            let auctioneerData = AuctionService.getUserById(auctionData.createdBy);
            
            // If no data from local service, try fetching from API
            if (!auctioneerData || !(auctioneerData as any).name) {
              try {
                const token = localStorage.getItem("authToken") || 
                            localStorage.getItem("token") || 
                            localStorage.getItem("accessToken");
                            
                if (token) {
                  const userResponse = await fetch(`${API_BASE_URL}/users/${auctionData.createdBy}`, {
                    method: "GET",
                    headers: {
                      Authorization: `Bearer ${token}`,
                      "Content-Type": "application/json",
                    },
                  });
                  
                  if (userResponse.ok) {
                    const userResult = await userResponse.json();
                    if (userResult.success && userResult.user) {
                      auctioneerData = {
                        id: userResult.user.id,
                        email: userResult.user.email,
                        phoneNumber: userResult.user.phone_number || (userResult.user as any).phoneNumber,
                        companyName: userResult.user.company_name || (userResult.user as any).companyName,
                        companyAddress: userResult.user.company_address || (userResult.user as any).companyAddress
                      } as any;
                      
                      // Add name property
                      (auctioneerData as any).name = (userResult.user as any).person_name || 
                                                     (userResult.user as any).name || 
                                                     "Unknown User";
                      
                      console.log("[ParticipantAuctionView] Fetched auctioneer from API:", auctioneerData);
                    }
                  }
                }
              } catch (apiError) {
                console.warn("[ParticipantAuctionView] Failed to fetch auctioneer from API:", apiError);
              }
            }
            
            setAuctioneer(auctioneerData);
          } catch (auctioneerError) {
            console.warn("[ParticipantAuctionView] Failed to load auctioneer:", auctioneerError);
            setAuctioneer(null);
          }
        }
      }
    } catch (error) {
      console.error("[ParticipantAuctionView] Error loading auction details:", error);
      if (isMountedRef.current) {
        toast.error("Failed to load auction details. Please try refreshing the page.");
        // Don't navigate away on error, let user try again
        setLoading(false);
      }
      return;
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  const handleDownloadDocument = (doc: { name: string; url: string }) => {
    toast.success(`Downloading ${doc.name}`);
    console.log(`Download: ${doc.name} from ${doc.url}`);
  };

  // const handleJoinAuction = async () => {
  //   if (!auction || !user) return;
  //   setJoinLoading(true);
  //   try {
  //     // Try backend join first (new API). Fallback to local join.
  //     const backendId = (auction as any).backendId || auction.id;
  //     const numId = Number(backendId);
  //     let didJoinBackend = false;
  //     if (!isNaN(numId) && user.phoneNumber) {
  //       try {
  //         const res = await newAuctionService.joinAuction({
  //           auction_id: numId,
  //           phone_number: user.phoneNumber,
  //         });
  //         console.log('[ParticipantAuctionView] joinAuction (new API) result:', res);
  //         didJoinBackend = !!res?.success;
  //       } catch (err) {
  //         console.warn('[ParticipantAuctionView] joinAuction (new API) failed, will fallback', err);
  //       }
  //     }
  //     if (!didJoinBackend) {
  //       const participantData: AuctionParticipant = {
  //         id: `${Date.now()}`,
  //         auctionId: auction.id,
  //         userId: user.id,
  //         userName: user.name || "Unknown Person",
  //         userPhone: user.phoneNumber || "",
  //         phoneNumber: user.phoneNumber || "",
  //         companyName: user.companyName || "Unknown Company",
  //         companyAddress: (user as any).companyAddress || "",
  //         personName: user.name || "Unknown Person",
  //         mailId: user.email || "",
  //         bidAmount: 0,
  //         lastBidTime: "",
  //         joinedAt: new Date().toISOString(),
  //         status: 'approved' as const
  //       };

  //       // Store locally (no need to use AuctionService.addParticipant)
  //       setParticipants((prev) => [...prev, participantData]);
  //     }

  //     setIsParticipant(true);

  //     // Refresh auction data to get updated participants
  //     loadAuctionDetails();

  //     toast.success("Successfully joined the auction!");
  //   } catch (error) {
  //     console.error("Error joining auction:", error);
  //     toast.error("Failed to join auction");
  //   } finally {
  //     setJoinLoading(false);
  //   }
  // };

  // Enhanced Pre-Build modal logic with proper validation

  // ...existing code...

  
  const handleJoinAuction = async () => {
    if (!auction || !user) return;
    setJoinLoading(true);
    try {
      const backendId = (auction as any).backendId || auction.id;
      const numId = Number(backendId);
      let didJoinBackend = false;
      let backendErrorMsg = "";
      if (!isNaN(numId) && user.phoneNumber) {
        try {
          const res = await newAuctionService.joinAuction({
            auction_id: numId,
            phone_number: user.phoneNumber,
          });
          console.log(
            "[ParticipantAuctionView] joinAuction (new API) result:",
            res
          );
          didJoinBackend = !!res?.success;
          if (!didJoinBackend && res?.message) {
            backendErrorMsg = res.message;
          }
        } catch (err: any) {
          backendErrorMsg = err?.message || "Failed to join auction";
          console.warn(
            "[ParticipantAuctionView] joinAuction (new API) failed, will fallback",
            err
          );
        }
      }
      if (!didJoinBackend) {
        // Show error and do NOT add participant locally
        toast.error(
          backendErrorMsg === "Route not found"
            ? "Unable to join: Auction route not found. Please contact support."
            : backendErrorMsg || "Failed to join auction"
        );
        setJoinLoading(false);
        return;
      }

      setIsParticipant(true);
      toast.success("Successfully joined the auction! Click refresh to see updated data.");
    } catch (error) {
      console.error("Error joining auction:", error);
      toast.error("Failed to join auction");
    } finally {
      setJoinLoading(false);
    }
  };
  // ...existing code...

  const handleSavePreBuild = async () => {
    if (!auction) return;
    setPreBuildError(null);

    const val = Number(preBuildInput);

    if (isNaN(val) || val <= 0) {
      setPreBuildError("Please enter a valid positive number");
      return;
    }

    // Allow pre-bid when auction is upcoming or live
    const isPreBidWindowOpen =
      auction.status === "upcoming" || auction.status === "live";
    if (!isPreBidWindowOpen) {
      setPreBuildError(
        "Pre-bid is allowed only when auction is upcoming or live"
      );
      return;
    }

    // Enhanced validation logic: "current lowest bid - decremental value"
    const startingPrice = auction?.startingPrice || 0;
    const decrementalValue = auction?.decrementalValue || 0;

    // Get current lowest bid from backend data (if any bids exist) or starting price
    const backendData = (auction as any)?.backend;
    const existingBids = backendData?.bids || [];

    // Filter for active/approved bids only
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
              parseFloat(bid.amount || startingPrice)
            )
          )
        : startingPrice;

    // Calculate minimum allowed bid: currentLowestBid - decrementalValue
    const minAllowedBid = currentLowestBid - decrementalValue;

    // Validation 1: bid must be lower than current lowest bid
    if (val >= currentLowestBid) {
      setPreBuildError(
        `Your bid (${
          auction?.currency
        } ${val.toLocaleString()}) must be lower than the current lowest bid (${
          auction?.currency
        } ${currentLowestBid.toLocaleString()})`
      );
      return;
    }

    // Validation 2: bid cannot be lower than minimum allowed (currentLowest - decremental)
    if (val < minAllowedBid) {
      setPreBuildError(
        `Your bid (${
          auction?.currency
        } ${val.toLocaleString()}) is too low. Minimum allowed bid is ${
          auction?.currency
        } ${minAllowedBid.toLocaleString()}.\n\nLogic: Current lowest (${
          auction?.currency
        } ${currentLowestBid.toLocaleString()}) - Decremental value (${
          auction?.currency
        } ${decrementalValue.toLocaleString()}) = ${
          auction?.currency
        } ${minAllowedBid.toLocaleString()}`
      );
      return;
    }

    // Validation 3: bid should not be negative
    if (val < 0) {
      setPreBuildError("Bid amount cannot be negative");
      return;
    }

    setPreBuildLoading(true);
    try {
      // Try submitting pre-bid to backend
      const backendId = (auction as any).backendId || auction.id;
      const numId = Number(backendId);
      let didSubmitBackend = false;

      if (!isNaN(numId) && user?.phoneNumber) {
        try {
          const result = await newAuctionService.submitPreBid({
            auction_id: numId,
            phone_number: user.phoneNumber,
            amount: val,
          });

          if (result.success) {
            didSubmitBackend = true;
            console.log(
              "[ParticipantAuctionView] Pre-bid submitted to backend:",
              result
            );
          } else {
            // Show backend validation errors
            if (result.message) {
              setPreBuildError(result.message);
              setPreBuildLoading(false);
              return;
            }
          }
        } catch (err: any) {
          console.warn("[ParticipantAuctionView] Backend pre-bid failed:", err);
          // Show error from service
          if (err.message) {
            setPreBuildError(err.message);
            setPreBuildLoading(false);
            return;
          }
        }
      }

      // Fallback to local storage if backend failed
      if (!didSubmitBackend) {
        const preBidData = {
          id: `${Date.now()}`,
          participantId: user?.id || "",
          amount: val,
          submittedAt: new Date().toISOString(),
          status: "pending",
        };

        // Store locally (you can implement local storage logic if needed)
        console.log(
          "[ParticipantAuctionView] Pre-bid stored locally:",
          preBidData
        );
      }

      toast.success("Pre-bid submitted successfully!");
      setShowPreBuildModal(false);
      setPreBuildInput("");

      // Refresh user's pre-bid data
      loadUserPreBid();
    } catch (error) {
      console.error("Error submitting pre-bid:", error);
      toast.error("Failed to submit pre-bid");
    } finally {
      setPreBuildLoading(false);
    }
  };

  const formatCurrency = (amount: number | undefined, currency: string) => {
    return `${currency} ${amount?.toLocaleString() || 0}`;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      upcoming: { color: "bg-blue-500", text: "Upcoming", icon: Clock },
      live: { color: "bg-green-500", text: "Live", icon: Play },
      completed: { color: "bg-gray-500", text: "Completed", icon: CheckCircle },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] ||
      statusConfig.upcoming;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-white text-sm font-medium ${config.color}`}
      >
        <Icon className="w-4 h-4" />
        {config.text}
      </span>
    );
  };

  const canJoinSession = () => {
    return auction?.status === "live";
  };

  const handleJoinSession = () => {
    if (!canJoinSession()) return;
    navigate(`/dashboard/auctions/${id}/session`);
  };

  // Live bidding handler
  const handleLiveBid = async () => {
    if (!auction || !user) return;
    setLiveBidError(null);

    const bidAmount = Number(liveBidInput);

    if (isNaN(bidAmount) || bidAmount <= 0) {
      setLiveBidError("Please enter a valid positive number");
      return;
    }

    // Validate bid using the same logic as pre-bid
    const startingPrice = auction?.startingPrice || 0;
    const decrementalValue = auction?.decrementalValue || 0;

    const backendData = (auction as any)?.backend;
    const existingBids = backendData?.bids || [];

    // Filter for active/approved bids only
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
              parseFloat(bid.amount || startingPrice)
            )
          )
        : startingPrice;

    const minAllowedBid = currentLowestBid - decrementalValue;

    // Validation 1: bid must be lower than current lowest bid
    if (bidAmount >= currentLowestBid) {
      setLiveBidError(
        `Your bid (${
          auction?.currency
        } ${bidAmount.toLocaleString()}) must be lower than the current lowest bid (${
          auction?.currency
        } ${currentLowestBid.toLocaleString()})`
      );
      return;
    }

    // Validation 2: bid cannot be lower than minimum allowed
    if (bidAmount < minAllowedBid) {
      setLiveBidError(
        `Your bid (${
          auction?.currency
        } ${bidAmount.toLocaleString()}) is too low. Minimum allowed bid is ${
          auction?.currency
        } ${minAllowedBid.toLocaleString()}`
      );
      return;
    }

    setLiveBidLoading(true);
    try {
      const backendId = (auction as any).backendId || auction.id;
      const numId = Number(backendId);

      if (!isNaN(numId)) {
        try {
          const result = await newAuctionService.placeBid({
            auction_id: numId,
            amount: bidAmount,
          });

          if (result.success) {
            toast.success("Bid placed successfully!");
            setShowLiveBidModal(false);
            setLiveBidInput("");

            // Bid placed successfully - user can manually refresh to see updates
          } else {
            setLiveBidError(result.message || "Failed to place bid");
          }
        } catch (err: any) {
          console.error("[ParticipantAuctionView] Live bid failed:", err);
          setLiveBidError(err.message || "Failed to place bid");
        }
      }
    } catch (error) {
      console.error("Error placing live bid:", error);
      setLiveBidError("Failed to place bid");
    } finally {
      setLiveBidLoading(false);
    }
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

  return (
    <div className="view-auction-container">
      <div className="view-auction-header">
        <div>
          <h1 className="auction-title">{auction.title}</h1>
          <p className="auction-subtitle">#{auction.auctionNo}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => {
              console.log("[ParticipantAuctionView] Manual refresh triggered");
              loadAuctionDetails(true);
            }}
            className="btn btn-secondary"
            disabled={refreshing}
            style={{ 
              padding: '0.5rem',
              minWidth: 'auto',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              opacity: refreshing ? 0.6 : 1,
              cursor: refreshing ? 'not-allowed' : 'pointer'
            }}
            title="Refresh auction data"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
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
              {auction.auctionDate ? format(new Date(auction.auctionDate), "dd MMM yyyy") : "Date not specified"}
            </div>
          </div>

          <div className="info-item">
            <span className="info-label">Start Time</span>
            <div className="info-value">
              <Clock className="w-4 h-4" />
              {formatTime(auction.auctionStartTime)}  
            </div>
          </div>

             <div className="info-item">
            <span className="info-label">End Time</span>
            <div className="info-value">
              <Clock className="w-4 h-4" />
               {formatTime(auction.auctionEndTime)}
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
            <span className="info-label">Starting Price</span>
            <div className="info-value">
              <IndianRupee className="w-4 h-4" />
              {formatCurrency(auction.startingPrice, auction.currency)}
            </div>
          </div>

          <div className="info-item">
            <span className="info-label">Decremental Value</span>
            <div className="info-value">
              <Gavel className="w-4 h-4" />
              {formatCurrency(auction.decrementalValue, auction.currency)}
            </div>
          </div>
          {/* <div className="info-item">
            <span className="info-label">Participants</span>
            <div className="info-value">
              <Users className="w-4 h-4" />
              {auction.participants.length} registered
            </div>
          </div> */}
        </div>
        <div className="auction-description">
          <h4>Description</h4>
          <p>{auction.auctionDetails}</p>
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
            {(() => {
              const backendData = (auction as any)?.backend;
              const existingBids = backendData?.bids || [];
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
                        parseFloat(bid.amount || auction.startingPrice)
                      )
                    )
                  : auction.startingPrice;
              const totalBids = activeBids.length;

              return (
                <>
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
                      {formatCurrency(
                        (currentLowestBid || 0) -
                          (auction.decrementalValue || 0),
                        auction.currency
                      )}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Auctioneer Details Card */}
      <div className="auction-details-card">
        <h2 className="card-title">
          <Building className="w-5 h-5" />
          Auction Creator Details
        </h2>
        {(() => {
          // Check if we have any real creator data (not null or empty)
          const creatorCompany = auction.auctioneerCompany;
          const creatorName = (auction as any).auctioneerPerson;
          const creatorEmail = (auction as any).auctioneerEmail;
          const creatorPhone = auction.auctioneerPhone;
          const creatorAddress = auction.auctioneerAddress;

          console.log("[ParticipantAuctionView] Creator data for display:", {
            creatorCompany,
            creatorName,
            creatorEmail,
            creatorPhone,
            creatorAddress
          });

          // Check if we have meaningful data
          const hasAnyData = creatorCompany || creatorName || creatorEmail || creatorPhone || creatorAddress;

          if (!hasAnyData) {
            return (
              <div style={{ 
                padding: '1rem', 
                textAlign: 'center', 
                color: 'rgba(255, 255, 255, 0.7)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Creator information is not available for this auction.</p>
                <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                  This may be due to privacy settings or data access restrictions.
                </p>
              </div>
            );
          }

          return (
            <div className="auction-info-grid">
              {creatorCompany && (
                <div className="info-item">
                  <span className="info-label">Company</span>
                  <div className="info-value">
                    <Building className="w-4 h-4" />
                    <span>{creatorCompany}</span>
                  </div>
                </div>
              )}
              {creatorName && (
                <div className="info-item">
                  <span className="info-label">Contact Person</span>
                  <div className="info-value">
                    <User className="w-4 h-4" />
                    <span>{creatorName}</span>
                  </div>
                </div>
              )}
              {creatorEmail && (
                <div className="info-item">
                  <span className="info-label">Email</span>
                  <div className="info-value">
                    <Mail className="w-4 h-4" />
                    <span>{creatorEmail}</span>
                  </div>
                </div>
              )}
              {creatorPhone && (
                <div className="info-item">
                  <span className="info-label">Phone</span>
                  <div className="info-value">
                    <Phone className="w-4 h-4" />
                    <span>{creatorPhone}</span>
                  </div>
                </div>
              )}
              {creatorAddress && (
                <div className="info-item">
                  <span className="info-label">Address</span>
                  <div className="info-value">
                    <MapPin className="w-4 h-4" />
                    <span>{creatorAddress}</span>
                  </div>
                </div>
              )}
              {/* Show additional info if we have auctioneer data from service */}
              {auctioneer && auctioneer.name && (
                <div className="info-item">
                  <span className="info-label">Created By</span>
                  <div className="info-value">
                    <User className="w-4 h-4" />
                    {auctioneer.name} ({auctioneer.companyName || 'N/A'})
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Documents Card */}
      {auction.documents && auction.documents.length > 0 && (
        <div className="info-card">
          <div className="info-card-header">
            <h2 className="info-card-title">
              <FileText className="w-5 h-5" />
              Auction Documents
            </h2>
          </div>
          <div className="info-card-content">
            <div className="documents-list">
              {auction.documents.map((doc, index) => (
                <div key={index} className="document-item">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <span className="document-name">{doc.name}</span>
                  <button
                    onClick={() => handleDownloadDocument(doc)}
                    className="download-btn"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
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

      {/* Bidding Access Info */}
      <div className="auction-details-card">
        <h2 className="card-title">
          <Users className="w-5 h-5" />
          Bidding Information
        </h2>
        <div className="auction-info-grid">
          <div className="info-item">
            <span className="info-label">Current Status</span>
            <div className="info-value">
              {auction.status === "upcoming" && <Clock className="w-4 h-4" />}
              {auction.status === "live" && <Play className="w-4 h-4" />}
              {auction.status === "completed" && (
                <CheckCircle className="w-4 h-4" />
              )}
              {auction.status.charAt(0).toUpperCase() + auction.status.slice(1)}
            </div>
          </div>
          <div className="info-item">
            <span className="info-label">Bidding Access</span>
            <div className="info-value">
              <Gavel className="w-4 h-4" />
              {auction.status === "live"
                ? "Bidding Available Now!"
                : auction.status === "upcoming"
                ? "Available When Live"
                : "Bidding Closed"}
            </div>
          </div>
          <div className="info-item">
            <span className="info-label">Registration Required</span>
            <div className="info-value">
              <XCircle className="w-4 h-4" />
              No - Bid Directly
            </div>
          </div>
        </div>
      </div>

      {/* Optional Join Form - Now just for display, not required for bidding */}
      {!isParticipant && auction.status !== "completed" && (
        <div className="auction-details-card">
          <div className="join-form">
            <h3>Join This Auction</h3>
            <p>
              Optionally register to track your participation status. You can
              bid directly without joining.
            </p>
            <button
              onClick={handleJoinAuction}
              disabled={joinLoading}
              className="btn btn-secondary"
            >
              {joinLoading ? (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Joining...
                </>
              ) : (
                <>
                  <Users className="w-4 h-4" />
                  Register as Participant
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Pre-Bid Section */}
      {auction.preBidOfferAllowed && auction.status !== "completed" && (
        <div className="auction-details-card">
          <div className="prebuild-content">
            <div>
              <h3
                style={{
                  color: "white",
                  margin: 0,
                  fontSize: "1.2rem",
                  fontWeight: "600",
                }}
              >
                Pre-Bid Submission
              </h3>
              <p
                style={{
                  color: "rgba(255, 255, 255, 0.8)",
                  margin: "0.5rem 0 0 0",
                  fontSize: "0.9rem",
                }}
              >
                {hasPreBid
                  ? "Update your bid before the auction goes live"
                  : "Submit your bid before the auction goes live"}
              </p>
              {hasPreBid && existingPreBid && (
                <div
                  style={{
                    marginTop: "0.5rem",
                    padding: "0.5rem",
                    backgroundColor: "rgba(0, 255, 0, 0.1)",
                    borderRadius: "4px",
                    border: "1px solid rgba(0, 255, 0, 0.3)",
                  }}
                >
                  <p
                    style={{
                      color: "rgba(255, 255, 255, 0.9)",
                      margin: 0,
                      fontSize: "0.85rem",
                    }}
                  >
                    <strong>Current Pre-Bid:</strong>{" "}
                    {formatCurrency(
                      parseFloat(existingPreBid.amount),
                      auction.currency
                    )}
                    <span
                      style={{
                        marginLeft: "1rem",
                        color: "rgba(255, 255, 255, 0.7)",
                      }}
                    >
                      Status:{" "}
                      {existingPreBid.status === "pending"
                        ? "Pending Review"
                        : existingPreBid.status === "approved"
                        ? "Approved"
                        : existingPreBid.status === "rejected"
                        ? "Rejected"
                        : "Submitted"}
                    </span>
                  </p>
                </div>
              )}
            </div>
            <button
              onClick={() => {
                if (hasPreBid && existingPreBid) {
                  setPreBuildInput(existingPreBid.amount.toString());
                }
                setShowPreBuildModal(true);
              }}
              disabled={false}
              className="btn btn-secondary prebuild-btn"
            >
              <Gavel className="w-4 h-4" />
              {hasPreBid ? "Update Pre-Bid" : "Submit Pre-Bid"}
            </button>
          </div>
        </div>
      )}

      {/* Live Bidding Section */}
      {(auction.status === "live" || auction.status === "upcoming") && (
        <div
          className="auction-details-card"
          style={{
            background:
              auction.status === "live"
                ? "linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.2))"
                : "linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.2))",
          }}
        >
          <div className="prebuild-content">
            <div>
              <h3
                style={{
                  color: "white",
                  margin: 0,
                  fontSize: "1.2rem",
                  fontWeight: "600",
                }}
              >
                {auction.status === "live"
                  ? "🔴 LIVE: Place Your Bid Now!"
                  : "📅 Ready to Bid"}
              </h3>
              <p
                style={{
                  color: "rgba(255, 255, 255, 0.9)",
                  margin: "0.5rem 0 0 0",
                  fontSize: "0.9rem",
                }}
              >
                {auction.status === "live"
                  ? "The auction is live! Place your bid now to participate."
                  : "Auction will start soon. You can bid when it goes live."}
              </p>
              {(() => {
                const backendData = (auction as any)?.backend;
                const existingBids = backendData?.bids || [];
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
                          parseFloat(bid.amount || auction.startingPrice)
                        )
                      )
                    : auction.startingPrice;

                return (
                  <div
                    style={{
                      marginTop: "0.5rem",
                      padding: "0.5rem",
                      backgroundColor: "rgba(0, 0, 255, 0.1)",
                      borderRadius: "4px",
                      border: "1px solid rgba(0, 0, 255, 0.3)",
                    }}
                  >
                    <p
                      style={{
                        color: "rgba(255, 255, 255, 0.9)",
                        margin: 0,
                        fontSize: "0.85rem",
                      }}
                    >
                      <strong>Current Lowest Bid:</strong>{" "}
                      {formatCurrency(currentLowestBid, auction.currency)}
                    </p>
                  </div>
                );
              })()}
            </div>
            <button
              onClick={() => setShowLiveBidModal(true)}
              disabled={auction.status !== "live"}
              className="btn btn-primary prebuild-btn"
              style={{
                backgroundColor:
                  auction.status === "live" ? "#10B981" : "#6B7280",
                borderColor: auction.status === "live" ? "#10B981" : "#6B7280",
                cursor: auction.status === "live" ? "pointer" : "not-allowed",
                opacity: auction.status === "live" ? 1 : 0.7,
              }}
            >
              <Gavel className="w-4 h-4" />
              {auction.status === "live"
                ? "Place Bid Now!"
                : "Bidding Available When Live"}
            </button>
          </div>
        </div>
      )}

      {/* Live Session Button */}
      {canJoinSession() && (
        <div className="auction-details-card">
          <div className="prebuild-content">
            <div>
              <h3
                style={{
                  color: "white",
                  margin: 0,
                  fontSize: "1.2rem",
                  fontWeight: "600",
                }}
              >
                Live Auction Session
              </h3>
              <p
                style={{
                  color: "rgba(255, 255, 255, 0.8)",
                  margin: "0.5rem 0 0 0",
                  fontSize: "0.9rem",
                }}
              >
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
      )}

      {/* Pre-Build Modal */}
      {showPreBuildModal && auction && (
        <div
          className="prebuild-modal-overlay"
          onClick={() => setShowPreBuildModal(false)}
        >
          <div className="prebuild-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="prebuild-modal-title">Submit Pre-Bid</h3>

            <div
              style={{
                marginBottom: "1rem",
                color: "rgba(255, 255, 255, 0.9)",
                fontSize: "0.9rem",
              }}
            >
              {(() => {
                const backendData = (auction as any)?.backend;
                const existingBids = backendData?.bids || [];
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
                          parseFloat(bid.amount || auction.startingPrice || 0)
                        )
                      )
                    : auction.startingPrice || 0;
                const minAllowedBid =
                  currentLowestBid - (auction.decrementalValue || 0);

                return (
                  <>
                    <p>
                      <strong>Starting Price:</strong>{" "}
                      {formatCurrency(auction.startingPrice, auction.currency)}
                    </p>
                    <p>
                      <strong>Current Lowest Bid:</strong>{" "}
                      {formatCurrency(currentLowestBid, auction.currency)}
                    </p>
                    <p>
                      <strong>Decremental Value:</strong>{" "}
                      {formatCurrency(
                        auction.decrementalValue,
                        auction.currency
                      )}
                    </p>
                    <p>
                      <strong>Valid Bid Range:</strong> Below{" "}
                      {formatCurrency(currentLowestBid, auction.currency)} but
                      above {formatCurrency(minAllowedBid, auction.currency)}
                    </p>
                    <p>
                      <strong>Logic:</strong> Your bid must be lower than
                      current lowest (
                      {formatCurrency(currentLowestBid, auction.currency)}) but
                      not lower than (
                      {formatCurrency(currentLowestBid, auction.currency)} -{" "}
                      {formatCurrency(
                        auction.decrementalValue,
                        auction.currency
                      )}
                      ) = {formatCurrency(minAllowedBid, auction.currency)}
                    </p>
                  </>
                );
              })()}
            </div>

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
                disabled={preBuildLoading || !preBuildInput}
                className="btn btn-primary"
              >
                {preBuildLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Submitting...
                  </>
                ) : (
                  "Submit Pre-Bid"
                )}
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

            <div
              style={{
                marginBottom: "1rem",
                color: "rgba(255, 255, 255, 0.9)",
                fontSize: "0.9rem",
              }}
            >
              {(() => {
                const backendData = (auction as any)?.backend;
                const existingBids = backendData?.bids || [];
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
                          parseFloat(bid.amount || auction.startingPrice || 0)
                        )
                      )
                    : auction.startingPrice || 0;
                const minAllowedBid =
                  (currentLowestBid || 0) - (auction.decrementalValue || 0);

                return (
                  <>
                    <p>
                      <strong>Current Lowest Bid:</strong>{" "}
                      {formatCurrency(currentLowestBid || 0, auction.currency)}
                    </p>
                    <p>
                      <strong>Decremental Value:</strong>{" "}
                      {formatCurrency(
                        auction.decrementalValue || 0,
                        auction.currency
                      )}
                    </p>
                    <p>
                      <strong>Valid Bid Range:</strong> Below{" "}
                      {formatCurrency(currentLowestBid || 0, auction.currency)}{" "}
                      but above{" "}
                      {formatCurrency(
                        (currentLowestBid || 0) -
                          (auction.decrementalValue || 0),
                        auction.currency
                      )}
                    </p>
                    <p>
                      <strong>Logic:</strong> Your bid must be lower than
                      current lowest (
                      {formatCurrency(currentLowestBid || 0, auction.currency)})
                      but not lower than (
                      {formatCurrency(currentLowestBid || 0, auction.currency)}{" "}
                      -{" "}
                      {formatCurrency(
                        auction.decrementalValue || 0,
                        auction.currency
                      )}
                      ) ={" "}
                      {formatCurrency(
                        (currentLowestBid || 0) -
                          (auction.decrementalValue || 0),
                        auction.currency
                      )}
                    </p>
                  </>
                );
              })()}
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
                disabled={liveBidLoading || !liveBidInput}
                className="btn btn-primary"
                style={{ backgroundColor: "#10B981", borderColor: "#10B981" }}
              >
                {liveBidLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Placing Bid...
                  </>
                ) : (
                  "Place Bid"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParticipantAuctionView;



