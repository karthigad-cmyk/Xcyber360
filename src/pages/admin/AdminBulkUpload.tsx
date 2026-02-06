import { useState, useRef, useCallback } from 'react';
import { 
  Upload, 
  FileSpreadsheet, 
  Download, 
  AlertCircle, 
  CheckCircle2,
  Loader2,
  X,
  FileText,
  Table,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table as UITable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import api from '@/services/api';
import { INSURANCE_PROVIDERS } from '@/constants/insuranceProviders';
import type { Section } from '@/types';
import * as XLSX from 'xlsx';

interface ParsedRow {
  question_text: string;
  question_type: string;
  options: string;
  required: boolean | string;
  placeholder: string;
}

interface UploadResult {
  total_rows: number;
  inserted_rows: number;
  failed_rows: number;
  error_details: { row: number; error: string }[];
}

export default function AdminBulkUpload() {
  const [selectedBankId, setSelectedBankId] = useState<string>('');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [sections, setSections] = useState<Section[]>([]);
  const [isLoadingSections, setIsLoadingSections] = useState(false);
  
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const loadSections = useCallback(async (bankId: string) => {
    setIsLoadingSections(true);
    try {
      const response = await api.getSections(bankId);
      if (response.success && response.data) {
        setSections(response.data);
      }
    } catch (error) {
      console.error('Error loading sections:', error);
    } finally {
      setIsLoadingSections(false);
    }
  }, []);

  const handleBankChange = (bankId: string) => {
    setSelectedBankId(bankId);
    setSelectedSectionId('');
    setSections([]);
    if (bankId) {
      loadSections(bankId);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    const validExtensions = ['.csv', '.xlsx', '.xls'];
    const fileExtension = selectedFile.name.toLowerCase().substring(selectedFile.name.lastIndexOf('.'));
    
    if (!validExtensions.includes(fileExtension)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a CSV or Excel file (.csv, .xlsx, .xls)',
        variant: 'destructive',
      });
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'File size must be less than 5MB',
        variant: 'destructive',
      });
      return;
    }

    setFile(selectedFile);
    setUploadResult(null);
    await parseFile(selectedFile);
  };

  const parseFile = async (file: File) => {
    setIsParsing(true);
    try {
      const buffer = await file.arrayBuffer();
      let rows: ParsedRow[] = [];

      if (file.name.toLowerCase().endsWith('.csv')) {
        const text = new TextDecoder().decode(buffer);
        const lines = text.split('\n').filter((line) => line.trim());
        const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/"/g, ''));

        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i]);
          const row: any = {};
          headers.forEach((header, idx) => {
            row[header] = values[idx]?.trim() || '';
          });
          rows.push({
            question_text: row.question_text || row.label || row.question || '',
            question_type: row.question_type || row.type || 'text',
            options: row.options || '',
            required: row.required === 'true' || row.required === '1',
            placeholder: row.placeholder || '',
          });
        }
      } else {
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<any>(sheet, { defval: '' });

        rows = jsonData.map((row: any) => ({
          question_text: row.question_text || row.label || row.question || '',
          question_type: row.question_type || row.type || 'text',
          options: row.options || '',
          required: row.required === true || row.required === 'true' || row.required === 1,
          placeholder: row.placeholder || '',
        }));
      }

      setParsedData(rows);
    } catch (error) {
      console.error('Error parsing file:', error);
      toast({
        title: 'Parse error',
        description: 'Failed to parse the file. Please check the format.',
        variant: 'destructive',
      });
    } finally {
      setIsParsing(false);
    }
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.replace(/^"|"$/g, '').trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.replace(/^"|"$/g, '').trim());
    return result;
  };

  const handleUpload = async () => {
    if (!file || !selectedSectionId) {
      toast({
        title: 'Missing information',
        description: 'Please select a section and upload a file',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sectionId', selectedSectionId);
      formData.append('insuranceProviderId', selectedBankId);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const response = await api.bulkUploadQuestions(formData);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.success && response.data) {
        setUploadResult(response.data);
        toast({
          title: 'Upload complete',
          description: `Successfully uploaded ${response.data.inserted_rows} questions`,
        });
      } else {
        toast({
          title: 'Upload failed',
          description: response.error || 'Failed to upload questions',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload error',
        description: error.message || 'Failed to upload questions',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadTemplate = async (type: 'csv' | 'excel') => {
    try {
      const response = await api.downloadQuestionTemplate(type);
      if (response.success && response.data) {
        const blob = response.data;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = type === 'csv' ? 'questions_template.csv' : 'questions_template.xlsx';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      // Fallback: generate template locally
      if (type === 'csv') {
        const csvContent = `question_text,question_type,options,required,placeholder
"What is your full name?",text,,true,"Enter your full name"
"What is your age?",number,,true,"Enter your age"
"What is your email?",email,,true,"Enter your email address"
"Select your gender",mcq,"Male,Female,Other",true,""
"Choose your preferred languages",checkbox,"English,Hindi,Tamil,Telugu,Bengali",false,""`;
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'questions_template.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const data = [
          { question_text: 'What is your full name?', question_type: 'text', options: '', required: true, placeholder: 'Enter your full name' },
          { question_text: 'What is your age?', question_type: 'number', options: '', required: true, placeholder: 'Enter your age' },
          { question_text: 'Select your gender', question_type: 'mcq', options: 'Male,Female,Other', required: true, placeholder: '' },
        ];
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Questions Template');
        XLSX.writeFile(workbook, 'questions_template.xlsx');
      }
    }
  };

  const clearFile = () => {
    setFile(null);
    setParsedData([]);
    setUploadResult(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      text: 'bg-blue-100 text-blue-800',
      textarea: 'bg-purple-100 text-purple-800',
      mcq: 'bg-green-100 text-green-800',
      checkbox: 'bg-yellow-100 text-yellow-800',
      dropdown: 'bg-orange-100 text-orange-800',
      number: 'bg-cyan-100 text-cyan-800',
      date: 'bg-pink-100 text-pink-800',
      email: 'bg-indigo-100 text-indigo-800',
      phone: 'bg-teal-100 text-teal-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bulk Upload Questions</h1>
        <p className="text-muted-foreground">Upload multiple questions at once using CSV or Excel files</p>
      </div>

      {/* Step 1: Select Insurance Company and Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-sm">1</span>
            Select Target Section
          </CardTitle>
          <CardDescription>Choose where to upload the questions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Insurance Company</Label>
              <Select value={selectedBankId} onValueChange={handleBankChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select company" />
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
            <div className="space-y-2">
              <Label>Section</Label>
              <Select 
                value={selectedSectionId} 
                onValueChange={setSelectedSectionId}
                disabled={!selectedBankId || isLoadingSections}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingSections ? 'Loading...' : 'Select section'} />
                </SelectTrigger>
                <SelectContent>
                  {sections.map((section) => (
                    <SelectItem key={section.id} value={section.id}>
                      {section.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Download Template */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-sm">2</span>
            Download Template
          </CardTitle>
          <CardDescription>Use our templates to ensure correct format</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => handleDownloadTemplate('csv')}>
              <FileText className="h-4 w-4 mr-2" />
              Download CSV Template
            </Button>
            <Button variant="outline" onClick={() => handleDownloadTemplate('excel')}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Download Excel Template
            </Button>
          </div>
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-2">Required Columns:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li><code className="px-1 bg-background rounded">question_text</code> - The question label (required)</li>
              <li><code className="px-1 bg-background rounded">question_type</code> - text, textarea, mcq, checkbox, dropdown, number, date, email, phone</li>
              <li><code className="px-1 bg-background rounded">options</code> - Comma-separated options for mcq/checkbox/dropdown</li>
              <li><code className="px-1 bg-background rounded">required</code> - true or false</li>
              <li><code className="px-1 bg-background rounded">placeholder</code> - Placeholder text (optional)</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Step 3: Upload File */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-sm">3</span>
            Upload File
          </CardTitle>
          <CardDescription>Upload your CSV or Excel file with questions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileSelect}
            className="hidden"
          />

          {!file ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
            >
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Click to upload or drag and drop</p>
              <p className="text-sm text-muted-foreground mt-1">CSV or Excel files up to 5MB</p>
            </div>
          ) : (
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="h-10 w-10 text-green-600" />
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB • {parsedData.length} rows detected
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={clearFile}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Preview Table */}
          {parsedData.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted px-4 py-2 border-b">
                <p className="font-medium flex items-center gap-2">
                  <Table className="h-4 w-4" />
                  Preview ({parsedData.length} rows)
                </p>
              </div>
              <div className="max-h-80 overflow-auto">
                <UITable>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Question</TableHead>
                      <TableHead className="w-28">Type</TableHead>
                      <TableHead className="w-32">Options</TableHead>
                      <TableHead className="w-20">Required</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.slice(0, 10).map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell className="font-medium">{row.question_text}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={getTypeColor(row.question_type)}>
                            {row.question_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm truncate max-w-[200px]">
                          {row.options || '-'}
                        </TableCell>
                        <TableCell>
                          {row.required ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <span className="text-muted-foreground text-sm">No</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </UITable>
              </div>
              {parsedData.length > 10 && (
                <div className="bg-muted px-4 py-2 border-t text-center text-sm text-muted-foreground">
                  ... and {parsedData.length - 10} more rows
                </div>
              )}
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          {/* Upload Result */}
          {uploadResult && (
            <Alert variant={uploadResult.failed_rows > 0 ? 'destructive' : 'default'}>
              {uploadResult.failed_rows > 0 ? (
                <AlertCircle className="h-4 w-4" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              <AlertTitle>Upload Complete</AlertTitle>
              <AlertDescription>
                <div className="mt-2 space-y-1">
                  <p>Total rows: {uploadResult.total_rows}</p>
                  <p className="text-green-600">Successfully inserted: {uploadResult.inserted_rows}</p>
                  {uploadResult.failed_rows > 0 && (
                    <>
                      <p className="text-red-600">Failed: {uploadResult.failed_rows}</p>
                      <div className="mt-2 max-h-32 overflow-auto text-sm">
                        {uploadResult.error_details.map((err, idx) => (
                          <p key={idx} className="text-red-500">
                            Row {err.row}: {err.error}
                          </p>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Upload Button */}
          <Button
            onClick={handleUpload}
            disabled={!file || !selectedSectionId || isUploading || isParsing}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload {parsedData.length} Questions
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
