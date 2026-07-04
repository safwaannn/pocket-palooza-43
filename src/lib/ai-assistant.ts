import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/supabase/auth-middleware";

export const getAIResponse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: { query: string }) => input)
  .handler(async ({ context, data: { query } }) => {
    const { supabase, userId } = context;
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!apiKey) {
      return {
        error: "AI Assistant is not configured. Please add GOOGLE_GENERATIVE_AI_API_KEY to your environment variables.",
      };
    }

    try {
      // 1. Fetch context data
      const [
        { data: transactions },
        { data: budgets },
        { data: categories },
      ] = await Promise.all([
        supabase
          .from("transactions")
          .select("*, categories(name)")
          .order("date", { ascending: false })
          .limit(20),
        supabase
          .from("budgets")
          .select("*, categories(name)")
          .limit(10),
        supabase
          .from("categories")
          .select("*"),
      ]);

      // 2. Prepare the prompt
      const contextStr = `
User ID: ${userId}
Recent Transactions:
${transactions?.map(t => `- ${t.date}: ${t.categories?.name ?? 'Uncategorized'} (${t.type}): ₹${t.amount} - ${t.note ?? ''}`).join('\n')}

Active Budgets:
${budgets?.map(b => `- ${b.categories?.name}: limit ₹${b.limit_amount} for ${b.month_year}`).join('\n')}

Categories:
${categories?.map(c => `- ${c.name} (${c.type})`).join('\n')}
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

      // 3. Call Gemini API
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        const errData = await response.json();
        console.error("Gemini API error:", errData);
        throw new Error("Failed to get response from AI model");
      }

      const result = await response.json();
      const aiText = result.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't process that.";

      return { text: aiText };
    } catch (error) {
      console.error("AI Assistant Error:", error);
      return {
        error: "Something went wrong while talking to the AI assistant. Please try again later.",
      };
    }
  });
