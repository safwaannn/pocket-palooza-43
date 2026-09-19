/**
 * ============================================================================
 * AI CONTROLLER — the Paisa Assistant (Gemini-backed finance Q&A)
 * ============================================================================
 *
 * Moved here from the frontend, which used to call Gemini from a TanStack
 * Start server function. That put a secret API key and an external network
 * call inside the frontend project. The frontend is client-only now, so this
 * lives in the one place that already holds request-scoped auth: behind
 * `authController.protect`, using `req.user` set by that middleware.
 */
const Transaction = require('./../models/transactionModel');
const Budget = require('./../models/budgetModel');
const Category = require('./../models/categoryModel');
const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');

exports.ask = catchAsync(async (req, res, next) => {
  const query = req.body.query;
  if (!query || typeof query !== 'string') {
    return next(new AppError('Please provide a query', 400));
  }

  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    return res.status(200).json({
      status: 'success',
      data: {
        text:
          'AI Assistant is not configured. Please add GOOGLE_GENERATIVE_AI_API_KEY to the backend config.env.',
      },
    });
  }

  // Gather recent context straight from the DB, scoped to this user — no
  // loopback HTTP call needed since we're already inside the API process.
  const [transactions, budgets, categories] = await Promise.all([
    Transaction.find({ user: req.user.id })
      .sort('-date')
      .limit(20)
      .populate('category', 'name type'),
    Budget.find({ user: req.user.id }).limit(10).populate('category', 'name type'),
    Category.find({ $or: [{ user: req.user.id }, { user: null }] }),
  ]);

  const contextStr = `
Recent Transactions:
${transactions
  .map(
    (t) =>
      `- ${String(t.date).slice(0, 10)}: ${t.category?.name ?? 'Uncategorized'} (${t.type}): ₹${t.amount} - ${t.note ?? ''}`,
  )
  .join('\n')}

Active Budgets:
${budgets
  .map((b) => `- ${b.category?.name ?? 'Category'}: limit ₹${b.limit_amount} for ${b.month_year}`)
  .join('\n')}

Categories:
${categories.map((c) => `- ${c.name} (${c.type})`).join('\n')}
  `.trim();

  const prompt = `
You are Paisa Assistant, a helpful and concise personal finance expert.
The user is asking a question about their finances in the Paisa app.
Base your answers on the following user data:

${contextStr}

Guidelines:
- Be concise and friendly.
- Use ₹ (INR) for currency.
- If you don't have enough data to answer, say so politely.
- Do not mention technical details like IDs or database tables.
- If they ask to do something (like add a transaction), explain that you are a read-only assistant for now.

User Query: ${query}
  `.trim();

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    },
  );

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    console.error('Gemini API error:', errData);
    return next(new AppError('Failed to get a response from the AI model', 502));
  }

  const result = await response.json();
  const text =
    result.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't process that.";

  res.status(200).json({ status: 'success', data: { text } });
});
