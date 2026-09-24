/**
 * ============================================================================
 * AI ASSISTANT — client for the backend's Paisa Assistant endpoint
 * ============================================================================
 *
 * The actual Gemini call, API key, and DB context-gathering all live on the
 * Express backend (backend/controllers/aiController.js), behind auth. This
 * file is a thin client wrapper, same shape as every other function in
 * src/lib — no server code, no secrets, on the frontend.
 */
import { api } from "@/lib/api";

export async function getAIResponse(query: string): Promise<{ text: string }> {
  return api<{ text: string }>("/ai/ask", { method: "POST", body: { query } });
}
