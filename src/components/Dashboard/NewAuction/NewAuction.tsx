/* ------------------------------------------------------------------ */
/*  NewAuction.tsx  –  Clean, builds, participants always saved       */
/* ------------------------------------------------------------------ */
import React, { useMemo, useRef, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { format, isToday } from "date-fns";
import {
  Calendar,
  Clock,
  Users,
  FileText,
  Upload,
  Plus,
  Trash2,
  IndianRupee,
  ArrowDown,
} from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import toast from "react-hot-toast";
import AuctionService from "../../../services/newAuctionService";
import { CreateAuctionRequest } from "../../../types/auction";
import "./NewAuction.css";

/* -------------------------- types --------------------------------- */
interface Participant {
  companyName: string;
  companyAddress: string;
  personName: string;
  mailId: string;
  contactNumber: string;
  _quick?: boolean;
}

interface AuctionForm {
  title: string;
  auctionDate: string;
  auctionStartTime: string;
  duration: number;
  openToAllCompanies: boolean;
  currency: "INR" | "USD";
  auctionDetails: string;
  decrementalValue?: number;
  participants: Participant[];
}

/* ------------------------ constants ------------------------------- */
const PHONE_REGEX = /^(\+91)?[6-9]\d{9}$/;
const MAX_FILES = 3;
const MAX_FILE_MB = 15;

/* ================================================================== */
const NewAuction: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const todayISO = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);

  /* -------------- react-hook-form -------------- */
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
    setError,
    clearErrors,
  } = useForm<AuctionForm>({
    defaultValues: {
      title: "",
      auctionDate: todayISO,
      auctionStartTime: format(new Date(), "HH:mm"),
      duration: 120,
      openToAllCompanies: true,
      currency: "INR",
      auctionDetails: "",
      participants: [],
    },
    mode: "onSubmit",
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "participants",
  });

  const [newParticipantPhone, setNewParticipantPhone] = useState("");
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");

  const watchOpenToAll = watch("openToAllCompanies");
  const watchAuctionDate = watch("auctionDate");
  const watchAuctionStartTime = watch("auctionStartTime");

  /* -------------- side-effects -------------- */
  React.useEffect(() => {
    if (!watchAuctionDate || !watchAuctionStartTime) return;
    if (!isToday(new Date(watchAuctionDate))) return;
    const now = format(new Date(), "HH:mm");
    if (watchAuctionStartTime < now) {
      setError("auctionStartTime", {
        type: "manual",
        message: "Start time must be in the future for today's date",
      });
    } else {
      clearErrors("auctionStartTime");
    }
  }, [watchAuctionDate, watchAuctionStartTime, setError, clearErrors]);

  /* -------------- helpers -------------- */
  const normalizedPhone = (raw: string): string => {
    const trimmed = raw.trim();
    const noLeadingZeros = trimmed.startsWith("0")
      ? trimmed.replace(/^0+/, "")
      : trimmed;
    let candidate = noLeadingZeros.startsWith("+")
      ? noLeadingZeros
      : noLeadingZeros;
    if (!candidate.startsWith("+91")) {
      if (/^[6-9]\d{9}$/.test(candidate)) candidate = `+91${candidate}`;
    }

    return candidate;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    // Filter out files exceeding size
    const validFiles = files.filter((f) => {
      if (f.size > MAX_FILE_MB * 1024 * 1024) {
        toast.error(`"${f.name}" exceeds ${MAX_FILE_MB} MB`);
        return false;
      }
      return true;
    });

    // Deduplicate based on name + size
    const dedup = validFiles.filter(
      (f) => !uploadedFiles.some((u) => u.name === f.name && u.size === f.size)
    );

    // Check file count limit
    if (uploadedFiles.length + dedup.length > MAX_FILES) {
      toast.error(`Max ${MAX_FILES} files allowed`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Update state if valid files found
    if (dedup.length > 0) {
      setUploadedFiles((prev) => [...prev, ...dedup]);
      toast.success(`${dedup.length} file(s) uploaded successfully`);
    } else {
      toast.error("No new valid files to upload");
    }

    // Reset input so user can re-select the same file again
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (idx: number) => {
    setUploadedFiles((p) => p.filter((_, i) => i !== idx));
    toast.success("File removed");
  };

  const addParticipantByPhone = () => {
    const norm = normalizedPhone(newParticipantPhone);
    if (!PHONE_REGEX.test(norm)) {
      toast.error("Enter valid Indian number");
      return;
    }
    if (user?.phoneNumber && normalizedPhone(user.phoneNumber) === norm) {
      toast.error("You cannot add your own number");
      return;
    }
    const exists = fields.some(
      (f) => normalizedPhone(f.contactNumber) === norm
    );
    if (exists) {
      toast.error("Number already added");
      return;
    }
    append({
      companyName: "",
      companyAddress: "",
      personName: "",
      mailId: "",
      contactNumber: norm,
      _quick: true,
    });
    toast.success("Participant added");
    setNewParticipantPhone("");
  };

  /* -------------- submit -------------- */
  const onSubmit = async (data: AuctionForm) => {
    if (isSubmitting) return;
    if (!user || !AuctionService.isAuthenticated()) {
      toast.error("Please log in");
      navigate("/login");
      return;
    }
    setIsSubmitting(true);

    try {
      /* 1. phones – always build */
      const phones = data.participants
        .map((p) => normalizedPhone(p.contactNumber))
        .filter((p) => PHONE_REGEX.test(p));
      const uniquePhones = Array.from(new Set(phones));

      /* 2. validate only when closed */
      if (!data.openToAllCompanies && uniquePhones.length === 0) {
        toast.error(
          'Add at least one participant when auction is not "Open to all"'
        );
        return;
      }

      const startTime =
        data.auctionStartTime.length === 5
          ? `${data.auctionStartTime}:00`
          : data.auctionStartTime;

      /* 3. payload – always send the list */
      const payload: CreateAuctionRequest = {
        title: data.title.trim(),
        description: data.auctionDetails.trim(),
        auction_date: data.auctionDate,
        start_time: startTime,
        duration: data.duration,
        currency: data.currency,
        base_price: 0,
        decremental_value: data.decrementalValue ?? 0,
        pre_bid_allowed: true,
        open_to_all: data.openToAllCompanies,
        send_invitations: !data.openToAllCompanies,
        participants: uniquePhones,
      };

      const res = await AuctionService.createAuction(payload, uploadedFiles);
      if (!res.success) throw new Error(res.message || "Creation failed");

      toast.success(res.message || `Auction "${res.auction.title}" created!`);
      reset({
        title: "",
        auctionDate: todayISO,
        auctionStartTime: format(new Date(), "HH:mm"),
        duration: 120,
        openToAllCompanies: true,
        currency: "INR",
        auctionDetails: "",
        participants: [],
      });
      setUploadedFiles([]);
      setTimeout(
        () => navigate(`/dashboard/my-auction/${res.auction.id}`),
        1200
      );
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Creation error");
      if (/auth|session/i.test(e.message)) {
        AuctionService.clearAuth();
        navigate("/login");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /* -------------- render -------------- */
  return (
    <div className="ap-newauction-wrapper">
      <div className="ap-newauction-container">
        <div className="card mb-6">
          <div className="card-header flex items-center justify-between">
            <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
              Create New Auction
            </h1>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent text-white text-sm font-medium">
              <Users className="w-4 h-4 mr-2" />
              Auctioneer
            </span>
          </div>
          <div className="card-body">
            <p className="text-text-secondary text-sm">
              Set up a new auction with participants and terms
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-text-primary">
                Basic Information
              </h2>
            </div>
            <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label className="form-label">
                  <FileText className="w-4 h-4 inline mr-2" />
                  <span>
                    Auction Title<span className="required">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter Auction Title"
                  {...register("title", {
                    required: "Required",
                    minLength: { value: 5, message: "Min 5 chars" },
                  })}
                />
                {errors.title && (
                  <p className="form-error">{errors.title.message}</p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  <span>
                    Auction Date<span className="required">*</span>
                  </span>
                </label>
                <input
                  type="date"
                  min={todayISO}
                  className="form-input"
                  {...register("auctionDate", {
                    required: "Required",
                    validate: (v) => v >= todayISO || "Cannot be in the past",
                  })}
                />
                {errors.auctionDate && (
                  <p className="form-error">{errors.auctionDate.message}</p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Clock className="w-4 h-4 inline mr-2" />
                  <span>
                    Start Time<span className="required">*</span>
                  </span>
                </label>
                <input
                  type="time"
                  className="form-input"
                  {...register("auctionStartTime", {
                    required: "Required",
                  })}
                />
                {errors.auctionStartTime && (
                  <p className="form-error">
                    {errors.auctionStartTime.message}
                  </p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Clock className="w-4 h-4 inline mr-2" />
                  <span>
                    Duration<span className="required">*</span>
                  </span>
                </label>
                <select className="form-input" {...register("duration")}>
                  <option value={15}>15 Minutes</option>
                  <option value={30}>30 Minutes</option>
                  <option value={60}>1 Hour</option>
                  <option value={120}>2 Hours</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <IndianRupee className="w-4 h-4 inline mr-2" />
                  <span>
                    Currency<span className="required">*</span>
                  </span>
                </label>
                <select className="form-input" {...register("currency")}>
                  <option value="INR">INR</option>
                  <option value="USD">USD</option>
                </select>
              </div>

              <div className="form-group md:col-span-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="form-checkbox"
                    {...register("openToAllCompanies")}
                  />
                  <span>Open to all companies (Suppliers)</span>
                </label>
                <div className="form-helper-text">
                  {watchOpenToAll
                    ? "✓ Visible to every participant"
                    : "⚠️ Only invited participants can view"}
                </div>
              </div>
            </div>
          </div>

          {/* Product Details */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-text-primary">
                Product Details
              </h2>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">
                  <FileText className="w-4 h-4 inline mr-2" />
                  <span>
                    Product Details / Description
                    <span className="required">*</span>
                  </span>
                </label>
                <textarea
                  rows={4}
                  className="form-input"
                  placeholder="Detailed description..."
                  {...register("auctionDetails", {
                    required: "Required",
                    minLength: { value: 10, message: "Min 10 chars" },
                  })}
                />
                {errors.auctionDetails && (
                  <p className="form-error">{errors.auctionDetails.message}</p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  <ArrowDown className="w-4 h-4 inline mr-2" />
                  <span>
                    Decremental Value<span className="required">*</span>
                  </span>
                </label>
                <input
                  type="number"
                  min={1}
                  step={1}
                  className="form-input"
                  placeholder="Add Bid Amount"
                  {...register("decrementalValue", {
                    valueAsNumber: true,
                    min: { value: 1, message: "Min 1" },
                  })}
                />
                {errors.decrementalValue && (
                  <p className="form-error">
                    {errors.decrementalValue.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-text-primary">
                Auction Documents
              </h2>
              <p className="text-text-secondary">
                Optional – up to {MAX_FILES} files, {MAX_FILE_MB} MB each (E.g Pdf And Images)
              </p>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">
                  <Upload className="w-4 h-4 inline mr-2" />
                  Upload Documents
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="*/*"
                  className="form-input"
                  onChange={handleFileUpload}
                  disabled={uploadedFiles.length >= MAX_FILES}
                />
              </div>

              {uploadedFiles.length > 0 && (
                <div className="space-y-2 mt-4">
                  <h4 className="font-medium text-white">Uploaded Files:</h4>
                  {uploadedFiles.map((file, idx) => (
                    <div
                      key={`${file.name}-${idx}`}
                      className="ap-newauction-file-item"
                    >
                      <div className="file-info">
                        <FileText className="file-icon" />
                        <span className="file-name">{file.name}</span>
                        <span className="file-size">
                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="file-remove-btn"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Participants */}
          <div className="card">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-text-primary">
                    Add Participants
                  </h2>
                  <p className="text-text-secondary mt-2">
                    Phone number is the primary identifier.
                    {watchOpenToAll
                      ? " Invitations are optional "
                      : " Only invited participants can join."}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="tel"
                    placeholder="Add phone"
                    value={newParticipantPhone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, ""); // Remove non-digits
                      if (value.length <= 10) {
                        // Only update if length is <= 10
                        setNewParticipantPhone(value);
                      }
                    }}
                    maxLength={10}
                    pattern="[0-9]{10}"
                    className="form-input"
                  />
                  <button
                    type="button"
                    onClick={addParticipantByPhone}
                    className="btn btn-primary"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkOpen((s) => !s)}
                    className="btn btn-secondary"
                  >
                    <Plus className="w-4 h-4" />
                    Bulk
                  </button>
                </div>
              </div>
            </div>
            <div className="card-body">
              {fields.length === 0 ? (
                <div className="ap-newauction-empty-state">
                  <Users className="w-12 h-12 text-text-secondary mx-auto mb-4" />
                  <p className="text-text-secondary">
                    No participants added yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {fields.map((field, idx) => (
                    <div
                      key={field.id}
                      className={`ap-newauction-participant-card ${
                        field._quick ? "quick-participant" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-text-primary">
                          Participant {idx + 1}
                        </h4>
                        <button
                          type="button"
                          onClick={() => remove(idx)}
                          className="file-remove-btn"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {!field._quick && (
                          <div className="form-group">
                            <label className="form-label">
                              <span>
                                Company Name<span className="required">*</span>
                              </span>
                            </label>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="Company name"
                              {...register(`participants.${idx}.companyName`, {
                                required: "Required",
                              })}
                            />
                            {errors.participants?.[idx]?.companyName && (
                              <p className="form-error">
                                {errors.participants[idx]?.companyName?.message}
                              </p>
                            )}
                          </div>
                        )}

                        <div className="form-group">
                          <label className="form-label">
                            <span>
                              Contact Number<span className="required">*</span>
                            </span>
                          </label>
                          <input
                            type="tel"
                            className="form-input"
                            placeholder="Phone number"
                            {...register(`participants.${idx}.contactNumber`, {
                              required: "Required",
                              pattern: {
                                value: PHONE_REGEX,
                                message: "Invalid Indian number",
                              },
                              setValueAs: (v: string) => normalizedPhone(v),
                            })}
                          />
                          {errors.participants?.[idx]?.contactNumber && (
                            <p className="form-error">
                              {errors.participants[idx]?.contactNumber?.message}
                            </p>
                          )}
                        </div>

                        {!field._quick && (
                          <>
                            <div className="form-group">
                              <label className="form-label">Person Name</label>
                              <input
                                type="text"
                                className="form-input"
                                placeholder="Contact person"
                                {...register(`participants.${idx}.personName`)}
                              />
                            </div>

                            <div className="form-group">
                              <label className="form-label">Email</label>
                              <input
                                type="email"
                                className="form-input"
                                placeholder="Email address"
                                {...register(`participants.${idx}.mailId`, {
                                  pattern: {
                                    value:
                                      /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                    message: "Invalid email",
                                  },
                                })}
                              />
                              {errors.participants?.[idx]?.mailId && (
                                <p className="form-error">
                                  {errors.participants[idx]?.mailId?.message}
                                </p>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="card">
            <div className="card-body flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  reset({
                    title: "",
                    auctionDate: todayISO,
                    auctionStartTime: format(new Date(), "HH:mm"),
                    duration: 120,
                    openToAllCompanies: true,
                    currency: "INR",
                    auctionDetails: "",
                    participants: [],
                  });
                  setUploadedFiles([]);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="btn btn-secondary"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary"
              >
                {isSubmitting ? (
                  <div className="loading-spinner" />
                ) : (
                  <>Create Auction</>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Bulk Modal */}
        {bulkOpen && (
          <div className="ap-modal-overlay">
            <div className="ap-modal">
              <div className="ap-modal-header">
                <h3 className="text-lg font-semibold">Bulk Add Participants</h3>
              </div>
              <div className="ap-modal-body">
                <p className="text-sm text-text-secondary mb-2">
                  Paste phone numbers separated by newlines, commas or spaces.
                </p>
                <textarea
                  rows={6}
                  className="form-input w-full"
                  placeholder="Enter phone numbers "
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                />
              </div>
              <div className="ap-modal-footer flex items-center justify-end gap-2">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setBulkText("")}
                >
                  Clear
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    const raw = bulkText || "";
                    const parts = raw
                      .split(/[,\n\s]+/)
                      .map((p) => p.trim())
                      .filter(Boolean);
                    const phones: string[] = [];
                    const exists = new Set(
                      fields.map((f) => normalizedPhone(f.contactNumber))
                    );
                    for (const p of parts) {
                      const n = normalizedPhone(p);
                      if (!PHONE_REGEX.test(n)) continue;
                      if (
                        user?.phoneNumber &&
                        normalizedPhone(user.phoneNumber) === n
                      )
                        continue;
                      if (exists.has(n) || phones.includes(n)) continue;
                      phones.push(n);
                    }
                    if (!phones.length) {
                      toast.error("No valid/new numbers");
                      return;
                    }
                    phones.forEach((num) =>
                      append({
                        companyName: "",
                        companyAddress: "",
                        personName: "",
                        mailId: "",
                        contactNumber: num,
                        _quick: true,
                      })
                    );
                    toast.success(`Added ${phones.length} participant(s)`);
                    setBulkText("");
                    setBulkOpen(false);
                  }}
                >
                  Add All
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setBulkOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewAuction;
