import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { User, Phone, School, Mail, MapPin } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import toast from "react-hot-toast";
import "./MyProfile.css";
import BusinessIcon from "@mui/icons-material/Business";

interface ProfileForm {
  phoneNumber: string;
  email?: string;
  name?: string;
  companyName?: string;
  companyAddress?: string;
}

const MyProfile: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { user, updateProfile } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileForm>({
    defaultValues: {
      phoneNumber: user?.phoneNumber || "",
      email: user?.email || "",
      name: user?.name || "",
      companyName: user?.companyName || "",
      companyAddress: user?.companyAddress || "",
    },
  });

  const onSubmit = async (data: ProfileForm) => {
    setIsLoading(true);
    try {
      await updateProfile(data);
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update profile"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="">
      {/* Header */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            Manage your account information
          </h1>
        </div>
      </div>

      {/* Profile Form */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2">
            Profile Information
          </h2>
        </div>

        <div className="card-body">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Phone Number – read-only */}
              <div className="form-group">
                <label htmlFor="phoneNumber" className="form-label">
                  <Phone className="w-4 h-4 inline mr-2" />
                  <span>Phone No</span>
                </label>
                <input
                  type="tel"
                  id="phoneNumber"
                  className="form-input"
                  {...register("phoneNumber")} // no rules at all
                  disabled={true} // locked
                />
              </div>

              {/* Email */}
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  <Mail className="w-4 h-4 inline mr-2" />
                  <span>
                    Mail Id<span className="text-red-500">*</span>
                  </span>
                </label>
                <input
                  type="email"
                  id="email"
                  className={`form-input ${errors.email ? "error" : ""}`}
                  placeholder="Enter your email address"
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Please enter a valid email address",
                    },
                  })}
                />
                {errors.email && (
                  <div className="form-error">{errors.email.message}</div>
                )}
              </div>

              {/* Person Name */}
              <div className="form-group">
                <label htmlFor="name" className="form-label">
                  <User className="w-4 h-4 inline mr-2" />
                  <span>
                    Person Name<span className="text-red-500">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  id="name"
                  className={`form-input ${errors.name ? "error" : ""}`}
                  placeholder="Enter your full name"
                  {...register("name", {
                    required: "Name is required",
                    minLength: {
                      value: 2,
                      message: "Name must be at least 2 characters",
                    },
                    maxLength: {
                      value: 50,
                      message: "Name must not exceed 50 characters",
                    },
                    pattern: {
                      value: /^[a-zA-Z\s]+$/,
                      message: "Name can only contain letters and spaces",
                    },
                  })}
                />
                {errors.name && (
                  <div className="form-error">{errors.name.message}</div>
                )}
              </div>

              {/* Company Name */}
              <div className="form-group">
                <label htmlFor="companyName" className="form-label">
                  <BusinessIcon className="w-4 h-4 inline mr-2" />
                  <span>
                    Company Name<span className="text-red-500">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  id="companyName"
                  className={`form-input ${errors.companyName ? "error" : ""}`}
                  placeholder="Enter your company name"
                  {...register("companyName", {
                    required: "Company name is required",
                    minLength: {
                      value: 2,
                      message: "Company name must be at least 2 characters",
                    },
                    maxLength: {
                      value: 100,
                      message: "Company name must not exceed 100 characters",
                    },
                  })}
                />
                {errors.companyName && (
                  <div className="form-error">{errors.companyName.message}</div>
                )}
              </div>
            </div>

            {/* Company Address */}
            <div className="form-group">
              <label htmlFor="companyAddress" className="form-label">
                <MapPin className="w-4 h-4 inline mr-2" />
                <span>
                  Company Address<span className="text-red-500">*</span>
                </span>
              </label>
              <textarea
                id="companyAddress"
                rows={3}
                className={`form-input ${errors.companyAddress ? "error" : ""}`}
                placeholder="Enter your company address"
                {...register("companyAddress", {
                  required: "Company address is required",
                  minLength: {
                    value: 10,
                    message: "Address must be at least 10 characters",
                  },
                  maxLength: {
                    value: 500,
                    message: "Address must not exceed 500 characters",
                  },
                })}
              />
              {errors.companyAddress && (
                <div className="form-error">
                  {errors.companyAddress.message}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => reset()}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary"
              >
                {isLoading ? <div className="loading-spinner" /> : "Save"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Account Information */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-semibold text-text-primary">
            Account Information
          </h2>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col">
              <label className="form-label">Account Type</label>
              <div className="p-3 bg-background-color rounded-lg border h-full flex flex-col justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {user?.role === "admin"
                      ? "Administrator"
                      : "User Panel (Auctioneer + Participant)"}
                  </span>
                </div>
                <p className="text-sm text-text-secondary mt-1">
                  {user?.role === "admin"
                    ? "Full system access with admin privileges"
                    : "Single login for company users - can act as both Auctioneer and Participant"}
                </p>
              </div>
            </div>

            <div className="flex flex-col">
              <label className="form-label">User ID</label>
              <div className="p-3 bg-background-color rounded-lg border h-full flex flex-col justify-between">
                <p className="text-xs text-text-secondary mt-1">
                  Unique identifier for your account
                </p>
                <div className="font-mono text-sm">{user?.id}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyProfile;