import { api } from "@/lib/api";

/**
 * Ask the backend to post any due recurring transactions and advance their
 * schedules. Returns the number of transactions created so the UI can toast it.
 */
export async function materializeRecurring(): Promise<number> {
  const res = await api<{ created: number }>(
    "/recurring-transactions/materialize",
    { method: "POST" },
  );
  return res?.created ?? 0;
}
