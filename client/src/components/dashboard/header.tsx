import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/hooks/use-theme";
import NotificationCenter from "./notifications";
import {
  Menu,
  Search,
  Sun,
  Moon,
  Bell,
  Plus,
} from "lucide-react";

interface HeaderProps {
  activeSection: string;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

const sectionTitles: Record<string, { title: string; description: string }> = {
  analytics: {
    title: "Analytics Dashboard",
    description: "Welcome back! Here's what's happening with your store today.",
  },
  orders: {
    title: "Orders Management",
    description: "Manage all your customer orders efficiently.",
  },
  products: {
    title: "Products",
    description: "Manage your product catalog with advanced tools.",
  },
  inventory: {
    title: "Inventory Management",
    description: "Monitor stock levels and manage your inventory efficiently.",
  },
  customers: {
    title: "Customers",
    description: "Manage your customer relationships.",
  },
  promotions: {
    title: "Promotions",
    description: "Create and manage promotional campaigns.",
  },
  reports: {
    title: "Reports",
    description: "Generate detailed business reports.",
  },
  settings: {
    title: "Settings",
    description: "Configure your account and store settings.",
  },
};

export default function Header({
  activeSection,
  sidebarCollapsed,
  onToggleSidebar,
}: HeaderProps) {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const currentSection = sectionTitles[activeSection] || sectionTitles.analytics;

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden bg-card shadow-sm border-b border-border px-4 py-3 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={onToggleSidebar}>
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">{currentSection.title}</h1>
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {theme === "dark" ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:flex items-center justify-between p-6 bg-card shadow-sm border-b border-border">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {currentSection.title}
          </h1>
          <p className="text-muted-foreground">{currentSection.description}</p>
        </div>

        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-9 w-64 bg-background"
            />
          </div>

          {/* Notifications */}
          <NotificationCenter />

          {/* Theme Toggle */}
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          {/* Quick Action */}
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Quick Action
          </Button>
        </div>
      </div>
    </>
  );
}
