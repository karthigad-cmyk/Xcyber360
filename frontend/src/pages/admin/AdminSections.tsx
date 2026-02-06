import { useState, useEffect } from 'react';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  FileText, 
  ChevronRight,
  GripVertical,
  Loader2,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import api from '@/services/api';
import { INSURANCE_PROVIDERS } from '@/constants/insuranceProviders';
import type { Section, Question, QuestionType } from '@/types';

const questionTypes: { value: QuestionType; label: string }[] = [
  { value: 'text', label: 'Short Text' },
  { value: 'textarea', label: 'Long Text' },
  { value: 'mcq', label: 'Multiple Choice (Single)' },
  { value: 'checkbox', label: 'Checkboxes (Multiple)' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
];

export default function AdminSections() {
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedBankId, setSelectedBankId] = useState<string>(INSURANCE_PROVIDERS[0].id);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Section dialog
  const [isSectionDialogOpen, setIsSectionDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [sectionForm, setSectionForm] = useState({
    title: '',
    description: '',
    isActive: true,
  });

  // Question dialog
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [questionForm, setQuestionForm] = useState({
    type: 'text' as QuestionType,
    label: '',
    placeholder: '',
    required: true,
    options: [{ label: '', value: '' }],
  });

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'section' | 'question'; id: string; name: string } | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (selectedBankId) {
      loadSections(selectedBankId);
    }
  }, [selectedBankId]);

  const loadSections = async (bankId: string) => {
    setIsLoading(true);
    try {
      const response = await api.getSections(bankId);
      if (response.success && response.data) {
        setSections(response.data);
        if (response.data.length > 0 && !selectedSection) {
          setSelectedSection(response.data[0]);
        }
      }
    } catch (error) {
      console.error('Error loading sections:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenSectionDialog = (section?: Section) => {
    if (section) {
      setEditingSection(section);
      setSectionForm({
        title: section.title,
        description: section.description || '',
        isActive: section.isActive,
      });
    } else {
      setEditingSection(null);
      setSectionForm({
        title: '',
        description: '',
        isActive: true,
      });
    }
    setIsSectionDialogOpen(true);
  };

  const handleSaveSection = async () => {
    if (!sectionForm.title.trim()) {
      toast({ title: 'Error', description: 'Section title is required', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      let response;
      if (editingSection) {
        response = await api.updateSection(editingSection.id, sectionForm);
      } else {
        response = await api.createSection({
          ...sectionForm,
          insuranceProviderId: selectedBankId,
          order: sections.length,
          questions: [],
        });
      }

      if (response.success) {
        toast({ title: 'Success', description: `Section ${editingSection ? 'updated' : 'created'}` });
        setIsSectionDialogOpen(false);
        loadSections(selectedBankId);
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save section', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenQuestionDialog = (question?: Question) => {
    if (question) {
      setEditingQuestion(question);
      setQuestionForm({
        type: question.type,
        label: question.label,
        placeholder: question.placeholder || '',
        required: question.required,
        options: question.options || [{ label: '', value: '' }],
      });
    } else {
      setEditingQuestion(null);
      setQuestionForm({
        type: 'text',
        label: '',
        placeholder: '',
        required: true,
        options: [{ label: '', value: '' }],
      });
    }
    setIsQuestionDialogOpen(true);
  };

  const handleSaveQuestion = async () => {
    if (!questionForm.label.trim()) {
      toast({ title: 'Error', description: 'Question label is required', variant: 'destructive' });
      return;
    }

    if (!selectedSection) {
      toast({ title: 'Error', description: 'Please select a section first', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      const formattedOptions = ['mcq', 'checkbox', 'dropdown'].includes(questionForm.type)
        ? questionForm.options
            .filter((o) => o.label.trim())
            .map((o, idx) => ({ id: `opt_${Date.now()}_${idx}`, label: o.label, value: o.value }))
        : undefined;

      const payload = {
        type: questionForm.type,
        label: questionForm.label,
        placeholder: questionForm.placeholder,
        required: questionForm.required,
        options: formattedOptions,
      };

      let response;
      if (editingQuestion) {
        response = await api.updateQuestion(editingQuestion.id, payload);
      } else {
        response = await api.createQuestion(selectedSection.id, {
          ...payload,
          order: selectedSection.questions?.length || 0,
        });
      }

      if (response.success) {
        toast({ title: 'Success', description: `Question ${editingQuestion ? 'updated' : 'added'}` });
        setIsQuestionDialogOpen(false);
        loadSections(selectedBankId);
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save question', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      const response = deleteTarget.type === 'section'
        ? await api.deleteSection(deleteTarget.id)
        : await api.deleteQuestion(deleteTarget.id);

      if (response.success) {
        toast({ title: 'Deleted', description: `${deleteTarget.name} has been deleted` });
        setDeleteTarget(null);
        loadSections(selectedBankId);
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
    }
  };

  const addOption = () => {
    setQuestionForm({
      ...questionForm,
      options: [...questionForm.options, { label: '', value: '' }],
    });
  };

  const updateOption = (index: number, label: string) => {
    const newOptions = [...questionForm.options];
    newOptions[index] = { label, value: label.toLowerCase().replace(/\s+/g, '_') };
    setQuestionForm({ ...questionForm, options: newOptions });
  };

  const removeOption = (index: number) => {
    setQuestionForm({
      ...questionForm,
      options: questionForm.options.filter((_, i) => i !== index),
    });
  };

  const selectedCompany = INSURANCE_PROVIDERS.find((c) => c.id === selectedBankId);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Sections & Questions</h1>
          <p className="text-muted-foreground">Create and manage form sections for each insurance company</p>
        </div>
      </div>

      {/* Insurance Company Selector */}
      <div className="flex items-center gap-4">
        <Label>Select Insurance Company:</Label>
        <Select value={selectedBankId} onValueChange={(value) => {
          setSelectedBankId(value);
          setSelectedSection(null);
        }}>
          <SelectTrigger className="w-80">
            <SelectValue placeholder="Choose an insurance company" />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {INSURANCE_PROVIDERS.map((provider) => (
              <SelectItem key={provider.id} value={provider.id}>
                {provider.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Sections List */}
          <Card className="lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg">Sections</CardTitle>
              <Button size="sm" onClick={() => handleOpenSectionDialog()}>
                <Plus className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {sections.length > 0 ? (
                sections.map((section) => (
                  <div
                    key={section.id}
                    onClick={() => setSelectedSection(section)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedSection?.id === section.id
                        ? 'bg-primary/10 border border-primary/20'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm">{section.title}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant="secondary" className="text-xs">
                          {section.questions?.length || 0} Q
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No sections yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Questions Panel */}
          <Card className="lg:col-span-2">
            {selectedSection ? (
              <>
                <CardHeader className="flex flex-row items-start justify-between pb-3">
                  <div>
                    <CardTitle className="text-lg">{selectedSection.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedSection.description || 'No description'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenSectionDialog(selectedSection)}
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button size="sm" onClick={() => handleOpenQuestionDialog()}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Question
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedSection.questions && selectedSection.questions.length > 0 ? (
                    selectedSection.questions.map((question, index) => (
                      <div
                        key={question.id}
                        className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-medium">
                              {index + 1}
                            </span>
                            <div>
                              <p className="font-medium">{question.label}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {questionTypes.find((t) => t.value === question.type)?.label}
                                </Badge>
                                {question.required && (
                                  <Badge variant="secondary" className="text-xs">Required</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleOpenQuestionDialog(question)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => setDeleteTarget({ type: 'question', id: question.id, name: question.label })}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No questions in this section</p>
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => handleOpenQuestionDialog()}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Question
                      </Button>
                    </div>
                  )}
                </CardContent>
              </>
            ) : (
              <CardContent className="py-12 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Select a section to view questions</p>
              </CardContent>
            )}
          </Card>
        </div>
      )}

      {/* Section Dialog */}
      <Dialog open={isSectionDialogOpen} onOpenChange={setIsSectionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSection ? 'Edit Section' : 'Add Section'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Section Title</Label>
              <Input
                value={sectionForm.title}
                onChange={(e) => setSectionForm({ ...sectionForm, title: e.target.value })}
                placeholder="e.g., Personal Information"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={sectionForm.description}
                onChange={(e) => setSectionForm({ ...sectionForm, description: e.target.value })}
                placeholder="Brief description of this section"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch
                checked={sectionForm.isActive}
                onCheckedChange={(checked) => setSectionForm({ ...sectionForm, isActive: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSectionDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveSection} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Question Dialog */}
      <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingQuestion ? 'Edit Question' : 'Add Question'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-96 overflow-y-auto">
            <div className="space-y-2">
              <Label>Question Type</Label>
              <Select
                value={questionForm.type}
                onValueChange={(value) => setQuestionForm({ ...questionForm, type: value as QuestionType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {questionTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Question Label</Label>
              <Input
                value={questionForm.label}
                onChange={(e) => setQuestionForm({ ...questionForm, label: e.target.value })}
                placeholder="e.g., What is your full name?"
              />
            </div>
            <div className="space-y-2">
              <Label>Placeholder (optional)</Label>
              <Input
                value={questionForm.placeholder}
                onChange={(e) => setQuestionForm({ ...questionForm, placeholder: e.target.value })}
                placeholder="e.g., Enter your name"
              />
            </div>
            
            {['mcq', 'checkbox', 'dropdown'].includes(questionForm.type) && (
              <div className="space-y-2">
                <Label>Options</Label>
                {questionForm.options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={option.label}
                      onChange={(e) => updateOption(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOption(index)}
                      disabled={questionForm.options.length <= 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addOption}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Option
                </Button>
              </div>
            )}

            <div className="flex items-center justify-between">
              <Label>Required</Label>
              <Switch
                checked={questionForm.required}
                onCheckedChange={(checked) => setQuestionForm({ ...questionForm, required: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsQuestionDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveQuestion} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.type}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
