#!/usr/bin/env node

/**
 * カバレッジレポート生成・検証スクリプト
 * CI/CDパイプラインでの使用を想定
 */

import fs from 'fs';
import path from 'path';

const COVERAGE_DIR = './coverage';
const COVERAGE_JSON = path.join(COVERAGE_DIR, 'coverage-summary.json');

/**
 * カバレッジ情報を読み込む
 */
function loadCoverageData() {
  if (!fs.existsSync(COVERAGE_JSON)) {
    console.error('❌ カバレッジファイルが見つかりません:', COVERAGE_JSON);
    process.exit(1);
  }

  try {
    const data = fs.readFileSync(COVERAGE_JSON, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ カバレッジファイルの読み込みに失敗:', error.message);
    process.exit(1);
  }
}

/**
 * 閾値チェック
 */
function checkThresholds(coverage, thresholds = { lines: 80, functions: 80, branches: 80, statements: 80 }) {
  const { total } = coverage;
  const results = {};
  let allPassed = true;

  Object.entries(thresholds).forEach(([metric, threshold]) => {
    const pct = total[metric]?.pct || 0;
    const passed = pct >= threshold;
    
    results[metric] = {
      current: pct,
      threshold,
      passed,
      status: passed ? '✅' : '❌'
    };
    
    if (!passed) allPassed = false;
  });

  return { results, allPassed };
}

/**
 * カバレッジレポートを表示
 */
function displayReport(coverage, thresholdResults) {
  console.log('\n📊 カバレッジレポート');
  console.log('='.repeat(50));
  
  const { total } = coverage;
  const { results } = thresholdResults;
  
  Object.entries(results).forEach(([metric, data]) => {
    const { current, threshold, status } = data;
    console.log(`${status} ${metric.padEnd(12)}: ${current.toFixed(2)}% (閾値: ${threshold}%)`);
  });
  
  console.log('='.repeat(50));
  
  // ファイル別で閾値を下回るものを表示
  const failedFiles = Object.entries(coverage)
    .filter(([key, value]) => {
      if (key === 'total') return false;
      return Object.entries(results).some(([metric, { threshold }]) => {
        return (value[metric]?.pct || 0) < threshold;
      });
    });

  if (failedFiles.length > 0) {
    console.log('\n⚠️  閾値を下回るファイル:');
    failedFiles.forEach(([file, data]) => {
      console.log(`  📄 ${file}`);
      Object.entries(results).forEach(([metric, { threshold }]) => {
        const pct = data[metric]?.pct || 0;
        if (pct < threshold) {
          console.log(`    ${metric}: ${pct.toFixed(2)}% (< ${threshold}%)`);
        }
      });
    });
  }
}

/**
 * GitHub Actions用の出力を生成
 */
function generateGitHubOutput(coverage, thresholdResults) {
  const { total } = coverage;
  const { results, allPassed } = thresholdResults;
  
  // GitHub Actionsの出力環境変数
  const outputs = [
    `coverage-lines=${total.lines.pct}`,
    `coverage-functions=${total.functions.pct}`,
    `coverage-branches=${total.branches.pct}`,
    `coverage-statements=${total.statements.pct}`,
    `coverage-passed=${allPassed}`,
  ];
  
  // GITHUB_OUTPUTファイルに出力
  const githubOutput = process.env.GITHUB_OUTPUT;
  if (githubOutput) {
    outputs.forEach(output => {
      fs.appendFileSync(githubOutput, `${output}\n`);
    });
    console.log('\n📤 GitHub Actions出力を生成しました');
  }
  
  // PRコメント用のマークダウンを生成
  const markdown = generateMarkdownReport(total, results);
  fs.writeFileSync(path.join(COVERAGE_DIR, 'pr-comment.md'), markdown);
  console.log('📝 PRコメント用マークダウンを生成しました');
}

/**
 * PR用マークダウンレポートを生成
 */
function generateMarkdownReport(total, results) {
  const getEmoji = (pct, threshold) => pct >= threshold ? '✅' : '❌';
  
  return `## 📊 カバレッジレポート

| メトリック | カバレッジ | 閾値 | ステータス |
|-----------|----------|------|-----------|
| Lines | ${total.lines.pct.toFixed(2)}% | ${results.lines.threshold}% | ${getEmoji(total.lines.pct, results.lines.threshold)} |
| Functions | ${total.functions.pct.toFixed(2)}% | ${results.functions.threshold}% | ${getEmoji(total.functions.pct, results.functions.threshold)} |
| Branches | ${total.branches.pct.toFixed(2)}% | ${results.branches.threshold}% | ${getEmoji(total.branches.pct, results.branches.threshold)} |
| Statements | ${total.statements.pct.toFixed(2)}% | ${results.statements.threshold}% | ${getEmoji(total.statements.pct, results.statements.threshold)} |

[📄 詳細レポート](./coverage/index.html)
`;
}

/**
 * メイン処理
 */
function main() {
  console.log('🔍 カバレッジレポートを検証中...\n');
  
  const coverage = loadCoverageData();
  const thresholdResults = checkThresholds(coverage);
  
  displayReport(coverage, thresholdResults);
  generateGitHubOutput(coverage, thresholdResults);
  
  if (thresholdResults.allPassed) {
    console.log('\n🎉 すべての閾値をクリアしました！');
    process.exit(0);
  } else {
    console.log('\n💥 一部の閾値を下回っています。テストカバレッジを改善してください。');
    process.exit(1);
  }
}

main();