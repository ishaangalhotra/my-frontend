import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useTheme } from "@/hooks/use-theme";
import AnalyticsSection from "@/components/dashboard/analytics-section";
import CustomersSection from "@/components/dashboard/customers-section";
import PromotionsSection from "@/components/dashboard/promotions-section";
import ReportsSection from "@/components/dashboard/reports-section";
import SettingsSection from "@/components/dashboard/settings-section";
import Header from "@/components/dashboard/header";
import {
  BarChart3,
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  DollarSign,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Star,
  Zap,
  Target,
  Settings,
  FileBarChart,
  Menu,
  X,
} from "lucide-react";

interface DashboardStats {
  title: string;
  value: string;
  change: string;
  changeType: "increase" | "decrease";
  icon: React.ReactNode;
  color: string;
}

const dashboardStats: DashboardStats[] = [
  {
    title: "Total Revenue",
    value: "₹2,45,678",
    change: "+12.3%",
    changeType: "increase",
    icon: <DollarSign className="w-6 h-6" />,
    color: "text-green-600",
  },
  {
    title: "Orders",
    value: "1,234",
    change: "+8.1%",
    changeType: "increase",
    icon: <ShoppingCart className="w-6 h-6" />,
    color: "text-blue-600",
  },
  {
    title: "Products",
    value: "89",
    change: "+2.4%",
    changeType: "increase",
    icon: <Package className="w-6 h-6" />,
    color: "text-purple-600",
  },
  {
    title: "Customers",
    value: "567",
    change: "+15.2%",
    changeType: "increase",
    icon: <Users className="w-6 h-6" />,
    color: "text-orange-600",
  },
];

const quickStats = [
  { label: "Avg. Order Value", value: "₹1,945", color: "bg-blue-500" },
  { label: "Conversion Rate", value: "3.2%", color: "bg-green-500" },
  { label: "Return Rate", value: "2.1%", color: "bg-red-500" },
  { label: "Customer Satisfaction", value: "4.8/5", color: "bg-yellow-500" },
];

const recentOrders = [
  {
    id: "ORD-001",
    customer: "Rahul Sharma",
    amount: "₹2,450",
    status: "Completed",
    date: "2 min ago",
  },
  {
    id: "ORD-002",
    customer: "Priya Patel",
    amount: "₹1,850",
    status: "Processing",
    date: "15 min ago",
  },
  {
    id: "ORD-003",
    customer: "Amit Kumar",
    amount: "₹3,200",
    status: "Shipped",
    date: "32 min ago",
  },
  {
    id: "ORD-004",
    customer: "Sneha Reddy",
    amount: "₹975",
    status: "Pending",
    date: "1 hour ago",
  },
];

const topProducts = [
  { name: "Wireless Earbuds", sales: 145, revenue: "₹1,45,000", growth: "+22%" },
  { name: "Smartphone Case", sales: 89, revenue: "₹89,000", growth: "+15%" },
  { name: "Power Bank", sales: 67, revenue: "₹67,000", growth: "+8%" },
  { name: "Bluetooth Speaker", sales: 54, revenue: "₹54,000", growth: "+12%" },
];

const alerts = [
  {
    type: "warning",
    message: "5 products are running low on stock",
    action: "Restock now",
  },
  {
    type: "info",
    message: "Weekly sales report is ready",
    action: "View report",
  },
  {
    type: "success",
    message: "New customer milestone reached: 500 customers!",
    action: "Celebrate",
  },
];

export default function Dashboard() {
  const { theme } = useTheme();
  const [activeSection, setActiveSection] = useState("analytics");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const navigation = [
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "orders", label: "Orders", icon: ShoppingCart },
    { id: "products", label: "Products", icon: Package },
    { id: "inventory", label: "Inventory", icon: Package },
    { id: "customers", label: "Customers", icon: Users },
    { id: "promotions", label: "Promotions", icon: Target },
    { id: "reports", label: "Reports", icon: FileBarChart },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "processing":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "shipped":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      default:
        return <Zap className="w-5 h-5 text-blue-600" />;
    }
  };

  const renderContent = () => {
    switch (activeSection) {
      case "analytics":
        return <AnalyticsSection />;
      case "customers":
        return <CustomersSection />;
      case "promotions":
        return <PromotionsSection />;
      case "reports":
        return <ReportsSection />;
      case "settings":
        return <SettingsSection />;
      case "orders":
      case "products":
      case "inventory":
        return (
          <div className="p-6">
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)} Management
              </h3>
              <p className="text-muted-foreground mb-6">
                This section is coming soon with advanced {activeSection} management features.
              </p>
              <Button onClick={() => setActiveSection("analytics")}>
                Return to Analytics
              </Button>
            </div>
          </div>
        );
      default:
        return (
          <div className="space-y-6 p-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {dashboardStats.map((stat, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {stat.title}
                        </p>
                        <p className="text-2xl font-bold">{stat.value}</p>
                        <p className={`text-sm ${stat.color}`}>
                          {stat.change} from last month
                        </p>
                      </div>
                      <div className={`${stat.color}`}>{stat.icon}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {quickStats.map((stat, index) => (
                    <div key={index} className="text-center p-4 rounded-lg border">
                      <div className={`w-4 h-4 ${stat.color} rounded mx-auto mb-2`}></div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-lg font-semibold">{stat.value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Orders */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Recent Orders</CardTitle>
                  <Button variant="outline" size="sm">
                    View All
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentOrders.map((order, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{order.id}</p>
                          <p className="text-sm text-muted-foreground">
                            {order.customer}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{order.amount}</p>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Products */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topProducts.map((product, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Star className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {product.sales} sales
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{product.revenue}</p>
                          <p className="text-sm text-green-600">{product.growth}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Alerts */}
            <Card>
              <CardHeader>
                <CardTitle>Important Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {alerts.map((alert, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 rounded-lg border"
                    >
                      <div className="flex items-center space-x-3">
                        {getAlertIcon(alert.type)}
                        <p className="text-sm">{alert.message}</p>
                      </div>
                      <Button variant="outline" size="sm">
                        {alert.action}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <div className={`${
          sidebarCollapsed ? "w-16" : "w-64"
        } lg:block ${
          sidebarCollapsed ? "" : "hidden"
        } fixed lg:relative h-screen bg-card border-r border-border transition-all duration-300 z-30`}>
          <div className="p-6">
            <div className="flex items-center space-x-3">
              {!sidebarCollapsed && (
                <>
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <h1 className="text-xl font-bold">QuickLocal</h1>
                </>
              )}
              {sidebarCollapsed && (
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mx-auto">
                  <TrendingUp className="w-5 h-5 text-primary-foreground" />
                </div>
              )}
            </div>
          </div>

          <nav className="px-4 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeSection === item.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </button>
              );
            })}
          </nav>

          <div className="absolute bottom-6 left-4 right-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-full justify-center lg:justify-start"
            >
              {sidebarCollapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4 mr-2" />}
              {!sidebarCollapsed && <span>Collapse</span>}
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 lg:ml-0">
          <Header
            activeSection={activeSection}
            sidebarCollapsed={sidebarCollapsed}
            onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
          <main className="overflow-auto">{renderContent()}</main>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {!sidebarCollapsed && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-20"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}
    </div>
  );
}