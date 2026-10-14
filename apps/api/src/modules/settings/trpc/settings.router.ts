import {
  GetSettingGroupInputSchema,
  SaveSettingGroupSchema,
  SETTING_GROUPS,
  Permission,
} from '@loom/shared';
import { router, permissionProcedure, getSettingsService } from '../../../trpc/trpc';

/**
 * 平台参数配置 router（ADR-008）。
 *
 * getGroup 返回目录 + 脱敏视图（敏感值永不回传明文）；
 * saveGroup 的 isSecret 字段传空串/null = 留空不修改。
 */
export const settingsRouter = router({
  groups: permissionProcedure(Permission.settings.read).query(() =>
    SETTING_GROUPS.map(({ key, label, description, guideLabel, guideUrl, fields }) => ({
      key,
      label,
      description,
      guideLabel,
      guideUrl,
      fieldKeys: fields.map((f) => f.key),
    })),
  ),

  getGroup: permissionProcedure(Permission.settings.read)
    .input(GetSettingGroupInputSchema)
    .query(({ input }) => {
      return {
        group: input.group,
        fields: getSettingsService().getGroupView(input.group),
      };
    }),

  saveGroup: permissionProcedure(Permission.settings.update)
    .input(SaveSettingGroupSchema)
    .mutation(async ({ input }) => {
      await getSettingsService().setMany(input.group, input.values);
      return {
        success: true,
        fields: getSettingsService().getGroupView(input.group),
      };
    }),
});
