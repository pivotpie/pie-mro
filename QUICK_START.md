# 🚀 Quick Start - GPT-5-nano AI Chatbot

## ✅ Installation Complete!

The OpenAI package has been installed successfully. Follow these steps to get started:

---

## Step 1: Get Your OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click **"Create new secret key"**
4. Copy the key (starts with `sk-proj-...`)

---

## Step 2: Configure API Key

Edit the `.env.local` file in the project root:

```env
VITE_OPENAI_API_KEY=sk-proj-paste_your_actual_key_here
```

**Important:** Replace `your_openai_api_key_here` with your actual key!

---

## Step 3: Restart Dev Server

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

**Critical:** Vite only reads environment variables on startup!

---

## Step 4: Test the Chatbot

1. Open your browser to http://localhost:5173 (or your dev port)
2. Click the purple bot icon 🤖 in the bottom-right corner
3. Try these queries:

### Quick Test Queries:

**Aircraft Status:**
```
Which aircraft are currently in maintenance?
```

**Workforce:**
```
How many employees are available today?
```

**Certifications:**
```
Are any licenses expiring soon?
```

**Complex Analysis:**
```
Give me a full operational status summary
```

---

## ✅ Expected Behavior

When working correctly, you should see:

1. **Bot opens** - Purple sparkle icon in header
2. **Welcome message** - "Hello! I'm your MRO Assistant..."
3. **Fast responses** - Within 2-5 seconds
4. **Intelligent answers** - Not templated, but contextual
5. **Real data** - Numbers from your actual database

---

## ⚠️ Troubleshooting

### Error: "OpenAI API is not configured"

**Fix:**
1. Check `.env.local` file exists
2. Verify API key is set correctly
3. Restart dev server with `npm run dev`

### Error: "API key error"

**Fix:**
1. Verify key is valid at https://platform.openai.com/api-keys
2. Check your OpenAI account has credits
3. Try creating a new API key

### Error: "Model error. GPT-5-nano may not be available"

**Fix:**
If GPT-5-nano isn't available yet, use GPT-4o-mini as fallback.

Edit `src/integrations/openai/client.ts`:
```typescript
export const GPT_CONFIG = {
  model: 'gpt-4o-mini', // Change this line
  // ... rest stays the same
};
```

Then restart the server.

### Slow or No Response

**Fix:**
1. Check browser console (F12) for errors
2. Verify internet connection
3. Check OpenAI status: https://status.openai.com
4. Try a simpler query first

---

## 💰 Cost Information

**GPT-5-nano is very cheap:**
- ~$0.0001 per query
- 100 queries = ~$0.01
- 1,000 queries = ~$0.11

You can safely test without worry!

---

## 📚 Full Documentation

For detailed information, see:

- **`GPT5_NANO_SETUP.md`** - Complete setup guide
- **`AI_CHATBOT_IMPLEMENTATION.md`** - Technical details
- **`.env.example`** - Environment variable template

---

## 🎯 Next Steps

Once the chatbot is working:

1. **Explore capabilities** - Try different query types
2. **Test edge cases** - Complex multi-part questions
3. **Monitor costs** - Check https://platform.openai.com/usage
4. **Customize prompts** - Edit `src/integrations/openai/client.ts`
5. **Add features** - See advanced options in setup guide

---

## ✅ Current Status

- ✅ OpenAI package installed (v4.104.0)
- ✅ Integration code ready
- ✅ Context gathering configured
- ✅ Error handling implemented
- ⏳ Awaiting API key configuration

**You're almost there!** Just add your API key and restart the server.

---

## 🆘 Need Help?

1. **Common Issues:** Check `GPT5_NANO_SETUP.md` Troubleshooting section
2. **OpenAI Support:** https://help.openai.com
3. **API Documentation:** https://platform.openai.com/docs

---

**Ready to go? Add your API key to `.env.local` and run `npm run dev`!**
