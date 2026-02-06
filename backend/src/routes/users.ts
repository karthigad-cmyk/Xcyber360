import { Router, Request, Response } from 'express';
import { query } from '../config/database';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Get all users (admin only)
router.get('/', authenticateToken, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const { role } = req.query;

    let sql = `
      SELECT u.id, u.name, u.email, u.phone, u.created_at, ur.role, ur.insurance_provider_id
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
    `;
    const params: any[] = [];

    if (role) {
      sql += ' WHERE ur.role = $1';
      params.push(role);
    }

    sql += ' ORDER BY u.created_at DESC';

    const result = await query(sql, params);

    const users = result.rows.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      insuranceProviderId: u.insurance_provider_id,
      createdAt: u.created_at,
    }));

    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get single user (admin only)
router.get('/:id', authenticateToken, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT u.id, u.name, u.email, u.phone, u.created_at, ur.role, ur.insurance_provider_id
       FROM users u
       JOIN user_roles ur ON u.id = ur.user_id
       WHERE u.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const u = result.rows[0];
    res.json({
      success: true,
      data: {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        insuranceProviderId: u.insurance_provider_id,
        createdAt: u.created_at,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update user (admin only)
router.put('/:id', authenticateToken, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, phone, role, insuranceProviderId } = req.body;

    // Update user info
    await query(
      `UPDATE users 
       SET name = COALESCE($1, name),
           email = COALESCE($2, email),
           phone = COALESCE($3, phone)
       WHERE id = $4`,
      [name, email, phone, id]
    );

    // Update role if provided
    if (role) {
      await query(
        `UPDATE user_roles 
         SET role = $1, insurance_provider_id = $2
         WHERE user_id = $3`,
        [role, insuranceProviderId || null, id]
      );
    }

    // Get updated user
    const result = await query(
      `SELECT u.id, u.name, u.email, u.phone, u.created_at, ur.role, ur.insurance_provider_id
       FROM users u
       JOIN user_roles ur ON u.id = ur.user_id
       WHERE u.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const u = result.rows[0];
    res.json({
      success: true,
      data: {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        insuranceProviderId: u.insurance_provider_id,
        createdAt: u.created_at,
      },
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete user (admin only)
router.delete('/:id', authenticateToken, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;
