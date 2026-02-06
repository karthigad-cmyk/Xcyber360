import { Router, Request, Response } from 'express';
import multer from 'multer';
import * as XLSX from 'xlsx';
import { query, getClient } from '../config/database';
import { authenticateToken, requireRole } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    if (allowedMimes.includes(file.mimetype) || file.originalname.match(/\.(csv|xlsx|xls)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and Excel files are allowed'));
    }
  },
});

// Get all questions (admin only)
router.get('/', authenticateToken, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const { sectionId, insuranceProviderId } = req.query;
    
    let sql = 'SELECT * FROM questions WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (sectionId) {
      sql += ` AND section_id = $${paramIndex++}`;
      params.push(sectionId);
    }

    sql += ' ORDER BY "order"';

    const result = await query(sql, params);

    const questions = result.rows.map((q) => ({
      id: q.id,
      sectionId: q.section_id,
      type: q.type,
      label: q.label,
      placeholder: q.placeholder,
      required: q.required,
      options: q.options,
      order: q.order,
      createdAt: q.created_at,
    }));

    res.json({ success: true, data: questions });
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update question (admin only)
router.put('/:id', authenticateToken, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { type, label, placeholder, required, options, order, sectionId } = req.body;

    // Validate required fields
    if (label !== undefined && (!label || label.trim() === '')) {
      return res.status(400).json({ success: false, message: 'Question label cannot be empty' });
    }

    if (type !== undefined) {
      const validTypes = ['text', 'textarea', 'mcq', 'checkbox', 'dropdown', 'number', 'date', 'email', 'phone', 'select'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({ success: false, message: 'Invalid question type' });
      }
    }

    // Check if question exists
    const existingQuestion = await query('SELECT * FROM questions WHERE id = $1', [id]);
    if (existingQuestion.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    const result = await query(
      `UPDATE questions 
       SET type = COALESCE($1, type),
           label = COALESCE($2, label),
           placeholder = COALESCE($3, placeholder),
           required = COALESCE($4, required),
           options = COALESCE($5, options),
           "order" = COALESCE($6, "order"),
           section_id = COALESCE($7, section_id)
       WHERE id = $8 
       RETURNING *`,
      [
        type,
        label,
        placeholder,
        required,
        options ? JSON.stringify(options) : null,
        order,
        sectionId,
        id,
      ]
    );

    const question = result.rows[0];
    res.json({
      success: true,
      data: {
        id: question.id,
        sectionId: question.section_id,
        type: question.type,
        label: question.label,
        placeholder: question.placeholder,
        required: question.required,
        options: question.options,
        order: question.order,
        createdAt: question.created_at,
      },
    });
  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete question (admin only)
router.delete('/:id', authenticateToken, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM questions WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    res.json({ success: true, message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Bulk upload questions (admin only)
router.post(
  '/bulk-upload',
  authenticateToken,
  requireRole('admin'),
  upload.single('file'),
  async (req: Request, res: Response) => {
    const client = await getClient();

    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }

      const { sectionId, insuranceProviderId } = req.body;

      if (!sectionId) {
        return res.status(400).json({ success: false, message: 'Section ID is required' });
      }

      // Verify section exists
      const sectionCheck = await query('SELECT id FROM sections WHERE id = $1', [sectionId]);
      if (sectionCheck.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Section not found' });
      }

      // Parse the file
      let rows: any[] = [];
      const buffer = req.file.buffer;
      const filename = req.file.originalname.toLowerCase();

      if (filename.endsWith('.csv')) {
        // Parse CSV
        const csvString = buffer.toString('utf-8');
        const lines = csvString.split('\n').filter((line) => line.trim());
        const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/"/g, ''));

        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i]);
          const row: any = {};
          headers.forEach((header, idx) => {
            row[header] = values[idx]?.trim() || '';
          });
          rows.push(row);
        }
      } else {
        // Parse Excel
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      }

      if (rows.length === 0) {
        return res.status(400).json({ success: false, message: 'File is empty or has no data rows' });
      }

      // Get current max order
      const orderResult = await query(
        'SELECT COALESCE(MAX("order"), -1) as max_order FROM questions WHERE section_id = $1',
        [sectionId]
      );
      let currentOrder = orderResult.rows[0].max_order + 1;

      // Validate and prepare data
      const validRows: any[] = [];
      const errors: { row: number; error: string }[] = [];
      const validTypes = ['text', 'textarea', 'mcq', 'checkbox', 'dropdown', 'number', 'date', 'email', 'phone', 'select'];

      rows.forEach((row, index) => {
        const rowNum = index + 2; // +2 because of 0-index and header row
        const questionText = row.question_text || row.label || row.question || '';
        const questionType = (row.question_type || row.type || 'text').toLowerCase();
        const options = row.options || '';
        const isRequired = row.required !== undefined ? 
          (row.required === 'true' || row.required === '1' || row.required === true) : true;

        // Validation
        if (!questionText.trim()) {
          errors.push({ row: rowNum, error: 'Question text is required' });
          return;
        }

        if (!validTypes.includes(questionType)) {
          errors.push({ row: rowNum, error: `Invalid question type: ${questionType}. Valid types: ${validTypes.join(', ')}` });
          return;
        }

        // Parse options for MCQ/checkbox/dropdown
        let parsedOptions = null;
        if (['mcq', 'checkbox', 'dropdown', 'select'].includes(questionType) && options) {
          try {
            const optionsArray = options.split(',').map((o: string) => o.trim()).filter((o: string) => o);
            parsedOptions = optionsArray.map((opt: string, idx: number) => ({
              id: `opt_${Date.now()}_${idx}`,
              label: opt,
              value: opt.toLowerCase().replace(/\s+/g, '_'),
            }));
          } catch (e) {
            errors.push({ row: rowNum, error: 'Invalid options format' });
            return;
          }
        }

        validRows.push({
          id: uuidv4(),
          sectionId,
          type: questionType,
          label: questionText.trim(),
          placeholder: row.placeholder || '',
          required: isRequired,
          options: parsedOptions,
          order: currentOrder++,
        });
      });

      // Begin transaction
      await client.query('BEGIN');

      let insertedCount = 0;
      const insertedQuestions: any[] = [];

      for (const row of validRows) {
        try {
          const result = await client.query(
            `INSERT INTO questions (id, section_id, type, label, placeholder, required, options, "order")
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [
              row.id,
              row.sectionId,
              row.type,
              row.label,
              row.placeholder,
              row.required,
              row.options ? JSON.stringify(row.options) : null,
              row.order,
            ]
          );
          insertedQuestions.push({
            id: result.rows[0].id,
            sectionId: result.rows[0].section_id,
            type: result.rows[0].type,
            label: result.rows[0].label,
            placeholder: result.rows[0].placeholder,
            required: result.rows[0].required,
            options: result.rows[0].options,
            order: result.rows[0].order,
            createdAt: result.rows[0].created_at,
          });
          insertedCount++;
        } catch (insertError: any) {
          errors.push({ row: validRows.indexOf(row) + 2, error: insertError.message });
        }
      }

      // If all valid rows failed, rollback
      if (insertedCount === 0 && validRows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: 'All rows failed to insert',
          data: {
            total_rows: rows.length,
            inserted_rows: 0,
            failed_rows: rows.length,
            error_details: errors,
          },
        });
      }

      await client.query('COMMIT');

      res.json({
        success: true,
        message: `Successfully uploaded ${insertedCount} questions`,
        data: {
          total_rows: rows.length,
          inserted_rows: insertedCount,
          failed_rows: errors.length,
          error_details: errors,
          questions: insertedQuestions,
        },
      });
    } catch (error: any) {
      await client.query('ROLLBACK');
      console.error('Bulk upload error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Bulk upload failed: ' + error.message,
        error_details: error.message,
      });
    } finally {
      client.release();
    }
  }
);

// Download sample CSV template
router.get('/template/csv', authenticateToken, requireRole('admin'), (req: Request, res: Response) => {
  const csvContent = `question_text,question_type,options,required,placeholder
"What is your full name?",text,,true,"Enter your full name"
"What is your age?",number,,true,"Enter your age"
"What is your email?",email,,true,"Enter your email address"
"Select your gender",mcq,"Male,Female,Other",true,""
"Choose your preferred languages",checkbox,"English,Hindi,Tamil,Telugu,Bengali",false,""
"Select your state",dropdown,"Maharashtra,Delhi,Karnataka,Tamil Nadu,Gujarat",true,""
"Describe your medical history",textarea,,false,"Provide any relevant medical history"
"What is your date of birth?",date,,true,""`;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=questions_template.csv');
  res.send(csvContent);
});

// Download sample Excel template
router.get('/template/excel', authenticateToken, requireRole('admin'), (req: Request, res: Response) => {
  const data = [
    { question_text: 'What is your full name?', question_type: 'text', options: '', required: true, placeholder: 'Enter your full name' },
    { question_text: 'What is your age?', question_type: 'number', options: '', required: true, placeholder: 'Enter your age' },
    { question_text: 'What is your email?', question_type: 'email', options: '', required: true, placeholder: 'Enter your email address' },
    { question_text: 'Select your gender', question_type: 'mcq', options: 'Male,Female,Other', required: true, placeholder: '' },
    { question_text: 'Choose your preferred languages', question_type: 'checkbox', options: 'English,Hindi,Tamil,Telugu,Bengali', required: false, placeholder: '' },
    { question_text: 'Select your state', question_type: 'dropdown', options: 'Maharashtra,Delhi,Karnataka,Tamil Nadu,Gujarat', required: true, placeholder: '' },
    { question_text: 'Describe your medical history', question_type: 'textarea', options: '', required: false, placeholder: 'Provide any relevant medical history' },
    { question_text: 'What is your date of birth?', question_type: 'date', options: '', required: true, placeholder: '' },
  ];

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Questions Template');

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=questions_template.xlsx');
  res.send(buffer);
});

// Helper function to parse CSV line handling quoted values
function parseCSVLine(line: string): string[] {
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
}

export default router;
