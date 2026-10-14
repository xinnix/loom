import { BadRequestException, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  DERIVED_SETTINGS,
  SETTING_GROUPS,
  SETTING_KEY_ALIASES,
  type SettingFieldDef,
  type SettingFieldView,
} from '@loom/shared';

interface CachedSetting {
  value: string;
  isSecret: boolean;
}

/**
 * 平台参数服务（ADR-008）—— SystemSetting 表的内存缓存读取层。
 *
 * 读取优先级（同步 get，依赖启动时预加载缓存）：
 *   1. 数据库 SystemSetting
 *   2. 环境变量
 *   3. 派生值（由 PUBLIC_API_URL 生成回调 URL 等，当前目录暂无派生项）
 *
 * ⚠️ 铁律（weSale 生产事故教训，见 docs/dev/settings-config-injection.md）：
 * 禁止 re-declare 全局 ConfigService token 来实现 DB 优先——同 token 双全局
 * 注册在「构造注入按注册序」与「app.get 后注册者覆盖」两种解析语义下必有一侧
 * 命中错误实例。需要 DB 配置的服务一律显式注入本 SettingsService。
 *
 * 写入（setMany）后 reload 缓存并递增 version，
 * 构造期读配置的服务以 version 判断是否需要重建。
 */
@Injectable()
export class SettingsService implements OnModuleInit {
  private readonly logger = new Logger(SettingsService.name);
  private cache = new Map<string, CachedSetting>();
  private version = 0;
  private loaded = false;
  private loading: Promise<void> | null = null;

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.reload();
    } catch (e) {
      // 配置表不可用不阻断启动（env 兜底仍然有效）
      this.logger.warn(
        `SystemSetting 加载失败，全部走环境变量兜底: ${e instanceof Error ? e.message : e}`,
      );
    }
  }

  /** 全量拉取 DB → 内存缓存；每次写入后调用（version +1） */
  async reload(): Promise<void> {
    if (this.loading) return this.loading;
    this.loading = (async () => {
      const rows = await this.prisma.systemSetting.findMany();
      const next = new Map<string, CachedSetting>();
      for (const row of rows) {
        if (row.value !== null) {
          next.set(row.key, { value: row.value, isSecret: row.isSecret });
        }
      }
      this.cache = next;
      this.version++;
      this.loaded = true;
    })();
    try {
      await this.loading;
    } finally {
      this.loading = null;
    }
  }

  /** 配置版本号：写入后 +1，懒初始化服务据此检测变更 */
  getVersion(): number {
    return this.version;
  }

  isLoaded(): boolean {
    return this.loaded;
  }

  /** 同步读取：DB → env → 派生 → undefined */
  get(key: string): string | undefined {
    const k = this.resolveKey(key);
    const row = this.cache.get(k);
    if (row && row.value !== '') return row.value;

    // 注意：这里直接读 process.env 而非 ConfigService，
    // 因为 ConfigService 若被 DB 优先逻辑覆写会形成回环（铁律见类注释）
    const envVal = process.env[k];
    if (envVal !== undefined && envVal !== '') return envVal;

    const derivedFn = DERIVED_SETTINGS[k];
    if (derivedFn) {
      const base = this.get('PUBLIC_API_URL');
      if (base) return derivedFn(base.replace(/\/+$/, ''));
    }
    return undefined;
  }

  /** 值的实际来源（供配置页展示） */
  getSource(key: string): 'db' | 'env' | 'derived' | 'none' {
    const k = this.resolveKey(key);
    if (this.cache.has(k)) return 'db';
    const envVal = process.env[k];
    if (envVal !== undefined && envVal !== '') return 'env';
    if (DERIVED_SETTINGS[k] && this.get('PUBLIC_API_URL')) return 'derived';
    return 'none';
  }

  /**
   * 保存一组配置（按分组目录白名单过滤）。
   * isSecret 字段传空串/undefined/null = 留空不修改；derivedOnly 字段不落库。
   */
  async setMany(group: string, values: Record<string, string | null | undefined>): Promise<void> {
    const groupDef = SETTING_GROUPS.find((g) => g.key === group);
    if (!groupDef) throw new BadRequestException(`未知的配置分组: ${group}`);

    const keys = new Set(groupDef.fields.filter((f) => !f.derivedOnly).map((f) => f.key));
    const writes = Object.entries(values)
      .filter(
        ([key, value]) => keys.has(key) && value !== null && value !== undefined && value !== '',
      )
      .map(([key, value]) => {
        const field = groupDef.fields.find((f) => f.key === key)!;
        return this.prisma.systemSetting.upsert({
          where: { key },
          update: { value: value as string, isSecret: field.isSecret, group },
          create: { key, value: value as string, isSecret: field.isSecret, group },
        });
      });

    if (writes.length > 0) {
      await this.prisma.$transaction(writes);
    }
    await this.reload();
    this.logger.log(`配置分组 ${group} 已更新（${writes.length} 项），version=${this.version}`);
  }

  /** 某分组的脱敏视图（配置页展示用，敏感值永不回传明文） */
  getGroupView(group: string): SettingFieldView[] {
    const groupDef = SETTING_GROUPS.find((g) => g.key === group);
    if (!groupDef) throw new BadRequestException(`未知的配置分组: ${group}`);
    return groupDef.fields.map((f) => this.fieldView(f));
  }

  private fieldView(f: SettingFieldDef): SettingFieldView {
    const source = this.getSource(f.key);
    const isSet = source !== 'none';
    const view: SettingFieldView = {
      key: f.key,
      label: f.label,
      type: f.type,
      isSecret: f.isSecret,
      derivedOnly: !!f.derivedOnly,
      isSet,
      source,
      options: f.options,
      help: f.help,
      placeholder: f.placeholder,
    };
    if (!isSet) return view;

    const raw = this.get(f.key)!;
    if (f.isSecret) {
      view.maskedValue = this.maskValue(raw);
    } else {
      view.value = raw;
    }
    return view;
  }

  /** 掩码：前 4 位 + **** */
  private maskValue(value: string): string {
    if (value.length <= 4) return '****';
    return `${value.slice(0, 4)}****`;
  }

  private resolveKey(key: string): string {
    return SETTING_KEY_ALIASES[key] ?? key;
  }
}
