import { API_BASE_URL } from "./apiConfig";

interface UpdateDecrementPayload {
  decremental_value: number;
}

const updateAuctionDecrement = async (
  auctionId: string | number,
  value: number,
  token?: string
) => {
  const url = `${API_BASE_URL}/auction/${auctionId}/decremental`;
  const body: UpdateDecrementPayload = { decremental_value: value };

  const authToken =
    token ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken");

  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: authToken ? `Bearer ${authToken}` : "",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to update decrement: ${res.status} ${text}`);
  }

  return res.json();
};

export default {
  updateAuctionDecrement,
};
