import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database';
import { LoginSchema, RegisterSchema } from '@our-line-in-time/shared';
import { AuthenticatedRequest } from '../middleware/auth';

export const register = async (req: Request, res: Response) => {
  try {
    const validatedData = RegisterSchema.parse(req.body);
    const { email, password, name } = validatedData;

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM family_members WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create new user
    const result = await pool.query(`
      INSERT INTO family_members (
        id, email, name, password_hash, role, generation_level, is_active,
        preferences, created_at, last_active_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW(), NOW()
      ) RETURNING id, email, name, role, generation_level, is_active
    `, [
      email,
      name,
      passwordHash,
      'admin', // First user is admin, later users will be 'contributor'
      0, // Default generation level
      true,
      JSON.stringify({
        theme: 'auto',
        language: 'en',
        notifications: { email: true, inApp: true },
        privacy: { showInFamilyTree: true, allowLocationSharing: true }
      })
    ]);

    const user = result.rows[0];

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid input data', details: error });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const validatedData = LoginSchema.parse(req.body);
    const { email, password } = validatedData;

    // Find user
    const result = await pool.query(
      'SELECT id, email, name, password_hash, role, is_active FROM family_members WHERE email = $1',
      [email]
    );

    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.is_active) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update last active timestamp
    await pool.query(
      'UPDATE family_members SET last_active_at = NOW() WHERE id = $1',
      [user.id]
    );

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid input data', details: error });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT id, email, name, role, generation_level, is_active,
             preferences, created_at, last_active_at
      FROM family_members
      WHERE id = $1
    `, [req.user!.id]);

    const user = result.rows[0];
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const logout = async (req: AuthenticatedRequest, res: Response) => {
  // For JWT, logout is handled client-side by removing the token
  // In future, we could implement token blacklisting with Redis
  res.json({ message: 'Logout successful' });
};