import { Router, Request, Response } from 'express';
import { query } from '../config/database';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Get responses (filtered by role with STRICT PROVIDER ISOLATION)
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { insuranceProviderId, sectionId, userId, isSubmitted, status } = req.query;
    const user = req.user!;

    let sql = `
      SELECT fr.id, fr.user_id, fr.section_id, fr.insurance_provider_id, 
             fr.responses, fr.status, fr.is_submitted, fr.submitted_at, 
             fr.created_at, fr.updated_at,
             u.name as user_name, u.email as user_email, u.phone as user_phone,
             s.title as section_title, s.description as section_description,
             ip.name as provider_name, ip.logo as provider_logo
      FROM form_responses fr
      JOIN users u ON fr.user_id = u.id
      JOIN sections s ON fr.section_id = s.id
      JOIN insurance_providers ip ON fr.insurance_provider_id = ip.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    // STRICT ROLE-BASED FILTERING (MANDATORY)
    if (user.role === 'user') {
      // Users can only see their own responses
      sql += ` AND fr.user_id = $${paramIndex++}`;
      params.push(user.userId);
    } else if (user.role === 'agent') {
      // STRICT: Agents can ONLY see responses for their assigned insurance provider
      if (!user.insuranceProviderId) {
        return res.status(403).json({ success: false, message: 'Agent not assigned to any insurance provider' });
      }
      sql += ` AND fr.insurance_provider_id = $${paramIndex++}`;
      params.push(user.insuranceProviderId);
    }
    // Admin can see all responses

    // Additional filters
    if (insuranceProviderId) {
      sql += ` AND fr.insurance_provider_id = $${paramIndex++}`;
      params.push(insuranceProviderId);
    }
    if (sectionId) {
      sql += ` AND fr.section_id = $${paramIndex++}`;
      params.push(sectionId);
    }
    if (userId && user.role === 'admin') {
      sql += ` AND fr.user_id = $${paramIndex++}`;
      params.push(userId);
    }
    if (isSubmitted !== undefined) {
      sql += ` AND fr.is_submitted = $${paramIndex++}`;
      params.push(isSubmitted === 'true');
    }
    if (status) {
      sql += ` AND fr.status = $${paramIndex++}`;
      params.push(status);
    }

    sql += ' ORDER BY fr.updated_at DESC';

    const result = await query(sql, params);

    const responses = result.rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      user: {
        id: r.user_id,
        name: r.user_name,
        email: r.user_email,
        phone: r.user_phone,
      },
      sectionId: r.section_id,
      section: {
        id: r.section_id,
        title: r.section_title,
        description: r.section_description,
      },
      insuranceProviderId: r.insurance_provider_id,
      insuranceProvider: {
        id: r.insurance_provider_id,
        name: r.provider_name,
        logo: r.provider_logo,
      },
      responses: r.responses,
      status: r.status,
      isSubmitted: r.is_submitted,
      submittedAt: r.submitted_at,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));

    res.json({ success: true, data: responses });
  } catch (error) {
    console.error('Get responses error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get single response
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    let sql = `
      SELECT fr.id, fr.user_id, fr.section_id, fr.insurance_provider_id, 
             fr.responses, fr.status, fr.is_submitted, fr.submitted_at, 
             fr.created_at, fr.updated_at,
             u.name as user_name, u.email as user_email, u.phone as user_phone,
             s.title as section_title, s.description as section_description,
             ip.name as provider_name, ip.logo as provider_logo
      FROM form_responses fr
      JOIN users u ON fr.user_id = u.id
      JOIN sections s ON fr.section_id = s.id
      JOIN insurance_providers ip ON fr.insurance_provider_id = ip.id
      WHERE fr.id = $1
    `;
    const params: any[] = [id];

    // Role-based access with STRICT ISOLATION
    if (user.role === 'user') {
      sql += ' AND fr.user_id = $2';
      params.push(user.userId);
    } else if (user.role === 'agent') {
      if (!user.insuranceProviderId) {
        return res.status(403).json({ success: false, message: 'Agent not assigned to any insurance provider' });
      }
      sql += ' AND fr.insurance_provider_id = $2';
      params.push(user.insuranceProviderId);
    }

    const result = await query(sql, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Response not found' });
    }

    const r = result.rows[0];
    res.json({
      success: true,
      data: {
        id: r.id,
        userId: r.user_id,
        user: { id: r.user_id, name: r.user_name, email: r.user_email, phone: r.user_phone },
        sectionId: r.section_id,
        section: { id: r.section_id, title: r.section_title, description: r.section_description },
        insuranceProviderId: r.insurance_provider_id,
        insuranceProvider: { id: r.insurance_provider_id, name: r.provider_name, logo: r.provider_logo },
        responses: r.responses,
        status: r.status,
        isSubmitted: r.is_submitted,
        submittedAt: r.submitted_at,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      },
    });
  } catch (error) {
    console.error('Get response error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get user's response for a section
router.get('/user/section/:sectionId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { sectionId } = req.params;
    const userId = req.user!.userId;

    const result = await query(
      'SELECT * FROM form_responses WHERE user_id = $1 AND section_id = $2',
      [userId, sectionId]
    );

    if (result.rows.length === 0) {
      return res.json({ success: true, data: null });
    }

    const r = result.rows[0];
    res.json({
      success: true,
      data: {
        id: r.id,
        userId: r.user_id,
        sectionId: r.section_id,
        insuranceProviderId: r.insurance_provider_id,
        responses: r.responses,
        status: r.status,
        isSubmitted: r.is_submitted,
        submittedAt: r.submitted_at,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      },
    });
  } catch (error) {
    console.error('Get user response error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Save/update response (auto-save) - DRAFT status
router.post('/save', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { sectionId, insuranceProviderId, responses } = req.body;
    const userId = req.user!.userId;

    if (!sectionId || !insuranceProviderId || !responses) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Verify section belongs to the insurance provider
    const sectionCheck = await query(
      'SELECT id FROM sections WHERE id = $1 AND insurance_provider_id = $2',
      [sectionId, insuranceProviderId]
    );
    if (sectionCheck.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid section for this insurance provider' });
    }

    // Check if response exists
    const existing = await query(
      'SELECT id, is_submitted FROM form_responses WHERE user_id = $1 AND section_id = $2',
      [userId, sectionId]
    );

    let result;
    if (existing.rows.length > 0) {
      // Don't allow editing submitted responses
      if (existing.rows[0].is_submitted) {
        return res.status(400).json({ success: false, message: 'Cannot edit submitted response' });
      }
      
      // Update existing
      result = await query(
        `UPDATE form_responses 
         SET responses = $1, updated_at = NOW()
         WHERE user_id = $2 AND section_id = $3
         RETURNING *`,
        [JSON.stringify(responses), userId, sectionId]
      );
    } else {
      // Create new with DRAFT status
      result = await query(
        `INSERT INTO form_responses (user_id, section_id, insurance_provider_id, responses, status)
         VALUES ($1, $2, $3, $4, 'DRAFT')
         RETURNING *`,
        [userId, sectionId, insuranceProviderId, JSON.stringify(responses)]
      );
    }

    const r = result.rows[0];
    res.json({
      success: true,
      data: {
        id: r.id,
        userId: r.user_id,
        sectionId: r.section_id,
        insuranceProviderId: r.insurance_provider_id,
        responses: r.responses,
        status: r.status,
        isSubmitted: r.is_submitted,
        submittedAt: r.submitted_at,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      },
    });
  } catch (error) {
    console.error('Save response error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Submit response - Changes status to SUBMITTED and locks editing
router.post('/:id/submit', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const result = await query(
      `UPDATE form_responses 
       SET is_submitted = true, status = 'SUBMITTED', submitted_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND user_id = $2 AND is_submitted = false
       RETURNING *`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Response not found or already submitted' });
    }

    const r = result.rows[0];
    res.json({
      success: true,
      data: {
        id: r.id,
        userId: r.user_id,
        sectionId: r.section_id,
        insuranceProviderId: r.insurance_provider_id,
        responses: r.responses,
        status: r.status,
        isSubmitted: r.is_submitted,
        submittedAt: r.submitted_at,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      },
    });
  } catch (error) {
    console.error('Submit response error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;
