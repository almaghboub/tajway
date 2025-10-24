import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

/**
 * Custom hook to fetch and use LYD exchange rate from settings
 * 
 * @returns {object} Object containing:
 *   - exchangeRate: The current exchange rate (0 if not set)
 *   - convertToLYD: Helper function to convert USD amounts to LYD
 *   - isLoading: Loading state for the settings query
 */
export function useLydExchangeRate() {
  // Fetch settings from API
  const { data: settings = [], isLoading } = useQuery({
    queryKey: ["/api/settings"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/settings");
      return response.json();
    },
  });

  // Get LYD exchange rate from settings
  const lydExchangeRateSetting = settings.find((s: any) => s.key === "lyd_exchange_rate")?.value;
  const exchangeRate = lydExchangeRateSetting ? parseFloat(lydExchangeRateSetting) : 0;

  // Helper function to convert USD to LYD
  const convertToLYD = (usdAmount: number): string => {
    if (exchangeRate > 0) {
      return (usdAmount * exchangeRate).toFixed(2);
    }
    // When no exchange rate is set, return the original USD amount
    return usdAmount.toFixed(2);
  };

  return {
    exchangeRate,
    convertToLYD,
    isLoading,
  };
}
