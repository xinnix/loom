const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TEMPLATE_REPO = 'https://github.com/xinnix/loom.git';

/**
 * Download template via git clone --depth=1
 */
exports.download = ({ targetDir, templateRepo, branch }) => {
  const repo = templateRepo || TEMPLATE_REPO;

  console.log(`\n📦 正在下载 Loom 模板...`);

  const args = ['clone', '--depth=1'];
  if (branch) args.push('--branch', branch);
  args.push(repo, targetDir);

  execSync(`git ${args.join(' ')}`, { stdio: 'inherit' });

  // Remove .git — we want a fresh start
  const gitDir = path.join(targetDir, '.git');
  if (fs.existsSync(gitDir)) {
    fs.rmSync(gitDir, { recursive: true, force: true });
  }

  // Remove worktree artifacts
  const worktreesDir = path.join(targetDir, '.claude', 'worktrees');
  if (fs.existsSync(worktreesDir)) {
    fs.rmSync(worktreesDir, { recursive: true, force: true });
  }

  console.log('  ✓ 模板下载完成');
};

/**
 * Get local git repo root (for --template-path dev mode)
 */
exports.resolveLocalPath = (localPath) => {
  const resolved = path.resolve(localPath);
  // Verify it's a git repo and has init-project.sh
  const scriptPath = path.join(resolved, 'scripts', 'init-project.sh');
  if (!fs.existsSync(scriptPath)) {
    throw new Error(`Invalid template path: ${resolved} — no scripts/init-project.sh found`);
  }
  return resolved;
};
