// src/services/notificationService.ts
import { API_BASE_URL } from './apiConfig';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  [key: string]: any;
}

class NotificationService {
  private getAuthHeaders(token?: string): HeadersInit {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    const authToken = token || localStorage.getItem('authToken');
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
    return headers;
  }

  async getMyNotifications(token?: string): Promise<NotificationItem[]> {
    const url = `${API_BASE_URL}/notifications/my-notification`;
    const res = await fetch(url, { headers: this.getAuthHeaders(token) });
    if (!res.ok) throw new Error('Failed to fetch notifications');
    const json = await res.json();
    // Try to find the array in common keys
    const arr = Array.isArray(json) ? json : (json.data || json.notifications || json.result || []);
    return Array.isArray(arr) ? arr : [];
  }
}

export default new NotificationService();
