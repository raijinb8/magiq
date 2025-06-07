// katouBeniyaIkebukuro/misawa プロンプトのテスト
import { assertEquals, assertStringIncludes } from '@std/testing/asserts'
import { describe, it } from '@std/testing/mod'
import { KATOUBENIYA_MISAWA_PROMPT } from '../../../prompts/katouBeniyaIkebukuro/misawa.ts'

describe('KATOUBENIYA_MISAWA_PROMPT', () => {
  it('ファイル名を含むプロンプトを生成する', () => {
    const fileName = 'misawa_work_order.pdf'
    const prompt = KATOUBENIYA_MISAWA_PROMPT(fileName)
    
    assertStringIncludes(prompt, fileName)
    assertEquals(typeof prompt, 'string')
  })

  it('必要な指示が含まれている', () => {
    const prompt = KATOUBENIYA_MISAWA_PROMPT('test.pdf')
    
    // プロンプトに含まれるべき重要な指示を確認
    assertStringIncludes(prompt, '加藤ベニヤ池袋')
    assertStringIncludes(prompt, 'ミサワホーム')
    assertStringIncludes(prompt, 'データ抽出')
  })

  it('フォーマット指示が含まれている', () => {
    const prompt = KATOUBENIYA_MISAWA_PROMPT('test.pdf')
    
    // 全角・半角の指示が含まれているか確認
    assertStringIncludes(prompt, '全角')
    assertStringIncludes(prompt, '半角')
  })

  it('異なるファイル名で異なるプロンプトを生成する', () => {
    const prompt1 = KATOUBENIYA_MISAWA_PROMPT('order1.pdf')
    const prompt2 = KATOUBENIYA_MISAWA_PROMPT('order2.pdf')
    
    // ファイル名部分以外は同じ構造であることを確認
    assertStringIncludes(prompt1, 'order1.pdf')
    assertStringIncludes(prompt2, 'order2.pdf')
    
    // ファイル名を除いた部分が同じ構造であることを確認
    const basePrompt1 = prompt1.replace('order1.pdf', 'FILENAME')
    const basePrompt2 = prompt2.replace('order2.pdf', 'FILENAME')
    assertEquals(basePrompt1, basePrompt2)
  })

  it('空のファイル名でもエラーにならない', () => {
    const prompt = KATOUBENIYA_MISAWA_PROMPT('')
    assertEquals(typeof prompt, 'string')
    assertStringIncludes(prompt, '加藤ベニヤ池袋')
    assertStringIncludes(prompt, 'ミサワホーム')
  })

  it('特殊文字を含むファイル名を正しく処理する', () => {
    const specialFileName = '作業指示書_加藤ベニヤ_2025-06-07_#456.pdf'
    const prompt = KATOUBENIYA_MISAWA_PROMPT(specialFileName)
    
    assertStringIncludes(prompt, specialFileName)
    assertEquals(typeof prompt, 'string')
  })

  it('日本語ファイル名を正しく処理する', () => {
    const japaneseFileName = 'ミサワホーム作業指示書.pdf'
    const prompt = KATOUBENIYA_MISAWA_PROMPT(japaneseFileName)
    
    assertStringIncludes(prompt, japaneseFileName)
    assertEquals(typeof prompt, 'string')
  })
})