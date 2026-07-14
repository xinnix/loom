const { prompt } = require('enquirer');

exports.askQuestions = async (defaults) => {
  const answers = await prompt([
    {
      type: 'input',
      name: 'projectName',
      message: 'Project name',
      initial: defaults.projectName || 'my-app',
      required: true,
      validate: (v) =>
        /^[a-z0-9_-]+$/.test(v) ? true : 'Only lowercase letters, numbers, hyphens, underscores',
    },
    {
      type: 'input',
      name: 'scope',
      message: 'Package scope (@)',
      initial: defaults.scope || defaults.projectName || 'myapp',
    },
    {
      type: 'input',
      name: 'db',
      message: 'Database name',
      initial: defaults.db || defaults.projectName || 'myapp',
    },
    {
      type: 'input',
      name: 'brand',
      message: 'Brand name',
      initial: defaults.brand || 'My App',
    },
    {
      type: 'input',
      name: 'apiDomain',
      message: 'Production API domain (optional)',
      initial: defaults.apiDomain || '',
    },
    {
      type: 'multiselect',
      name: 'apps',
      message: 'Enable modules',
      hint: 'Space to toggle, Enter to confirm',
      choices: [
        { name: 'api', message: 'API Backend', checked: true },
        { name: 'admin', message: 'Admin Dashboard', checked: true },
        { name: 'web', message: 'Web Client', checked: false },
        { name: 'landing', message: 'Landing Page', checked: false },
        { name: 'miniapp', message: 'WeChat Miniapp', checked: false },
      ],
      validate: (v) => (v.length > 0 ? true : 'Select at least one module'),
    },
    {
      type: 'confirm',
      name: 'install',
      message: 'Auto install dependencies?',
      initial: true,
    },
    {
      type: 'confirm',
      name: 'gitInit',
      message: 'Auto initialize git repo?',
      initial: true,
    },
  ]);

  return answers;
};

exports.askProjectName = async () => {
  const { name } = await prompt({
    type: 'input',
    name: 'name',
    message: 'Project name',
    required: true,
    validate: (v) =>
      /^[a-z0-9_-]+$/.test(v) ? true : 'Only lowercase letters, numbers, hyphens, underscores',
  });
  return name;
};
