import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, CheckCircle, Clock, ArrowRight, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';
import { INSURANCE_PROVIDERS } from '@/constants/insuranceProviders';
import type { Section, FormResponse, InsuranceProvider } from '@/types';

export default function UserDashboard() {
  const { user } = useAuth();
  const [selectedProvider, setSelectedProvider] = useState<InsuranceProvider | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (selectedProvider) {
      loadSections(selectedProvider.id);
    }
  }, [selectedProvider]);

  const loadSections = async (providerId: string) => {
    setIsLoading(true);
    try {
      const [sectionsRes, responsesRes] = await Promise.all([
        api.getSections(providerId),
        api.getResponses({ userId: user?.id }),
      ]);
      if (sectionsRes.success && sectionsRes.data) {
        setSections(sectionsRes.data.filter((s) => s.isActive));
      }
      if (responsesRes.success && responsesRes.data) {
        setResponses(responsesRes.data);
      }
    } catch (error) {
      console.error('Error loading sections:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getResponseStatus = (sectionId: string) => {
    const response = responses.find((r) => r.sectionId === sectionId);
    if (!response) return null;
    return response.status;
  };

  // Convert constants to provider format
  const providers: InsuranceProvider[] = INSURANCE_PROVIDERS.map(p => ({
    id: p.id,
    name: p.name,
    logo: p.logo,
    isActive: true,
    createdAt: '',
  }));

  return (
    <div className="container py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Welcome, {user?.name}!</h1>
        <p className="text-muted-foreground">Select an insurance provider to view and fill forms</p>
      </div>

      {!selectedProvider ? (
        <>
          <h2 className="text-xl font-semibold">Select Insurance Provider</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {providers.map((provider) => (
              <Card key={provider.id} className="cursor-pointer card-hover" onClick={() => setSelectedProvider(provider)}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <img 
                      src={provider.logo} 
                      alt={provider.name} 
                      className="h-16 w-16 rounded-xl object-contain bg-muted p-2" 
                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64?text=Logo'; }}
                    />
                    <div>
                      <h3 className="font-semibold text-lg">{provider.name}</h3>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src={selectedProvider.logo} alt={selectedProvider.name} className="h-12 w-12 rounded-xl object-contain bg-muted p-1" />
              <div>
                <h2 className="text-xl font-semibold">{selectedProvider.name}</h2>
                <p className="text-sm text-muted-foreground">Available forms</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => setSelectedProvider(null)}>Change Provider</Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {sections.map((section) => {
                const status = getResponseStatus(section.id);
                return (
                  <Card key={section.id} className="card-hover">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="p-3 rounded-xl bg-primary/10"><FileText className="h-6 w-6 text-primary" /></div>
                          <div>
                            <h3 className="font-semibold">{section.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{section.description}</p>
                            <p className="text-xs text-muted-foreground mt-2">{section.questions?.length || 0} questions</p>
                          </div>
                        </div>
                        {status && (
                          <Badge variant={status === 'SUBMITTED' ? 'default' : 'secondary'}>
                            {status === 'SUBMITTED' ? <><CheckCircle className="h-3 w-3 mr-1" /> Submitted</> : <><Clock className="h-3 w-3 mr-1" /> Draft</>}
                          </Badge>
                        )}
                      </div>
                      <Button asChild className="w-full mt-4">
                        <Link to={`/form/${section.id}?provider=${selectedProvider.id}`}>
                          {status === 'SUBMITTED' ? 'View Response' : status === 'DRAFT' ? 'Continue' : 'Start Form'}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
