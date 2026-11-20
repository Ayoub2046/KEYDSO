import { Router } from 'express';
import { authRouter } from './auth/auth.routes';
import { academicRouter } from './academic/academic.routes';
import { studentRouter } from './students/student.routes';
import { adminRouter } from './admin/admin.routes';
import { portalRouter } from './portal/portal.routes';
import { financeRouter } from './finance/finance.routes';
import { governanceRouter } from './governance/governance.routes';
import { reportsRouter } from './reports/reports.routes';

export const apiV1Router = Router();

apiV1Router.use('/auth', authRouter);
apiV1Router.use('/academic', academicRouter);
apiV1Router.use('/students', studentRouter);
apiV1Router.use('/admin', adminRouter);
apiV1Router.use('/portal', portalRouter);
apiV1Router.use('/finance', financeRouter);
apiV1Router.use('/governance', governanceRouter);
apiV1Router.use('/reports', reportsRouter);
