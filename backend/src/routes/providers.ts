import { Router, Request, Response } from 'express';
import { query } from '../config/database';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Get all insurance providers
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const result = await query(
      'SELECT id, name, logo, description, is_active, created_at FROM insurance_providers ORDER BY name'
    );

    const providers = result.rows.map((provider) => ({
      id: provider.id,
      name: provider.name,
      logo: provider.logo,
      description: provider.description,
      isActive: provider.is_active,
      createdAt: provider.created_at,
    }));

    res.json({ success: true, data: providers });
  } catch (error) {
    console.error('Get providers error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get single insurance provider
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query(
      'SELECT id, name, logo, description, is_active, created_at FROM insurance_providers WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Insurance provider not found' });
    }

    const provider = result.rows[0];
    res.json({
      success: true,
      data: {
        id: provider.id,
        name: provider.name,
        logo: provider.logo,
        description: provider.description,
        isActive: provider.is_active,
        createdAt: provider.created_at,
      },
    });
  } catch (error) {
    console.error('Get provider error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create insurance provider (admin only)
router.post('/', authenticateToken, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const { id, name, logo, description, isActive = true } = req.body;

    if (!id || !name) {
      return res.status(400).json({ success: false, message: 'Provider ID and name are required' });
    }

    // Check if provider ID already exists
    const existing = await query('SELECT id FROM insurance_providers WHERE id = $1', [id]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Provider ID already exists' });
    }

    const result = await query(
      'INSERT INTO insurance_providers (id, name, logo, description, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [id, name, logo || '', description || '', isActive]
    );

    const provider = result.rows[0];
    res.status(201).json({
      success: true,
      data: {
        id: provider.id,
        name: provider.name,
        logo: provider.logo,
        description: provider.description,
        isActive: provider.is_active,
        createdAt: provider.created_at,
      },
    });
  } catch (error) {
    console.error('Create provider error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update insurance provider (admin only)
router.put('/:id', authenticateToken, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, logo, description, isActive } = req.body;

    const result = await query(
      `UPDATE insurance_providers 
       SET name = COALESCE($1, name), 
           logo = COALESCE($2, logo), 
           description = COALESCE($3, description),
           is_active = COALESCE($4, is_active)
       WHERE id = $5 
       RETURNING *`,
      [name, logo, description, isActive, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Insurance provider not found' });
    }

    const provider = result.rows[0];
    res.json({
      success: true,
      data: {
        id: provider.id,
        name: provider.name,
        logo: provider.logo,
        description: provider.description,
        isActive: provider.is_active,
        createdAt: provider.created_at,
      },
    });
  } catch (error) {
    console.error('Update provider error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete insurance provider (admin only)
router.delete('/:id', authenticateToken, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM insurance_providers WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Insurance provider not found' });
    }

    res.json({ success: true, message: 'Insurance provider deleted successfully' });
  } catch (error) {
    console.error('Delete provider error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;
