import { Link, useLocation } from "wouter";
import { Truck, LayoutDashboard, Package, Users, Box, TrendingUp, Users2, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-provider";
import logoPath from "@assets/lynx-logo.png";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["owner", "customer_service", "receptionist", "sorter", "stock_manager"] },
  { name: "Orders", href: "/orders", icon: Package, roles: ["owner", "customer_service", "receptionist", "sorter", "stock_manager"] },
  { name: "Customers", href: "/customers", icon: Users, roles: ["owner", "customer_service", "receptionist"] },
  { name: "Inventory", href: "/inventory", icon: Box, roles: ["owner", "stock_manager", "sorter"] },
  { name: "Profit Reports", href: "/profits", icon: TrendingUp, roles: ["owner"] },
  { name: "User Management", href: "/users", icon: Users2, roles: ["owner"] },
  { name: "Settings", href: "/settings", icon: Settings, roles: ["owner", "customer_service", "receptionist", "sorter", "stock_manager"] },
];

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const filteredNavigation = navigation.filter(item => 
    user?.role && item.roles.includes(user.role)
  );

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col">
      {/* Logo and branding */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-center">
          <img src={logoPath} alt="Lynx Logo" className="h-16 w-auto" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {filteredNavigation.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <li key={item.name}>
                <Link href={item.href}>
                  <span
                    className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors cursor-pointer ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}
                    data-testid={`nav-${item.name.toLowerCase().replace(" ", "-")}`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className={isActive ? "font-medium" : ""}>{item.name}</span>
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
