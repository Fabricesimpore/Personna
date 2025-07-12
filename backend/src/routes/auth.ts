import express from 'express';
import jwt from 'jsonwebtoken';

const router = express.Router();

// In-memory user storage for MVP
const users: Map<string, any> = new Map();

// JWT secret - in production, use environment variable
const JWT_SECRET = 'your-secret-key-change-in-production';

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name and email are required' 
      });
    }

    // Check if user already exists
    let user = users.get(email);
    
    if (!user) {
      // Create new user
      user = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        email,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      users.set(email, user);
    } else {
      // Update existing user
      user.name = name;
      user.updatedAt = new Date().toISOString();
      users.set(email, user);
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email 
      }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// GET /api/auth/me - Get current user
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided' 
      });
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const user = users.get(decoded.email);
      
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      res.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        }
      });

    } catch (jwtError) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    }

  } catch (error) {
    console.error('Auth me error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

export default router; 