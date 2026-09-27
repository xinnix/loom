'use client';

import { useState } from 'react';

export function CopyCommandButton({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 剪贴板不可用（非安全上下文 / 权限拒绝）时保持原样
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? '已复制' : '复制安装命令'}
      className="ml-3 flex items-center gap-1.5 text-text-muted hover:text-primary transition-colors focus:outline-none"
    >
      <span className="font-label-mono text-label-mono">{copied ? '已复制' : '复制'}</span>
      <span className="material-symbols-outlined text-[16px]">content_copy</span>
    </button>
  );
}
