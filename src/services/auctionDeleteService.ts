
import { API_BASE_URL } from "./apiConfig";
import toast from "react-hot-toast";

class AuctionDeleteService {
  private getAuthToken(): string {
    return (
      localStorage.getItem("authToken") ||
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken") ||
      ""
    );
  }

  async deleteAuction(
    auctionId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const token = this.getAuthToken();
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(
        `${API_BASE_URL}/admin/auctions/${auctionId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        return {
          success: true,
          message: result.message || "Auction deleted successfully",
        };
      } else {
        throw new Error(
          result.message ||
            `Failed to delete auction. Status: ${response.status}`
        );
      }
    } catch (error: any) {
      console.error("[AuctionDeleteService] Error deleting auction:", error);
      throw new Error(error.message || "Failed to delete auction");
    }
  }
}

export default new AuctionDeleteService();