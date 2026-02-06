import { useState, useEffect } from 'react';
import { 
  Users, 
  Building2, 
  FileText, 
  MessageSquare, 
  TrendingUp, 
  Clock,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import api from '@/services/api';
import type { AdminStats, FormResponse } from '@/types';

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentResponses, setRecentResponses] = useState<FormResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, responsesRes] = await Promise.all([
        api.getAdminStats(),
        api.getResponses(),
      ]);
      
      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }
      if (responsesRes.success && responsesRes.data) {
        setRecentResponses(responsesRes.data.slice(0, 5));
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      trend: '+12%',
      trendUp: true,
    },
    {
      title: 'Insurance Agents',
      value: stats?.totalAgents || 0,
      icon: Building2,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      trend: '+5%',
      trendUp: true,
    },
    {
      title: 'Insurance Providers',
      value: stats?.totalProviders || 0,
      icon: FileText,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      trend: '+2',
      trendUp: true,
    },
    {
      title: 'Total Responses',
      value: stats?.totalResponses || 0,
      icon: MessageSquare,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      trend: '+24%',
      trendUp: true,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <Card key={index} className="stat-card">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
              <div className="flex items-center mt-4 text-sm">
                {stat.trendUp ? (
                  <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={stat.trendUp ? 'text-green-500' : 'text-red-500'}>
                  {stat.trend}
                </span>
                <span className="text-muted-foreground ml-1">from last month</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Response Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Response Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-green-500/10">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="font-medium">Submitted</span>
              </div>
              <span className="text-2xl font-bold">{stats?.submittedResponses || 0}</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-yellow-500/10">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-yellow-500" />
                <span className="font-medium">Draft / Pending</span>
              </div>
              <span className="text-2xl font-bold">{stats?.pendingResponses || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent Responses</CardTitle>
              <CardDescription>Latest form submissions from users</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/responses">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentResponses.length > 0 ? (
              <div className="space-y-3">
                {recentResponses.map((response) => (
                  <div
                    key={response.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{response.user?.name || 'Anonymous'}</p>
                        <p className="text-xs text-muted-foreground">
                          {response.insuranceProvider?.name} - {response.section?.title}
                        </p>
                      </div>
                    </div>
                    <Badge variant={response.isSubmitted ? 'default' : 'secondary'}>
                      {response.status === 'SUBMITTED' ? 'Submitted' : 'Draft'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No responses yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
              <Link to="/admin/providers">
                <Building2 className="h-6 w-6" />
                <span>Manage Providers</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
              <Link to="/admin/sections">
                <FileText className="h-6 w-6" />
                <span>Edit Sections</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
              <Link to="/admin/responses">
                <MessageSquare className="h-6 w-6" />
                <span>View Responses</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
              <Link to="/admin/users">
                <Users className="h-6 w-6" />
                <span>Manage Users</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
