import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Truck, LayoutDashboard, Package, Users, Box, TrendingUp, Users2, Settings, LogOut, MessageSquare, ClipboardList, UserCog, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/auth-provider";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import logoPath from "@assets/tajway_logo[1]_1760402240997.pdf";

const navigationItems = [
  { key: "dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["owner", "customer_service", "receptionist", "sorter", "stock_manager"] },
  { key: "orders", href: "/orders", icon: Package, roles: ["owner", "customer_service", "receptionist", "sorter", "stock_manager"] },
  { key: "customers", href: "/customers", icon: Users, roles: ["owner", "customer_service", "receptionist"] },
  { key: "deliveryTasks", href: "/delivery-tasks", icon: ClipboardList, roles: ["shipping_staff"] },
  { key: "taskAssignment", href: "/task-assignment", icon: UserCog, roles: ["owner", "customer_service", "receptionist"] },
  { key: "taskHistory", href: "/task-history", icon: History, roles: ["owner", "customer_service", "receptionist"] },
  { key: "profitReports", href: "/profits", icon: TrendingUp, roles: ["owner"] },
  { key: "userManagement", href: "/users", icon: Users2, roles: ["owner"] },
  { key: "messages", href: "/messages", icon: MessageSquare, roles: ["owner", "customer_service", "receptionist", "sorter", "stock_manager", "shipping_staff"], showBadge: true },
  { key: "settings", href: "/settings", icon: Settings, roles: ["owner", "customer_service", "receptionist", "sorter", "stock_manager", "shipping_staff"] },
];

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  const { data: unreadCountData } = useQuery({
    queryKey: ["/api/messages/unread-count"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/messages/unread-count");
      return response.json() as Promise<{ count: number }>;
    },
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });

  const unreadCount = unreadCountData?.count || 0;

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const filteredNavigation = navigationItems.filter(item => 
    user?.role && item.roles.includes(user.role)
  );

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col">
      {/* Logo and branding */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-center">
          <object data={logoPath} type="application/pdf" className="h-16 w-auto">
            <div className="h-16 w-32 flex items-center justify-center bg-primary/10 rounded">
              <span className="text-2xl font-bold text-primary">TajWay</span>
            </div>
          </object>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {filteredNavigation.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <li key={item.key}>
                <Link href={item.href}>
                  <span
                    className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors cursor-pointer ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}
                    data-testid={`nav-${item.key.toLowerCase().replace(/([A-Z])/g, '-$1').toLowerCase()}`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className={`flex-1 ${isActive ? "font-medium" : ""}`}>{t(item.key)}</span>
                    {item.showBadge && unreadCount > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="ml-auto"
                        data-testid="badge-unread-messages"
                      >
                        {unreadCount}
                      </Badge>
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User profile */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-primary-foreground">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-muted-foreground truncate capitalize">
              {user?.role?.replace("_", " ")}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-foreground"
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
