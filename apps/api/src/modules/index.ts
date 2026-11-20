import { Router } from 'express';
import { authRouter } from './auth/auth.routes';
import { academicRouter } from './academic/academic.routes';
import { studentRouter } from './students/student.routes';
import { adminRouter } from './admin/admin.routes';

export const apiV1Router = Router();

apiV1Router.use('/auth', authRouter);
apiV1Router.use('/academic', academicRouter);
apiV1Router.use('/students', studentRouter);
apiV1Router.use('/admin', adminRouter);
