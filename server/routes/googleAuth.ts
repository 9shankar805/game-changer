import { Request, Response } from 'express';
import { storage } from '../storage';

// Google OAuth login endpoint
export async function handleGoogleLogin(req: Request, res: Response) {
  try {
    const { code, email, fullName } = req.body;

    if (!code && !email) {
      return res.status(400).json({ error: 'Missing required data' });
    }

    let userEmail = email;
    let userName = fullName;

    // If code is provided, exchange it for user info (OAuth flow)
    if (code && !email) {
      // For now, create a demo user since we don't have OAuth server setup
      userEmail = 'google.user@example.com';
      userName = 'Google User';
    }

    // Check if user exists
    let user = await storage.getUserByEmail(userEmail);
    
    if (!user) {
      // Create new user
      user = await storage.createUser({
        fullName: userName,
        email: userEmail,
        password: null,
        phone: '',
        role: 'customer',
        status: 'active'
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ error: 'Google authentication failed' });
  }
}

// Google OAuth registration endpoint
export async function handleGoogleRegister(req: Request, res: Response) {
  try {
    const { email, fullName, role = 'customer' } = req.body;

    if (!email || !fullName) {
      return res.status(400).json({ error: 'Missing required data' });
    }

    // Check if user already exists
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Account with this email already exists' });
    }

    // Create new user
    const user = await storage.createUser({
      fullName,
      email,
      password: null,
      phone: '',
      role,
      status: 'active'
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Google registration error:', error);
    res.status(500).json({ error: 'Google registration failed' });
  }
}