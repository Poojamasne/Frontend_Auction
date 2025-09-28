// src/components/SystemSettings.tsx
import React, { useState, useEffect } from 'react';
import { Settings, Save, RefreshCw, Globe } from 'lucide-react';
import { useForm } from 'react-hook-form';

/* ------------------  TYPES  ------------------ */
interface SystemConfig {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  timezone: string;
  currency: string;
  language: string;
}

/* ------------------  CONSTANTS  ------------------ */
const DEFAULT_CONFIG: SystemConfig = {
  siteName: 'AuctionPlatform Pro',
  siteDescription: 'Professional Auction Management Platform',
  contactEmail: 'admin@auctionplatform.com',
  contactPhone: '9999999999',
  address: 'Mumbai, Maharashtra, India',
  timezone: 'Asia/Kolkata',
  currency: 'INR',
  language: 'en',
};

const STORAGE_KEY = 'system_config';

/* ------------------  HELPERS  ------------------ */
const loadStored = (): SystemConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_CONFIG, ...JSON.parse(raw) } : DEFAULT_CONFIG;
  } catch {
    return DEFAULT_CONFIG;
  }
};

const saveStored = (data: SystemConfig) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

/* ------------------  COMPONENT  ------------------ */
const SystemSettings: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<SystemConfig>({ defaultValues: loadStored() });

  /* keep form in sync if another tab changes storage */
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        reset({ ...DEFAULT_CONFIG, ...JSON.parse(e.newValue) });
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [reset]);

  /* ------------------  HANDLERS  ------------------ */
  const onSubmit = async (data: SystemConfig) => {
    setIsLoading(true);
    setSaveStatus('idle');
    try {
      await new Promise((r) => setTimeout(r, 1000)); // simulate API
      saveStored(data);
      setSaveStatus('success');
      reset(data); // mark clean
    } catch {
      setSaveStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    reset(DEFAULT_CONFIG);
    setSaveStatus('idle');
  };

  /* ------------------  VALIDATIONS  ------------------ */
  const validateEmail = (email: string) => {
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    const validDomains = ['com', 'in', 'org'];
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    const domain = email.split('.').pop()?.toLowerCase();
    if (!domain || !validDomains.includes(domain))
      return 'Email must end with .com, .in, or .org';
    return true;
  };

  /* ------------------  RENDER  ------------------ */
  return (
    <div className="space-y-6">
      {saveStatus === 'success' && (
        <div className="bg-green-900 border border-green-700 text-green-200 px-4 py-3 rounded-lg">
          Settings saved successfully!
        </div>
      )}
      {saveStatus === 'error' && (
        <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
          Error saving settings. Please try again.
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="bg-[#111827] rounded-xl shadow-md border border-gray-700 p-4 sm:p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Settings className="w-5 h-5" />
              General Settings
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              Configure your platform's basic information and contact details
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* ----------  Site Name  ---------- */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Site Name<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className={`w-full px-3 py-2 rounded-lg border bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                  errors.siteName
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-600 focus:border-blue-500'
                }`}
                placeholder="Enter your site name"
                {...register('siteName', {
                  required: 'Site name is required',
                  minLength: { value: 3, message: 'Site name must be at least 3 characters' },
                  maxLength: { value: 50, message: 'Site name must not exceed 50 characters' },
                  pattern: {
                    value: /^[a-zA-Z0-9\s\-_]+$/,
                    message: 'Site name can only contain letters, numbers, spaces, hyphens, and underscores',
                  },
                })}
              />
              {errors.siteName && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <span>⚠</span>
                  {errors.siteName.message}
                </p>
              )}
            </div>

            {/* ----------  Contact Email  ---------- */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Contact Email<span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                className={`w-full px-3 py-2 rounded-lg border bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                  errors.contactEmail
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-600 focus:border-blue-500'
                }`}
                placeholder="admin@example.com"
                {...register('contactEmail', {
                  required: 'Contact email is required',
                  maxLength: { value: 100, message: 'Email must not exceed 100 characters' },
                  validate: validateEmail,
                })}
              />
              {errors.contactEmail && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <span>⚠</span>
                  {errors.contactEmail.message}
                </p>
              )}
            </div>

            {/* ----------  Contact Phone  ---------- */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Contact Phone<span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                maxLength={10}
                className={`w-full px-3 py-2 rounded-lg border bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                  errors.contactPhone
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-600 focus:border-blue-500'
                }`}
                placeholder="Enter 10-digit phone number"
                {...register('contactPhone', {
                  required: 'Contact phone is required',
                  pattern: { value: /^[6-9]\d{9}$/, message: 'Phone number must start with 6-9 and be 10 digits' },
                  minLength: { value: 10, message: 'Phone number must be exactly 10 digits' },
                  maxLength: { value: 10, message: 'Phone number must be exactly 10 digits' },
                })}
                onKeyPress={(e) => /[0-9]/.test(e.key) || e.preventDefault()}
              />
              {errors.contactPhone && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <span>⚠</span>
                  {errors.contactPhone.message}
                </p>
              )}
            </div>

            {/* ----------  Timezone  ---------- */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Timezone<span className="text-red-500">*</span>
              </label>
              <select
                className="w-full px-3 py-2 rounded-lg border border-gray-600 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                {...register('timezone', { required: 'Timezone is required' })}
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
                <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
              </select>
              {errors.timezone && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <span>⚠</span>
                  {errors.timezone.message}
                </p>
              )}
            </div>

            {/* ----------  Currency  ---------- */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Currency<span className="text-red-500">*</span>
              </label>
              <select
                className={`w-full px-3 py-2 rounded-lg border bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                  errors.currency
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-600 focus:border-blue-500'
                }`}
                {...register('currency', { required: 'Currency is required' })}
              >
                <option value="INR">INR (₹) - Indian Rupee</option>
                <option value="USD">USD ($) - US Dollar</option>
                <option value="EUR">EUR (€) - Euro</option>
                <option value="GBP">GBP (£) - British Pound</option>
              </select>
              {errors.currency && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <span>⚠</span>
                  {errors.currency.message}
                </p>
              )}
            </div>

            {/* ----------  Language  ---------- */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Language<span className="text-red-500">*</span>
              </label>
              <select
                className="w-full px-3 py-2 rounded-lg border border-gray-600 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                {...register('language', { required: 'Language is required' })}
              >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
              </select>
              {errors.language && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <span>⚠</span>
                  {errors.language.message}
                </p>
              )}
            </div>

            {/* ----------  Site Description  ---------- */}
            <div className="col-span-1 sm:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Site Description<span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                className={`w-full px-3 py-2 rounded-lg border bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                  errors.siteDescription
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-600 focus:border-blue-500'
                }`}
                placeholder="Describe your auction platform..."
                {...register('siteDescription', {
                  required: 'Site description is required',
                  minLength: { value: 10, message: 'Description must be at least 10 characters' },
                  maxLength: { value: 500, message: 'Description must not exceed 500 characters' },
                })}
              />
              <div className="flex justify-between mt-1">
                {errors.siteDescription ? (
                  <p className="text-red-500 text-xs flex items-center gap-1">
                    <span>⚠</span>
                    {errors.siteDescription.message}
                  </p>
                ) : (
                  <span className="text-xs text-gray-400">
                    {watch('siteDescription')?.length || 0}/500 characters
                  </span>
                )}
              </div>
            </div>

            {/* ----------  Address  ---------- */}
            <div className="col-span-1 sm:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Address<span className="text-red-500">*</span>
              </label>
              <textarea
                rows={2}
                className={`w-full px-3 py-2 rounded-lg border bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                  errors.address
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-600 focus:border-blue-500'
                }`}
                placeholder="Enter your complete address..."
                {...register('address', {
                  required: 'Address is required',
                  minLength: { value: 10, message: 'Address must be at least 10 characters' },
                  maxLength: { value: 300, message: 'Address must not exceed 300 characters' },
                })}
              />
              <div className="flex justify-between mt-1">
                {errors.address ? (
                  <p className="text-red-500 text-xs flex items-center gap-1">
                    <span>⚠</span>
                    {errors.address.message}
                  </p>
                ) : (
                  <span className="text-xs text-gray-400">
                    {watch('address')?.length || 0}/300 characters
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ----------  Action Buttons  ---------- */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
          {/* <button
            type="button"
            onClick={handleReset}
            disabled={isLoading || !isDirty}
            className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
          >
            Reset to Default
          </button> */}

          <button
            type="submit"
            disabled={isLoading || !isDirty}
            className="px-6 py-2 text-black bg-blue-600 rounded-lg hover:bg-blue-700
                       transition disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center justify-center w-full sm:w-auto"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Saving
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save All Settings
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SystemSettings;