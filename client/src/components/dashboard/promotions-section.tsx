import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Dialog,
  DialogContent,
  DialogDescription,
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
  Target,
  Plus,
  Calendar,
  TrendingUp,
  Users,
  ShoppingCart,
  DollarSign,
  Percent,
  Gift,
  Tag,
  Clock,
  Star,
  BarChart3,
  Edit,
  Trash2,
  Copy,
  Play,
  Pause,
  MoreHorizontal,
  Zap,
  Crown,
  Heart,
  Megaphone,
} from "lucide-react";

interface Promotion {
  id: string;
  name: string;
  type: "percentage" | "fixed" | "bogo" | "free_shipping";
  value: number;
  code: string;
  description: string;
  startDate: string;
  endDate: string;
  status: "active" | "scheduled" | "expired" | "paused";
  usage: {
    used: number;
    limit: number;
  };
  performance: {
    revenue: number;
    orders: number;
    customers: number;
    conversionRate: number;
  };
  conditions: {
    minOrder?: number;
    categories?: string[];
    customers?: string[];
  };
}

interface PromotionTemplate {
  id: string;
  name: string;
  type: string;
  description: string;
  discount: string;
  icon: React.ReactNode;
  color: string;
}

export default function PromotionsSection() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const promotions: Promotion[] = [
    {
      id: "1",
      name: "Summer Sale 2024",
      type: "percentage",
      value: 20,
      code: "SUMMER20",
      description: "20% off on all summer collection items",
      startDate: "2024-06-01",
      endDate: "2024-08-31",
      status: "active",
      usage: { used: 245, limit: 1000 },
      performance: {
        revenue: 85600,
        orders: 245,
        customers: 198,
        conversionRate: 3.2,
      },
      conditions: {
        minOrder: 500,
        categories: ["fashion", "accessories"],
      },
    },
    {
      id: "2",
      name: "First Order Discount",
      type: "fixed",
      value: 100,
      code: "WELCOME100",
      description: "₹100 off on first order",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      status: "active",
      usage: { used: 89, limit: -1 },
      performance: {
        revenue: 24500,
        orders: 89,
        customers: 89,
        conversionRate: 8.9,
      },
      conditions: {
        minOrder: 200,
        customers: ["new"],
      },
    },
    {
      id: "3",
      name: "Buy One Get One",
      type: "bogo",
      value: 50,
      code: "BOGO50",
      description: "Buy one get one at 50% off",
      startDate: "2024-08-01",
      endDate: "2024-08-31",
      status: "scheduled",
      usage: { used: 0, limit: 500 },
      performance: {
        revenue: 0,
        orders: 0,
        customers: 0,
        conversionRate: 0,
      },
      conditions: {
        categories: ["electronics"],
      },
    },
    {
      id: "4",
      name: "Free Shipping Weekend",
      type: "free_shipping",
      value: 0,
      code: "FREESHIP",
      description: "Free shipping on all orders",
      startDate: "2024-07-20",
      endDate: "2024-07-22",
      status: "expired",
      usage: { used: 156, limit: -1 },
      performance: {
        revenue: 45600,
        orders: 156,
        customers: 134,
        conversionRate: 4.1,
      },
      conditions: {},
    },
  ];

  const promotionTemplates: PromotionTemplate[] = [
    {
      id: "1",
      name: "Percentage Discount",
      type: "percentage",
      description: "Offer a percentage discount on selected items",
      discount: "5% - 50%",
      icon: <Percent className="w-6 h-6" />,
      color: "bg-blue-500",
    },
    {
      id: "2",
      name: "Fixed Amount Off",
      type: "fixed",
      description: "Give a fixed amount discount on orders",
      discount: "₹50 - ₹1000",
      icon: <DollarSign className="w-6 h-6" />,
      color: "bg-green-500",
    },
    {
      id: "3",
      name: "Buy One Get One",
      type: "bogo",
      description: "Buy one product and get another free or discounted",
      discount: "50% - 100%",
      icon: <Gift className="w-6 h-6" />,
      color: "bg-purple-500",
    },
    {
      id: "4",
      name: "Free Shipping",
      type: "free_shipping",
      description: "Offer free shipping on qualifying orders",
      discount: "Shipping Cost",
      icon: <Zap className="w-6 h-6" />,
      color: "bg-orange-500",
    },
    {
      id: "5",
      name: "VIP Customer",
      type: "vip",
      description: "Exclusive discounts for VIP customers",
      discount: "10% - 30%",
      icon: <Crown className="w-6 h-6" />,
      color: "bg-yellow-500",
    },
    {
      id: "6",
      name: "Flash Sale",
      type: "flash",
      description: "Limited time offers with countdown",
      discount: "20% - 60%",
      icon: <Clock className="w-6 h-6" />,
      color: "bg-red-500",
    },
  ];

  const campaignMetrics = [
    { label: "Active Promotions", value: "3", change: "+1" },
    { label: "Total Revenue", value: "₹1,55,700", change: "+22.5%" },
    { label: "Orders Generated", value: "334", change: "+18.2%" },
    { label: "Avg. Conversion Rate", value: "5.4%", change: "+1.2%" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "scheduled":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "expired":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      case "paused":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "percentage":
        return <Percent className="w-4 h-4" />;
      case "fixed":
        return <DollarSign className="w-4 h-4" />;
      case "bogo":
        return <Gift className="w-4 h-4" />;
      case "free_shipping":
        return <Zap className="w-4 h-4" />;
      default:
        return <Tag className="w-4 h-4" />;
    }
  };

  const formatDiscount = (promotion: Promotion) => {
    switch (promotion.type) {
      case "percentage":
        return `${promotion.value}% OFF`;
      case "fixed":
        return `₹${promotion.value} OFF`;
      case "bogo":
        return `BOGO ${promotion.value}%`;
      case "free_shipping":
        return "FREE SHIPPING";
      default:
        return "DISCOUNT";
    }
  };

  const handleCreatePromotion = (template: PromotionTemplate) => {
    toast({
      title: "Creating Promotion",
      description: `Setting up ${template.name} promotion...`,
    });
    setIsCreateDialogOpen(false);
  };

  const handleTogglePromotion = (promotion: Promotion) => {
    const newStatus = promotion.status === "active" ? "paused" : "active";
    toast({
      title: "Promotion Updated",
      description: `${promotion.name} has been ${newStatus}.`,
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Promotions & Campaigns</h2>
          <p className="text-muted-foreground">Create and manage promotional campaigns to boost sales</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Promotion
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Choose Promotion Type</DialogTitle>
                <DialogDescription>
                  Select a promotion template to get started with your campaign
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {promotionTemplates.map((template) => (
                  <Card 
                    key={template.id} 
                    className="cursor-pointer hover:shadow-lg transition-all hover:scale-105"
                    onClick={() => handleCreatePromotion(template)}
                  >
                    <CardContent className="p-6 text-center">
                      <div className={`w-16 h-16 ${template.color} rounded-full flex items-center justify-center mx-auto mb-4 text-white`}>
                        {template.icon}
                      </div>
                      <h3 className="font-medium mb-2">{template.name}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                      <Badge variant="outline">{template.discount}</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Campaign Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {campaignMetrics.map((metric, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
                <p className="text-2xl font-bold">{metric.value}</p>
                <p className={`text-sm ${metric.change.startsWith('+') ? 'text-green-600' : 'text-blue-600'}`}>
                  {metric.change} from last month
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Promotion Management Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Active Promotions */}
          <Card>
            <CardHeader>
              <CardTitle>Active & Scheduled Promotions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {promotions.filter(p => p.status === "active" || p.status === "scheduled").map((promotion) => (
                  <div key={promotion.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white">
                        {getTypeIcon(promotion.type)}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{promotion.name}</h4>
                          <Badge className={getStatusColor(promotion.status)}>
                            {promotion.status}
                          </Badge>
                          <Badge variant="outline" className="text-lg font-bold">
                            {formatDiscount(promotion)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{promotion.description}</p>
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <span>Code: {promotion.code}</span>
                          <span>Valid: {promotion.startDate} to {promotion.endDate}</span>
                          {promotion.usage.limit > 0 && (
                            <span>Used: {promotion.usage.used}/{promotion.usage.limit}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="font-medium">₹{promotion.performance.revenue.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">{promotion.performance.orders} orders</p>
                      </div>
                      
                      {promotion.usage.limit > 0 && (
                        <div className="w-24">
                          <Progress 
                            value={(promotion.usage.used / promotion.usage.limit) * 100} 
                            className="h-2" 
                          />
                          <p className="text-xs text-center mt-1">
                            {Math.round((promotion.usage.used / promotion.usage.limit) * 100)}%
                          </p>
                        </div>
                      )}
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setSelectedPromotion(promotion)}>
                            <BarChart3 className="w-4 h-4 mr-2" />
                            View Analytics
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Promotion
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Copy className="w-4 h-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleTogglePromotion(promotion)}>
                            {promotion.status === "active" ? (
                              <>
                                <Pause className="w-4 h-4 mr-2" />
                                Pause
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4 mr-2" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Megaphone className="w-5 h-5" />
                  <span>Quick Campaigns</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline">
                  <Clock className="w-4 h-4 mr-2" />
                  Flash Sale (24hrs)
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Heart className="w-4 h-4 mr-2" />
                  Weekend Special
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Users className="w-4 h-4 mr-2" />
                  New Customer Offer
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Star className="w-4 h-4 mr-2" />
                  Loyalty Reward
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Conversion Rate</span>
                    <span className="font-medium">5.4%</span>
                  </div>
                  <Progress value={54} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Revenue Impact</span>
                    <span className="font-medium">+22.5%</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Customer Acquisition</span>
                    <span className="font-medium">+18.2%</span>
                  </div>
                  <Progress value={65} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Upcoming Events</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <h4 className="font-medium text-sm">Independence Day Sale</h4>
                  <p className="text-xs text-muted-foreground">Starts in 5 days</p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <h4 className="font-medium text-sm">Back to School</h4>
                  <p className="text-xs text-muted-foreground">Starts in 12 days</p>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                  <h4 className="font-medium text-sm">Festive Season</h4>
                  <p className="text-xs text-muted-foreground">Starts in 45 days</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {promotionTemplates.map((template) => (
              <Card key={template.id} className="cursor-pointer hover:shadow-lg transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className={`w-12 h-12 ${template.color} rounded-lg flex items-center justify-center text-white`}>
                      {template.icon}
                    </div>
                    <div>
                      <h3 className="font-medium">{template.name}</h3>
                      <Badge variant="outline">{template.discount}</Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{template.description}</p>
                  <Button 
                    className="w-full" 
                    onClick={() => handleCreatePromotion(template)}
                  >
                    Use Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Promotion Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {promotions.filter(p => p.performance.orders > 0).map((promotion, index) => (
                    <div key={promotion.id} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">{promotion.name}</span>
                        <span className="text-sm text-muted-foreground">
                          ₹{promotion.performance.revenue.toLocaleString()}
                        </span>
                      </div>
                      <Progress 
                        value={(promotion.performance.revenue / 100000) * 100} 
                        className="h-2" 
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{promotion.performance.orders} orders</span>
                        <span>{promotion.performance.conversionRate}% conversion</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ROI Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">324%</div>
                    <div className="text-xs text-muted-foreground">Average ROI</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">₹45</div>
                    <div className="text-xs text-muted-foreground">Cost per Acquisition</div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Revenue Generated</span>
                    <span className="font-medium">₹1,55,700</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Promotion Costs</span>
                    <span className="font-medium">₹48,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Net Profit</span>
                    <span className="font-medium text-green-600">₹1,07,700</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Promotion History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {promotions.map((promotion) => (
                  <div key={promotion.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                        {getTypeIcon(promotion.type)}
                      </div>
                      <div>
                        <h4 className="font-medium">{promotion.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {promotion.startDate} - {promotion.endDate}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Badge className={getStatusColor(promotion.status)}>
                        {promotion.status}
                      </Badge>
                      <div className="text-right">
                        <p className="font-medium">₹{promotion.performance.revenue.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">{promotion.performance.orders} orders</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Promotion Details Modal */}
      {selectedPromotion && (
        <Dialog open={!!selectedPromotion} onOpenChange={() => setSelectedPromotion(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{selectedPromotion.name} - Analytics</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">₹{selectedPromotion.performance.revenue.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">Revenue</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{selectedPromotion.performance.orders}</div>
                  <div className="text-xs text-muted-foreground">Orders</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{selectedPromotion.performance.customers}</div>
                  <div className="text-xs text-muted-foreground">Customers</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{selectedPromotion.performance.conversionRate}%</div>
                  <div className="text-xs text-muted-foreground">Conversion</div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Promotion Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Code:</span>
                      <span className="font-mono">{selectedPromotion.code}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Type:</span>
                      <span>{formatDiscount(selectedPromotion)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <Badge className={getStatusColor(selectedPromotion.status)}>
                        {selectedPromotion.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Period:</span>
                      <span>{selectedPromotion.startDate} to {selectedPromotion.endDate}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Usage Statistics</h4>
                  <div className="space-y-3">
                    {selectedPromotion.usage.limit > 0 && (
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Usage</span>
                          <span>{selectedPromotion.usage.used}/{selectedPromotion.usage.limit}</span>
                        </div>
                        <Progress 
                          value={(selectedPromotion.usage.used / selectedPromotion.usage.limit) * 100} 
                          className="h-2" 
                        />
                      </div>
                    )}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Avg. Order Value:</span>
                        <span>₹{Math.round(selectedPromotion.performance.revenue / selectedPromotion.performance.orders).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Customer Acquisition:</span>
                        <span>{selectedPromotion.performance.customers}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}