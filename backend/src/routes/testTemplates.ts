/**
 * Test Templates API routes
 * Handles GET requests for test templates
 */

import { Request, Response } from 'express';
import OpenAI from "openai";
import { testTemplateStore } from '../models/TestTemplate';

// Initialize OpenAI configuration (optional - will use fallback if no API key)
let openai: OpenAI | null = null;
try {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
} catch (error) {
  console.warn('OpenAI API key not configured, using fallback flow definitions');
}

/**
 * Async initializer to generate flow definitions for test templates
 * This function uses OpenAI to generate 3 short, clear steps for each test template
 * that participants can follow during the demo.
 */
(async () => {
  console.log('🔄 Initializing test templates with OpenAI flow definitions...');
  const templates = testTemplateStore.getAll();
  console.log(`📋 Found ${templates.length} templates to process`);
  
  for (const tpl of templates) {
    console.log(`🔍 Processing template: ${tpl.name}`);
    if (!tpl.flowDefinition || tpl.flowDefinition.length === 0) {
      console.log(`  ⚡ Generating flow definition for: ${tpl.name}`);
      try {
        if (openai) {
          console.log(`  🤖 Using OpenAI for: ${tpl.name}`);
          const resp = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
              { role: "system", content: "You are a UX researcher creating engaging, interactive test instructions. Generate specific, actionable steps that participants can follow for different types of user testing." },
              { role: "user", content: 
                 `Create 3 specific, interactive steps for a "${tpl.name}" user test. Make them engaging and specific to this test type:

                 - Click Test: Focus on clicking specific elements, tracking mouse movements, and finding clickable areas
                 - Survey: Focus on answering questions, rating scales, and providing detailed feedback
                 - Live Intercept: Focus on real-time interaction, immediate feedback, and spontaneous reactions
                 - Card Sort: Focus on organizing cards, creating categories, and explaining sorting decisions
                 - Tree Test: Focus on navigation, finding items in hierarchies, and path completion
                 - Basic Usability Test: Focus on task completion, error recovery, and overall user experience
                 - Advanced UX Research: Focus on detailed observation, think-aloud protocols, and comprehensive analysis

                 Each step should be 8-15 words, specific to the test type, and include interactive elements. Return only the 3 steps, one per line, without numbering.`
              }
            ],
            max_tokens: 150
          });
          const content = resp.choices[0].message.content;
          if (content) {
            tpl.flowDefinition = content
              .trim()
              .split(/\n+/)
              .map((line: string) => line.replace(/^[0-9\.\-\s\)]+/, ""))
              .filter((line: string) => line.trim().length > 0);
            console.log(`  ✅ Generated for ${tpl.name}:`, tpl.flowDefinition);
          } else {
            console.log(`  ⚠️  No content from OpenAI for ${tpl.name}, using fallback`);
            // Fallback if content is null
            tpl.flowDefinition = [
              "Review the interface elements",
              "Complete the assigned tasks", 
              "Report any usability issues found"
            ];
          }
        } else {
          console.log(`  ⚠️  No OpenAI available for ${tpl.name}, using fallback`);
          // Fallback flow definitions
          tpl.flowDefinition = [
            "Review the interface elements",
            "Complete the assigned tasks", 
            "Report any usability issues found"
          ];
        }
      } catch (error) {
        console.warn(`❌ Failed to generate flow definition for ${tpl.name}:`, error);
        // Fallback flow definitions
        tpl.flowDefinition = [
          "Review the interface elements",
          "Complete the assigned tasks", 
          "Report any usability issues found"
        ];
      }
    } else {
      console.log(`  ℹ️  Template ${tpl.name} already has flow definition`);
    }
  }
  console.log('✅ Template initialization complete!');
})();

/**
 * GET /api/test-templates
 * Returns all available test templates
 */
export const getTestTemplates = (req: Request, res: Response) => {
  try {
    // Get query parameters for filtering
    const { featured, category, search, limit } = req.query;

    let templates = testTemplateStore.getAll();

    // Filter by featured status if specified
    if (featured === 'true') {
      templates = testTemplateStore.getFeatured();
    }

    // Filter by category if specified
    if (typeof category === 'string' && category.trim()) {
      templates = templates.filter(template => template.category === category);
    }

    // Search by query if specified
    if (typeof search === 'string' && search.trim()) {
      templates = testTemplateStore.search(search);
    }

    // Apply limit if specified
    if (typeof limit === 'string') {
      const limitNum = parseInt(limit, 10);
      if (!isNaN(limitNum) && limitNum > 0) {
        templates = templates.slice(0, limitNum);
      }
    }

    // Format response with metadata
    const response = {
      success: true,
      data: templates,
      meta: {
        total: templates.length,
        featured: testTemplateStore.getFeatured().length,
        categories: [...new Set(testTemplateStore.getAll().map(t => t.category))],
        timestamp: new Date().toISOString()
      }
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching test templates:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch test templates'
    });
  }
};

/**
 * GET /api/test-templates/:id
 * Returns a specific test template by ID
 */
export const getTestTemplateById = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const template = testTemplateStore.getById(id);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: `Test template with ID ${id} not found`
      });
    }

    res.status(200).json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Error fetching test template:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch test template'
    });
  }
};

/**
 * GET /api/test-templates/categories
 * Returns all available categories
 */
export const getCategories = (req: Request, res: Response) => {
  try {
    const categories = [...new Set(testTemplateStore.getAll().map(t => t.category))];
    
    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch categories'
    });
  }
}; 