import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts"
import { PROMPT_REGISTRY } from '../promptRegistry.ts'
import { NOHARA_G_PROMPT } from '../prompts/noharaG.ts'
import { KATOUBENIYA_MISAWA_PROMPT } from '../prompts/katouBeniyaIkebukuro/misawa.ts'

Deno.test("NOHARA_G_PROMPT function returns valid prompt", () => {
  const fileName = "test.pdf"
  const prompt = NOHARA_G_PROMPT(fileName)
  assertExists(prompt)
  assertEquals(typeof prompt, 'string')
  assertEquals(prompt.includes(fileName), true)
})

Deno.test("KATOUBENIYA_MISAWA_PROMPT function returns valid prompt", () => {
  const fileName = "test.pdf"
  const prompt = KATOUBENIYA_MISAWA_PROMPT(fileName)
  assertExists(prompt)
  assertEquals(typeof prompt, 'string')
  assertEquals(prompt.includes(fileName), true)
})

Deno.test("All registry entries have valid prompt functions", () => {
  for (const [key, entry] of Object.entries(PROMPT_REGISTRY)) {
    if (entry) {
      assertExists(entry.promptFunction)
      assertEquals(typeof entry.promptFunction, 'function')
    }
  }
})