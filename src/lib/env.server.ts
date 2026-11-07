import 'server-only';
import { z } from 'zod';
const schema = z.object({
  scenario: z.enum(['success', 'empty', 'error', 'timeout']).default('success'),
  delayMs: z.coerce.number().int().min(0).max(5000).default(600),
});
export type MockOptions = z.infer<typeof schema>;
export function readMockOptions(): MockOptions {
  return schema.parse({
    scenario: process.env.HOTEL_MOCK_SCENARIO,
    delayMs: process.env.HOTEL_MOCK_DELAY_MS,
  });
}
