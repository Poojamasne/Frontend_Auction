import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Registration.css";
import authService from "../../services/authService";
import toast from "react-hot-toast";
import TermsModal from "../Common/TermsModal";

/* ---------- TYPES ---------- */
interface RegistrationFormState {
  phone: string;
  email: string;
  name: string;
  companyName: string;
  companyAddress: string;
  companyProductService: string;
  otp: string;
}

interface FormErrors {
  phone?: string;
  email?: string;
  name?: string;
  companyName?: string;
  companyAddress?: string;
  companyProductService?: string;
}

/* ---------- COMPONENT ---------- */
export default function Registration() {
  const navigate = useNavigate();

  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<RegistrationFormState>({
    phone: "",
    email: "",
    name: "",
    companyName: "",
    companyAddress: "",
    companyProductService: "",
    otp: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});

  /* ---------- HELPERS ---------- */
  const validateEmail = (email: string): boolean =>
    /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.(com|in|org)$/i.test(email);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let filtered = value;

    setErrors((prev) => ({ ...prev, [name]: undefined }));

    switch (name) {
      case "phone":
        filtered = value.replace(/\D/g, "").slice(0, 10);
        break;
      case "name":
      case "companyName":
        filtered = value.replace(/[^a-zA-Z\s\-.,&']/g, "");
        break;
      case "email":
        filtered = value.replace(/[^a-zA-Z0-9@.\-_]/g, "");
        break;
      case "companyAddress":
        filtered = value.replace(/[^a-zA-Z0-9\s\-.,#/]/g, "");
        break;
      case "companyProductService":
        filtered = value.replace(/[^a-zA-Z0-9\s\-.,&']/g, "");
        break;
      default:
        filtered = value;
    }

    setForm((prev) => ({ ...prev, [name]: filtered }));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!form.phone.trim()) newErrors.phone = "Phone number is required";
    else if (form.phone.length !== 10) newErrors.phone = "Exactly 10 digits";
    else if (!/^[6-9]\d{9}$/.test(form.phone))
      newErrors.phone = "Must start with 6-9";

    if (form.email && !validateEmail(form.email))
      newErrors.email = "Must end with .com, .in or .org";

    if (!form.companyName.trim()) newErrors.companyName = "Required";
    else if (form.companyName.trim().length < 2)
      newErrors.companyName = "≥ 2 characters";

    if (form.name && form.name.trim().length < 2)
      newErrors.name = "≥ 2 characters";

    if (!form.companyProductService.trim())
      newErrors.companyProductService = "Required";

    setErrors(newErrors);
    return !Object.keys(newErrors).length;
  };

  /* ---------- SUBMIT ---------- */
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const res = await authService.register({
        phone_number: `+91${form.phone.trim()}`,
        email: form.email || undefined,
        person_name: form.name || undefined,
        company_name: form.companyName.trim(),
        company_address: form.companyAddress || undefined,
        company_product_service: form.companyProductService || undefined,
      });

      if (res.success) {
        if (res.user) localStorage.setItem("auctionUser", JSON.stringify(res.user));
        if (res.token) localStorage.setItem("authToken", res.token);
        toast.success(res.message || "Registered! Please log in.");
        navigate("/login");
      } else {
        throw new Error(res.message || "Registration failed");
      }
    } catch (err: any) {
      toast.error(err?.message || "Registration failed. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------- RENDER ---------- */
  return (
    <div className="ap-reg-wrapper">
      <div className="ap-reg-card">
        <header className="ap-reg-header">
          <h1 className="ap-reg-title">Create Your Account</h1>
          <p className="ap-reg-sub">Register to participate in auctions</p>
        </header>

        <form className="ap-reg-form" onSubmit={handleSave} noValidate>
          <div className="ap-reg-grid">
            {/* Phone */}
            <div className="ap-reg-field">
              <label htmlFor="phone" className="ap-reg-label">
                Phone Number <span className="ap-reg-required">*</span>
              </label>
              <input
                id="phone"
                type="tel"
                name="phone"
                required
                inputMode="numeric"
                pattern="\d{10}"
                maxLength={10}
                className={`ap-reg-input ${errors.phone ? "error" : ""}`}
                placeholder="Enter your phone number"
                value={form.phone}
                onChange={handleChange}
                title="Enter exactly 10 digits"
              />
              {errors.phone && (
                <span className="ap-reg-error">{errors.phone}</span>
              )}
              {!errors.phone && (
                <small className="ap-reg-hint">
                  Enter exactly 10 digits (no spaces or symbols)
                </small>
              )}
            </div>

            {/* Email */}
            <div className="ap-reg-field">
              <label htmlFor="email" className="ap-reg-label">
                Email
              </label>
              <input
                id="email"
                type="email"
                name="email"
                autoComplete="email"
                className={`ap-reg-input ${errors.email ? "error" : ""}`}
                placeholder="Enter your email (optional)"
                value={form.email}
                onChange={handleChange}
                title="Email must end with .com, .in, or .org"
              />
              {errors.email && (
                <span className="ap-reg-error">{errors.email}</span>
              )}
              {!errors.email && form.email && (
                <small className="ap-reg-hint">
                  Only .com, .in, or .org domains allowed
                </small>
              )}
            </div>

            {/* Name */}
            <div className="ap-reg-field">
              <label htmlFor="name" className="ap-reg-label">
                Person Name
              </label>
              <input
                id="name"
                type="text"
                name="name"
                autoComplete="name"
                minLength={2}
                maxLength={50}
                pattern="[a-zA-Z\s\-.]{2,50}"
                className={`ap-reg-input ${errors.name ? "error" : ""}`}
                placeholder="Enter your Full Name"
                value={form.name}
                onChange={handleChange}
                title="Letters, spaces, hyphens, dots only"
              />
              {errors.name && (
                <span className="ap-reg-error">{errors.name}</span>
              )}
            </div>

            {/* Company Name */}
            <div className="ap-reg-field ap-reg-field--full">
              <label htmlFor="companyName" className="ap-reg-label">
                Company Name <span className="ap-reg-required">*</span>
              </label>
              <input
                id="companyName"
                type="text"
                name="companyName"
                required
                autoComplete="organization"
                minLength={2}
                maxLength={100}
                pattern="[a-zA-Z0-9\s\-.,&']{2,100}"
                className={`ap-reg-input ${errors.companyName ? "error" : ""}`}
                placeholder="Enter your Company Name"
                value={form.companyName}
                onChange={handleChange}
                title="2-100 characters"
              />
              {errors.companyName && (
                <span className="ap-reg-error">{errors.companyName}</span>
              )}
              {!errors.companyName && (
                <small className="ap-reg-hint">It is mandatory</small>
              )}
            </div>

            {/* Company Product / Service */}
            <div className="ap-reg-field ap-reg-field--full">
              <label htmlFor="companyProductService" className="ap-reg-label">
                Company Product/Service <span className="ap-reg-required">*</span>
              </label>
              <input
                id="companyProductService"
                type="text"
                name="companyProductService"
                autoComplete="off"
                maxLength={200}
                pattern="[a-zA-Z0-9\s\-.,&']{0,200}"
                className={`ap-reg-input ${
                  errors.companyProductService ? "error" : ""
                }`}
                placeholder="e.g., Construction Materials, IT Services"
                value={form.companyProductService}
                onChange={handleChange}
                title="Describe your products or services"
              />
              {errors.companyProductService && (
                <span className="ap-reg-error">
                  {errors.companyProductService}
                </span>
              )}
              {!errors.companyProductService && (
                <small className="ap-reg-hint">
                  What does your company sell or provide?
                </small>
              )}
            </div>

            {/* Company Address */}
            <div className="ap-reg-field ap-reg-field--full">
              <label htmlFor="companyAddress" className="ap-reg-label">
                Company Address
              </label>
              <input
                id="companyAddress"
                type="text"
                name="companyAddress"
                autoComplete="street-address"
                maxLength={200}
                pattern="[a-zA-Z0-9\s\-.,#/]{0,200}"
                className={`ap-reg-input ${errors.companyAddress ? "error" : ""}`}
                placeholder="123 Business Street, City, State"
                value={form.companyAddress}
                onChange={handleChange}
                title="Enter a valid address"
              />
              {errors.companyAddress && (
                <span className="ap-reg-error">{errors.companyAddress}</span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="ap-reg-actions">
            <button
              type="submit"
              className="ap-reg-btn"
              disabled={
                submitting || !form.phone || !form.companyName || !form.companyProductService
              }
            >
              {submitting ? "Registering…" : "Register"}
            </button>

            <button
              type="button"
              className="ap-reg-btn ap-reg-btn--secondary"
              onClick={() => navigate("/login")}
            >
              Back to Login
            </button>
          </div>

          {/* Footer */}
          <p className="ap-reg-disclaimer">
            By continuing you agree to our{" "}
            <a role="button" onClick={() => setIsTermsModalOpen(true)}>
              Terms
            </a>{" "}
            &{" "}
            <a role="button" onClick={() => setIsTermsModalOpen(true)}>
              Privacy Policy
            </a>
            .
            <TermsModal
              isOpen={isTermsModalOpen}
              onClose={() => setIsTermsModalOpen(false)}
            />
          </p>
        </form>
      </div>
    </div>
  );
}
