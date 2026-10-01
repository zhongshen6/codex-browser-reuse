const { loadDeployment } = require("./deployment");
// Explicit overrides include their mount; defaults follow project configuration.
const baseUrl = (process.env.CODEX_BROWSER_BRIDGE_URL ||
  `http://127.0.0.1:4387${loadDeployment(__dirname).basePath}`).replace(/\/$/, "");
const reset = process.argv.includes("--reset");

async function main() {
  if (reset) {
    const response = await fetch(`${baseUrl}/__bridge/stats/reset`, { method: "POST" });
    if (!response.ok) throw new Error(`reset failed: ${response.status}`);
    console.log("桥接请求统计已清空。");
    return;
  }
  const response = await fetch(`${baseUrl}/__bridge/stats`, { cache: "no-store" });
  if (!response.ok) throw new Error(`stats failed: ${response.status}`);
  const stats = await response.json();
  console.log(`统计开始: ${new Date(stats.startedAt).toLocaleString()}`);
  console.log(`请求总数: ${stats.total}`);
  console.log("");
  console.log("分类:");
  for (const [category, value] of Object.entries(stats.byCategory || {})) {
    console.log(
      `  ${category.padEnd(18)} ${String(value.count).padStart(6)} ` +
      `收到 ${String(value.received).padStart(6)} ` +
      `成功 ${String(value.success).padStart(6)} ` +
      `失败 ${String(value.errors).padStart(6)} ` +
      `空返回 ${String(value.empty).padStart(6)}`
    );
  }
  console.log("");
  console.log("请求明细:");
  const rows = Object.values(stats.byKey || {})
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
  for (const row of rows) {
    console.log(
      `${String(row.category).padEnd(18)} ${String(row.kind).padEnd(15)} ` +
      `${String(row.count).padStart(5)} 次  ${row.key}` +
      `${row.empty ? " [空返回]" : ""}`
    );
  }
  console.log("");
  console.log(`日志: ${stats.logPath}`);
}

main().catch(error => {
  console.error(error.message || error);
  process.exitCode = 1;
});
