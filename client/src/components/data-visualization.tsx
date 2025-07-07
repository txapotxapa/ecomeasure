import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar,
  AreaChart,
  Area,
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter
} from 'recharts';
import { 
  BarChart3, 
  LineChart as LineChartIcon, 
  PieChart as PieChartIcon,
  Activity,
  TrendingUp,
  TreePine,
  Leaf,
  Eye,
  Layers,
  Calendar
} from 'lucide-react';
import { format, parseISO, startOfDay, endOfDay } from 'date-fns';
import type { AnalysisSession } from '@shared/schema';
import { cn } from '@/lib/utils';

interface DataVisualizationProps {
  sessions: AnalysisSession[];
  className?: string;
}

export default function DataVisualization({ sessions, className }: DataVisualizationProps) {
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'all'>('week');
  const [selectedMetric, setSelectedMetric] = useState<'coverage' | 'diversity' | 'light'>('coverage');

  // Filter sessions by time range
  const filteredSessions = sessions.filter(session => {
    const sessionDate = new Date(session.timestamp);
    const now = new Date();
    
    switch (timeRange) {
      case 'day':
        return sessionDate >= startOfDay(now) && sessionDate <= endOfDay(now);
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return sessionDate >= weekAgo;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return sessionDate >= monthAgo;
      default:
        return true;
    }
  });

  // Process data for charts
  const timeSeriesData = filteredSessions
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map(session => ({
      date: format(new Date(session.timestamp), 'MMM dd'),
      time: new Date(session.timestamp).getTime(),
      canopyCover: session.analysisMethod === 'GLAMA' || session.analysisMethod === 'Canopeo' 
        ? session.canopyCover : null,
      lightTransmission: session.lightTransmission,
      diversity: session.speciesDiversity || 0,
      bareGround: session.bareGroundPercentage || 0,
      litter: session.litterPercentage || 0,
      vegetation: session.vegetationObscurity || session.vegetationDensity || 0,
      toolType: session.toolType
    }));

  // Tool usage statistics
  const toolUsageData = [
    { 
      name: 'Canopy Analysis', 
      value: sessions.filter(s => s.toolType === 'canopy').length,
      color: '#10b981'
    },
    { 
      name: 'Horizontal Vegetation', 
      value: sessions.filter(s => s.toolType === 'horizontal_vegetation').length,
      color: '#3b82f6'
    },
    { 
      name: 'Daubenmire Frame', 
      value: sessions.filter(s => s.toolType === 'daubenmire').length,
      color: '#f59e0b'
    }
  ];

  // Biodiversity metrics
  const biodiversityData = filteredSessions
    .filter(s => s.speciesDiversity && s.speciesDiversity > 0)
    .map(session => ({
      site: session.plotName,
      diversity: session.speciesDiversity || 0,
      evenness: session.evennessIndex || 0,
      shannonIndex: session.shannonIndex || 0,
      totalCoverage: session.totalCoverage || 0
    }));

  // Ground cover composition
  const groundCoverData = filteredSessions
    .filter(s => s.toolType === 'daubenmire')
    .reduce((acc, session) => {
      const siteName = session.plotName;
      if (!acc[siteName]) {
        acc[siteName] = {
          site: siteName,
          vegetation: 0,
          bareGround: 0,
          litter: 0,
          rock: 0,
          count: 0
        };
      }
      acc[siteName].vegetation += session.totalCoverage || 0;
      acc[siteName].bareGround += session.bareGroundPercentage || 0;
      acc[siteName].litter += session.litterPercentage || 0;
      acc[siteName].rock += session.rockPercentage || 0;
      acc[siteName].count += 1;
      return acc;
    }, {} as Record<string, any>);

  const groundCoverAvgData = Object.values(groundCoverData).map(site => ({
    site: site.site,
    vegetation: site.vegetation / site.count,
    bareGround: site.bareGround / site.count,
    litter: site.litter / site.count,
    rock: site.rock / site.count
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}%
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className={cn("space-y-4", className)}>
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
          <SelectTrigger className="w-full sm:w-40">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Today</SelectItem>
            <SelectItem value="week">Past Week</SelectItem>
            <SelectItem value="month">Past Month</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedMetric} onValueChange={(value: any) => setSelectedMetric(value)}>
          <SelectTrigger className="w-full sm:w-48">
            <BarChart3 className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="coverage">Coverage Metrics</SelectItem>
            <SelectItem value="diversity">Biodiversity</SelectItem>
            <SelectItem value="light">Light Analysis</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="trends" className="text-xs sm:text-sm">
            <TrendingUp className="h-4 w-4 mr-1" />
            Trends
          </TabsTrigger>
          <TabsTrigger value="composition" className="text-xs sm:text-sm">
            <Layers className="h-4 w-4 mr-1" />
            Composition
          </TabsTrigger>
          <TabsTrigger value="biodiversity" className="text-xs sm:text-sm">
            <Leaf className="h-4 w-4 mr-1" />
            Biodiversity
          </TabsTrigger>
          <TabsTrigger value="comparison" className="text-xs sm:text-sm">
            <Eye className="h-4 w-4 mr-1" />
            Comparison
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          {/* Time Series Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChartIcon className="h-5 w-5" />
                Coverage Trends Over Time
              </CardTitle>
              <CardDescription>
                Tracking vegetation metrics across measurement sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  {selectedMetric === 'coverage' && (
                    <>
                      <Line 
                        type="monotone" 
                        dataKey="canopyCover" 
                        stroke="#10b981" 
                        name="Canopy Cover"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="vegetation" 
                        stroke="#3b82f6" 
                        name="Vegetation Density"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    </>
                  )}
                  {selectedMetric === 'diversity' && (
                    <Line 
                      type="monotone" 
                      dataKey="diversity" 
                      stroke="#f59e0b" 
                      name="Species Diversity"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  )}
                  {selectedMetric === 'light' && (
                    <Line 
                      type="monotone" 
                      dataKey="lightTransmission" 
                      stroke="#ef4444" 
                      name="Light Transmission"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Tool Usage */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="h-5 w-5" />
                Tool Usage Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={toolUsageData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {toolUsageData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="composition" className="space-y-4">
          {/* Ground Cover Composition */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Ground Cover Composition by Site
              </CardTitle>
              <CardDescription>
                Average percentages of vegetation, bare ground, litter, and rock
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={groundCoverAvgData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="site" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="vegetation" stackId="a" fill="#10b981" name="Vegetation" />
                  <Bar dataKey="bareGround" stackId="a" fill="#f59e0b" name="Bare Ground" />
                  <Bar dataKey="litter" stackId="a" fill="#8b5cf6" name="Litter" />
                  <Bar dataKey="rock" stackId="a" fill="#6b7280" name="Rock" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="biodiversity" className="space-y-4">
          {/* Biodiversity Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Biodiversity Indices
              </CardTitle>
              <CardDescription>
                Shannon diversity index and evenness across sites
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={biodiversityData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="site" className="text-xs" />
                  <PolarRadiusAxis />
                  <Radar 
                    name="Shannon Index" 
                    dataKey="shannonIndex" 
                    stroke="#10b981" 
                    fill="#10b981" 
                    fillOpacity={0.6} 
                  />
                  <Radar 
                    name="Evenness" 
                    dataKey="evenness" 
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    fillOpacity={0.6} 
                  />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          {/* Scatter Plot Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Coverage vs. Light Transmission
              </CardTitle>
              <CardDescription>
                Relationship between canopy cover and light penetration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="canopyCover" 
                    name="Canopy Cover" 
                    unit="%" 
                    className="text-xs"
                  />
                  <YAxis 
                    dataKey="lightTransmission" 
                    name="Light Transmission" 
                    unit="%" 
                    className="text-xs"
                  />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter 
                    name="Measurements" 
                    data={timeSeriesData.filter(d => d.canopyCover !== null)} 
                    fill="#10b981"
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Summary Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <TreePine className="h-8 w-8 text-green-500" />
              <div className="text-right">
                <p className="text-2xl font-bold">
                  {sessions.filter(s => s.canopyCover).length}
                </p>
                <p className="text-xs text-muted-foreground">Canopy Analyses</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Leaf className="h-8 w-8 text-blue-500" />
              <div className="text-right">
                <p className="text-2xl font-bold">
                  {sessions.filter(s => s.speciesDiversity).length}
                </p>
                <p className="text-xs text-muted-foreground">Biodiversity Records</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Eye className="h-8 w-8 text-amber-500" />
              <div className="text-right">
                <p className="text-2xl font-bold">
                  {sessions.filter(s => s.vegetationObscurity).length}
                </p>
                <p className="text-xs text-muted-foreground">Vegetation Profiles</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Layers className="h-8 w-8 text-purple-500" />
              <div className="text-right">
                <p className="text-2xl font-bold">
                  {new Set(sessions.map(s => s.plotName)).size}
                </p>
                <p className="text-xs text-muted-foreground">Research Sites</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}