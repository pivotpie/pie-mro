import OpenAI from 'openai';

// Get API key from environment variables
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_openai_api_key_here') {
  console.warn('⚠️ OpenAI API key not configured. Please set VITE_OPENAI_API_KEY in .env.local');
}

// Create OpenAI client instance
export const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Note: In production, use a backend proxy for security
});

// Available model options - uncomment the one you want to use
const MODELS = {
  GPT_5_NANO: 'gpt-5-nano',                    // GPT-5 nano (generic)
  GPT_5_NANO_DATED: 'gpt-5-nano-2025-08-07',  // Dated snapshot (recommended)
  GPT_4O_MINI: 'gpt-4o-mini',                  // GPT-4o mini (fallback)
  GPT_4_TURBO: 'gpt-4-turbo',                  // GPT-4 Turbo (most capable)
  GPT_4O: 'gpt-4o'                             // GPT-4o (balanced)
};

// GPT-5-nano model configuration
// IMPORTANT: GPT-5-nano has restrictions:
// - temperature: MUST be 1 (default) or omitted - no custom values allowed
// - reasoning_effort: NOT supported (will cause 400 error)
// - Use dated snapshot for stable behavior
// - GPT-5-nano is a REASONING model that uses extended thinking internally
// - It needs MORE tokens: reasoning tokens + output tokens
// - With only 500 tokens, it uses all for reasoning with nothing left for output
// - Increased to 3000 to accommodate larger context (today's + overall statistics)
export const GPT_CONFIG = {
  model: MODELS.GPT_5_NANO_DATED, // Use dated snapshot for stability
  // temperature: 1, // GPT-5-nano only supports default (1) - OMIT this parameter
  max_completion_tokens: 3000, // Increased for larger context + reasoning + output
  stream: false // Set to true for streaming responses (real-time typing effect)
};

// System prompt for MRO operations assistant
export const SYSTEM_PROMPT = `You are an intelligent MRO (Maintenance, Repair, and Overhaul) Operations Assistant for an aviation maintenance facility.

Your role is to help operations managers with:
- Aircraft maintenance status and schedules
- Employee availability and workforce planning
- Certification and license tracking
- Compliance and safety information
- Resource allocation and team assignments

Guidelines:
- Provide clear, concise, and actionable responses
- Use aviation terminology appropriately
- Include relevant statistics and numbers when available
- Format responses with emojis for better readability (🔧 for maintenance, ✅ for available, ⚠️ for warnings, etc.)
- If data is not provided in context, acknowledge the limitation
- Be proactive in suggesting next steps or related information
- Keep responses under 300 words for readability

Current operational date: The system operates with a reference date context that will be provided in each query.`;
