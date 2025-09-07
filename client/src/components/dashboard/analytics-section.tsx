import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Calendar,
  Download,
  RefreshCw,
  Eye,
  MousePointer,
  Clock,
  Target,
  Star,
  BarChart3,
  PieChart,
  LineChart,
} from "lucide-react";

interface MetricCard {
  title: string;
  value: string;
  change: string;
  changeType: "increase" | "decrease";
  icon: React.ReactNode;
  color: string;
  description: string;
}

interface ChartData {
  name: string;
  value: number;
  revenue?: number;
  orders?: number;
  visitors?: number;
  conversions?: number;
}

export default function AnalyticsSection() {
  const [dateRange, setDateRange] = useState("7d");
  const [activeTab, setActiveTab] = useState("overview");
  const [realtimeData, setRealtimeData] = useState({
    activeUsers: 23,
    newOrders: 5,
    revenue: 12450,
  });

  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setRealtimeData(prev => ({
        activeUsers: Math.max(10, prev.activeUsers + Math.floor(Math.random() * 10) - 5),
        newOrders: prev.newOrders + (Math.random() > 0.7 ? 1 : 0),
        revenue: prev.revenue + Math.floor(Math.random() * 500),
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const metrics: MetricCard[] = [
    {
      title: "Total Revenue",
      value: `₹${realtimeData.revenue.toLocaleString()}`,
      change: "+12.3%",
      changeType: "increase",
      icon: <DollarSign className="w-6 h-6" />,
      color: "text-green-600",
      description: "vs last period",
    },
    {
      title: "Orders",
      value: realtimeData.newOrders.toString(),
      change: "+8.1%",
      changeType: "increase",
      icon: <ShoppingCart className="w-6 h-6" />,
      color: "text-blue-600",
      description: "new orders today",
    },
    {
      title: "Active Users",
      value: realtimeData.activeUsers.toString(),
      change: "+15.2%",
      changeType: "increase",
      icon: <Users className="w-6 h-6" />,
      color: "text-purple-600",
      description: "online now",
    },
    {
      title: "Conversion Rate",
      value: "3.24%",
      change: "-2.1%",
      changeType: "decrease",
      icon: <Target className="w-6 h-6" />,
      color: "text-orange-600",
      description: "visitors to customers",
    },
  ];

  const salesData: ChartData[] = [
    { name: "Mon", value: 4000, revenue: 4000, orders: 20 },
    { name: "Tue", value: 3000, revenue: 3000, orders: 18 },
    { name: "Wed", value: 5000, revenue: 5000, orders: 25 },
    { name: "Thu", value: 4500, revenue: 4500, orders: 22 },
    { name: "Fri", value: 6000, revenue: 6000, orders: 30 },
    { name: "Sat", value: 5500, revenue: 5500, orders: 28 },
    { name: "Sun", value: 7000, revenue: 7000, orders: 35 },
  ];

  const trafficData: ChartData[] = [
    { name: "Organic Search", value: 45, visitors: 2450 },
    { name: "Direct", value: 25, visitors: 1350 },
    { name: "Social Media", value: 15, visitors: 810 },
    { name: "Email", value: 10, visitors: 540 },
    { name: "Paid Ads", value: 5, visitors: 270 },
  ];

  const conversionFunnel = [
    { stage: "Visitors", count: 5400, rate: 100 },
    { stage: "Product Views", count: 3240, rate: 60 },
    { stage: "Add to Cart", count: 810, rate: 15 },
    { stage: "Checkout", count: 405, rate: 7.5 },
    { stage: "Purchase", count: 175, rate: 3.24 },
  ];

  const topProducts = [
    { name: "Wireless Earbuds", revenue: 15600, orders: 52, growth: "+22%" },
    { name: "Smartphone Case", revenue: 12400, orders: 41, growth: "+15%" },
    { name: "Power Bank", revenue: 9800, orders: 35, growth: "+8%" },
    { name: "Bluetooth Speaker", revenue: 8200, orders: 28, growth: "+12%" },
    { name: "Phone Charger", revenue: 6500, orders: 22, growth: "+5%" },
  ];

  const getChangeIcon = (type: "increase" | "decrease") => {
    return type === "increase" ? (
      <TrendingUp className="w-4 h-4 text-green-600" />
    ) : (
      <TrendingDown className="w-4 h-4 text-red-600" />
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-muted-foreground">Track your store's performance and insights</p>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Today</SelectItem>
              <SelectItem value="7d">7 days</SelectItem>
              <SelectItem value="30d">30 days</SelectItem>
              <SelectItem value="90d">90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {metric.title}
                  </p>
                  <p className="text-2xl font-bold">{metric.value}</p>
                  <div className="flex items-center space-x-1">
                    {getChangeIcon(metric.changeType)}
                    <span className={`text-sm font-medium ${
                      metric.changeType === "increase" ? "text-green-600" : "text-red-600"
                    }`}>
                      {metric.change}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">
                      {metric.description}
                    </span>
                  </div>
                </div>
                <div className={`${metric.color} opacity-80`}>
                  {metric.icon}
                </div>
              </div>
            </CardContent>
            <div className={`absolute bottom-0 left-0 right-0 h-1 ${
              metric.changeType === "increase" ? "bg-green-500" : "bg-red-500"
            }`} />
          </Card>
        ))}
      </div>

      {/* Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="sales" className="flex items-center space-x-2">
            <LineChart className="w-4 h-4" />
            <span>Sales</span>
          </TabsTrigger>
          <TabsTrigger value="traffic" className="flex items-center space-x-2">
            <PieChart className="w-4 h-4" />
            <span>Traffic</span>
          </TabsTrigger>
          <TabsTrigger value="conversion" className="flex items-center space-x-2">
            <Target className="w-4 h-4" />
            <span>Conversion</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Sales Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-end justify-between space-x-1">
                  {salesData.map((data, index) => (
                    <div key={index} className="flex flex-col items-center space-y-2">
                      <div
                        className="bg-blue-500 rounded-t-sm transition-all duration-500"
                        style={{
                          height: `${(data.value / 7000) * 200}px`,
                          width: "30px",
                        }}
                      />
                      <span className="text-xs text-muted-foreground">{data.name}</span>
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
                  {topProducts.slice(0, 5).map((product, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {product.orders} orders
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-sm">₹{product.revenue.toLocaleString()}</p>
                        <p className="text-xs text-green-600">{product.growth}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Real-time Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <span>Real-time Activity</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {realtimeData.activeUsers}
                  </div>
                  <p className="text-sm text-muted-foreground">Active Users</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {realtimeData.newOrders}
                  </div>
                  <p className="text-sm text-muted-foreground">New Orders</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    ₹{realtimeData.revenue.toLocaleString()}
                  </div>
                  <p className="text-sm text-muted-foreground">Today's Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Sales Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-end justify-between space-x-2">
                  {salesData.map((data, index) => (
                    <div key={index} className="flex flex-col items-center space-y-2">
                      <div className="text-xs font-medium">₹{data.revenue}</div>
                      <div
                        className="bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-lg transition-all duration-700"
                        style={{
                          height: `${(data.revenue / 7000) * 250}px`,
                          width: "40px",
                        }}
                      />
                      <span className="text-xs text-muted-foreground">{data.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sales Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Weekly Goal</span>
                    <span>75%</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Monthly Goal</span>
                    <span>60%</span>
                  </div>
                  <Progress value={60} className="h-2" />
                </div>
                <div className="space-y-3 pt-4 border-t">
                  <div className="flex justify-between">
                    <span className="text-sm">Average Order</span>
                    <span className="font-medium">₹1,945</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Best Day</span>
                    <span className="font-medium">Sunday</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Total Items</span>
                    <span className="font-medium">178</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="traffic" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Traffic Sources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {trafficData.map((source, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{source.name}</span>
                        <span>{source.value}%</span>
                      </div>
                      <Progress value={source.value} className="h-2" />
                      <div className="text-xs text-muted-foreground text-right">
                        {source.visitors} visitors
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Behavior</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <Eye className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold">3.2</div>
                    <div className="text-xs text-muted-foreground">Avg. Page Views</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <Clock className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold">2:34</div>
                    <div className="text-xs text-muted-foreground">Avg. Session</div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Bounce Rate</span>
                    <span className="font-medium">45.2%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Return Visitors</span>
                    <span className="font-medium">38.7%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">New Visitors</span>
                    <span className="font-medium">61.3%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="conversion" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Conversion Funnel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {conversionFunnel.map((step, index) => (
                  <div key={index} className="relative">
                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{step.stage}</p>
                          <p className="text-sm text-muted-foreground">
                            {step.count.toLocaleString()} users
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{step.rate}%</p>
                        <Progress value={step.rate} className="w-24 h-2" />
                      </div>
                    </div>
                    {index < conversionFunnel.length - 1 && (
                      <div className="absolute left-8 top-full w-0.5 h-4 bg-border" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}