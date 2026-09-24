import uni from '@uni-helper/eslint-config';
import prettier from 'eslint-config-prettier';

// 格式类规则统一交给 prettier。注意：uni-helper 的 config 用 @stylistic 插件
// 抢注了 style/ 命名空间，eslint-config-prettier 关闭的是 core 同名规则而失效，
// 故此处显式关闭实际生效的风格规则（与 prettier 职责重叠者）。
// 注：uni() 返回 Promise，需在其 resolve 后展开为扁平 config 数组返回。
export default uni({
  unocss: true,
  ignores: ['**/*.md'],
}).then((config) => [
  ...(Array.isArray(config) ? config : [config]),
  {
    rules: {
      'perfectionist/sort-imports': 'off',
      'style/semi': 'off',
      'style/quotes': 'off',
      'style/comma-dangle': 'off',
      'style/member-delimiter-style': 'off',
      'style/arrow-parens': 'off',
      'style/brace-style': 'off',
      'style/indent': 'off',
      'style/indent-binary-ops': 'off',
      'style/no-extra-semi': 'off',
      'antfu/if-newline': 'off',
    },
  },
  prettier,
]);
