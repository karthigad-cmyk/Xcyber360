import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../config/database';
import { generateToken, authenticateToken } from '../middleware/auth';
import { UserRole } from '../types';

const router = Router();

// Register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, phone, password, role, insuranceProviderId } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !password || !role) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Validate role
    if (!['admin', 'agent', 'user'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    // Agent must have an insurance provider
    if (role === 'agent' && !insuranceProviderId) {
      return res.status(400).json({ success: false, message: 'Insurance provider is required for agents' });
    }

    // Check if email exists
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Validate insurance provider if provided
    if (insuranceProviderId) {
      const providerCheck = await query('SELECT id FROM insurance_providers WHERE id = $1', [insuranceProviderId]);
      if (providerCheck.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'Invalid insurance provider' });
      }
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Create user
    const userResult = await query(
      'INSERT INTO users (name, email, phone, password_hash) VALUES ($1, $2, $3, $4) RETURNING id, name, email, phone, created_at',
      [name, email, phone, password_hash]
    );
    const user = userResult.rows[0];

    // Assign role
    await query(
      'INSERT INTO user_roles (user_id, role, insurance_provider_id) VALUES ($1, $2, $3)',
      [user.id, role as UserRole, insuranceProviderId || null]
    );

    // Generate token
    const token = generateToken({ userId: user.id, role: role as UserRole, insuranceProviderId });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role,
          insuranceProviderId,
          createdAt: user.created_at,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Email, password, and role are required' });
    }

    // Get user with role
    const userResult = await query(
      `SELECT u.id, u.name, u.email, u.phone, u.password_hash, u.created_at, ur.role, ur.insurance_provider_id
       FROM users u
       JOIN user_roles ur ON u.id = ur.user_id
       WHERE u.email = $1 AND ur.role = $2`,
      [email, role]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials or role' });
    }

    const user = userResult.rows[0];

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken({ 
      userId: user.id, 
      role: user.role, 
      insuranceProviderId: user.insurance_provider_id 
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          insuranceProviderId: user.insurance_provider_id,
          createdAt: user.created_at,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

// Get profile
router.get('/profile', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    const userResult = await query(
      `SELECT u.id, u.name, u.email, u.phone, u.created_at, ur.role, ur.insurance_provider_id
       FROM users u
       JOIN user_roles ur ON u.id = ur.user_id
       WHERE u.id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = userResult.rows[0];

    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        insuranceProviderId: user.insurance_provider_id,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;
