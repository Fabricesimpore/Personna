/**
 * Personas API routes
 * Handles GET requests for persona data
 */

import { Request, Response } from 'express';
import { personaStore } from '../models/Persona';
import { verifyToken } from '../middleware/auth';

/**
 * GET /api/personas/me
 * Returns the latest persona for the authenticated user
 */
export const getMyPersona = (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    
    const persona = personaStore.getLatestByUserId(userId);
    
    if (!persona) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'No persona found for this user'
      });
    }

    res.json({
      success: true,
      data: {
        personaId: persona.id,
        name: persona.name,
        traitScores: persona.traitScores,
        painPoints: persona.painPoints,
        quotes: persona.quotes,
        createdAt: persona.createdAt
      }
    });

  } catch (error) {
    console.error('Error fetching user persona:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch persona'
    });
  }
};

/**
 * GET /api/personas/:id
 * Returns a specific persona by ID
 */
export const getPersonaById = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const persona = personaStore.getById(id);
    
    if (!persona) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: `Persona with ID ${id} not found`
      });
    }

    // Check if user has access to this persona
    const userId = req.user!.userId;
    if (persona.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Access denied to this persona'
      });
    }

    res.json({
      success: true,
      data: persona
    });

  } catch (error) {
    console.error('Error fetching persona:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch persona'
    });
  }
};

/**
 * GET /api/personas
 * Returns all personas for the authenticated user
 */
export const getUserPersonas = (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    
    const personas = personaStore.getByUserId(userId);
    
    res.json({
      success: true,
      data: personas.map(persona => ({
        id: persona.id,
        name: persona.name,
        runId: persona.runId,
        createdAt: persona.createdAt,
        updatedAt: persona.updatedAt
      })),
      meta: {
        total: personas.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching user personas:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch personas'
    });
  }
}; 