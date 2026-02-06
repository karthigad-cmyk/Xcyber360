import { useState, useEffect } from 'react';
import { 
  Search, 
  Eye, 
  Phone,
  Mail,
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
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';
import type { FormResponse, Section } from '@/types';

export default function AgentResponses() {
  const { user } = useAuth();
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sectionFilter, setSectionFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedResponse, setSelectedResponse] = useState<FormResponse | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (user?.insuranceProviderId) {
      loadData();
    }
  }, [user?.insuranceProviderId]);

  useEffect(() => {
    if (user?.insuranceProviderId) {
      loadResponses();
    }
  }, [sectionFilter, statusFilter, user?.insuranceProviderId]);

  const loadData = async () => {
    try {
      const sectionsRes = await api.getSections(user?.insuranceProviderId);
      if (sectionsRes.success && sectionsRes.data) {
        setSections(sectionsRes.data);
      }
    } catch (error) {
      console.error('Error loading sections:', error);
    }
  };

  const loadResponses = async () => {
    if (!user?.insuranceProviderId) return;
    
    setIsLoading(true);
    try {
      const filters: { insuranceProviderId?: string; sectionId?: string; status?: 'DRAFT' | 'SUBMITTED' } = {
        insuranceProviderId: user.insuranceProviderId,
      };
      if (sectionFilter !== 'all') filters.sectionId = sectionFilter;
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
      response.user?.phone?.toLowerCase().includes(searchLower)
    );
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Responses</h1>
          <p className="text-muted-foreground">View and manage form submissions for your insurance provider</p>
        </div>
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
            <Select value={sectionFilter} onValueChange={setSectionFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Sections" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sections</SelectItem>
                {sections.map((section) => (
                  <SelectItem key={section.id} value={section.id}>{section.title}</SelectItem>
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
                  <TableHead>Contact</TableHead>
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
                        <span className="font-medium">{response.user?.name || 'Unknown'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleCall(response.user?.phone || '')}
                        >
                          <Phone className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEmail(response.user?.email || '')}
                        >
                          <Mail className="h-4 w-4 text-primary" />
                        </Button>
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
              {/* User Info with Contact */}
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Contact Information</h3>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCall(selectedResponse.user?.phone || '')}
                    >
                      <Phone className="h-4 w-4 mr-1" />
                      Call
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEmail(selectedResponse.user?.email || '')}
                    >
                      <Mail className="h-4 w-4 mr-1" />
                      Email
                    </Button>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <Label className="text-muted-foreground">Name</Label>
                    <p className="font-medium">{selectedResponse.user?.name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="font-medium">{selectedResponse.user?.email}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Phone</Label>
                    <p className="font-medium">{selectedResponse.user?.phone}</p>
                  </div>
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
