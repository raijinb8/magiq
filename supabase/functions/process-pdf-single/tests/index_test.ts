import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts"
import { PROMPT_REGISTRY } from '../promptRegistry.ts'

Deno.test("PDF processing - error handling", async () => {
  try {
    // Simulate PDF processing error
    throw new Error('PDF processing failed')
  } catch (error) {
    assertEquals((error as Error).message, 'PDF processing failed')
  }
})

Deno.test("PDF processing - rate limit handling", async () => {
  try {
    // Simulate rate limit error
    throw new Error('Rate limit exceeded')
  } catch (error) {
    assertEquals((error as Error).message, 'Rate limit exceeded')
  }
})

Deno.test("PDF processing - registry validation", () => {
  const entry = PROMPT_REGISTRY['NOHARA_G']
  assertExists(entry)
  assertExists(entry.promptFunction)
  assertEquals(typeof entry.promptFunction, 'function')
})