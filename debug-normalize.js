// 调试normalize文本处理逻辑

function normalizeTextOld(text) {
  return text
    .toLowerCase()
    .replace(/\s+/g, " ") // 多个空格合并为一个
    .replace(/[^\w\s\u4e00-\u9fff]/g, " ") // 保留字母数字中文和空格，其他字符转为空格
    .trim();
}

function normalizeTextNew(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s\u4e00-\u9fff]/g, " ") // 保留字母数字中文和空格，其他字符转为空格
    .replace(/\s+/g, " ") // 多个空格合并为一个（移到最后，避免产生意外的词汇组合）
    .trim();
}

function normalizeTextFixed(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s\u4e00-\u9fff]+/g, " ") // 连续的非字母数字中文字符替换为单个空格
    .replace(/\s+/g, " ") // 多个空格合并为一个
    .trim();
}

const testTexts = [
  "Re: UGREEN DH4300 Plus Relaunch Campaign – Limited-Time 20% Off!",
  "Limited-Time 20% Off!",
  "20% Off!",
  "Off!",
  "! Hi",
  "a!b",
  "word1-word2",
  "word1--word2",
];

console.log("=== 文本标准化测试 ===\n");

for (const text of testTexts) {
  console.log(`原文: "${text}"`);
  console.log(`旧方法: "${normalizeTextOld(text)}"`);
  console.log(`新方法: "${normalizeTextNew(text)}"`);
  console.log(`修复版: "${normalizeTextFixed(text)}"`);
  
  // 检查是否包含 "oppo"
  const oldResult = normalizeTextOld(text);
  const newResult = normalizeTextNew(text);
  const fixedResult = normalizeTextFixed(text);
  
  if (oldResult.includes("oppo")) {
    console.log(`❌ 旧方法产生了 "oppo": "${oldResult}"`);
  }
  if (newResult.includes("oppo")) {
    console.log(`❌ 新方法产生了 "oppo": "${newResult}"`);
  }
  if (fixedResult.includes("oppo")) {
    console.log(`❌ 修复版产生了 "oppo": "${fixedResult}"`);
  }
  
  console.log();
}