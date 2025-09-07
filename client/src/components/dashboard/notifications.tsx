import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import {
  Bell,
  X,
  CheckCircle,
  AlertTriangle,
  Info,
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  AlertCircle,
  Clock,
  Star,
  Settings,
  Mail,
  Archive,
  Trash2,
  Filter,
} from "lucide-react";

interface Notification {
  id: string;
  type: "info" | "success" | "warning" | "error";
  category: "order" | "inventory" | "customer" | "analytics" | "system" | "promotion";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: "low" | "medium" | "high" | "urgent";
  actions?: Array<{
    label: string;
    action: () => void;
    variant?: "default" | "destructive" | "outline";
  }>;
}

export default function NotificationCenter() {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      type: "warning",
      category: "inventory",
      title: "Low Stock Alert",
      message: "5 products are running low on stock and need restocking",
      timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
      read: false,
      priority: "high",
      actions: [
        {
          label: "View Inventory",
          action: () => {},
          variant: "default",
        },
      ],
    },
    {
      id: "2",
      type: "success",
      category: "order",
      title: "New Order Received",
      message: "Order #ORD-2024-001 for ₹2,450 has been placed by Rahul Sharma",
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      read: false,
      priority: "medium",
      actions: [
        {
          label: "View Order",
          action: () => {},
          variant: "default",
        },
      ],
    },
    {
      id: "3",
      type: "info",
      category: "analytics",
      title: "Weekly Report Ready",
      message: "Your weekly sales report has been generated and is ready for download",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      read: true,
      priority: "low",
      actions: [
        {
          label: "Download",
          action: () => {},
          variant: "outline",
        },
      ],
    },
    {
      id: "4",
      type: "error",
      category: "system",
      title: "Payment Failed",
      message: "Payment for order #ORD-2024-002 failed. Customer needs assistance",
      timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 minutes ago
      read: false,
      priority: "urgent",
      actions: [
        {
          label: "Contact Customer",
          action: () => {},
          variant: "default",
        },
        {
          label: "Retry Payment",
          action: () => {},
          variant: "outline",
        },
      ],
    },
    {
      id: "5",
      type: "success",
      category: "promotion",
      title: "Promotion Performance",
      message: "Summer Sale promotion has achieved 150% of expected conversions",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
      read: true,
      priority: "medium",
    },
  ]);

  const [filter, setFilter] = useState<string>("all");
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: string, category: string) => {
    if (type === "error") return <AlertCircle className="w-5 h-5 text-red-600" />;
    if (type === "warning") return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
    if (type === "success") return <CheckCircle className="w-5 h-5 text-green-600" />;
    
    switch (category) {
      case "order":
        return <ShoppingCart className="w-5 h-5 text-blue-600" />;
      case "inventory":
        return <Package className="w-5 h-5 text-purple-600" />;
      case "customer":
        return <Users className="w-5 h-5 text-green-600" />;
      case "analytics":
        return <TrendingUp className="w-5 h-5 text-indigo-600" />;
      default:
        return <Info className="w-5 h-5 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      case "high":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400";
      case "medium":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "low":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "error":
        return "border-l-red-500 bg-red-50 dark:bg-red-900/10";
      case "warning":
        return "border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/10";
      case "success":
        return "border-l-green-500 bg-green-50 dark:bg-green-900/10";
      case "info":
        return "border-l-blue-500 bg-blue-50 dark:bg-blue-900/10";
      default:
        return "border-l-gray-500 bg-gray-50 dark:bg-gray-900/10";
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    
    if (diff < 1000 * 60) return "Just now";
    if (diff < 1000 * 60 * 60) return `${Math.floor(diff / (1000 * 60))}m ago`;
    if (diff < 1000 * 60 * 60 * 24) return `${Math.floor(diff / (1000 * 60 * 60))}h ago`;
    return timestamp.toLocaleDateString();
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === "all") return true;
    if (filter === "unread") return !n.read;
    return n.category === filter;
  });

  // Simulate real-time notifications
  useEffect(() => {
    const interval = setInterval(() => {
      const shouldShow = Math.random() < 0.1; // 10% chance every 10 seconds
      if (shouldShow) {
        const newNotification: Notification = {
          id: Date.now().toString(),
          type: ["info", "success", "warning"][Math.floor(Math.random() * 3)] as any,
          category: ["order", "inventory", "customer"][Math.floor(Math.random() * 3)] as any,
          title: "New Activity",
          message: "A new activity has occurred in your store",
          timestamp: new Date(),
          read: false,
          priority: "medium",
        };
        
        setNotifications(prev => [newNotification, ...prev]);
        
        toast({
          title: newNotification.title,
          description: newNotification.message,
        });
      }
    }, 10000); // Every 10 seconds

    return () => clearInterval(interval);
  }, [toast]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              <Bell className="w-5 h-5" />
              <span>Notifications</span>
              {unreadCount > 0 && (
                <Badge variant="secondary">
                  {unreadCount} unread
                </Badge>
              )}
            </DialogTitle>
            <div className="flex items-center space-x-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setFilter("all")}>
                    All Notifications
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilter("unread")}>
                    Unread Only
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setFilter("order")}>
                    Orders
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilter("inventory")}>
                    Inventory
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilter("customer")}>
                    Customers
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilter("analytics")}>
                    Analytics
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={markAllAsRead}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark All Read
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No notifications</h3>
              <p className="text-muted-foreground">You're all caught up!</p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <Card
                key={notification.id}
                className={`cursor-pointer transition-colors border-l-4 ${getTypeColor(notification.type)} ${
                  !notification.read ? "bg-muted/30" : ""
                }`}
                onClick={() => !notification.read && markAsRead(notification.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="mt-1">
                      {getNotificationIcon(notification.type, notification.category)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">{notification.title}</h4>
                        <div className="flex items-center space-x-2">
                          <Badge className={getPriorityColor(notification.priority)} variant="secondary">
                            {notification.priority}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatTimestamp(notification.timestamp)}
                          </span>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      
                      {notification.actions && notification.actions.length > 0 && (
                        <div className="flex items-center space-x-2 mt-3">
                          {notification.actions.map((action, index) => (
                            <Button
                              key={index}
                              size="sm"
                              variant={action.variant || "default"}
                              onClick={(e) => {
                                e.stopPropagation();
                                action.action();
                              }}
                            >
                              {action.label}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-6 h-6 p-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {!notification.read ? (
                          <DropdownMenuItem onClick={() => markAsRead(notification.id)}>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Mark as read
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => setNotifications(prev =>
                            prev.map(n => n.id === notification.id ? { ...n, read: false } : n)
                          )}>
                            <Mail className="w-4 h-4 mr-2" />
                            Mark as unread
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => deleteNotification(notification.id)}>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Smart Alert Component for contextual notifications
export function SmartAlert({ type, title, message, actions, onDismiss }: {
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  actions?: Array<{ label: string; action: () => void; variant?: "default" | "destructive" | "outline" }>;
  onDismiss?: () => void;
}) {
  const getAlertStyle = () => {
    switch (type) {
      case "error":
        return "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/10";
      case "warning":
        return "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/10";
      case "success":
        return "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/10";
      default:
        return "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/10";
    }
  };

  const getIcon = () => {
    switch (type) {
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  return (
    <Card className={`border ${getAlertStyle()}`}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className="mt-0.5">{getIcon()}</div>
          <div className="flex-1">
            <h4 className="font-medium text-sm">{title}</h4>
            <p className="text-sm text-muted-foreground mt-1">{message}</p>
            
            {actions && actions.length > 0 && (
              <div className="flex items-center space-x-2 mt-3">
                {actions.map((action, index) => (
                  <Button
                    key={index}
                    size="sm"
                    variant={action.variant || "default"}
                    onClick={action.action}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
          
          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              className="w-6 h-6 p-0"
              onClick={onDismiss}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}