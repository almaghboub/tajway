import { Settings as SettingsIcon, Database, Shield, Bell, Palette } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/header";

export default function Settings() {
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
              <Switch id="notifications" data-testid="switch-notifications" />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-backup">Automatic Backup</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically backup data daily
                </p>
              </div>
              <Switch id="auto-backup" defaultChecked data-testid="switch-auto-backup" />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="maintenance">Maintenance Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Enable maintenance mode for system updates
                </p>
              </div>
              <Switch id="maintenance" data-testid="switch-maintenance" />
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
              <Button variant="outline" data-testid="button-backup-database">
                <Database className="w-4 h-4 mr-2" />
                Backup Database
              </Button>
              
              <Button variant="outline" data-testid="button-optimize-database">
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
              <Switch id="two-factor" data-testid="switch-two-factor" />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="session-timeout">Auto Session Timeout</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically log out inactive users after 30 minutes
                </p>
              </div>
              <Switch id="session-timeout" defaultChecked data-testid="switch-session-timeout" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button variant="outline" data-testid="button-view-logs">
                View Security Logs
              </Button>
              <Button variant="outline" data-testid="button-reset-passwords">
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
              <Switch id="order-notifications" defaultChecked data-testid="switch-order-notifications" />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="inventory-alerts">Low Stock Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Alert when inventory items are running low
                </p>
              </div>
              <Switch id="inventory-alerts" defaultChecked data-testid="switch-inventory-alerts" />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="system-alerts">System Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Notify about system errors and maintenance
                </p>
              </div>
              <Switch id="system-alerts" defaultChecked data-testid="switch-system-alerts" />
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
              <Switch id="dark-mode" data-testid="switch-dark-mode" />
            </div>

            <div className="p-4 bg-muted/20 rounded-lg">
              <h4 className="font-medium mb-2">Current Theme</h4>
              <p className="text-sm text-muted-foreground">Light theme is currently active</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
