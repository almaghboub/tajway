import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

interface Setting {
  id: string;
  key: string;
  value: string;
  type: string;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Load settings from API using default queryFn
  const { data: settings = [] } = useQuery<Setting[]>({
    queryKey: ["/api/settings"],
  });

  // Apply dark mode on startup and whenever settings change
  useEffect(() => {
    // Find dark mode setting
    const darkModeSetting = settings.find((s: Setting) => s.key === "darkMode");
    const isDarkMode = darkModeSetting?.value === "true";

    // Apply or remove dark class
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [settings]);

  return <>{children}</>;
}
