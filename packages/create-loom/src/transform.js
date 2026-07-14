const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Run init-project.sh to replace identity markers.
 * Then patch files the script intentionally skips.
 */
exports.transform = ({ targetDir, projectName, scope, db, brand, apiDomain, apps }) => {
  const cwd = targetDir;
  const appsStr = apps.join(' ');

  console.log(`\n🔧 正在初始化项目...`);

  // Run init-project.sh
  execSync(
    `bash scripts/init-project.sh "${projectName}" "${scope}" "${db}" "${brand}" "${apiDomain || ''}" "${appsStr}"`,
    { cwd, stdio: 'inherit' },
  );

  // ---- Post-processing: patch files skipped by init-project.sh ----

  // 1. CLAUDE.md title
  const claudeMd = path.join(targetDir, 'CLAUDE.md');
  if (fs.existsSync(claudeMd)) {
    let content = fs.readFileSync(claudeMd, 'utf-8');
    const updated = content
      .replace(/^# Loom — /, `# ${brand} — `)
      .replace(/\*\*Database name\*\*：loom/, `**Database name**：${db}`);
    if (content !== updated) {
      fs.writeFileSync(claudeMd, updated);
      console.log('  ✓ CLAUDE.md 已更新');
    }
  }

  // 2. .env.example DATABASE_URL
  const envExample = path.join(targetDir, '.env.example');
  if (fs.existsSync(envExample)) {
    let content = fs.readFileSync(envExample, 'utf-8');
    if (content.includes('database_name')) {
      content = content.replace('database_name', db);
      fs.writeFileSync(envExample, content);
    }
  }

  // 3. README.md — replace loom git clone example if present
  const readme = path.join(targetDir, 'README.md');
  if (fs.existsSync(readme)) {
    let content = fs.readFileSync(readme, 'utf-8');
    const updated = content.replace(/Xinnix\/loom/g, `${scope}/${projectName}`);
    if (content !== updated) {
      fs.writeFileSync(readme, updated);
      console.log('  ✓ README.md 已更新');
    }
  }

  console.log('  ✓ 项目初始化完成');
};
