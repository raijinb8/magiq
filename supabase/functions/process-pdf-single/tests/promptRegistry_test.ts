import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts"
import { PROMPT_REGISTRY, getPrompt } from '../promptRegistry.ts'

Deno.test("PROMPT_REGISTRY - NOHARA_G entry exists", () => {
  const entry = PROMPT_REGISTRY['NOHARA_G']
  assertExists(entry)
  assertExists(entry.companyName)
  assertEquals(entry.companyName, '野原G住環境')
})

Deno.test("PROMPT_REGISTRY - KATOUBENIYA_MISAWA entry exists", () => {
  const entry = PROMPT_REGISTRY['KATOUBENIYA_MISAWA']
  assertExists(entry)
  assertExists(entry.version)
  assertEquals(entry.version, 'V20250526')
})

Deno.test("getPrompt - returns correct prompt for valid companyId", () => {
  const prompt = getPrompt('NOHARA_G')
  assertExists(prompt)
  assertEquals(prompt?.companyName, '野原G住環境')
})

Deno.test("getPrompt - returns null for invalid companyId", () => {
  const prompt = getPrompt('INVALID_COMPANY')
  assertEquals(prompt, null)
})

Deno.test("getPrompt - handles errors gracefully", () => {
  try {
    const prompt = getPrompt('')
    assertEquals(prompt, null)
  } catch (error) {
    assertEquals((error as Error).message, 'Invalid company ID')
  }
})