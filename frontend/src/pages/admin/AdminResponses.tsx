import { useState, useEffect } from 'react';
import { 
  Search, 
  Download, 
  Eye, 
  MessageSquare,
  User,
  CheckCircle,
  Clock,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import api from '@/services/api';
import { INSURANCE_PROVIDERS } from '@/constants/insuranceProviders';
import type { FormResponse } from '@/types';

export default function AdminResponses() {
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProviderId, setSelectedProviderId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedResponse, setSelectedResponse] = useState<FormResponse | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadResponses();
  }, [selectedProviderId, statusFilter]);

  const loadResponses = async () => {
    setIsLoading(true);
    try {
      const filters: { insuranceProviderId?: string; status?: 'DRAFT' | 'SUBMITTED' } = {};
      if (selectedProviderId !== 'all') filters.insuranceProviderId = selectedProviderId;
      if (statusFilter !== 'all') filters.status = statusFilter as 'DRAFT' | 'SUBMITTED';

      const response = await api.getResponses(filters);
      if (response.success && response.data) {
        setResponses(response.data);
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load responses', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredResponses = responses.filter((response) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      response.user?.name?.toLowerCase().includes(searchLower) ||
      response.user?.email?.toLowerCase().includes(searchLower) ||
      response.insuranceProvider?.name?.toLowerCase().includes(searchLower) ||
      response.section?.title?.toLowerCase().includes(searchLower)
    );
  });

  const exportToCSV = () => {
    const headers = ['User Name', 'Email', 'Phone', 'Insurance Provider', 'Section', 'Status', 'Submitted At'];
    const rows = filteredResponses.map((r) => [
      r.user?.name || '',
      r.user?.email || '',
      r.user?.phone || '',
      r.insuranceProvider?.name || '',
      r.section?.title || '',
      r.status,
      r.submittedAt || '',
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `responses-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({ title: 'Exported', description: 'Responses exported to CSV' });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Responses</h1>
          <p className="text-muted-foreground">View and manage all form submissions</p>
        </div>
        <Button onClick={exportToCSV} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or provider..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedProviderId} onValueChange={setSelectedProviderId}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="All Insurance Providers" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="all">All Insurance Providers</SelectItem>
                {INSURANCE_PROVIDERS.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id}>{provider.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="SUBMITTED">Submitted</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Responses Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredResponses.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Insurance Provider</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResponses.map((response) => (
                  <TableRow key={response.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{response.user?.name || 'Unknown'}</p>
                          <p className="text-sm text-muted-foreground">{response.user?.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {response.insuranceProvider?.logo && (
                          <img src={response.insuranceProvider.logo} alt="" className="h-6 w-6 rounded object-contain" />
                        )}
                        <span className="text-sm">{response.insuranceProvider?.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{response.section?.title}</TableCell>
                    <TableCell>
                      <Badge variant={response.status === 'SUBMITTED' ? 'default' : 'secondary'}>
                        {response.status === 'SUBMITTED' ? (
                          <><CheckCircle className="h-3 w-3 mr-1" /> Submitted</>
                        ) : (
                          <><Clock className="h-3 w-3 mr-1" /> Draft</>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(response.updatedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedResponse(response)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No responses found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Response Detail Dialog */}
      <Dialog open={!!selectedResponse} onOpenChange={() => setSelectedResponse(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Response Details</DialogTitle>
          </DialogHeader>
          {selectedResponse && (
            <div className="space-y-6">
              {/* User Info */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Name</Label>
                  <p className="font-medium">{selectedResponse.user?.name}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{selectedResponse.user?.email}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Phone</Label>
                  <p className="font-medium">{selectedResponse.user?.phone}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge variant={selectedResponse.status === 'SUBMITTED' ? 'default' : 'secondary'}>
                    {selectedResponse.status}
                  </Badge>
                </div>
              </div>

              {/* Responses */}
              <div>
                <h3 className="font-semibold mb-3">Form Responses</h3>
                <div className="space-y-3">
                  {selectedResponse.section?.questions?.map((question, index) => {
                    const answer = selectedResponse.responses.find(
                      (r) => r.questionId === question.id
                    );
                    return (
                      <div key={question.id} className="p-3 rounded-lg bg-muted/50">
                        <p className="text-sm text-muted-foreground mb-1">
                          Q{index + 1}: {question.label}
                        </p>
                        <p className="font-medium">
                          {answer?.value
                            ? Array.isArray(answer.value)
                              ? answer.value.join(', ')
                              : answer.value
                            : <span className="text-muted-foreground italic">No answer</span>}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
