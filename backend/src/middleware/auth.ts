import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// JWT secret - in production, use environment variable
const JWT_SECRET = 'your-secret-key-change-in-production';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
      };
    }
  }
}

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
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
      req.user = {
        userId: decoded.userId,
        email: decoded.email
      };
      next();
    } catch (jwtError) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    }

  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
}; 