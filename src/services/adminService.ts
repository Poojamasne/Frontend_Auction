// Updated admin dashboard endpoint base (full dashboard)
import { API_BASE_URL } from './apiConfig';

const ADMIN_DASHBOARD_URL = `${API_BASE_URL}/fulldashboard/admin`;

export interface AdminDashboardOverview {
  total_users: number;
  total_auctions: number;
  upcoming_auctions: number;
  live_auctions: number;
  completed_auctions: number;
  cancelled_auctions: number;
  total_bids: number;
  total_participants: number;
  new_users_7d: number;
  new_auctions_7d: number;
  pending_users: number;
  pending_auctions: number;
}

export interface AdminRecentActivity {
  type: string;
  id: number;
  title: string;
  status: string;
  timestamp: string;
  amount: string | null;
  company_name: string | null;
  person_name: string | null;
  phone_number: string | null;
  winner_company: string | null;
  auctioneer_action: string | null;
  message: string;
  icon: string;
  time_ago: string;
  formatted_time: string;
}

export interface AdminUpcomingAuctionRaw {
  id: number;
  title: string;
  participant_count: number;
  company: string;
  start_time: string;
  auction_no: string;
  // Add fields we need to fetch from individual auction API
  auction_date?: string;
  start_time_actual?: string;
  decremental_value?: number;
  current_price?: string;
}

export interface AdminUpcomingAuction {
  id: number;
  title: string;
  participants: number;
  company: string;
  startTime: string;
  auctionNo: string;
  decrementalValue: number;
}

export interface AdminDashboardData {
  overview: AdminDashboardOverview;
  recent_activities: AdminRecentActivity[];
  upcoming_auctions: AdminUpcomingAuction[];
}

export interface AdminDashboardRaw {
  success?: boolean;
  message?: string;
  dashboard?: {
    overview: AdminDashboardOverview;
    recent_activities: AdminRecentActivity[];
    upcoming_auctions: AdminUpcomingAuctionRaw[];
  };
  data?: any;
}

class AdminService {
  private getAuthHeaders(token?: string) {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    let adminToken: string | null = null;
    try {
      adminToken = sessionStorage.getItem('adminToken');
      if (!adminToken) {
        for (let i = 0; i < sessionStorage.length; i++) {
          const k = sessionStorage.key(i) || '';
          if (k && k.startsWith('admin_token')) {
            adminToken = sessionStorage.getItem(k);
            break;
          }
        }
      }
    } catch (e) {
      adminToken = null;
    }

    const authToken = token || adminToken || localStorage.getItem('authToken');
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
    return headers;
  }

  // Helper method to get individual auction details for better date/time info
  private async getAuctionDetails(auctionId: number, token?: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/auctions/${auctionId}`, {
        headers: this.getAuthHeaders(token),
      });
      if (res.ok) {
        const json = await res.json();
        return json.data || json.auction || json;
      }
    } catch (e) {
      console.warn(`Failed to fetch details for auction ${auctionId}:`, e);
    }
    return null;
  }

  private formatDateTime(dateStr?: string, timeStr?: string): string {
    if (!dateStr && !timeStr) return 'N/A';

    try {
      let date: Date;

      if (dateStr && timeStr) {
        // Combine date and time
        const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
        const [hour, minute] = timeStr.split(':').map(Number);
        date = new Date(year, month - 1, day, hour, minute);
      } else if (dateStr) {
        date = new Date(dateStr);
      } else {
        return 'N/A';
      }

      if (isNaN(date.getTime())) return 'N/A';

      // Format as DD/MM/YYYY HH:MM
      const formattedDate = date.toLocaleDateString('en-GB'); // DD/MM/YYYY
      const formattedTime = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      return `${formattedDate} ${formattedTime}`;
    } catch (e) {
      console.warn('Failed to format date/time:', e);
      return 'N/A';
    }
  }

  async getDashboard(token?: string): Promise<AdminDashboardData> {
    const res = await fetch(ADMIN_DASHBOARD_URL, {
      method: 'GET',
      headers: this.getAuthHeaders(token),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.message || `Failed to fetch dashboard (${res.status})`);

    const rawData = json as AdminDashboardRaw;
    const dashboard = rawData.dashboard || rawData.data || rawData;

    if (!dashboard) {
      throw new Error('Dashboard data not found in response');
    }

    // Process upcoming auctions with enhanced data
    const upcomingAuctions: AdminUpcomingAuction[] = [];

    if (dashboard.upcoming_auctions && Array.isArray(dashboard.upcoming_auctions)) {
      for (const auction of dashboard.upcoming_auctions.slice(0, 5)) { // Limit to 5 for performance
        try {
          // Try to get detailed auction info for better date/time and decremental value
          const details = await this.getAuctionDetails(auction.id, token);

          let startTime = 'N/A';
          let decrementalValue = 0;

          if (details) {
            // Use detailed info if available
            startTime = this.formatDateTime(
              details.auction_date || details.start_date,
              details.start_time || details.startTime
            );
            decrementalValue = Number(details.decremental_value || details.decrementalValue || 0);
          } else {
            // Fallback to dashboard data (though it might be incomplete)
            startTime = auction.start_time !== 'Invalid Date' ? auction.start_time : 'N/A';
          }

          upcomingAuctions.push({
            id: auction.id,
            title: auction.title,
            participants: auction.participant_count || 0,
            company: auction.company,
            startTime,
            auctionNo: auction.auction_no,
            decrementalValue,
          });
        } catch (e) {
          // If individual auction fetch fails, use basic data
          console.warn(`Failed to enhance auction ${auction.id}, using basic data:`, e);
          upcomingAuctions.push({
            id: auction.id,
            title: auction.title,
            participants: auction.participant_count || 0,
            company: auction.company,
            startTime: 'N/A',
            auctionNo: auction.auction_no,
            decrementalValue: 0,
          });
        }
      }
    }

    return {
      overview: dashboard.overview || {
        total_users: 0,
        total_auctions: 0,
        upcoming_auctions: 0,
        live_auctions: 0,
        completed_auctions: 0,
        cancelled_auctions: 0,
        total_bids: 0,
        total_participants: 0,
        new_users_7d: 0,
        new_auctions_7d: 0,
        pending_users: 0,
        pending_auctions: 0,
      },
      recent_activities: dashboard.recent_activities || [],
      upcoming_auctions: upcomingAuctions,
    };
  }
}

export default new AdminService();