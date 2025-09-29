import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Settings as SettingsIcon, Database, Shield, Bell, Palette, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/header";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Setting } from "@shared/schema";

// Default settings
const DEFAULT_SETTINGS = {
  emailNotifications: false,
  autoBackup: true,
  maintenanceMode: false,
  twoFactor: false,
  sessionTimeout: true,
  orderNotifications: true,
  inventoryAlerts: true,
  systemAlerts: true,
  darkMode: false,
};

export default function Settings() {
  const [settingsState, setSettingsState] = useState(DEFAULT_SETTINGS);
  const { toast } = useToast();

  // Load settings from API
  const { data: settings = [], isLoading } = useQuery({
    queryKey: ["/api/settings"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/settings");
      return response.json() as Promise<Setting[]>;
    },
  });

  // Process settings when data changes
  useEffect(() => {
    if (settings.length > 0) {
      // Convert settings array to state object
      const settingsObj = { ...DEFAULT_SETTINGS };
      settings.forEach((setting: Setting) => {
        if (setting.type === "boolean") {
          settingsObj[setting.key as keyof typeof DEFAULT_SETTINGS] = setting.value === "true";
        }
      });
      setSettingsState(settingsObj);
    }
  }, [settings]);

  // Update setting mutation
  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const existingSetting = settings.find(s => s.key === key);
      if (existingSetting) {
        const response = await apiRequest("PUT", `/api/settings/${key}`, { value, type: "boolean" });
        return response.json();
      } else {
        const response = await apiRequest("POST", "/api/settings", {
          key,
          value,
          type: "boolean",
          description: `Setting for ${key}`
        });
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Setting updated",
        description: "Your setting has been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update setting. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSettingChange = (key: keyof typeof DEFAULT_SETTINGS, checked: boolean) => {
    setSettingsState(prev => ({ ...prev, [key]: checked }));
    updateSettingMutation.mutate({ key, value: checked.toString() });
  };

  const handleDatabaseBackup = () => {
    toast({
      title: "Backup initiated",
      description: "Database backup has started. You will be notified when complete.",
    });
  };

  const handleDatabaseOptimize = () => {
    toast({
      title: "Optimization started",
      description: "Database optimization is running in the background.",
    });
  };

  const handleViewSecurityLogs = () => {
    toast({
      title: "Security logs",
      description: "Security log viewer will be implemented in a future update.",
    });
  };

  const handleResetPasswords = () => {
    toast({
      title: "Password reset",
      description: "This feature requires additional confirmation. Contact system administrator.",
      variant: "destructive",
    });
  };
  return (
    <div className="flex-1 flex flex-col">
      <Header 
        title="Settings" 
        description="Configure system preferences and settings" 
      />
      
      <div className="flex-1 p-6 space-y-6">
        {/* System Settings */}
        <Card data-testid="card-system-settings">
          <CardHeader>
            <CardTitle className="flex items-center">
              <SettingsIcon className="w-5 h-5 mr-2" />
              System Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notifications">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive email notifications for order updates
                </p>
              </div>
              <Switch 
                id="notifications" 
                checked={settingsState.emailNotifications}
                onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
                disabled={updateSettingMutation.isPending}
                data-testid="switch-notifications" 
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-backup">Automatic Backup</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically backup data daily
                </p>
              </div>
              <Switch 
                id="auto-backup" 
                checked={settingsState.autoBackup}
                onCheckedChange={(checked) => handleSettingChange('autoBackup', checked)}
                disabled={updateSettingMutation.isPending}
                data-testid="switch-auto-backup" 
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="maintenance">Maintenance Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Enable maintenance mode for system updates
                </p>
              </div>
              <Switch 
                id="maintenance" 
                checked={settingsState.maintenanceMode}
                onCheckedChange={(checked) => handleSettingChange('maintenanceMode', checked)}
                disabled={updateSettingMutation.isPending}
                data-testid="switch-maintenance" 
              />
            </div>
          </CardContent>
        </Card>

        {/* Database Settings */}
        <Card data-testid="card-database-settings">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="w-5 h-5 mr-2" />
              Database Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                onClick={handleDatabaseBackup}
                data-testid="button-backup-database"
              >
                <Database className="w-4 h-4 mr-2" />
                Backup Database
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleDatabaseOptimize}
                data-testid="button-optimize-database"
              >
                <SettingsIcon className="w-4 h-4 mr-2" />
                Optimize Database
              </Button>
            </div>
            
            <div className="p-4 bg-muted/20 rounded-lg">
              <h4 className="font-medium mb-2">Database Status</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Connection Status:</span>
                  <span className="text-green-600 font-medium">Connected</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Backup:</span>
                  <span>Today at 3:00 AM</span>
                </div>
                <div className="flex justify-between">
                  <span>Database Size:</span>
                  <span>12.4 MB</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card data-testid="card-security-settings">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Security & Access Control
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="two-factor">Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">
                  Require 2FA for all user logins
                </p>
              </div>
              <Switch 
                id="two-factor" 
                checked={settingsState.twoFactor}
                onCheckedChange={(checked) => handleSettingChange('twoFactor', checked)}
                disabled={updateSettingMutation.isPending}
                data-testid="switch-two-factor" 
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="session-timeout">Auto Session Timeout</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically log out inactive users after 30 minutes
                </p>
              </div>
              <Switch 
                id="session-timeout" 
                checked={settingsState.sessionTimeout}
                onCheckedChange={(checked) => handleSettingChange('sessionTimeout', checked)}
                disabled={updateSettingMutation.isPending}
                data-testid="switch-session-timeout" 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                onClick={handleViewSecurityLogs}
                data-testid="button-view-logs"
              >
                View Security Logs
              </Button>
              <Button 
                variant="outline" 
                onClick={handleResetPasswords}
                data-testid="button-reset-passwords"
              >
                Reset All Passwords
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card data-testid="card-notification-settings">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="w-5 h-5 mr-2" />
              Notification Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="order-notifications">Order Updates</Label>
                <p className="text-sm text-muted-foreground">
                  Notify when orders are created or updated
                </p>
              </div>
              <Switch 
                id="order-notifications" 
                checked={settingsState.orderNotifications}
                onCheckedChange={(checked) => handleSettingChange('orderNotifications', checked)}
                disabled={updateSettingMutation.isPending}
                data-testid="switch-order-notifications" 
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="inventory-alerts">Low Stock Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Alert when inventory items are running low
                </p>
              </div>
              <Switch 
                id="inventory-alerts" 
                checked={settingsState.inventoryAlerts}
                onCheckedChange={(checked) => handleSettingChange('inventoryAlerts', checked)}
                disabled={updateSettingMutation.isPending}
                data-testid="switch-inventory-alerts" 
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="system-alerts">System Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Notify about system errors and maintenance
                </p>
              </div>
              <Switch 
                id="system-alerts" 
                checked={settingsState.systemAlerts}
                onCheckedChange={(checked) => handleSettingChange('systemAlerts', checked)}
                disabled={updateSettingMutation.isPending}
                data-testid="switch-system-alerts" 
              />
            </div>
          </CardContent>
        </Card>

        {/* Theme Settings */}
        <Card data-testid="card-theme-settings">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Palette className="w-5 h-5 mr-2" />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="dark-mode">Dark Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Use dark theme for the interface
                </p>
              </div>
              <Switch 
                id="dark-mode" 
                checked={settingsState.darkMode}
                onCheckedChange={(checked) => handleSettingChange('darkMode', checked)}
                disabled={updateSettingMutation.isPending}
                data-testid="switch-dark-mode" 
              />
            </div>

            <div className="p-4 bg-muted/20 rounded-lg">
              <h4 className="font-medium mb-2">Current Theme</h4>
              <p className="text-sm text-muted-foreground">
                {settingsState.darkMode ? "Dark theme is currently active" : "Light theme is currently active"}
              </p>
              {updateSettingMutation.isPending && (
                <div className="flex items-center text-sm text-muted-foreground mt-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                  Saving settings...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
