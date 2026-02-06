import { useState, useEffect } from 'react';
import { 
  Users, 
  MessageSquare, 
  CheckCircle, 
  Clock,
  Phone,
  ArrowUpRight,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import api from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { getProviderById } from '@/constants/insuranceProviders';
import type { AgentStats, FormResponse, InsuranceProvider } from '@/types';

export default function AgentDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [recentResponses, setRecentResponses] = useState<FormResponse[]>([]);
  const [provider, setProvider] = useState<InsuranceProvider | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [user?.insuranceProviderId]);

  const loadDashboardData = async () => {
    if (!user?.insuranceProviderId) return;
    
    setIsLoading(true);
    try {
      // Get provider info from constants
      const providerInfo = getProviderById(user.insuranceProviderId);
      if (providerInfo) {
        setProvider({
          id: providerInfo.id,
          name: providerInfo.name,
          logo: providerInfo.logo,
          isActive: true,
          createdAt: '',
        });
      }

      const [statsRes, responsesRes] = await Promise.all([
        api.getAgentStats(),
        api.getResponses({ insuranceProviderId: user.insuranceProviderId }),
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
      title: 'Total Responses',
      value: stats?.totalResponses || 0,
      icon: MessageSquare,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Submitted',
      value: stats?.submittedResponses || 0,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Draft / Pending',
      value: stats?.pendingResponses || 0,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      title: 'Unique Users',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Card */}
      {provider && (
        <Card className="bg-gradient-to-r from-primary to-primary/70 text-primary-foreground border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <img 
                src={provider.logo} 
                alt={provider.name} 
                className="h-16 w-16 rounded-xl object-contain bg-white/90 p-2" 
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64?text=Logo';
                }}
              />
              <div>
                <h1 className="text-2xl font-bold">Welcome back, {user?.name}!</h1>
                <p className="opacity-90">Managing responses for {provider.name}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Responses & Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent Responses</CardTitle>
              <CardDescription>Latest submissions from users</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/agent/responses">View All</Link>
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
                          {response.section?.title} • {response.user?.phone}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={response.status === 'SUBMITTED' ? 'default' : 'secondary'}>
                        {response.status === 'SUBMITTED' ? 'Submitted' : 'Draft'}
                      </Badge>
                      {response.status !== 'SUBMITTED' && (
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Phone className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
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

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild variant="outline" className="w-full justify-start h-auto py-3">
              <Link to="/agent/responses" className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <p className="font-medium">View All Responses</p>
                  <p className="text-xs text-muted-foreground">See all form submissions</p>
                </div>
                <ArrowUpRight className="h-4 w-4 ml-auto" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start h-auto py-3">
              <Link to="/agent/leads" className="flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <p className="font-medium">Manage Leads</p>
                  <p className="text-xs text-muted-foreground">Follow up with users</p>
                </div>
                <ArrowUpRight className="h-4 w-4 ml-auto" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start h-auto py-3">
              <Link to="/agent/responses?status=DRAFT" className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-yellow-600" />
                <div className="text-left">
                  <p className="font-medium">Pending Forms</p>
                  <p className="text-xs text-muted-foreground">Help users complete</p>
                </div>
                <ArrowUpRight className="h-4 w-4 ml-auto" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
