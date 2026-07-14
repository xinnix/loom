#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const { askQuestions, askProjectName } = require('./src/cli');
const { download, resolveLocalPath } = require('./src/download');
const { transform } = require('./src/transform');

// ---- Help ----
function showHelp() {
  console.log(`
  🚀  Create Loom App  v${require('./package.json').version}
  Scaffold a full-stack project with NestJS + tRPC + Refine + UniApp

  USAGE
    $ npx create-loom <project-name> [options]

  OPTIONS
    --scope <scope>         Package scope (@), default = project name
    --db <name>             Database name, default = project name
    --brand <name>          Brand name, default = project name
    --api-domain <url>      Production API domain (optional)
    --apps <list>           Comma-separated: api,admin,web,landing,miniapp
    -y, --yes               Skip prompts, use all defaults

    --template-path <dir>   Use local template (for development)
    --branch <branch>       Template git branch, default = main

    -h, --help              Show this help

  EXAMPLES
    $ npx create-loom my-app
    $ npx create-loom my-app --yes
    $ npx create-loom my-app --scope myco --db myco_db --brand MyCo
    $ npx create-loom my-app --apps api,admin,web
`);
}

// ---- Parse CLI args ----
function parseArgs(argv) {
  const args = { apps: [] };
  let i = 0;

  while (i < argv.length) {
    const arg = argv[i];
    switch (arg) {
      case '-h':
      case '--help':
        args.help = true;
        i++;
        break;
      case '-y':
      case '--yes':
        args.yes = true;
        i++;
        break;
      case '--scope':
        args.scope = argv[++i];
        i++;
        break;
      case '--db':
        args.db = argv[++i];
        i++;
        break;
      case '--brand':
        args.brand = argv[++i];
        i++;
        break;
      case '--api-domain':
        args.apiDomain = argv[++i];
        i++;
        break;
      case '--apps':
        args.apps = (argv[++i] || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        i++;
        break;
      case '--template-path':
        args.templatePath = argv[++i];
        i++;
        break;
      case '--branch':
        args.branch = argv[++i];
        i++;
        break;
      default:
        if (arg && !arg.startsWith('-')) {
          args.projectName = arg;
        }
        i++;
        break;
    }
  }

  return args;
}

// ---- Main ----
async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    showHelp();
    process.exit(0);
  }

  console.log(`
╔══════════════════════════════════════════╗
║     🚀  Create Loom App  v${require('./package.json').version}        ║
║     Full-stack scaffold                   ║
╚══════════════════════════════════════════╝
`);

  // ---- Step 1: Get project name ----
  let projectName = args.projectName;
  if (!projectName) {
    if (args.yes) {
      projectName = 'my-app';
    } else {
      projectName = await askProjectName();
    }
  }

  // ---- Step 2: Interactive prompts (if not --yes) ----
  let answers;
  if (args.yes) {
    answers = {
      projectName,
      scope: args.scope || projectName,
      db: args.db || projectName,
      brand: args.brand || projectName,
      apiDomain: args.apiDomain || '',
      apps: args.apps.length > 0 ? args.apps : ['api', 'admin'],
      install: true,
      gitInit: true,
    };
  } else {
    answers = await askQuestions({
      projectName,
      scope: args.scope,
      db: args.db,
      brand: args.brand,
      apiDomain: args.apiDomain,
    });
  }

  console.log(`
  📋  Summary
     ─────────────────────────────────
     Project   : ${answers.projectName}
     Scope     : @${answers.scope}
     Database  : ${answers.db}
     Brand     : ${answers.brand}
     API Domain: ${answers.apiDomain || '(none)'}
     Modules   : ${answers.apps.join(', ')}
     Install   : ${answers.install ? 'yes' : 'no'}
     Git init  : ${answers.gitInit ? 'yes' : 'no'}
  ─────────────────────────────────
  `);

  // ---- Step 3: Download template ----
  const targetDir = path.resolve(process.cwd(), answers.projectName);

  if (fs.existsSync(targetDir)) {
    console.error(`\n  ✗ 目录已存在: ${targetDir}`);
    process.exit(1);
  }

  if (args.templatePath) {
    // Local path — copy instead of clone
    const src = resolveLocalPath(args.templatePath);
    console.log(`\n📦 正在从本地复制模板: ${src}`);
    execSync(`cp -R "${src}" "${targetDir}"`, { stdio: 'inherit' });
    const gitDir = path.join(targetDir, '.git');
    if (fs.existsSync(gitDir)) {
      fs.rmSync(gitDir, { recursive: true, force: true });
    }
  } else {
    download({ targetDir, branch: args.branch });
  }

  // ---- Step 4: Transform (init-project.sh + post-processing) ----
  transform({
    targetDir,
    projectName: answers.projectName,
    scope: answers.scope,
    db: answers.db,
    brand: answers.brand,
    apiDomain: answers.apiDomain,
    apps: answers.apps,
  });

  // ---- Step 5: pnpm install ----
  if (answers.install) {
    console.log(`\n📥 正在安装依赖...`);
    execSync('pnpm install', { cwd: targetDir, stdio: 'inherit' });
  }

  // ---- Step 6: git init ----
  if (answers.gitInit) {
    console.log(`\n🔗 正在初始化 git...`);
    execSync('git init', { cwd: targetDir, stdio: 'inherit' });
    execSync('git add .', { cwd: targetDir, stdio: 'inherit' });
    try {
      execSync('git commit -m "chore: initial scaffold from create-loom"', {
        cwd: targetDir,
        stdio: 'inherit',
      });
    } catch {
      // git commit may fail if there are no changes — ignore
    }
  }

  // ---- Step 7: Done ----
  console.log(`
╔══════════════════════════════════════════╗
║   ✅  ${answers.projectName} 创建完成！          ║
╚══════════════════════════════════════════╝

  cd ${answers.projectName}
  cp .env.example .env
  /db-migrate     # 建库 + 迁移 + Seed
  /start-api      # 启动后端 API
  /start-admin    # 启动管理后台

  更多命令请查阅 CLAUDE.md
`);
}

main().catch((err) => {
  console.error(`\n  ✗ 创建失败: ${err.message}`);
  process.exit(1);
});
