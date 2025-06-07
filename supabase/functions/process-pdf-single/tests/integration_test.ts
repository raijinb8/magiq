import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts"
import { PROMPT_REGISTRY, getPrompt } from '../promptRegistry.ts'
import type { PromptFunction } from '../promptRegistry.ts'

Deno.test("Integration - getPrompt returns working prompt function", () => {
  const entry = getPrompt('NOHARA_G')
  assertExists(entry)
  assertExists(entry.promptFunction)
  
  const result = entry.promptFunction("test_file.pdf")
  assertExists(result)
  assertEquals(typeof result, 'string')
})

Deno.test("Integration - all prompts follow PromptFunction interface", () => {
  const companies = ['NOHARA_G', 'KATOUBENIYA_MISAWA']
  
  for (const companyId of companies) {
    const entry = getPrompt(companyId)
    assertExists(entry)
    
    const promptResult = entry.promptFunction("sample.pdf")
    assertEquals(typeof promptResult, 'string')
    assertEquals(promptResult.length > 0, true)
  }
})