import React, { useState, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  AreaChart, 
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer,
  Scatter,
  ScatterChart
} from 'recharts';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Download,
  Upload,
  BarChart2,
  TrendingUp,
  AlertCircle,
  Clock,
  Users,
  Activity,
  DollarSign,
  Save
} from 'lucide-react';

interface AnalyticsData {
  usage: {
    daily: any[];
    weekly: any[];
    monthly: any[];
  };
  compute: {
    performance: any[];
    resources: any[];
    costs: any[];
  };
  revenue: {
    breakdown: any[];
    trends: any[];
  };
  users: {
    activity: any[];
    demographics: any[];
  };
}

const AdvancedAnalytics: React.FC<{ datasetId: string }> = ({ datasetId }) => {
  const [timeframe, setTimeframe] = useState('weekly');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [exportFormat, setExportFormat] = useState('json');
  const { toast } = useToast();

  // Detailed Analytics Components
  const UsageMetrics = ({ data }) => (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Usage Metrics
        </CardTitle>
        <div className="flex items-center gap-2">
          <Select
            value={timeframe}
            onValueChange={setTimeframe}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => exportAnalytics('usage')}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={data[timeframe]}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="timestamp" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area
              type="monotone"
              dataKey="downloads"
              stackId="1"
              stroke="#8884d8"
              fill="#8884d8"
              name="Downloads"
            />
            <Area
              type="monotone"
              dataKey="computeJobs"
              stackId="1"
              stroke="#82ca9d"
              fill="#82ca9d"
              name="Compute Jobs"
            />
            <Area
              type="monotone"
              dataKey="queries"
              stackId="1"
              stroke="#ffc658"
              fill="#ffc658"
              name="API Queries"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );

  const ComputePerformance = ({ data }) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Compute Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="duration" name="Duration (s)" />
            <YAxis dataKey="resourceUsage" name="Resource Usage (%)" />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Legend />
            <Scatter
              name="Compute Jobs"
              data={data.performance}
              fill="#8884d8"
            />
          </ScatterChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );

  const RevenueAnalysis = ({ data }) => (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Revenue Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        <div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.breakdown}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                label
              >
                {data.breakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#8884d8"
                name="Revenue"
              />
              <Line
                type="monotone"
                dataKey="costs"
                stroke="#82ca9d"
                name="Costs"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );

  const UserAnalytics = ({ data }) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          User Analytics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Active Users</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.activity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="users" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div>
            <h4 className="font-medium mb-2">User Distribution</h4>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={data.demographics}
                  dataKey="value"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  label
                />
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Settings Export/Import
  const SettingsManager = () => {
    const handleExport = async () => {
      try {
        const settings = await fetchSettings();
        const data = JSON.stringify(settings, null, 2);
        
        // Create download
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dataset-${datasetId}-settings.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast({
          title: "Settings Exported",
          description: "Settings file has been downloaded"
        });
      } catch (error) {
        toast({
          title: "Export Failed",
          description: error.message,
          variant: "destructive"
        });
      }
    };

    const handleImport = async (file: File) => {
      try {
        const content = await file.text();
        const settings = JSON.parse(content);
        
        // Validate settings
        if (!validateSettings(settings)) {
          throw new Error("Invalid settings format");
        }

        // Apply settings
        await updateSettings(settings);

        toast({
          title: "Settings Imported",
          description: "Settings have been successfully updated"
        });
      } catch (error) {
        toast({
          title: "Import Failed",
          description: error.message,
          variant: "destructive"
        });
      }
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle>Settings Management</CardTitle>
          <CardDescription>
            Export or import dataset settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Button onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export Settings
              </Button>
            </div>
            <div>
              <Input
                type="file"
                accept=".json"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleImport(e.target.files[0]);
                  }
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Analytics Export
  const exportAnalytics = async (section: string) => {
    try {
      const data = analyticsData?.[section];
      if (!data) return;

      let exportData;
      if (exportFormat === 'json') {
        exportData = JSON.stringify(data, null, 2);
      } else if (exportFormat === 'csv') {
        exportData = convertToCSV(data);
      }

      const blob = new Blob([exportData], { 
        type: exportFormat === 'json' ? 'application/json' : 'text/csv' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${section}.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Analytics Exported",
        description: `${section} analytics exported as ${exportFormat.toUpperCase()}`
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <UsageMetrics data={analyticsData?.usage} />
        <ComputePerformance data={analyticsData?.compute} />
        <RevenueAnalysis data={analyticsData?.revenue} />
        <UserAnalytics data={analyticsData?.users} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Export Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Select
                value={exportFormat}
                onValueChange={setExportFormat}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => exportAnalytics('all')}>
                <Download className="h-4 w-4 mr-2" />
                Export All
              </Button>
            </div>
          </CardContent>
        </Card>

        <SettingsManager />
      </div>
    </div>
  );
};

export default AdvancedAnalytics;