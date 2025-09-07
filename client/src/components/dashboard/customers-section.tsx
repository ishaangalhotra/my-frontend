import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  Users,
  Search,
  Filter,
  Plus,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Star,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  MoreHorizontal,
  Edit,
  Trash2,
  Download,
  UserPlus,
  Heart,
  Gift,
  Target,
  Eye,
  MessageCircle,
} from "lucide-react";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  joinDate: string;
  totalOrders: number;
  totalSpent: number;
  lastOrder: string;
  status: "active" | "inactive" | "vip";
  avatar?: string;
  tier: "bronze" | "silver" | "gold" | "platinum";
  tags: string[];
}

interface CustomerSegment {
  name: string;
  count: number;
  percentage: number;
  growth: string;
  color: string;
}

export default function CustomersSection() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSegment, setSelectedSegment] = useState("all");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const customers: Customer[] = [
    {
      id: "1",
      name: "Rahul Sharma",
      email: "rahul.sharma@gmail.com",
      phone: "+91 98765 43210",
      location: "Mumbai, Maharashtra",
      joinDate: "2024-01-15",
      totalOrders: 24,
      totalSpent: 48500,
      lastOrder: "2024-08-15",
      status: "vip",
      tier: "gold",
      tags: ["high-value", "frequent-buyer"],
    },
    {
      id: "2",
      name: "Priya Patel",
      email: "priya.patel@yahoo.com",
      phone: "+91 87654 32109",
      location: "Delhi, India",
      joinDate: "2024-02-20",
      totalOrders: 12,
      totalSpent: 23400,
      lastOrder: "2024-08-10",
      status: "active",
      tier: "silver",
      tags: ["regular-customer"],
    },
    {
      id: "3",
      name: "Amit Kumar",
      email: "amit.kumar@hotmail.com",
      phone: "+91 76543 21098",
      location: "Bangalore, Karnataka",
      joinDate: "2024-03-10",
      totalOrders: 8,
      totalSpent: 15600,
      lastOrder: "2024-08-05",
      status: "active",
      tier: "bronze",
      tags: ["mobile-user"],
    },
    {
      id: "4",
      name: "Sneha Reddy",
      email: "sneha.reddy@gmail.com",
      phone: "+91 65432 10987",
      location: "Hyderabad, Telangana",
      joinDate: "2024-04-25",
      totalOrders: 18,
      totalSpent: 35200,
      lastOrder: "2024-08-12",
      status: "vip",
      tier: "gold",
      tags: ["high-value", "loyal"],
    },
    {
      id: "5",
      name: "Vikash Singh",
      email: "vikash.singh@outlook.com",
      phone: "+91 54321 09876",
      location: "Pune, Maharashtra",
      joinDate: "2024-05-30",
      totalOrders: 5,
      totalSpent: 8900,
      lastOrder: "2024-07-20",
      status: "inactive",
      tier: "bronze",
      tags: ["new-customer"],
    },
  ];

  const segments: CustomerSegment[] = [
    { name: "All Customers", count: 567, percentage: 100, growth: "+15.2%", color: "bg-blue-500" },
    { name: "VIP Customers", count: 45, percentage: 8, growth: "+22.1%", color: "bg-purple-500" },
    { name: "Active", count: 423, percentage: 75, growth: "+12.5%", color: "bg-green-500" },
    { name: "Inactive", count: 99, percentage: 17, growth: "-5.2%", color: "bg-red-500" },
    { name: "New (30 days)", count: 78, percentage: 14, growth: "+28.3%", color: "bg-yellow-500" },
  ];

  const customerInsights = [
    { label: "Average Order Value", value: "₹1,945", change: "+12.3%" },
    { label: "Customer Lifetime Value", value: "₹24,500", change: "+8.7%" },
    { label: "Repeat Purchase Rate", value: "68%", change: "+5.1%" },
    { label: "Average Days Between Orders", value: "21 days", change: "-2 days" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "vip":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400";
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "inactive":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "platinum":
        return "bg-slate-100 text-slate-800 dark:bg-slate-900/20 dark:text-slate-400";
      case "gold":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "silver":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
      case "bronze":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSegment = selectedSegment === "all" || 
                          (selectedSegment === "vip" && customer.status === "vip") ||
                          (selectedSegment === "active" && customer.status === "active") ||
                          (selectedSegment === "inactive" && customer.status === "inactive");
    return matchesSearch && matchesSegment;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Customer Management</h2>
          <p className="text-muted-foreground">Manage your customer relationships and insights</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" className="bg-green-600 text-white hover:bg-green-700 border-green-600">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            <UserPlus className="w-4 h-4 mr-2" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Customer Segments */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {segments.map((segment, index) => (
          <Card 
            key={index} 
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedSegment === segment.name.toLowerCase().replace(/\s+/g, '') ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setSelectedSegment(segment.name.toLowerCase().replace(/\s+/g, ''))}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">{segment.name}</p>
                  <p className="text-2xl font-bold">{segment.count}</p>
                  <p className={`text-xs ${segment.growth.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                    {segment.growth} vs last month
                  </p>
                </div>
                <div className={`w-12 h-12 ${segment.color} rounded-full flex items-center justify-center`}>
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Customer Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {customerInsights.map((insight, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">{insight.label}</p>
                <p className="text-2xl font-bold">{insight.value}</p>
                <p className={`text-sm ${insight.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                  {insight.change} vs last period
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Customer Management Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="segments">Segments</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search customers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={selectedSegment} onValueChange={setSelectedSegment}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by segment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Customers</SelectItem>
                    <SelectItem value="vip">VIP Customers</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  More Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Customer List */}
          <Card>
            <CardHeader>
              <CardTitle>Customer List ({filteredCustomers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredCustomers.map((customer) => (
                  <div key={customer.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarImage src={customer.avatar} />
                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                          {customer.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{customer.name}</h4>
                          <Badge className={getStatusColor(customer.status)}>
                            {customer.status}
                          </Badge>
                          <Badge className={getTierColor(customer.tier)} variant="outline">
                            {customer.tier}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span className="flex items-center space-x-1">
                            <Mail className="w-3 h-3" />
                            <span>{customer.email}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <MapPin className="w-3 h-3" />
                            <span>{customer.location}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-6">
                      <div className="text-right">
                        <p className="font-medium">₹{customer.totalSpent.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">{customer.totalOrders} orders</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">Last order</p>
                        <p className="text-sm text-muted-foreground">{customer.lastOrder}</p>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setSelectedCustomer(customer)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Customer
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Mail className="w-4 h-4 mr-2" />
                            Send Email
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Customer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="segments" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Segments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {segments.map((segment, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{segment.name}</span>
                        <span className="text-sm text-muted-foreground">{segment.count} customers</span>
                      </div>
                      <Progress value={segment.percentage} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{segment.percentage}% of total</span>
                        <span className={segment.growth.startsWith('+') ? 'text-green-600' : 'text-red-600'}>
                          {segment.growth}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Customer Tiers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { tier: "Platinum", count: 12, spending: "₹50,000+", benefits: "Free shipping, priority support" },
                    { tier: "Gold", count: 45, spending: "₹25,000+", benefits: "Free shipping, exclusive offers" },
                    { tier: "Silver", count: 156, spending: "₹10,000+", benefits: "Free shipping on orders ₹500+" },
                    { tier: "Bronze", count: 354, spending: "₹0+", benefits: "Standard benefits" },
                  ].map((tier, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{tier.tier}</h4>
                        <Badge className={getTierColor(tier.tier.toLowerCase())} variant="outline">
                          {tier.count} customers
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Minimum spending: {tier.spending}
                      </p>
                      <p className="text-xs text-muted-foreground">{tier.benefits}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Engagement Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Email Open Rate</span>
                    <span className="font-medium">68%</span>
                  </div>
                  <Progress value={68} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Click-through Rate</span>
                    <span className="font-medium">12%</span>
                  </div>
                  <Progress value={12} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">App Engagement</span>
                    <span className="font-medium">45%</span>
                  </div>
                  <Progress value={45} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Social Media Follows</span>
                    <span className="font-medium">23%</span>
                  </div>
                  <Progress value={23} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { action: "Newsletter signup", count: 23, time: "2 hours ago" },
                    { action: "Product reviews", count: 8, time: "4 hours ago" },
                    { action: "Social media shares", count: 15, time: "6 hours ago" },
                    { action: "Support tickets", count: 3, time: "8 hours ago" },
                    { action: "Wishlist additions", count: 12, time: "1 day ago" },
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{activity.action}</p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                      <Badge variant="outline">{activity.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Engagement Tools</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline">
                  <Mail className="w-4 h-4 mr-2" />
                  Send Newsletter
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Gift className="w-4 h-4 mr-2" />
                  Create Promotion
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Send Survey
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Heart className="w-4 h-4 mr-2" />
                  Loyalty Program
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Target className="w-4 h-4 mr-2" />
                  Targeted Campaign
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Behavior Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <h4 className="font-medium mb-2">Peak Shopping Hours</h4>
                  <p className="text-sm text-muted-foreground">
                    Most customers shop between 7-9 PM on weekdays and 2-4 PM on weekends.
                  </p>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <h4 className="font-medium mb-2">Popular Categories</h4>
                  <p className="text-sm text-muted-foreground">
                    Electronics (45%), Fashion (30%), Home & Garden (15%), Books (10%)
                  </p>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                  <h4 className="font-medium mb-2">Seasonal Trends</h4>
                  <p className="text-sm text-muted-foreground">
                    Sales peak during festive seasons with 40% increase in November-December.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
                  <h4 className="font-medium mb-2">Re-engage Inactive Customers</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    99 customers haven't purchased in 60+ days.
                  </p>
                  <Button size="sm" variant="outline">
                    Create Win-back Campaign
                  </Button>
                </div>
                <div className="p-4 border-l-4 border-green-500 bg-green-50 dark:bg-green-950/20">
                  <h4 className="font-medium mb-2">Reward VIP Customers</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    VIP customers generate 35% of total revenue.
                  </p>
                  <Button size="sm" variant="outline">
                    Create VIP Rewards
                  </Button>
                </div>
                <div className="p-4 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950/20">
                  <h4 className="font-medium mb-2">Upsell Opportunities</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    156 customers show interest in premium products.
                  </p>
                  <Button size="sm" variant="outline">
                    Create Upsell Campaign
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Customer Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={selectedCustomer.avatar} />
                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xl">
                    {selectedCustomer.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">{selectedCustomer.name}</h3>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(selectedCustomer.status)}>
                      {selectedCustomer.status}
                    </Badge>
                    <Badge className={getTierColor(selectedCustomer.tier)} variant="outline">
                      {selectedCustomer.tier} tier
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Contact Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedCustomer.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedCustomer.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedCustomer.location}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>Joined {selectedCustomer.joinDate}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Purchase History</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Total Orders</span>
                      <span className="font-medium">{selectedCustomer.totalOrders}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Total Spent</span>
                      <span className="font-medium">₹{selectedCustomer.totalSpent.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Average Order</span>
                      <span className="font-medium">₹{Math.round(selectedCustomer.totalSpent / selectedCustomer.totalOrders).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Last Order</span>
                      <span className="font-medium">{selectedCustomer.lastOrder}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Customer
                </Button>
                <Button variant="outline">
                  <Mail className="w-4 h-4 mr-2" />
                  Send Email
                </Button>
                <Button variant="outline">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  View Orders
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}