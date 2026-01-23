# GPT-5-nano AI Chatbot Setup Guide

This guide explains how to configure and use the GPT-5-nano powered AI Operations Assistant in your Pie-MRO application.

---

## 🎯 What Changed?

The AI Chatbot has been upgraded from **keyword-based matching** to **GPT-5-nano powered AI** that:
- Uses real-time operational data from your database
- Understands natural language queries
- Provides intelligent, context-aware responses
- Supports follow-up questions and complex queries

---

## 📋 Prerequisites

1. **OpenAI Account** - Sign up at https://platform.openai.com
2. **API Key** - Generate from https://platform.openai.com/api-keys
3. **Credits** - Ensure your OpenAI account has credits (GPT-5-nano is very cheap: $0.05/1M input, $0.40/1M output)

---

## 🚀 Quick Start

### Step 1: Install Dependencies

```bash
cd "C:\Users\Book 3\Desktop\Pivot Pie Projects\Pie-MRO"
npm install
```

This will install the `openai` package (version ^4.73.1) that was added to `package.json`.

### Step 2: Configure API Key

1. Open the `.env.local` file in the project root (already created for you)
2. Replace `your_openai_api_key_here` with your actual OpenAI API key:

```env
VITE_OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxx
```

**Important:**
- Do NOT commit this file to git (already in .gitignore)
- The key must start with `VITE_` for Vite to expose it to the browser
- Never share your API key publicly

### Step 3: Restart Development Server

```bash
npm run dev
```

**Important:** You MUST restart the dev server after changing environment variables. Vite only reads .env files on startup.

### Step 4: Test the Chatbot

1. Open the application in your browser
2. Click the purple bot icon (🤖) in the bottom-right corner
3. Try these queries:
   - "Which aircraft are currently grounded?"
   - "How many employees are available today?"
   - "Are any licenses expiring soon?"
   - "Give me a summary of operations"
   - "What should I prioritize today?"

---

## 🏗️ Architecture Overview

### Hybrid AI + Database Approach

```
User Query → Context Gathering → GPT-5-nano → Intelligent Response
                    ↓
         [Real-time Database Data]
         • Aircraft status
         • Employee availability
         • Certification expiries
         • Current date context
```

### Components

#### 1. OpenAI Client (`src/integrations/openai/client.ts`)
- Initializes OpenAI SDK
- Configures GPT-5-nano model settings
- Defines the system prompt for MRO operations

#### 2. Context Gathering (`src/integrations/openai/contextGathering.ts`)
- Fetches real-time data from Supabase
- Formats operational context for GPT
- Provides aircraft, workforce, and certification status

#### 3. AI Chatbot (`src/components/workforce/AIChatbot.tsx`)
- User interface for chat
- Integrates OpenAI API calls
- Handles errors gracefully
- Displays streaming responses

---

## 🔧 Configuration Options

### Model Selection

Edit `src/integrations/openai/client.ts`:

```typescript
export const GPT_CONFIG = {
  model: 'gpt-5-nano', // Options: gpt-5-nano, gpt-4o-mini, gpt-4-turbo
  temperature: 0.7,    // 0.0-2.0 (lower = more focused, higher = more creative)
  max_tokens: 500,     // Max response length
  stream: false        // Set to true for streaming responses
};
```

**Model Options:**
- `gpt-5-nano` - Fastest, cheapest ($0.05/$0.40 per 1M tokens) - **Recommended**
- `gpt-4o-mini` - Fallback if gpt-5-nano not available
- `gpt-4-turbo` - More capable, higher cost

### System Prompt Customization

Edit `SYSTEM_PROMPT` in `src/integrations/openai/client.ts` to adjust:
- AI personality and tone
- Domain expertise level
- Response format preferences
- Specific instructions for your operations

### Context Data

Modify `src/integrations/openai/contextGathering.ts` to:
- Add more data sources (training, hangars, etc.)
- Change query filters
- Adjust data formatting

---

## 💡 Usage Examples

### Example Queries

**Aircraft Maintenance:**
- "Which aircraft are in maintenance right now?"
- "How many A-checks are scheduled this week?"
- "What's the status of G-FVWF?"

**Workforce Planning:**
- "Do we have enough mechanics available?"
- "Who's on leave this week?"
- "What's our workforce utilization rate?"

**Compliance & Certifications:**
- "Are any licenses expiring this month?"
- "Which employees need recertification?"
- "Show me critical expiring authorizations"

**Operational Insights:**
- "Give me a daily operations summary"
- "What are the top priorities today?"
- "Are we meeting our maintenance schedule?"

**Complex Queries:**
- "We have an urgent A350 C-check. Who should I assign?"
- "Explain our current capacity constraints"
- "What impact will the upcoming leave requests have?"

---

## 🛡️ Security Best Practices

### ⚠️ Important Security Notes

1. **API Key Protection**
   - Never commit `.env.local` to version control
   - Rotate keys regularly
   - Use separate keys for development and production

2. **Browser Security**
   - Current setup uses `dangerouslyAllowBrowser: true`
   - This is acceptable for development and internal tools
   - **For production:** Implement a backend proxy to hide the API key

3. **Production Deployment**
   ```typescript
   // Recommended: Create a backend endpoint
   POST /api/chat
   {
     "query": "user question",
     "context": {...}
   }
   // Server calls OpenAI, returns response
   ```

### Production-Ready Setup

For production deployment, consider:

1. **Backend Proxy** (Node.js example):
```javascript
// server.js
app.post('/api/chat', async (req, res) => {
  const { query, context } = req.body;

  const completion = await openai.chat.completions.create({
    model: 'gpt-5-nano',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'system', content: context },
      { role: 'user', content: query }
    ]
  });

  res.json({ response: completion.choices[0].message.content });
});
```

2. **Rate Limiting**
   - Implement per-user rate limits
   - Track token usage
   - Set budget alerts in OpenAI dashboard

3. **Monitoring**
   - Log all queries for auditing
   - Track costs and usage
   - Monitor response times

---

## 🐛 Troubleshooting

### Error: "OpenAI API is not configured"

**Solution:**
1. Check `.env.local` exists and has correct key
2. Restart dev server (`npm run dev`)
3. Verify key starts with `VITE_` prefix

### Error: "API key error"

**Solution:**
1. Verify API key is valid at https://platform.openai.com/api-keys
2. Check key has sufficient credits
3. Ensure key has correct permissions

### Error: "Model error. GPT-5-nano may not be available"

**Solution:**
If GPT-5-nano is not yet available in your OpenAI account, use a fallback:

Edit `src/integrations/openai/client.ts`:
```typescript
export const GPT_CONFIG = {
  model: 'gpt-4o-mini', // Use this instead
  // ... rest of config
};
```

### Error: "Rate limit reached"

**Solution:**
1. Wait 1 minute before retrying
2. Check your OpenAI account usage limits
3. Upgrade your OpenAI plan if needed

### No Response / Blank Messages

**Solution:**
1. Open browser DevTools (F12)
2. Check Console tab for errors
3. Check Network tab for failed requests
4. Verify Supabase connection is working

### Slow Responses

**Optimization:**
1. Reduce `max_tokens` in config (currently 500)
2. Enable streaming: `stream: true` in config
3. Simplify context gathering queries
4. Use caching for frequently requested data

---

## 💰 Cost Estimation

### GPT-5-nano Pricing
- **Input:** $0.05 per 1M tokens (~$0.00005 per 1000 tokens)
- **Output:** $0.40 per 1M tokens (~$0.0004 per 1000 tokens)

### Typical Query Costs

| Query Type | Input Tokens | Output Tokens | Cost per Query |
|------------|--------------|---------------|----------------|
| Simple aircraft status | ~800 | ~150 | ~$0.0001 |
| Workforce summary | ~900 | ~200 | ~$0.00012 |
| Complex analysis | ~1200 | ~400 | ~$0.00022 |

**Monthly Estimate (1000 queries/day):**
- 30,000 queries × $0.00015 avg = **~$4.50/month**

GPT-5-nano is extremely cost-effective for production use!

---

## 📊 Monitoring & Analytics

### Usage Tracking

View your usage at: https://platform.openai.com/usage

Track:
- Total requests per day
- Token consumption
- Cost breakdown by model
- Error rates

### Application Logs

The chatbot logs key events to console:
```javascript
console.log('Gathering operational context...');
console.log('Sending query to GPT-5-nano...');
console.log('GPT-5-nano response received');
```

Enable verbose logging by adding to `client.ts`:
```typescript
export const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
  verbose: true // Add this for detailed logs
});
```

---

## 🚀 Advanced Features

### Streaming Responses

For real-time typing effect:

```typescript
// In client.ts
export const GPT_CONFIG = {
  stream: true, // Enable streaming
  // ...
};

// In AIChatbot.tsx processQuery function
const stream = await openai.chat.completions.create({
  ...GPT_CONFIG,
  stream: true,
  messages: [...]
});

let response = '';
for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content || '';
  response += content;
  // Update message in real-time
  setMessages(prev => {
    const last = prev[prev.length - 1];
    if (last.role === 'assistant') {
      return [...prev.slice(0, -1), { ...last, content: response }];
    }
    return prev;
  });
}
```

### Function Calling

Add structured data retrieval:

```typescript
const completion = await openai.chat.completions.create({
  model: 'gpt-5-nano',
  messages: [...],
  functions: [
    {
      name: 'get_aircraft_details',
      description: 'Get detailed information about a specific aircraft',
      parameters: {
        type: 'object',
        properties: {
          registration: { type: 'string' }
        },
        required: ['registration']
      }
    }
  ]
});
```

### Conversation Memory

Store chat history for context:

```typescript
// Keep last 10 messages for context
const conversationHistory = messages.slice(-10).map(m => ({
  role: m.role,
  content: m.content
}));

const completion = await openai.chat.completions.create({
  messages: [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'system', content: contextString },
    ...conversationHistory
  ]
});
```

---

## 📚 Additional Resources

### OpenAI Documentation
- **API Reference:** https://platform.openai.com/docs/api-reference
- **GPT-5 Guide:** https://platform.openai.com/docs/guides/latest-model
- **Best Practices:** https://platform.openai.com/docs/guides/production-best-practices

### Project Files
- **OpenAI Client:** `src/integrations/openai/client.ts`
- **Context Gathering:** `src/integrations/openai/contextGathering.ts`
- **Chatbot Component:** `src/components/workforce/AIChatbot.tsx`
- **Environment Template:** `.env.example`

### Support
- **OpenAI Support:** https://help.openai.com
- **Community Forum:** https://community.openai.com

---

## ✅ Checklist

Before deploying:

- [ ] OpenAI API key added to `.env.local`
- [ ] Dev server restarted after env changes
- [ ] Tested chatbot with sample queries
- [ ] Verified Supabase data is accessible
- [ ] Checked OpenAI account has sufficient credits
- [ ] Set up usage alerts in OpenAI dashboard
- [ ] Reviewed security considerations
- [ ] Configured rate limiting (if needed)
- [ ] Tested error scenarios
- [ ] Documented any custom modifications

---

## 🎉 You're All Set!

Your AI Chatbot is now powered by GPT-5-nano with real-time operational data. Users can ask natural language questions and get intelligent, context-aware responses about aircraft maintenance, workforce availability, and certification compliance.

**Next Steps:**
1. Add your OpenAI API key to `.env.local`
2. Run `npm install` to install dependencies
3. Restart the dev server
4. Test the chatbot!

For questions or issues, check the Troubleshooting section above.
