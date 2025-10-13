import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import authService from "../services/authService";
import profileService from "../services/profileService";
import toast from "react-hot-toast";

export interface User {
  id: string;
  phoneNumber: string;
  name?: string;
  email?: string;
  companyName: string;
  companyAddress: string;
  personName: string;
  mailId: string;
  role: "auctioneer" | "participant" | "admin";
  isVerified: boolean;
  createdAt?: string;
  gstn_number: string;
  company_product_service: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  token: string | null;
  login: (phoneNumber: string) => Promise<void>;
  verifyOTP: (otp: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  forgotPassword: (phoneNumber: string) => Promise<void>;
  refreshToken: () => Promise<void>;
  syncProfile: () => Promise<void>; // Add this to manually trigger sync
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper function to merge user data from backend
  const mergeUserData = (
    backendUser: any,
    fallbackUser: User | null = null
  ): User => {
    const base = fallbackUser || user;
    return {
      id:
        backendUser.id ||
        backendUser.user_id ||
        base?.id ||
        Date.now().toString(),
      phoneNumber:
        backendUser.phoneNumber ||
        backendUser.phone_number ||
        base?.phoneNumber ||
        "",
      name:
        backendUser.name ||
        backendUser.personName ||
        backendUser.person_name ||
        base?.name,
      email: backendUser.email || backendUser.mailId || base?.email,
      companyName:
        backendUser.companyName ||
        backendUser.company_name ||
        base?.companyName ||
        "",
      companyAddress:
        backendUser.companyAddress ||
        backendUser.company_address ||
        base?.companyAddress ||
        "",
      personName:
        backendUser.personName ||
        backendUser.person_name ||
        backendUser.name ||
        base?.personName ||
        "",

      mailId: backendUser.mailId || backendUser.email || base?.mailId || "",
      role: (backendUser.role || base?.role || "participant") as User["role"],
      isVerified: backendUser.isVerified ?? base?.isVerified ?? true,
      createdAt:
        backendUser.createdAt ||
        backendUser.created_at ||
        base?.createdAt ||
        new Date().toISOString(),
      gstn_number:
        backendUser.gstn_number ||
        backendUser.gstnumber ||
        base?.gstn_number ||
        "",
      company_product_service:
        backendUser.company_product_service ||
        backendUser.companyproductservice ||
        base?.company_product_service ||
        "",
    };
  };

  // Function to sync profile data
  const syncProfile = async (): Promise<void> => {
    const storedToken = token || localStorage.getItem("authToken");
    if (!storedToken) return;

    try {
      const res = await profileService.getProfile(storedToken);
      if (!res?.user) return;

      const currentUser =
        user || JSON.parse(localStorage.getItem("auctionUser") || "null");
      const mergedUser = mergeUserData(res.user, currentUser);

      // Only update if data actually changed
      setUser((prev) => {
        const hasChanged =
          !prev || JSON.stringify(prev) !== JSON.stringify(mergedUser);
        if (hasChanged) {
          localStorage.setItem("auctionUser", JSON.stringify(mergedUser));
          return mergedUser;
        }
        return prev;
      });
    } catch (err) {
      console.warn("Profile sync failed:");
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Load stored user and token
        const storedUserRaw = localStorage.getItem("auctionUser");
        const storedToken = localStorage.getItem("authToken");

        let parsedUser: User | null = null;
        if (storedUserRaw) {
          try {
            parsedUser = JSON.parse(storedUserRaw);
          } catch {
            console.warn("Failed to parse stored user data");
          }
        }

        // Set initial state
        if (parsedUser) setUser(parsedUser);
        if (storedToken) setToken(storedToken);

        // Initialize auction service if user exists
        if (parsedUser) {
          try {
            const AuctionService =
              require("../services/auctionService").default;
            AuctionService.setCurrentUser(parsedUser);
            // Defer heavy initialization
            setTimeout(() => {
              try {
                AuctionService.initializeData();
              } catch (e) {
                console.warn("Auction data init failed", e);
              }
            }, 100);
          } catch (e) {
            console.warn("Auction service init error", e);
          }
        }

        // Sync profile data immediately if we have a token
        if (storedToken) {
          try {
            const res = await profileService.getProfile(storedToken);
            if (res?.user) {
              const mergedUser = mergeUserData(res.user, parsedUser);

              // Check if we need to update the user data
              const needsUpdate =
                !parsedUser ||
                parsedUser.name === "Please update your name" ||
                parsedUser.personName === "Please update your name" ||
                parsedUser.companyName === "Please update your company" ||
                parsedUser.companyAddress === "Please update your address" ||
                parsedUser.mailId === "Please update your email" ||
                JSON.stringify(parsedUser) !== JSON.stringify(mergedUser);

              if (needsUpdate) {
                setUser(mergedUser);
                localStorage.setItem("auctionUser", JSON.stringify(mergedUser));
              }
            }
          } catch (err) {
            console.warn("Initial profile sync failed:");
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const refreshToken = async (): Promise<void> => {
    try {
      // Implement token refresh logic here if your API supports it
      // For now, we'll just keep the existing token
      const storedToken = localStorage.getItem("authToken");
      if (storedToken) {
        setToken(storedToken);
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
      logout();
    }
  };

  const login = async (phoneNumber: string): Promise<void> => {
    setLoading(true);
    try {
      // Format phone number
      let formattedPhone = phoneNumber.trim();
      if (!formattedPhone.startsWith("+")) {
        formattedPhone = "+91" + formattedPhone.replace(/^0+/, "");
      }

      // Call send OTP API
      const response = await authService.sendOTP({
        phone_number: formattedPhone,
      });

      if (response.success) {
        // Store phone number and session ID for OTP verification
        localStorage.setItem("pendingPhoneNumber", formattedPhone);

        // Store session ID if provided by the API
        if (response.data && response.data.sessionId) {
          localStorage.setItem("sessionId", response.data.sessionId);
        } else if (response.sessionId) {
          localStorage.setItem("sessionId", response.sessionId);
        }
      } else {
        throw new Error(response.message || "Failed to send OTP");
      }
    } catch (error) {
      console.error("Login error:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to send OTP"
      );
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (otp: string): Promise<void> => {
    setLoading(true);
    try {
      const phoneNumber = localStorage.getItem("pendingPhoneNumber");
      const sessionId = localStorage.getItem("sessionId");
      if (!phoneNumber) {
        throw new Error("No pending phone number found");
      }
      if (!sessionId) {
        throw new Error("Session ID not found. Please request OTP again.");
      }

      // Validate OTP format
      if (!/^\d{4,8}$/.test(otp)) {
        throw new Error("Invalid OTP format");
      }

      // Call verify OTP API
      const response = await authService.verifyOTP({
        sessionId: sessionId,
        otp: otp.trim(),
        phone_number: phoneNumber,
      });

      if (response.success) {
        // Handle successful verification
        let userData: User;

        if (response.user) {
          // Use user data from API response and merge properly
          userData = mergeUserData(response.user);
        } else {
          // Fallback: Check existing users or create new one
          const AuctionService = require("../services/auctionService").default;
          const normalizedPhone = phoneNumber.replace(/\D/g, "");
          let existingUser =
            AuctionService.getUserByPhone(phoneNumber) ||
            AuctionService.getUserByPhone(`+91${normalizedPhone}`) ||
            AuctionService.getUserByPhone(normalizedPhone);
          

          if (existingUser) {
            userData = {
              id: existingUser.id,
              phoneNumber: existingUser.phoneNumber,
              name: existingUser.personName,
              email: existingUser.mailId,
              companyName: existingUser.companyName,
              companyAddress: existingUser.companyAddress,
              personName: existingUser.personName,
              mailId: existingUser.mailId,
              role: existingUser.role,
              isVerified: existingUser.isVerified,
              createdAt: existingUser.createdAt,
              gstn_number: existingUser.gstn_number,
              company_product_service: existingUser.company_product_service
            };
          } else {
            // Create new user
            let newUserId = Date.now().toString();
            let userRole: "auctioneer" | "participant" | "admin" =
              "participant";

            // Handle special demo phone numbers
            if (
              normalizedPhone === "9876543210" ||
              phoneNumber.includes("9876543210")
            ) {
              newUserId = "user1";
              userRole = "auctioneer";
            } else if (
              normalizedPhone === "9123456789" ||
              phoneNumber.includes("9123456789")
            ) {
              newUserId = "user2";
              userRole = "participant";
            } else if (
              normalizedPhone === "8765432109" ||
              phoneNumber.includes("8765432109")
            ) {
              newUserId = "user3";
              userRole = "participant";
            } else if (
              normalizedPhone === "9999999999" ||
              phoneNumber.includes("9999999999")
            ) {
              newUserId = "admin1";
              userRole = "admin";
            }

            userData = {
              id: newUserId,
              phoneNumber,
              name: "New User",
              email: "",
              companyName: "Please update your company",
              companyAddress: "Please update your address",
              personName: "Please update your name",
              mailId: "Please update your email",
              role: userRole,
              isVerified: true,
              createdAt: new Date().toISOString(),
              gstn_number: "",
              company_product_service: ""
            };
          }
        }

        

        setUser(userData);
        localStorage.setItem("auctionUser", JSON.stringify(userData));

        // Store auth token if provided
        if (response.token) {
          setToken(response.token);
          localStorage.setItem("authToken", response.token);

          // Immediately sync profile data after login to get latest info
          setTimeout(() => syncProfile(), 100);
        }

        localStorage.removeItem("pendingPhoneNumber");
        localStorage.removeItem("sessionId");
      } else {
        throw new Error(response.message || "OTP verification failed");
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = (): void => {
    setUser(null);
    setToken(null);
    profileService.clearCache();
    localStorage.removeItem("auctionUser");
    localStorage.removeItem("pendingPhoneNumber");
    localStorage.removeItem("sessionId");
    localStorage.removeItem("authToken");
  };

  const updateProfile = async (data: Partial<User>): Promise<void> => {
    if (!user) throw new Error("No user logged in");
    setLoading(true);
    try {
      // Build backend payload
      const payload: any = {};
      if (data.phoneNumber && data.phoneNumber !== user.phoneNumber) {
        let pn = data.phoneNumber.trim();
        if (!pn.startsWith("+")) pn = "+91" + pn.replace(/^0+/, "");
        payload.phone_number = pn;
      }
      if (data.name || data.personName)
        payload.person_name = data.name || data.personName;

        if (data.gstn_number !== undefined)
          payload.gstn_number = data.gstn_number;
        if (data.company_product_service !== undefined)
          payload.company_product_service = data.company_product_service;
      


      if (data.email || data.mailId) payload.email = data.email || data.mailId;
      if (data.companyName) payload.company_name = data.companyName;
      if (data.companyAddress) payload.company_address = data.companyAddress;

      // Optimistic update
      const optimistic: User = {
        ...user,
        phoneNumber: payload.phone_number || user.phoneNumber,
        name: payload.person_name || data.name || user.name,
        email: payload.email || data.email || user.email,
        companyName:
          payload.company_name || data.companyName || user.companyName,
        companyAddress:
          payload.company_address || data.companyAddress || user.companyAddress,
        personName: payload.person_name || data.name || user.personName,
        mailId: payload.email || data.email || user.mailId,
        gstn_number:
          data.gstn_number !== undefined ? data.gstn_number : user.gstn_number,
        company_product_service:
          data.company_product_service !== undefined
            ? data.company_product_service
            : user.company_product_service,
      };

      setUser(optimistic);
      localStorage.setItem("auctionUser", JSON.stringify(optimistic));

      // Call backend
      const response = await profileService.updateProfile(user.id, payload);
      if (response.user) {
        const merged = mergeUserData(response.user, optimistic);
        setUser(merged);
        localStorage.setItem("auctionUser", JSON.stringify(merged));
      }

      toast.success("Profile updated successfully!");
    } catch (error: any) {
      console.error("Profile update error:", error);
      // Revert optimistic update on error
      await syncProfile();
      throw new Error(error?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (phoneNumber: string): Promise<void> => {
    setLoading(true);
    try {
      // Format phone number
      let formattedPhone = phoneNumber.trim();
      if (!formattedPhone.startsWith("+")) {
        formattedPhone = "+91" + formattedPhone.replace(/^0+/, "");
      }

      // Call send OTP API for password reset
      const response = await authService.sendOTP({
        phone_number: formattedPhone,
      });

      if (response.success) {
        // Store phone number and session ID for OTP verification
        localStorage.setItem("pendingPhoneNumber", formattedPhone);

        // Store session ID if provided by the API
        if (response.data && response.data.sessionId) {
          localStorage.setItem("sessionId", response.data.sessionId);
        } else if (response.sessionId) {
          localStorage.setItem("sessionId", response.sessionId);
        }

        
      } else {
        throw new Error(response.message || "Failed to send reset OTP");
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to send reset OTP"
      );
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    token,
    login,
    verifyOTP,
    logout,
    updateProfile,
    forgotPassword,
    refreshToken,
    syncProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};