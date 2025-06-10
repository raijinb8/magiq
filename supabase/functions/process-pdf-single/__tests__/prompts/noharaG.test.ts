// noharaG プロンプトのテスト
import { assertEquals, assertStringIncludes } from '@std/testing/asserts'
import { describe, it } from '@std/testing/bdd'
import { NOHARA_G_PROMPT } from '../../prompts/noharaG.ts'

describe('NOHARA_G_PROMPT', () => {
  it('ファイル名を含むプロンプトを生成する', () => {
    const fileName = 'test_work_order.pdf'
    const prompt = NOHARA_G_PROMPT(fileName)

    assertStringIncludes(prompt, fileName)
    assertEquals(typeof prompt, 'string')
  })

  it('必要な指示が含まれている', () => {
    const prompt = NOHARA_G_PROMPT('test.pdf')

    // プロンプトに含まれるべき重要な指示を確認
    assertStringIncludes(prompt, '野原Ｇ住環境')
    assertStringIncludes(prompt, '抽出')
    assertStringIncludes(prompt, '発注書')
  })

  it('フォーマット指示が含まれている', () => {
    const prompt = NOHARA_G_PROMPT('test.pdf')

    // 全角・半角の指示が含まれているか確認
    assertStringIncludes(prompt, '全角')
    assertStringIncludes(prompt, '半角')
  })

  it('異なるファイル名で異なるプロンプトを生成する', () => {
    const prompt1 = NOHARA_G_PROMPT('file1.pdf')
    const prompt2 = NOHARA_G_PROMPT('file2.pdf')

    // ファイル名部分以外は同じ構造であることを確認
    assertStringIncludes(prompt1, 'file1.pdf')
    assertStringIncludes(prompt2, 'file2.pdf')

    // ファイル名を除いた部分が同じ構造であることを確認
    const basePrompt1 = prompt1.replace('file1.pdf', 'FILENAME')
    const basePrompt2 = prompt2.replace('file2.pdf', 'FILENAME')
    assertEquals(basePrompt1, basePrompt2)
  })

  it('空のファイル名でもエラーにならない', () => {
    const prompt = NOHARA_G_PROMPT('')
    assertEquals(typeof prompt, 'string')
    assertStringIncludes(prompt, '野原Ｇ住環境')
  })

  it('特殊文字を含むファイル名を正しく処理する', () => {
    const specialFileName = '作業指示書_2025-06-07_#123.pdf'
    const prompt = NOHARA_G_PROMPT(specialFileName)

    assertStringIncludes(prompt, specialFileName)
    assertEquals(typeof prompt, 'string')
  })
})
