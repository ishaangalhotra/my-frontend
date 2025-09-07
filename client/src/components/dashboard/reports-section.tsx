import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import {
  FileText,
  Download,
  TrendingUp,
  BarChart3,
  PieChart,
  Calendar as CalendarIcon,
  Filter,
  RefreshCw,
  Share,
  Clock,
  CheckCircle,
  AlertCircle,
  Printer,
  Mail,
  FileSpreadsheet,
  FileImage,
  Eye,
  Settings,
  PlayCircle,
  Pause,
  IndianRupee,
  ShoppingCart,
  Users,
  Package,
} from "lucide-react";

export default function ReportsSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [dateRange, setDateRange] = useState({ from: new Date(), to: new Date() });
  const [reportType, setReportType] = useState("sales");
  const [isGenerating, setIsGenerating] = useState(false);

  // Mock reports data - replace with real API calls
  const reports = [
    {
      id: "1",
      name: "Monthly Sales Report",
      type: "sales",
      status: "completed",
      createdAt: "2024-08-15T10:30:00Z",
      completedAt: "2024-08-15T10:35:00Z",
      fileSize: "2.4 MB",
      format: "PDF",
      downloads: 12,
    },
    {
      id: "2",
      name: "Inventory Analysis",
      type: "inventory",
      status: "processing",
      createdAt: "2024-08-15T11:00:00Z",
      completedAt: null,
      fileSize: null,
      format: "Excel",
      downloads: 0,
    },
    {
      id: "3",
      name: "Customer Insights Q2",
      type: "customers",
      status: "completed",
      createdAt: "2024-08-14T15:20:00Z",
      completedAt: "2024-08-14T15:28:00Z",
      fileSize: "1.8 MB",
      format: "PDF",
      downloads: 8,
    },
  ];

  const reportTemplates = [
    {
      id: "sales-summary",
      name: "Sales Summary",
      description: "Complete overview of sales performance",
      category: "Sales",
      estimatedTime: "2-3 minutes",
      format: ["PDF", "Excel"],
    },
    {
      id: "product-performance",
      name: "Product Performance",
      description: "Detailed analysis of product sales and trends",
      category: "Products",
      estimatedTime: "3-5 minutes",
      format: ["PDF", "Excel"],
    },
    {
      id: "customer-analysis",
      name: "Customer Analysis",
      description: "Customer behavior and segmentation insights",
      category: "Customers",
      estimatedTime: "4-6 minutes",
      format: ["PDF", "Excel"],
    },
    {
      id: "inventory-report",
      name: "Inventory Report",
      description: "Stock levels, movement, and forecasting",
      category: "Inventory",
      estimatedTime: "2-4 minutes",
      format: ["PDF", "Excel"],
    },
    {
      id: "financial-summary",
      name: "Financial Summary",
      description: "Revenue, profit margins, and financial metrics",
      category: "Finance",
      estimatedTime: "3-5 minutes",
      format: ["PDF", "Excel"],
    },
    {
      id: "marketing-performance",
      name: "Marketing Performance",
      description: "Campaign effectiveness and ROI analysis",
      category: "Marketing",
      estimatedTime: "2-3 minutes",
      format: ["PDF", "Excel"],
    },
  ];

  const quickStats = {
    totalReports: 156,
    reportsThisMonth: 23,
    avgGenerationTime: "3.2 min",
    totalDownloads: 892,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400";
      case "processing":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      case "scheduled":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "processing":
        return <RefreshCw className="w-4 h-4 animate-spin" />;
      case "failed":
        return <AlertCircle className="w-4 h-4" />;
      case "scheduled":
        return <Clock className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format.toLowerCase()) {
      case "pdf":
        return <FileText className="w-4 h-4 text-red-600" />;
      case "excel":
        return <FileSpreadsheet className="w-4 h-4 text-green-600" />;
      case "csv":
        return <FileSpreadsheet className="w-4 h-4 text-blue-600" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const generateReport = async (templateId: string, format: string) => {
    setIsGenerating(true);
    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast({
        title: "Report Generated",
        description: "Your report has been generated successfully and is ready for download.",
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Reports & Analytics</h2>
          <p className="text-muted-foreground">Generate comprehensive business reports</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" className="bg-purple-600 text-white hover:bg-purple-700 border-purple-600">
            <Settings className="w-4 h-4 mr-2" />
            Schedule Reports
          </Button>
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            <PlayCircle className="w-4 h-4 mr-2" />
            Quick Report
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Reports</p>
                <p className="text-3xl font-bold">{quickStats.totalReports}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">This Month</p>
                <p className="text-3xl font-bold">{quickStats.reportsThisMonth}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Generation</p>
                <p className="text-3xl font-bold">{quickStats.avgGenerationTime}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Downloads</p>
                <p className="text-3xl font-bold">{quickStats.totalDownloads}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-xl flex items-center justify-center">
                <Download className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports Management */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Report Generation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Report Type</label>
                    <Select value={reportType} onValueChange={setReportType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sales">Sales Report</SelectItem>
                        <SelectItem value="products">Product Performance</SelectItem>
                        <SelectItem value="customers">Customer Analysis</SelectItem>
                        <SelectItem value="inventory">Inventory Report</SelectItem>
                        <SelectItem value="financial">Financial Summary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Format</label>
                    <Select defaultValue="pdf">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF Document</SelectItem>
                        <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                        <SelectItem value="csv">CSV File</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Date Range</label>
                  <div className="flex space-x-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="flex-1">
                          <CalendarIcon className="w-4 h-4 mr-2" />
                          {dateRange.from ? dateRange.from.toLocaleDateString() : "From"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dateRange.from}
                          onSelect={(date) => date && setDateRange(prev => ({ ...prev, from: date }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="flex-1">
                          <CalendarIcon className="w-4 h-4 mr-2" />
                          {dateRange.to ? dateRange.to.toLocaleDateString() : "To"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dateRange.to}
                          onSelect={(date) => date && setDateRange(prev => ({ ...prev, to: date }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <Button
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                  disabled={isGenerating}
                  onClick={() => generateReport("custom", "pdf")}
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Generating Report...
                    </>
                  ) : (
                    <>
                      <PlayCircle className="w-4 h-4 mr-2" />
                      Generate Report
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Reports</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {reports.slice(0, 3).map((report) => (
                  <div key={report.id} className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      {getFormatIcon(report.format)}
                      {getStatusIcon(report.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{report.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {report.status === "completed" && (
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reportTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <Badge variant="outline">{template.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground text-sm">{template.description}</p>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Est. Time</span>
                    <span className="font-medium">{template.estimatedTime}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">Formats:</span>
                    {template.format.map((fmt, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {fmt}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex space-x-2">
                    {template.format.map((format, index) => (
                      <Button
                        key={index}
                        size="sm"
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                        onClick={() => generateReport(template.id, format.toLowerCase())}
                        disabled={isGenerating}
                      >
                        Generate {format}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Report History</CardTitle>
              <div className="flex items-center space-x-2">
                <Select defaultValue="all">
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Reports</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="products">Products</SelectItem>
                    <SelectItem value="customers">Customers</SelectItem>
                    <SelectItem value="inventory">Inventory</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left py-4 px-6 font-medium text-muted-foreground">Report</th>
                      <th className="text-left py-4 px-6 font-medium text-muted-foreground">Type</th>
                      <th className="text-left py-4 px-6 font-medium text-muted-foreground">Status</th>
                      <th className="text-left py-4 px-6 font-medium text-muted-foreground">Created</th>
                      <th className="text-left py-4 px-6 font-medium text-muted-foreground">Size</th>
                      <th className="text-left py-4 px-6 font-medium text-muted-foreground">Downloads</th>
                      <th className="text-left py-4 px-6 font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {reports.map((report) => (
                      <tr key={report.id} className="hover:bg-muted/50">
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-3">
                            {getFormatIcon(report.format)}
                            <div>
                              <div className="font-medium">{report.name}</div>
                              <div className="text-sm text-muted-foreground">{report.format}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <Badge variant="outline" className="capitalize">
                            {report.type}
                          </Badge>
                        </td>
                        <td className="py-4 px-6">
                          <Badge className={`${getStatusColor(report.status)} flex items-center space-x-1 w-fit`}>
                            {getStatusIcon(report.status)}
                            <span className="capitalize">{report.status}</span>
                          </Badge>
                        </td>
                        <td className="py-4 px-6">
                          <div>{new Date(report.createdAt).toLocaleDateString()}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(report.createdAt).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="py-4 px-6">{report.fileSize || "—"}</td>
                        <td className="py-4 px-6">{report.downloads}</td>
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-2">
                            {report.status === "completed" && (
                              <>
                                <Button variant="ghost" size="sm">
                                  <Download className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Share className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            {report.status === "processing" && (
                              <Button variant="ghost" size="sm">
                                <Pause className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Scheduled Reports</h3>
                <p className="text-muted-foreground mb-4">
                  Set up automatic report generation to receive regular insights.
                </p>
                <Button className="bg-indigo-600 hover:bg-indigo-700">
                  <Settings className="w-4 h-4 mr-2" />
                  Schedule Your First Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}