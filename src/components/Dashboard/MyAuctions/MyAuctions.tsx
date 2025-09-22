import React, { useState, useEffect, useRef } from 'react';
import './MyAuctions.css';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Users,
  Eye,
  Play,
  Filter,
  Search,
  RefreshCw ,
  Plus,
  Gavel,
  User,
  Download,
} from 'lucide-react';
import apiService from '../../../services/apiAuctionService';
import AuctionService from '../../../services/auctionService';
import { BaseAuction, AuctionParticipant } from '../../../types/auction';
import { useAuth } from '../../../contexts/AuthContext';
import { API_BASE_URL } from '../../../services/apiConfig';

const MyAuctions: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Helper: Fetch participants by auction ID using the API and token
  const fetchParticipantsByAuctionId = async (auctionId: string | number) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      if (!token) {
        console.warn('[MyAuctions] No token found for participants API');
        return null;
      }

      const res = await fetch(`${API_BASE_URL}/auction/${auctionId}/participants`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!res.ok) {
        console.warn(`[MyAuctions] Participants API failed for auction ${auctionId}:`, res.status);
        return null;
      }
      
      const data = await res.json();
      console.log(`[MyAuctions] Participants API response for auction ${auctionId}:`, data);
      return data;
    } catch (err) {
      console.error(`[MyAuctions] Error fetching participants for auction ${auctionId}:`, err);
      return null;
    }
  };

  // Function to fetch participant counts for all auctions
  const fetchParticipantCounts = async (auctions: BaseAuction[]) => {
    const counts: {[key: string]: number} = {};
    
    // Process auctions in batches to avoid overwhelming the server
    const batchSize = 5;
    for (let i = 0; i < auctions.length; i += batchSize) {
      const batch = auctions.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (auction) => {
        const auctionId = auction.backendId || auction.id;
        if (auctionId) {
          try {
            const participantsData = await fetchParticipantsByAuctionId(auctionId);
            if (participantsData && participantsData.participants && Array.isArray(participantsData.participants)) {
              // Filter out empty/null participants and count valid ones
              const validParticipants = participantsData.participants.filter((p: any) => 
                p && (typeof p === 'string' ? p.trim() !== '' : true)
              );
              counts[auctionId] = validParticipants.length;
              console.log(`[MyAuctions] Fetched participant count for auction ${auctionId}: ${validParticipants.length}`);
            } else {
              // Fallback to auction.participants count if API returns invalid data
              counts[auctionId] = auction.participants?.length || 0;
              console.log(`[MyAuctions] Using fallback participant count for auction ${auctionId}: ${counts[auctionId]}`);
            }
          } catch (error) {
            console.error(`[MyAuctions] Error fetching participant count for auction ${auctionId}:`, error);
            // Fallback to auction.participants count if API fails
            counts[auctionId] = auction.participants?.length || 0;
          }
        }
      }));
      
      // Small delay between batches to be gentle on the server
      if (i + batchSize < auctions.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log(`[MyAuctions] Participant counts fetched for ${Object.keys(counts).length} auctions:`, counts);
    setParticipantCounts(counts);
  };

  // Helper function to get participant count for display
  const getParticipantCount = (auction: BaseAuction): number => {
    const auctionId = auction.backendId || auction.id;
    // First try to get count from API cache, fallback to auction.participants count
    const apiCount = participantCounts[auctionId];
    if (apiCount !== undefined) {
      return apiCount;
    }
    // Fallback to local count while API is loading
    return auction.participants?.length ?? 0;
  };

  const [activeTab, setActiveTab] = useState<'auctioneer' | 'participant'>('auctioneer');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [auctions, setAuctions] = useState<BaseAuction[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [participantBackendFiltered, setParticipantBackendFiltered] = useState(false);
  const [enrichedFromDetails, setEnrichedFromDetails] = useState(false);
  const [participantCounts, setParticipantCounts] = useState<{[key: string]: number}>({});
  const [auctioneerCount, setAuctioneerCount] = useState(0);
  const [participantCount, setParticipantCount] = useState(0);
  

  const firstLoadRef = useRef(true);
  const handleManualRefresh = async () => {

  setIsFetching(true);

//   setIsFetching(true);

  try {
    await fetchAuctions();
  } finally {
    setIsFetching(false);
  }
};
  
  // Debounce search to avoid spamming network
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(searchTerm), 350);
    return () => clearTimeout(id);
  }, [searchTerm]);

  // Keep a ref of last in-flight promise to discard out-of-order results
  const inFlightRef = useRef<Promise<any> | null>(null);

  useEffect(() => {
    if (!user) return;
    setApiError(null);
    const controller = new AbortController();
    const immediate = firstLoadRef.current;
    if (immediate) setLoading(true); else setIsFetching(true);
    const p = fetchAuctions(controller.signal).finally(() => {
      if (!controller.signal.aborted) {
        if (immediate) {
          setLoading(false);
          firstLoadRef.current = false;
        } else {
          setIsFetching(false);
        }
      }
    });
    inFlightRef.current = p;
    return () => controller.abort();
  }, [activeTab, statusFilter, debouncedSearch, user]);

  // Helper to check if user created the auction
  const isCreatedByUser = (auction: BaseAuction) => {
    if (!user) return false;
    
    console.log(`[MyAuctions] Checking if user created auction ${auction.id}:`, {
      userInfo: {
        id: user.id,
        companyName: user.companyName,
        phoneNumber: user.phoneNumber
      },
      auctionInfo: {
        createdBy: auction.createdBy,
        userId: auction.userId,
        auctioneerCompany: auction.auctioneerCompany,
        auctioneerPhone: (auction as any).auctioneerPhone
      }
    });
    
    const isCreated = (
      auction.createdBy === user.id ||
      auction.userId === user.id ||
      auction.createdBy === user.companyName ||
      auction.auctioneerCompany === user.companyName ||
      (auction as any).auctioneerPhone === user.phoneNumber
    );
    
    console.log(`[MyAuctions] Auction ${auction.id} created by user: ${isCreated}`);
    return isCreated;
  };

  // Helper function to check detailed participation data
  const checkDetailedParticipation = (auction: any, user: any) => {
    if (!user) return false;

    console.log(`[MyAuctions] Checking detailed participation:`, {
      userPhone: user.phoneNumber,
      userId: user.id,
      auctionParticipants: auction.participants,
      auctionParticipantsList: auction.participantsList,
      allAuctionKeys: Object.keys(auction)
    });

    // Check all possible participant arrays and fields
    const participantFields = [
      auction.participants,
      auction.participantsList,
      auction.participantsData,
      auction.usersList,
      auction.members,
      auction.registeredUsers
    ];

    for (const field of participantFields) {
      if (Array.isArray(field)) {
        const found = field.some(participant => {
          if (typeof participant === 'string') {
            // Clean empty strings and check for phone number match
            const cleanParticipant = participant.trim();
            if (!cleanParticipant) return false;
            
            // Check exact match or variations
            const phoneVariations = [
              user.phoneNumber,
              user.phoneNumber.replace('+91', ''),
              user.phoneNumber.replace('+', ''),
              '+91' + user.phoneNumber.replace(/^\+?91?/, '')
            ];
            
            return phoneVariations.includes(cleanParticipant);
          }
          
          if (typeof participant === 'object' && participant !== null) {
            // Check all values in the participant object
            const values = Object.values(participant);
            return values.includes(user.phoneNumber) || 
                   values.includes(user.id) || 
                   (user.email && values.includes(user.email));
          }
          
          return false;
        });
        
        if (found) {
          console.log(`[MyAuctions] Found user in detailed participant field`);
          return true;
        }
      }
    }

    // Check nested objects for participant data
    for (const [key, value] of Object.entries(auction)) {
      if (key.toLowerCase().includes('participant') && typeof value === 'object' && value !== null) {
        const nestedFound = JSON.stringify(value).includes(user.phoneNumber);
        if (nestedFound) {
          console.log(`[MyAuctions] Found user in nested field ${key}`);
          return true;
        }
      }
    }

    return false;
  };

  // Enhanced helper to check if user is a participant using API
  const isUserParticipantViaAPI = async (auction: BaseAuction): Promise<boolean> => {
    if (!user) return false;
    if (isCreatedByUser(auction)) return false;

    const auctionId = auction.backendId || auction.id;
    if (!auctionId) return false;

    try {
      const participantsData = await fetchParticipantsByAuctionId(auctionId);
      if (!participantsData || !participantsData.participants) {
        return false;
      }

      // Check if current user is in the participants list
      const userPhoneVariations = [
        user.phoneNumber,
        user.phoneNumber?.replace('+91', ''),
        user.phoneNumber?.replace('+', ''),
        '+91' + user.phoneNumber?.replace(/^\+?91?/, '')
      ].filter(Boolean);

      const isParticipant = participantsData.participants.some((participant: any) => {
        if (!participant) return false;

        // Check if participant is a string (phone number)
        if (typeof participant === 'string') {
          return userPhoneVariations.includes(participant) || 
                 (user.email && participant.includes(user.email));
        }

        // Check if participant is an object
        if (typeof participant === 'object') {
          const values = Object.values(participant);
          return userPhoneVariations.some(phone => values.includes(phone)) ||
                 values.includes(user.id) ||
                 (user.email && values.includes(user.email));
        }

        return false;
      });

      console.log(`[MyAuctions] API check for auction ${auctionId}: participant = ${isParticipant}`);
      return isParticipant;
    } catch (error) {
      console.error(`[MyAuctions] Error in API participant check for auction ${auctionId}:`, error);
      return false;
    }
  };

  // Enhanced helper to check if user is a participant (but NOT the creator)
  const isUserParticipant = (auction: BaseAuction) => {
    if (!user) return false;

    // CRITICAL: If user created this auction, they should NEVER appear in participated auctions
    // This ensures clear separation between "My Created Auctions" and "My Participated Auctions"
    if (isCreatedByUser(auction)) {
      console.log(`[MyAuctions] Auction ${auction.id} was created by user - excluding from participated auctions`);
      return false;
    }

    console.log(`[MyAuctions] Checking participation for auction ${auction.id} (${auction.title}):`, {
      userPhone: user.phoneNumber,
      userId: user.id,
      userEmail: user.email,
      auctionParticipants: auction.participants,
      backendParticipants: (auction as any).backend?.participantsList,
      allAuctionFields: Object.keys(auction as any)
    });

    // Check if user's phone number is in participants array
    if (auction.participants && Array.isArray(auction.participants)) {
      console.log(`[MyAuctions] Raw participants array:`, auction.participants);
      
      // Filter out empty strings, null, undefined values
      const cleanParticipants = auction.participants.filter(p => p && typeof p === 'string' && p.trim() !== '');
      console.log(`[MyAuctions] Cleaned participants:`, cleanParticipants);
      
      // Check for exact phone number match
      const hasUserPhone = cleanParticipants.includes(user.phoneNumber);
      if (hasUserPhone) {
        console.log(`[MyAuctions] ✅ Found user phone number in participants array`);
        return true;
      }

      // Check for phone number variations (with/without country codes)
      const userPhoneVariations = [
        user.phoneNumber,                                          // +919327437170
        user.phoneNumber.replace('+91', ''),                     // 9327437170
        user.phoneNumber.replace('+', ''),                       // 919327437170
        '+91' + user.phoneNumber.replace(/^\+?91?/, '')          // +919327437170 (normalized)
      ];
      
      console.log(`[MyAuctions] Checking phone variations:`, userPhoneVariations);
      
      const hasPhoneVariation = cleanParticipants.some(p => userPhoneVariations.includes(p));
      if (hasPhoneVariation) {
        console.log(`[MyAuctions] ✅ Found user phone variation in participants`);
        return true;
      }
    }

    // Check backend participantsList with multiple possible field names
    const backendList: any[] | undefined = (auction as any).backend?.participantsList;
    if (Array.isArray(backendList)) {
      console.log(`[MyAuctions] Checking backend participantsList:`, backendList);
      
      const isParticipant = backendList.some(p => {
        const phoneFields = [
          p?.phone_number, 
          p?.phoneNumber, 
          p?.userPhone, 
          p?.phone,
          p?.Phone,
          p?.Phone_Number
        ].filter(Boolean);
        
        const userIdFields = [
          p?.user_id,
          p?.userId,
          p?.id,
          p?.participantId
        ].filter(Boolean);

        const emailFields = [
          p?.email,
          p?.mail_id,
          p?.mailId
        ].filter(Boolean);

        const phoneMatch = phoneFields.includes(user.phoneNumber);
        const idMatch = userIdFields.includes(user.id);
        const emailMatch = user.email ? emailFields.includes(user.email) : false;

        if (phoneMatch || idMatch || emailMatch) {
          console.log(`[MyAuctions] ✅ Found user in backend participants:`, {
            phoneMatch,
            idMatch,
            emailMatch,
            participant: p
          });
          return true;
        }
        return false;
      });
      
      if (isParticipant) return true;
    }

    // Check other possible participant data structures
    const participantsList = (auction as any).participantsList;
    if (Array.isArray(participantsList)) {
      console.log(`[MyAuctions] Checking participantsList:`, participantsList);
      
      const isInList = participantsList.some(p => {
        if (typeof p === 'string') {
          const userPhoneVariations = [
            user.phoneNumber,
            user.phoneNumber.replace('+91', ''),
            user.phoneNumber.replace('+', ''),
            '+91' + user.phoneNumber.replace(/^\+?91?/, '')
          ];
          return userPhoneVariations.includes(p);
        }
        if (typeof p === 'object' && p !== null) {
          return Object.values(p).includes(user.phoneNumber) || 
                 Object.values(p).includes(user.id) ||
                 (user.email && Object.values(p).includes(user.email));
        }
        return false;
      });
      
      if (isInList) {
        console.log(`[MyAuctions] ✅ Found user in participantsList`);
        return true;
      }
    }

    // Check all possible fields in the auction object that might contain participant data
    const allFields = Object.entries(auction as any);
    for (const [key, value] of allFields) {
      if (key.toLowerCase().includes('participant') || key.toLowerCase().includes('user')) {
        console.log(`[MyAuctions] Checking field ${key}:`, value);
        
        if (Array.isArray(value)) {
          const found = value.some(v => {
            if (typeof v === 'string') {
              const userPhoneVariations = [
                user.phoneNumber,
                user.phoneNumber.replace('+91', ''),
                user.phoneNumber.replace('+', ''),
                '+91' + user.phoneNumber.replace(/^\+?91?/, '')
              ];
              return userPhoneVariations.includes(v) || v === user.id || (user.email && v === user.email);
            }
            if (typeof v === 'object' && v !== null) {
              const values = Object.values(v);
              const userPhoneVariations = [
                user.phoneNumber,
                user.phoneNumber.replace('+91', ''),
                user.phoneNumber.replace('+', ''),
                '+91' + user.phoneNumber.replace(/^\+?91?/, '')
              ];
              return values.some(val => 
                userPhoneVariations.includes(val as string) || 
                val === user.id || 
                (user.email && val === user.email)
              );
            }
            return false;
          });
          
          if (found) {
            console.log(`[MyAuctions] ✅ Found user in field ${key}`);
            return true;
          }
        }
      }
    }

    console.log(`[MyAuctions] ❌ User NOT found as participant in auction ${auction.id}`);
    return false;
  };

    const fetchAuctions = async (signal?: AbortSignal) => {
  try {
    let data: BaseAuction[] = [];


    if (activeTab === 'auctioneer') {
      console.log(`[MyAuctions] 🏗️ FETCHING CREATED AUCTIONS - Only auctions created by user ${user?.phoneNumber}`);
      
      // Fetch auctions created by user
      if (!debouncedSearch) {
        try {
          data = await apiService.fetchMyAuctions(statusFilter === 'all' ? undefined : statusFilter, signal);
          console.log(`[MyAuctions] Fetched ${data.length} auctions from my-auctions endpoint`);
        } catch (e) {
          console.warn('[MyAuctions] fetchMyAuctions failed, falling back', e);
        }
      }

      // Fallback to filtered endpoint for created auctions
      if (data.length === 0) {
        const params = {
          status: statusFilter,
          type: 'created',
          search: debouncedSearch,
          signal,
        };
        data = await apiService.fetchFilteredAuctions(params);
        console.log(`[MyAuctions] Fallback: Fetched ${data.length} auctions from filtered endpoint`);

        // Filter to only auctions created by current user
        if (data.length > 0 && user?.id) {
          const beforeFilter = data.length;
          data = data.filter(isCreatedByUser);
          console.log(`[MyAuctions] ✅ Filtered to show only USER CREATED auctions: ${beforeFilter} → ${data.length}`);
        }
      }
      
      // Double-check: Make sure all returned auctions are created by user
      const finalCreatedCheck = data.filter(isCreatedByUser);
      if (finalCreatedCheck.length !== data.length) {
        console.warn(`[MyAuctions] ⚠️ Found non-created auctions in created tab! Filtering...`);
        data = finalCreatedCheck;
      }
      
      // Update auctioneer count
      setAuctioneerCount(data.length);
      console.log(`[MyAuctions] 🏗️ FINAL CREATED AUCTIONS RESULT: ${data.length} auctions`);
    }
    else if (activeTab === 'participant') {
      console.log(`[MyAuctions] 👥 FETCHING PARTICIPATED AUCTIONS - Only auctions where ${user?.phoneNumber} was added as participant (NOT created by user)`);
      
      console.log(`[MyAuctions] User details for participation check:`, {
        userId: user?.id,
        userPhone: user?.phoneNumber,
        userEmail: user?.email,
        userCompany: user?.companyName
      });


      // Strategy 1: Try direct my-auctions endpoint first (most reliable)
      try {
        console.log(`[MyAuctions] Strategy 1: Trying my-auctions endpoint for participated auctions`);
        const myAuctions = await apiService.fetchMyAuctions(statusFilter === 'all' ? undefined : statusFilter, signal);
        console.log(`[MyAuctions] Fetched ${myAuctions.length} auctions from my-auctions endpoint`);
        
        // Filter for participated auctions (excluding created ones)
        const participated = myAuctions.filter(auction => !isCreatedByUser(auction) && isUserParticipant(auction));

        console.log(`[MyAuctions] Found ${participated.length} non-created auctions from my-auctions`);
        
        if (participated.length > 0) {
          data = participated;
          console.log(`[MyAuctions] Strategy 1 successful: ${data.length} participated auctions`);
        }
      } catch (myAuctionsErr) {
        console.warn('[MyAuctions] Strategy 1 (my-auctions) failed:', myAuctionsErr);
      }

      // Strategy 2: Try participated endpoint if Strategy 1 failed or returned empty
      if (data.length === 0) {
        try {
          console.log(`[MyAuctions] Strategy 2: Trying participated endpoint`);
          const params = {
            status: statusFilter === 'all' ? undefined : statusFilter,
            type: 'participated',
            search: debouncedSearch,
            signal,
          };
          
          data = await apiService.fetchFilteredAuctions(params);
          console.log(`[MyAuctions] Strategy 2: Fetched ${data.length} auctions from participated endpoint`);
          
          // Still filter to ensure we only get actual participated auctions
          if (data.length > 0) {
            const beforeFilter = data.length;
            data = data.filter(isUserParticipant);
            console.log(`[MyAuctions] Strategy 2: Filtered participated auctions from ${beforeFilter} to ${data.length}`);
          }
        } catch (participatedErr) {
          console.warn('[MyAuctions] Strategy 2 (participated endpoint) failed:', participatedErr);
          data = [];
        }
      }

      // Strategy 3: Use API to check each auction individually for participation
      if (data.length === 0) {
        try {
          console.log(`[MyAuctions] Strategy 3: Using participants API to check each auction`);
          const params = {
            status: statusFilter === 'all' ? undefined : statusFilter,
            search: debouncedSearch,
            signal,
          };

          const allAuctions = await apiService.fetchFilteredAuctions(params);
          console.log(`[MyAuctions] Strategy 3: Fetched ${allAuctions.length} total auctions for API check`);

          // Get auctions that user did NOT create
          const nonCreatedAuctions = allAuctions.filter(auction => !isCreatedByUser(auction));
          console.log(`[MyAuctions] Strategy 3: ${nonCreatedAuctions.length} auctions not created by user`);

          // Check each auction via API for participation
          const participatedAuctions: BaseAuction[] = [];
          const maxToCheck = Math.min(nonCreatedAuctions.length, 50); // Check more auctions

          for (let i = 0; i < maxToCheck; i++) {
            const auction = nonCreatedAuctions[i];
            console.log(`[MyAuctions] Strategy 3: Checking API participation for auction ${auction.id} (${auction.title})`);
            
            const isParticipant = await isUserParticipantViaAPI(auction);
            if (isParticipant) {
              console.log(`[MyAuctions] ✅ Strategy 3: Found participation in auction ${auction.id} via API`);
              participatedAuctions.push(auction);
            }

            // Small delay to avoid overwhelming the API
            if (i < maxToCheck - 1) {
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          }

          console.log(`[MyAuctions] Strategy 3: Found ${participatedAuctions.length} participated auctions via API`);
          data = participatedAuctions;
          
        } catch (fallbackErr: any) {
          console.warn('[MyAuctions] Strategy 3 (API check) failed:', fallbackErr);
          data = [];
        }
      }

      // Strategy 4: Emergency fallback - if all else fails, show auctions with participant indicators
      if (data.length === 0) {
        try {
          console.log(`[MyAuctions] Strategy 4: Emergency fallback - non-created auctions with participants`);
          const params = {
            status: statusFilter === 'all' ? undefined : statusFilter,
            search: debouncedSearch,
            signal,
          };

          const allAuctions = await apiService.fetchFilteredAuctions(params);
          
          // Get auctions that user did NOT create and have participant indicators
          const potentialParticipations = allAuctions.filter(auction => {
            const notCreatedByUser = !isCreatedByUser(auction);
            const hasParticipants = (auction.participants?.length || 0) > 0;
            const hasParticipantsList = ((auction as any).participantsList?.length || 0) > 0;
            const hasParticipantCount = ((auction as any).participantCount || 0) > 0;
            
            const hasAnyParticipantData = hasParticipants || hasParticipantsList || hasParticipantCount;
            
            if (notCreatedByUser && hasAnyParticipantData) {
              console.log(`[MyAuctions] Strategy 4: Potential participation in auction ${auction.id} (${auction.title})`);
              return true;
            }
            
            return false;
          });
          
          console.log(`[MyAuctions] Strategy 4: Found ${potentialParticipations.length} potential participated auctions`);
          
          // Use this fallback if reasonable number
          if (potentialParticipations.length > 0 && potentialParticipations.length <= 15) {
            data = potentialParticipations;
            console.log(`[MyAuctions] Strategy 4: Using emergency fallback with ${data.length} auctions`);
          }
          
        } catch (emergencyErr: any) {
          console.warn('[MyAuctions] Strategy 4 (emergency fallback) failed:', emergencyErr);
          data = [];
        }
      }

      // Set UI state based on which strategy worked
      if (data.length > 0) {
        setParticipantBackendFiltered(false);
        setEnrichedFromDetails(false);
        
        // Double-check: Make sure NO auction in participated list was created by user
        const createdByUserCount = data.filter(isCreatedByUser).length;
        if (createdByUserCount > 0) {
          console.warn(`[MyAuctions] ⚠️ Found ${createdByUserCount} user-created auctions in participated list! Removing them...`);
          data = data.filter(auction => !isCreatedByUser(auction));
        }
        
        // Triple-check: Make sure all auctions are actually participated by user
        const actuallyParticipated = data.filter(isUserParticipant).length;
        console.log(`[MyAuctions] 👥 PARTICIPATION VERIFICATION: ${actuallyParticipated}/${data.length} auctions verified as participated`);
        
      } else {
        // Show a helpful message if no strategies worked
        console.log('[MyAuctions] ❌ All strategies failed to find participated auctions');
        setParticipantBackendFiltered(false);
        setEnrichedFromDetails(false);
      }
      
      // Update participant count
      setParticipantCount(data.length);
      console.log(`[MyAuctions] 👥 FINAL PARTICIPATED AUCTIONS RESULT: ${data.length} auctions where user is participant (NOT creator)`);
    }

    console.log(`[MyAuctions] Final result: ${data.length} auctions for ${activeTab} tab`);
    setAuctions(data);
    
    // Fetch participant counts for all auctions
    if (data.length > 0) {
      await fetchParticipantCounts(data);
    }
  } catch (err: any) {
    console.error('[MyAuctions] fetchAuctions failed:', err);
    setApiError(err?.message || 'Failed to load auctions');
    setAuctions([]);
  }
}

  // Derive start Date object for an auction
  const getAuctionStart = (auction: BaseAuction) => {
    try {
      const iso = `${auction.auctionDate}T${auction.auctionStartTime}:00`;
      return new Date(iso);
    } catch {
      return new Date();
    }
  };

  // Derive end time using duration (backend returns seconds for live, minutes for upcoming)
  // const getAuctionEnd = (auction: BaseAuction) => {
  //   const start = getAuctionStart(auction).getTime();
  //   // Handle duration conversion: live auctions have duration in seconds, upcoming in minutes
  //   const durMs = auction.status === 'live' 
  //     ? (auction.duration || 60) * 1000        // seconds to milliseconds
  //     : (auction.duration || 60) * 60 * 1000;  // minutes to milliseconds
  //   return new Date(start + durMs);
  // };
  const getAuctionEnd = (auction: BaseAuction) => {
  const start = getAuctionStart(auction).getTime();
  
  // FIXED: Always treat duration as minutes regardless of status
  // The backend should provide duration in consistent units
  let durationInMinutes = auction.duration || 60;
  
  // If duration seems to be in seconds (very large number), convert to minutes
  if (durationInMinutes > 1440) { // More than 24 hours suggests it's in seconds
    durationInMinutes = Math.floor(durationInMinutes / 60);
  }
  
  const durMs = durationInMinutes * 60 * 1000; // Convert minutes to milliseconds
  
  console.log(`[MyAuctions] Auction ${auction.id} duration calculation:`, {
    originalDuration: auction.duration,
    durationInMinutes,
    durationInMs: durMs,
    startTime: new Date(start).toISOString(),
    endTime: new Date(start + durMs).toISOString()
  });
  
  return new Date(start + durMs);
};

  // Determine real-time status transitions without waiting for backend updates
  // const getDerivedStatus = (auction: BaseAuction, nowMs: number): BaseAuction['status'] => {
  //   const start = getAuctionStart(auction).getTime();
  //   const end = getAuctionEnd(auction).getTime();
  //   if (nowMs < start) return 'upcoming';
  //   if (nowMs >= start && nowMs < end) return 'live';
  //   return 'completed';
  // };
//   const getDerivedStatus = (auction: BaseAuction, nowMs: number): BaseAuction['status'] => {
//   const start = getAuctionStart(auction).getTime();
//   const end = getAuctionEnd(auction).getTime();
  
//   // If backend says it's live and we're within reasonable bounds, trust it
//   if (auction.status === 'live' && nowMs >= start && nowMs < end + 60000) { // 1 minute grace period
//     return 'live';
//   }
  
//   // Otherwise use time-based calculation
//   if (nowMs < start - 60000) return 'upcoming'; // 1 minute before start
//   if (nowMs >= start && nowMs < end) return 'live';
//   return 'completed';
// };

const getDerivedStatus = (auction: BaseAuction, nowMs: number): BaseAuction['status'] => {
  // 1. If backend already closed the auction, believe it.
  if (auction.status === 'completed') return 'completed';

  // 2. Otherwise calculate dynamically.
  const start = getAuctionStart(auction).getTime();
  const end   = getAuctionEnd(auction).getTime();

  if (nowMs < start) return 'upcoming';
  if (nowMs >= end)  return 'completed';
  return 'live';
};

  // Timer for countdowns and status monitoring
  const [now, setNow] = useState<number>(Date.now());
  // useEffect(() => {
  //   const id = setInterval(() => {
  //     const currentTime = Date.now();
  //     setNow(currentTime);
      
      
  //     const shouldRefresh = auctions.some(auction => {
  //       const start = getAuctionStart(auction).getTime();
  //       const end = getAuctionEnd(auction).getTime();
        
      
  //       const currentStatus = auction.status;
  //       const derivedStatus = getDerivedStatus(auction, currentTime);
        
  //       return currentStatus !== derivedStatus && 
  //              (derivedStatus === 'live' || derivedStatus === 'completed');
  //     });
      
  //     if (shouldRefresh) {
  //       console.log('[MyAuctions] Status change detected, refreshing auction data');
  //       fetchAuctions();
  //     }
  //   }, 1000);
  //   return () => clearInterval(id);
  // }, [auctions]);

  useEffect(() => {
  const id = setInterval(() => {
    const currentTime = Date.now();
    setNow(currentTime);
    
    // FIXED: Only refresh when there are clear status transitions with grace periods
    const shouldRefresh = auctions.some(auction => {
      const start = getAuctionStart(auction).getTime();
      const end = getAuctionEnd(auction).getTime();
      
      const currentStatus = auction.status;
      const derivedStatus = getDerivedStatus(auction, currentTime);
      
      // Only refresh on major transitions with some delay to prevent flapping
      const isSignificantTransition = (
        (currentStatus === 'upcoming' && derivedStatus === 'live' && currentTime >= start + 30000) || // 30 seconds after start
        (currentStatus === 'live' && derivedStatus === 'completed' && currentTime >= end + 60000) // 1 minute after expected end
      );
      
      if (isSignificantTransition) {
        console.log(`[MyAuctions] Significant status transition detected for auction ${auction.id}:`, {
          from: currentStatus,
          to: derivedStatus,
          now: new Date(currentTime).toISOString(),
          start: new Date(start).toISOString(),
          end: new Date(end).toISOString()
        });
      }
      
      return isSignificantTransition;
    });
    
    if (shouldRefresh) {
      console.log('[MyAuctions] Status change detected, refreshing auction data');
      fetchAuctions();
    }
  }, 1000); // FIXED: Check every 5 seconds instead of every second to reduce load
  
  return () => clearInterval(id);
}, [auctions]);

  // Filter auctions locally after fetch using derived status
  const filterAuctions = (auctions: BaseAuction[]) => {
    const term = searchTerm.trim().toLowerCase();
    const nowMs = now;
    return auctions.filter((auction) => {
      const derivedStatus = getDerivedStatus(auction, nowMs);
      const matchesSearch = term === '' ||
        auction.title.toLowerCase().includes(term) ||
        auction.auctionNo.toLowerCase().includes(term) ||
        (auction.auctioneerCompany?.toLowerCase().includes(term) ?? false);
      const matchesStatus = statusFilter === 'all' || derivedStatus === statusFilter;
      return matchesSearch && matchesStatus;
    }).sort((a, b) => getAuctionStart(a).getTime() - getAuctionStart(b).getTime());
  };
  const filteredAuctions = filterAuctions(auctions);

  // Utility for displaying auction status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'live':
        return <Play className="w-4 h-4" />;
      case 'upcoming':
        return <Clock className="w-4 h-4" />;
      case 'completed':
        return <Calendar className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };


  // Calculate countdown string
  const formatCountdown = (ms: number) => {
    if (ms <= 0) return '00d 00h 00m 00s';
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / (24 * 3600));
    const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(days).padStart(2, '0')}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
  };

  // Remaining time helper
  const remainingToStart = (auction: BaseAuction) => {
    return getAuctionStart(auction).getTime() - now;
  };
  const remainingToEnd = (auction: BaseAuction) => {
    return getAuctionEnd(auction).getTime() - now;
  };

  // Generate and download a simple auction report (mirrors internal implementation)
  const downloadAuctionReport = async (auction: BaseAuction) => {
  try {
    /* 1.  fetch complete auction object */
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    const res = await fetch(`${API_BASE_URL}/auction/${auction.backendId || auction.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Could not fetch auction detail');
    const json = await res.json();
    const full = json.auction;
    if (!full) throw new Error('Empty auction detail');

    /* 2.  participants */
    const participants = full.participants.map((p: any) => ({
      userId: p.user_id,
      companyName: p.company_name || '—',
      personName: p.person_name || '—',
      phoneNumber: p.phone_number,
      mailId: p.email || '—',          // ← will show once backend adds it
      companyAddress: '—',
      bidAmount: 0,
      lastBidTime: '',
      status: p.status,
      invitedAt: p.invited_at,
      joinedAt: p.joined_at,
    }));

    /* 3.  winner */
    const winnerBid = full.winner_info
      ? participants.find((x: any) => x.userId === full.winner_info.user_id)
      : null;

    /* 4.  documents */
    const docRows =
      full.documents?.map(
        (d: any) =>
          `<tr>
             <td>${d.file_name}</td>
             <td><a href="${d.file_url}" target="_blank" rel="noreferrer">Download</a></td>
             <td>${d.file_type}</td>
             <td>${new Date(d.uploaded_at).toLocaleString()}</td>
           </tr>`
      ).join('') || '<tr><td colspan="4">No documents</td></tr>';

    /* 5.  HTML report */
    const html = `<!DOCTYPE html>
<html>handleManualRefresh
<head>
  <meta charset="utf-8"/>
  <title>Auction Report – ${full.auction_no}</title>
  <style>
    body{font-family:Arial,Helvetica,sans-serif;margin:24px;color:#333}
    h1{margin:0 0 8px;font-size:24px;color:#4f46e5}
    h2{font-size:18px;margin:24px 0 8px;color:#4f46e5}
    .section{border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-top:16px}
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;font-size:14px}
    .label{font-weight:600;color:#555}
    table{border-collapse:collapse;width:100%;margin-top:8px}
    th,td{border:1px solid #ddd;padding:6px 8px;font-size:12px;text-align:left}
    th{background:#f3f4f6}
    .badge{color:#0d9488;font-weight:600}
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
      <div><span class="label">Time:</span> ${full.formatted_start_time} – ${full.formatted_end_time || '—'}</div>
      <div><span class="label">Duration:</span> ${full.duration} min</div>
      <div><span class="label">Currency:</span> ${full.currency}</div>
      <div><span class="label">Starting / Current Price:</span> ${full.currency} ${Number(full.current_price).toLocaleString()}</div>
      <div><span class="label">Reserve Price:</span> ${full.currency} ${Number(full.reserve_price || 0).toLocaleString()}</div>
      <div><span class="label">Decremental Value:</span> ${full.currency} ${Number(full.decremental_value).toLocaleString()}</div>
      <div><span class="label">Pre-bid Allowed:</span> ${full.pre_bid_allowed ? 'Yes' : 'No'}</div>
      <div><span class="label">Open to All:</span> ${full.open_to_all ? 'Yes' : 'No'}</div>
      <div><span class="label">Total Bids:</span> ${full.statistics?.total_bids || 0}</div>
      <div><span class="label">Total Participants:</span> ${full.statistics?.total_participants || 0}</div>
      <div><span class="label">Active Participants:</span> ${full.statistics?.active_participants || 0}</div>
      <div><span class="label">Highest Bid:</span> ${full.currency} ${Number(full.statistics?.highest_bid || 0).toLocaleString()}</div>
      <div><span class="label">Lowest Bid:</span> ${full.currency} ${Number(full.statistics?.lowest_bid || 0).toLocaleString()}</div>
    </div>
    <div style="margin-top:8px"><span class="label">Description:</span> ${full.description || '—'}</div>
  </div>

  <div class="section">
    <h2>Auctioneer</h2>
    <div class="grid">
      <div><span class="label">Company:</span> ${full.creator_info?.company_name || '—'}</div>
      <div><span class="label">Contact Person:</span> ${full.creator_info?.person_name || '—'}</div>
      <div><span class="label">Email:</span> ${full.creator_info?.email || full.auctioneer_email || '—'}</div>
      <div><span class="label">Phone:</span> ${full.creator_info?.phone || '—'}</div>
    </div>
  </div>

  ${
    winnerBid
      ? `<div class="section">
           <h2>Winning Bid</h2>
           <div class="grid">
             <div><span class="label">Company:</span> ${winnerBid.companyName}</div>
             <div><span class="label">Amount:</span> ${full.currency} ${winnerBid.bidAmount.toLocaleString()}</div>
             <div><span class="label">Contact:</span> ${winnerBid.personName}</div>
             <div><span class="label">Phone:</span> ${winnerBid.phoneNumber}</div>
           </div>
         </div>`
      : ''
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
                        <td>${p.joinedAt ? new Date(p.joinedAt).toLocaleString() : '—'}</td>
                      </tr>`
                 )
                 .join('')}
             </tbody>
           </table>`
        : '<div>No participants.</div>'
    }
  </div>

  <div class="section">
    <h2>Documents (${full.documents?.length || 0})</h2>
    <table>
      <thead><tr><th>File Name</th><th>Download</th><th>Type</th><th>Uploaded At</th></tr></thead>
      <tbody>${docRows}</tbody>
    </table>
  </div>

  <div style="margin-top:32px;font-size:11px;text-align:center;color:#666">
    Generated by Auction Platform
  </div>
</body>
</html>`;

    /* 6.  open / print */
    const w = window.open('', '_blank');
    if (w) {
      w.document.write(html);
      w.document.close();
      w.onload = () => setTimeout(() => {
        w.print();
        w.close();
      }, 400);
    } else {
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Auction_Report_${full.auction_no}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  } catch (e) {
    console.error('Failed to generate report', e);
    alert('Could not create report. Please try again.');
  }
};

  // Add debug button for testing (remove in production)
  // const debugParticipantData = () => {
  //   console.log('=== DEBUG: Participant Data ===');
  //   console.log('Current user:', user);
  //   console.log('Raw auctions data:', auctions);
  //   console.log('Filtered auctions:', filteredAuctions);
  //   auctions.forEach(auction => {
  //     console.log(`Auction ${auction.id}:`, {
  //       title: auction.title,
  //       isCreatedByUser: isCreatedByUser(auction),
  //       isUserParticipant: isUserParticipant(auction),
  //       participants: auction.participants,
  //       backend: (auction as any).backend
  //     });
  //   });
  // };

  // Render
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
              My Auctions
            </h1>
            <p className="ap-myauctions-subtitle">
              Manage your auctions and track participation
            </p>
          </div>
          <Link to="/dashboard/new-auction" className="ap-myauctions-create-btn">
            <Plus className="w-4 h-4" />
            Create Auction
          </Link>
        </div>
      </div>

      {/* Tabs */}
            <div className="ap-myauctions-tabs">
  <div className="ap-myauctions-tabs-list">
    <button
      onClick={() => setActiveTab('auctioneer')}
      className={`ap-myauctions-tab ${activeTab === 'auctioneer' ? 'ap-myauctions-tab-active' : ''}`}
    >
      <Gavel className="w-4 h-4" />
      My Created Auctions
      <span className="ap-myauctions-tab-badge">
        {activeTab === 'auctioneer' ? filteredAuctions.length : auctioneerCount}
      </span>
    </button>
    <button
      onClick={() => setActiveTab('participant')}
      className={`ap-myauctions-tab ${activeTab === 'participant' ? 'ap-myauctions-tab-active' : ''}`}
    >
      <User className="w-4 h-4" />
      My Participated Auctions
      <span className="ap-myauctions-tab-badge">
        {activeTab === 'participant' ? filteredAuctions.length : participantCount}
      </span>
    </button>
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
                



  className={`ap-myauctions-filter-btn ${isFetching ? 'opacity-75' : ''}`}
  onClick={handleManualRefresh} 
  disabled={isFetching}
  title={isFetching ? 'Refreshing data...' : 'Click to refresh'}
>
  
  <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
  <span className="ml-1">
    {isFetching ? 'Refreshing...' : 'Refresh'}
  </span>
</button>
            {/* Debug button - remove in production */}
            {/* {process.env.NODE_ENV === 'development' && (
              <button onClick={debugParticipantData} style={{marginLeft: '8px', padding: '4px 8px', fontSize: '12px'}}>
                Debug
              </button>
            )} */}
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
        {activeTab === 'participant' && participantBackendFiltered && !enrichedFromDetails && (
          <div className="ap-myauctions-info-banner">
            Searching for auctions where you are a participant...
          </div>
        )}
        {activeTab === 'participant' && enrichedFromDetails && (
          <div className="ap-myauctions-info-banner">
            Showing auctions where you are registered as a participant (verified via detailed search).
          </div>
        )}
        {isFetching && (
          <div className="ap-myauctions-loading-inline">Loading latest auctions...</div>
        )}
        {filteredAuctions.length > 0 ? (
          <div className="ap-myauctions-grid">
            {filteredAuctions.map((auction) => {
              const start = getAuctionStart(auction);
              const derivedStatus = getDerivedStatus(auction, now);
              const startsInMs = remainingToStart(auction);
              const endsInMs = remainingToEnd(auction);

              return (
                <div
                  key={auction.id}
                  className="ap-myauctions-card"
                >
                  <div className="ap-myauctions-card-header">
                    <div className="ap-myauctions-card-title-section">
                      <h3 className="ap-myauctions-card-title">{auction.title}</h3>
                      <span className={`ap-myauctions-status-badge ap-myauctions-status-${derivedStatus}`}>
                        {getStatusIcon(derivedStatus)}
                        {derivedStatus.toUpperCase()}
                      </span>
                    </div>
                    <p className="ap-myauctions-card-subtitle">
                      Auction No: {auction.auctionNo}
                    </p>
                  </div>
                  <div className="ap-myauctions-card-info">
                    <div className="ap-myauctions-info-item">
                      <span className="ap-myauctions-info-label">Date &amp; Time:</span>
                      <p className="ap-myauctions-info-value">
                        <Calendar className="w-4 h-4" />
                        {auction.auctionDate} at {auction.auctionStartTime}
                      </p>
                    </div>
                      {activeTab !== 'participant' && (
                        <div className="ap-myauctions-info-item">
                          <span className="ap-myauctions-info-label">Participants:</span>
                          <p className="ap-myauctions-info-value">
                            <Users className="w-4 h-4" />
                            {getParticipantCount(auction)}
                          </p>
                        </div>
                      )}
                    {/* Show auctioneer info only in participant tab */}
                    {activeTab === 'participant' && auction.auctioneerCompany && (
                      <div className="ap-myauctions-info-item">
                        <span className="ap-myauctions-info-label">Auctioneer:</span>
                        <p className="ap-myauctions-info-value">
                          <Gavel className="w-4 h-4" />
                          {auction.auctioneerCompany}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="ap-myauctions-card-meta">
                    {derivedStatus === 'upcoming' && (
                      <div className="ap-myauctions-countdown" title="Time until auction starts">
                        Starts in: {formatCountdown(startsInMs)}
                      </div>
                    )}
                    {derivedStatus === 'live' && (
                      <div className="ap-myauctions-countdown" title="Auction in progress (time remaining)">
                        Live • {formatCountdown(Math.max(endsInMs, 0))}
                      </div>
                    )}
                  </div>
                  <div className="ap-myauctions-card-actions">
                    <Link
                      to={isCreatedByUser(auction) 
                        ? `/dashboard/my-auction/${auction.backendId || auction.id}`
                        : `/dashboard/auction/${auction.backendId || auction.id}`
                      }
                      className="ap-myauctions-action-btn ap-myauctions-view-btn"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </Link>
                    {derivedStatus === 'live' && (
                      activeTab === 'participant' ? (
                        <button
                          onClick={async (e) => {
                            e.preventDefault();
                            console.log('[MyAuctions] Join as Participant clicked for auction:', auction);
                            if (!auction.backendId && !auction.id) {
                              console.error('[MyAuctions] No auction ID found');
                              return;
                            }
                            const targetId = auction.backendId || auction.id;
                            console.log('[MyAuctions] Using auction ID:', targetId);
                            try {
                              const button = e.currentTarget as HTMLButtonElement;
                              if (button) {
                                button.disabled = true;
                                button.innerText = 'Joining...';
                              }
                              const { default: newAuctionService } = await import('../../../services/newAuctionService');
                              const { joinParticipant } = await import('../../../services/apiAuctionService');
                              console.log('[MyAuctions] Trying new join API with ID:', targetId);
                              let joined = false;
                              try {
                                const numId = Number(targetId);
                                if (!isNaN(numId) && user?.phoneNumber) {
                                  const result = await newAuctionService.joinAuction({
                                    auction_id: numId,
                                    phone_number: user.phoneNumber,
                                  });
                                  console.log('[MyAuctions] new joinAuction result:', result);
                                  joined = !!result?.success;
                                }
                              } catch (newErr) {
                                console.warn('[MyAuctions] new join API failed, will try legacy', newErr);
                              }
                              if (!joined) {
                                console.log('[MyAuctions] Falling back to legacy joinParticipant with ID:', targetId);
                                const legacy = await joinParticipant(targetId);
                                console.log('[MyAuctions] legacy joinParticipant result:', legacy);
                              }
                              console.log('[MyAuctions] Navigating to participant session:', `/dashboard/participant-auction/${targetId}`);
                              navigate(`/dashboard/participant-auction/${targetId}`);
                            } catch (err: any) {
                              console.error('[MyAuctions] joinParticipant failed:', err);
                              console.error('[MyAuctions] Error details:', err?.message, err?.stack);
                              alert(err?.message || 'Failed to join auction');
                            } finally {
                              const button = e.currentTarget as HTMLButtonElement;
                              if (button) {
                                button.disabled = false;
                                button.innerText = 'Join as Participant';
                              }
                            }
                          }}
                          className="ap-myauctions-action-btn ap-myauctions-join-btn"
                        >
                          <Play className="w-4 h-4" />
                          Join as Participant
                        </button>
                      ) : (
                        <Link
                          to={`/dashboard/auctioneer-live/${auction.backendId || auction.id}`}
                          className="ap-myauctions-action-btn ap-myauctions-live-btn"
                        >
                          <Gavel className="w-4 h-4" />
                          Join as Auctioneer
                        </Link>
                      )
                    )}
                    {derivedStatus === 'upcoming' && activeTab === 'auctioneer' && remainingToStart(auction) <= 60 * 1000 && remainingToStart(auction) <= 0 && (
                      <Link
                        to={`/dashboard/auctioneer-live/${auction.backendId || auction.id}`}
                        className="ap-myauctions-action-btn ap-myauctions-start-btn"
                      >
                        <Play className="w-4 h-4" />
                        Start Live Auction
                      </Link>
                    )}
                    {derivedStatus === 'completed' && (
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
                {activeTab === 'auctioneer'
                  ? "You haven't created any auctions yet. Start by creating your first auction!"
                  : "You haven't participated in any auctions yet. You need to be added as a participant by the auctioneer to see auctions here."
                }
              </p>
              {activeTab === 'auctioneer' && (
                <Link to="/dashboard/new-auction" className="ap-myauctions-empty-action">
                  <Plus className="w-4 h-4" />
                  Create First Auction
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyAuctions
