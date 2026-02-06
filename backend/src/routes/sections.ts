import { Router, Request, Response } from 'express';
import { query } from '../config/database';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Get all sections (with optional insuranceProviderId filter)
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { insuranceProviderId } = req.query;
    
    let sql = `
      SELECT s.id, s.insurance_provider_id, s.title, s.description, s."order", s.is_active, s.created_at,
             COALESCE(json_agg(
               json_build_object(
                 'id', q.id,
                 'sectionId', q.section_id,
                 'type', q.type,
                 'label', q.label,
                 'placeholder', q.placeholder,
                 'required', q.required,
                 'options', q.options,
                 'order', q."order",
                 'createdAt', q.created_at
               ) ORDER BY q."order"
             ) FILTER (WHERE q.id IS NOT NULL), '[]') as questions
      FROM sections s
      LEFT JOIN questions q ON s.id = q.section_id
    `;
    
    const params: any[] = [];
    if (insuranceProviderId) {
      sql += ' WHERE s.insurance_provider_id = $1';
      params.push(insuranceProviderId);
    }
    
    sql += ' GROUP BY s.id ORDER BY s."order"';

    const result = await query(sql, params);

    const sections = result.rows.map((section) => ({
      id: section.id,
      insuranceProviderId: section.insurance_provider_id,
      title: section.title,
      description: section.description,
      order: section.order,
      isActive: section.is_active,
      questions: section.questions,
      createdAt: section.created_at,
    }));

    res.json({ success: true, data: sections });
  } catch (error) {
    console.error('Get sections error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get single section
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      `SELECT s.id, s.insurance_provider_id, s.title, s.description, s."order", s.is_active, s.created_at,
              COALESCE(json_agg(
                json_build_object(
                  'id', q.id,
                  'sectionId', q.section_id,
                  'type', q.type,
                  'label', q.label,
                  'placeholder', q.placeholder,
                  'required', q.required,
                  'options', q.options,
                  'order', q."order",
                  'createdAt', q.created_at
                ) ORDER BY q."order"
              ) FILTER (WHERE q.id IS NOT NULL), '[]') as questions
       FROM sections s
       LEFT JOIN questions q ON s.id = q.section_id
       WHERE s.id = $1
       GROUP BY s.id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Section not found' });
    }

    const section = result.rows[0];
    res.json({
      success: true,
      data: {
        id: section.id,
        insuranceProviderId: section.insurance_provider_id,
        title: section.title,
        description: section.description,
        order: section.order,
        isActive: section.is_active,
        questions: section.questions,
        createdAt: section.created_at,
      },
    });
  } catch (error) {
    console.error('Get section error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create section (admin only)
router.post('/', authenticateToken, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const { insuranceProviderId, title, description, order = 0, isActive = true } = req.body;

    if (!insuranceProviderId || !title) {
      return res.status(400).json({ success: false, message: 'Insurance provider ID and title are required' });
    }

    // Verify provider exists
    const providerCheck = await query('SELECT id FROM insurance_providers WHERE id = $1', [insuranceProviderId]);
    if (providerCheck.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid insurance provider' });
    }

    const result = await query(
      'INSERT INTO sections (insurance_provider_id, title, description, "order", is_active) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [insuranceProviderId, title, description || '', order, isActive]
    );

    const section = result.rows[0];
    res.status(201).json({
      success: true,
      data: {
        id: section.id,
        insuranceProviderId: section.insurance_provider_id,
        title: section.title,
        description: section.description,
        order: section.order,
        isActive: section.is_active,
        questions: [],
        createdAt: section.created_at,
      },
    });
  } catch (error) {
    console.error('Create section error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update section (admin only)
router.put('/:id', authenticateToken, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, order, isActive } = req.body;

    const result = await query(
      `UPDATE sections 
       SET title = COALESCE($1, title), 
           description = COALESCE($2, description),
           "order" = COALESCE($3, "order"),
           is_active = COALESCE($4, is_active)
       WHERE id = $5 
       RETURNING *`,
      [title, description, order, isActive, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Section not found' });
    }

    const section = result.rows[0];
    res.json({
      success: true,
      data: {
        id: section.id,
        insuranceProviderId: section.insurance_provider_id,
        title: section.title,
        description: section.description,
        order: section.order,
        isActive: section.is_active,
        createdAt: section.created_at,
      },
    });
  } catch (error) {
    console.error('Update section error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete section (admin only)
router.delete('/:id', authenticateToken, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM sections WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Section not found' });
    }

    res.json({ success: true, message: 'Section deleted successfully' });
  } catch (error) {
    console.error('Delete section error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get questions for a section
router.get('/:id/questions', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      'SELECT * FROM questions WHERE section_id = $1 ORDER BY "order"',
      [id]
    );

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

// Create question (admin only)
router.post('/:id/questions', authenticateToken, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const { id: sectionId } = req.params;
    const { type, label, placeholder, required = true, options, order = 0 } = req.body;

    if (!type || !label) {
      return res.status(400).json({ success: false, message: 'Type and label are required' });
    }

    const result = await query(
      'INSERT INTO questions (section_id, type, label, placeholder, required, options, "order") VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [sectionId, type, label, placeholder || '', required, options ? JSON.stringify(options) : null, order]
    );

    const question = result.rows[0];
    res.status(201).json({
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
    console.error('Create question error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Reorder questions (admin only)
router.put('/:id/questions/reorder', authenticateToken, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const { questionIds } = req.body;

    if (!Array.isArray(questionIds)) {
      return res.status(400).json({ success: false, message: 'questionIds must be an array' });
    }

    for (let i = 0; i < questionIds.length; i++) {
      await query('UPDATE questions SET "order" = $1 WHERE id = $2', [i, questionIds[i]]);
    }

    res.json({ success: true, message: 'Questions reordered successfully' });
  } catch (error) {
    console.error('Reorder questions error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;
