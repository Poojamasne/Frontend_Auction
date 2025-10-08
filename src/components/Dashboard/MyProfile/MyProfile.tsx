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
        <div className="card-body">
          {/* <div className="font-mono text-sm">{user?.id}</div> */}
          <label htmlFor="companyAddress" className="Set-btn">
            <span>USER ID</span>
            <div>{user?.id}</div>
          </label>
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
            <div className="space-y-4">
              {/* First Row: Phone, Email, Name */}
              <div className="grid sm:grid-cols-1 md:grid-cols-4 gap-6">
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
                    {...register("phoneNumber")}
                    disabled={true}
                  />
                </div>

                {/* Email */}
                <div className="form-group">
                  <label htmlFor="email" className="form-label">
                    <Mail className="w-4 h-4 inline mr-2" />
                    <span>
                      Mail Id<span className="required">*</span>
                    </span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="form-input"
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
                      Person Name<span className="required">*</span>
                    </span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="form-input"
                    placeholder="Enter your full name"
                    {...register("name", {
                      required: "Name is required",
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

                <div className="form-group">
                  <label htmlFor="companyName" className="form-label">
                    <BusinessIcon className="w-4 h-4 inline mr-2" />
                    <span>
                      Company Name<span className="required">*</span>
                    </span>
                  </label>
                  <input
                    type="text"
                    id="companyName"
                    className="form-input"
                    placeholder="Enter your company name"
                    {...register("companyName", {
                      required: "Company name is required",
                    })}
                  />
                  {errors.companyName && (
                    <div className="form-error">
                      {errors.companyName.message}
                    </div>
                  )}
                </div>
              </div>

              {/* Second Row: Company Name */}
              {/* <div className="form-group">
                <label htmlFor="companyName" className="form-label">
                  <BusinessIcon className="w-4 h-4 inline mr-2" />
                  <span>
                    Company Name<span className="required">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  id="companyName"
                  className="form-input"
                  placeholder="Enter your company name"
                  {...register("companyName", {
                    required: "Company name is required",
                  })}
                />
                {errors.companyName && (
                  <div className="form-error">{errors.companyName.message}</div>
                )}
              </div> */}
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
                })}
              />
              {errors.companyAddress && (
                <div className="form-error">
                  {errors.companyAddress.message}
                </div>
              )}
            </div>

            {/* <div className="font-mono text-sm">{user?.id}</div> */}
            {/* we showing User ID */}

            {/* <div className="form-group">
              <label htmlFor="companyAddress" className="form-label">
                <span>
                  USER ID<span className="text-red-500">*</span>
                </span>
                <div className="font-mono text-sm">{user?.id}</div>
              </label>
            </div> */}

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

    </div>
  );
};

export default MyProfile;
