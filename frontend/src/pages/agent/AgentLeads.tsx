import { useState, useEffect } from 'react';
import { 
  Search, 
  Phone,
  Mail,
  User,
  MessageSquare,
  CheckCircle,
  Clock,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';
import type { FormResponse } from '@/types';

interface Lead {
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  responses: FormResponse[];
  totalForms: number;
  completedForms: number;
  pendingForms: number;
}

export default function AgentLeads() {
  const { user } = useAuth();
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    if (user?.insuranceProviderId) {
      loadResponses();
    }
  }, [user?.insuranceProviderId]);

  const loadResponses = async () => {
    if (!user?.insuranceProviderId) return;
    
    setIsLoading(true);
    try {
      const response = await api.getResponses({ insuranceProviderId: user.insuranceProviderId });
      if (response.success && response.data) {
        setResponses(response.data);
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load leads', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // Group responses by user to create leads
  const leads: Lead[] = Object.values(
    responses.reduce((acc, response) => {
      if (!response.user) return acc;
      
      const userId = response.user.id;
      if (!acc[userId]) {
        acc[userId] = {
          user: response.user,
          responses: [],
          totalForms: 0,
          completedForms: 0,
          pendingForms: 0,
        };
      }
      acc[userId].responses.push(response);
      acc[userId].totalForms++;
      if (response.status === 'SUBMITTED') {
        acc[userId].completedForms++;
      } else {
        acc[userId].pendingForms++;
      }
      return acc;
    }, {} as Record<string, Lead>)
  );

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch = 
      lead.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.user.phone.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = 
      statusFilter === 'all' ||
      (statusFilter === 'complete' && lead.pendingForms === 0) ||
      (statusFilter === 'pending' && lead.pendingForms > 0);

    return matchesSearch && matchesStatus;
  });

  const handleCall = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  const handleEmail = (email: string) => {
    window.open(`mailto:${email}`, '_self');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Leads</h1>
        <p className="text-muted-foreground">Manage and follow up with users</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Leads" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Leads</SelectItem>
                <SelectItem value="complete">Complete (all forms done)</SelectItem>
                <SelectItem value="pending">Pending (needs follow-up)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Leads Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredLeads.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredLeads.map((lead) => (
            <Card key={lead.user.id} className="card-hover">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{lead.user.name}</h3>
                    <p className="text-sm text-muted-foreground truncate">{lead.user.email}</p>
                    <p className="text-sm text-muted-foreground">{lead.user.phone}</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    {lead.totalForms} forms
                  </Badge>
                  {lead.completedForms > 0 && (
                    <Badge variant="default" className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      {lead.completedForms}
                    </Badge>
                  )}
                  {lead.pendingForms > 0 && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {lead.pendingForms}
                    </Badge>
                  )}
                </div>

                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleCall(lead.user.phone)}
                  >
                    <Phone className="h-4 w-4 mr-1" />
                    Call
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEmail(lead.user.email)}
                  >
                    <Mail className="h-4 w-4 mr-1" />
                    Email
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No leads found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
