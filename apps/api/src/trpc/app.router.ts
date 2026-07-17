import { router } from './trpc';

// Merge all feature routers here
import { authRouter } from '../modules/auth/trpc/auth.router';
import { userRouter } from '../modules/user/trpc/user.router';
import { adminRouter } from '../modules/admin/trpc/admin.router';
import { roleRouter } from '../modules/role/trpc/role.router';
import { permissionRouter } from '../modules/permission/trpc/permission.router';
import { uploadRouter } from '../modules/upload/trpc/upload.router';
import { paymentRouter } from '../modules/payment/trpc/payment.router';
import { agentsRouter } from '../modules/agents/trpc/agents.router';
import { wecomRouter } from '../modules/wecom/trpc/wecom.router';
import { todoRouter } from '../modules/todo/trpc/todo.router';

export const appRouter = router({
  auth: authRouter,
  user: userRouter,
  admin: adminRouter,
  role: roleRouter,
  permission: permissionRouter,
  upload: uploadRouter,
  payment: paymentRouter,
  agents: agentsRouter,
  wecom: wecomRouter,
  todo: todoRouter,
});

export type AppRouter = typeof appRouter;
