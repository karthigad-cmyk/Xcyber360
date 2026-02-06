import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, Send, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import api from '@/services/api';
import type { Section, Question, QuestionResponse } from '@/types';

export default function UserForm() {
  const { sectionId } = useParams<{ sectionId: string }>();
  const [searchParams] = useSearchParams();
  const providerId = searchParams.get('provider') || '';
  const navigate = useNavigate();
  const { toast } = useToast();
  const [section, setSection] = useState<Section | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [responseId, setResponseId] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    if (sectionId) loadSection();
  }, [sectionId]);

  useEffect(() => {
    if (!isSubmitted && Object.keys(answers).length > 0) {
      const timer = setInterval(() => handleSave(true), 30000);
      return () => clearInterval(timer);
    }
  }, [answers, isSubmitted]);

  const loadSection = async () => {
    try {
      const [sectionRes, responseRes] = await Promise.all([
        api.getSection(sectionId!),
        api.getUserResponse(sectionId!),
      ]);
      if (sectionRes.success && sectionRes.data) setSection(sectionRes.data);
      if (responseRes.success && responseRes.data) {
        setResponseId(responseRes.data.id);
        setIsSubmitted(responseRes.data.status === 'SUBMITTED');
        const existingAnswers: Record<string, string | string[]> = {};
        responseRes.data.responses.forEach((r) => { existingAnswers[r.questionId] = r.value; });
        setAnswers(existingAnswers);
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load form', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, value: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSave = async (silent = false) => {
    if (!section || isSubmitted) return;
    setIsSaving(true);
    try {
      const responses: QuestionResponse[] = Object.entries(answers).map(([questionId, value]) => ({ questionId, value }));
      const res = await api.saveResponse({
        sectionId: section.id,
        insuranceProviderId: section.insuranceProviderId || providerId,
        responses,
      });
      if (res.success && res.data) {
        setResponseId(res.data.id);
        setLastSaved(new Date());
        if (!silent) toast({ title: 'Saved', description: 'Your progress has been saved' });
      }
    } catch (error) {
      if (!silent) toast({ title: 'Error', description: 'Failed to save', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!responseId) await handleSave();
    if (!responseId) return;
    setIsSubmitting(true);
    try {
      const res = await api.submitResponse(responseId);
      if (res.success) {
        setIsSubmitted(true);
        toast({ title: 'Submitted!', description: 'Your form has been submitted successfully' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to submit', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderQuestion = (question: Question) => {
    const value = answers[question.id] || '';
    switch (question.type) {
      case 'text': case 'email': case 'phone': case 'number':
        return <Input type={question.type === 'number' ? 'number' : question.type === 'email' ? 'email' : 'text'} placeholder={question.placeholder} value={value as string} onChange={(e) => handleAnswerChange(question.id, e.target.value)} disabled={isSubmitted} />;
      case 'textarea':
        return <Textarea placeholder={question.placeholder} value={value as string} onChange={(e) => handleAnswerChange(question.id, e.target.value)} disabled={isSubmitted} />;
      case 'date':
        return <Input type="date" value={value as string} onChange={(e) => handleAnswerChange(question.id, e.target.value)} disabled={isSubmitted} />;
      case 'mcq':
        return (
          <RadioGroup value={value as string} onValueChange={(v) => handleAnswerChange(question.id, v)} disabled={isSubmitted}>
            {question.options?.map((opt) => (<div key={opt.id} className="flex items-center space-x-2"><RadioGroupItem value={opt.value} id={opt.id} /><Label htmlFor={opt.id}>{opt.label}</Label></div>))}
          </RadioGroup>
        );
      case 'checkbox':
        const selectedValues = (value as string[]) || [];
        return (
          <div className="space-y-2">
            {question.options?.map((opt) => (<div key={opt.id} className="flex items-center space-x-2"><Checkbox id={opt.id} checked={selectedValues.includes(opt.value)} onCheckedChange={(checked) => { const newValues = checked ? [...selectedValues, opt.value] : selectedValues.filter((v) => v !== opt.value); handleAnswerChange(question.id, newValues); }} disabled={isSubmitted} /><Label htmlFor={opt.id}>{opt.label}</Label></div>))}
          </div>
        );
      case 'dropdown':
        return (
          <Select value={value as string} onValueChange={(v) => handleAnswerChange(question.id, v)} disabled={isSubmitted}>
            <SelectTrigger><SelectValue placeholder={question.placeholder || 'Select...'} /></SelectTrigger>
            <SelectContent>{question.options?.map((opt) => (<SelectItem key={opt.id} value={opt.value}>{opt.label}</SelectItem>))}</SelectContent>
          </Select>
        );
      default:
        return <Input value={value as string} onChange={(e) => handleAnswerChange(question.id, e.target.value)} disabled={isSubmitted} />;
    }
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="container py-8 max-w-3xl">
      <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-4"><ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard</Button>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{section?.title}</CardTitle>
            {isSubmitted && <span className="flex items-center text-sm text-green-600"><CheckCircle className="h-4 w-4 mr-1" /> Submitted</span>}
          </div>
          {section?.description && <p className="text-muted-foreground">{section.description}</p>}
        </CardHeader>
        <CardContent className="space-y-6">
          {section?.questions?.map((question, index) => (
            <div key={question.id} className="space-y-2">
              <Label className="text-base">{index + 1}. {question.label}{question.required && <span className="text-destructive ml-1">*</span>}</Label>
              {renderQuestion(question)}
            </div>
          ))}
          {!isSubmitted && (
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-muted-foreground">{lastSaved && `Last saved: ${lastSaved.toLocaleTimeString()}`}</div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleSave(false)} disabled={isSaving}>{isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}Save</Button>
                <Button onClick={handleSubmit} disabled={isSubmitting} className="btn-gradient">{isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}Submit</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
