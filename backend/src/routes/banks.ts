import { Router, Request, Response } from 'express';
import { query } from '../config/database';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Get all banks
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const result = await query(
      'SELECT id, name, logo, description, is_active, created_at FROM banks ORDER BY created_at DESC'
    );

    const banks = result.rows.map((bank) => ({
      id: bank.id,
      name: bank.name,
      logo: bank.logo,
      description: bank.description,
      isActive: bank.is_active,
      createdAt: bank.created_at,
    }));

    res.json({ success: true, data: banks });
  } catch (error) {
    console.error('Get banks error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get single bank
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query(
      'SELECT id, name, logo, description, is_active, created_at FROM banks WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Bank not found' });
    }

    const bank = result.rows[0];
    res.json({
      success: true,
      data: {
        id: bank.id,
        name: bank.name,
        logo: bank.logo,
        description: bank.description,
        isActive: bank.is_active,
        createdAt: bank.created_at,
      },
    });
  } catch (error) {
    console.error('Get bank error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create bank (admin only)
router.post('/', authenticateToken, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const { id, name, logo, description, isActive = true } = req.body;

    if (!id || !name) {
      return res.status(400).json({ success: false, message: 'Bank ID and name are required' });
    }

    // Check if bank ID already exists
    const existing = await query('SELECT id FROM banks WHERE id = $1', [id]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Bank ID already exists' });
    }

    const result = await query(
      'INSERT INTO banks (id, name, logo, description, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [id, name, logo || '', description || '', isActive]
    );

    const bank = result.rows[0];
    res.status(201).json({
      success: true,
      data: {
        id: bank.id,
        name: bank.name,
        logo: bank.logo,
        description: bank.description,
        isActive: bank.is_active,
        createdAt: bank.created_at,
      },
    });
  } catch (error) {
    console.error('Create bank error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update bank (admin only)
router.put('/:id', authenticateToken, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, logo, description, isActive } = req.body;

    const result = await query(
      `UPDATE banks 
       SET name = COALESCE($1, name), 
           logo = COALESCE($2, logo), 
           description = COALESCE($3, description),
           is_active = COALESCE($4, is_active)
       WHERE id = $5 
       RETURNING *`,
      [name, logo, description, isActive, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Bank not found' });
    }

    const bank = result.rows[0];
    res.json({
      success: true,
      data: {
        id: bank.id,
        name: bank.name,
        logo: bank.logo,
        description: bank.description,
        isActive: bank.is_active,
        createdAt: bank.created_at,
      },
    });
  } catch (error) {
    console.error('Update bank error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete bank (admin only)
router.delete('/:id', authenticateToken, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM banks WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Bank not found' });
    }

    res.json({ success: true, message: 'Bank deleted successfully' });
  } catch (error) {
    console.error('Delete bank error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;
