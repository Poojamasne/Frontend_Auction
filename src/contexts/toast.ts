// utils/toast.ts
import { toast as hotToast } from 'react-hot-toast';

export const toast = (
  message: string,
  options?: { icon?: string; [key: string]: any }
) => {
  // if someone mistakenly puts text inside icon, fix it
  if (options?.icon && options.icon.length > 2) {
    return hotToast(options.icon, { ...options, icon: options.icon[0] });
  }
  return hotToast(message, options);
};

toast.success = hotToast.success;
toast.error = hotToast.error;
toast.loading = hotToast.loading;
