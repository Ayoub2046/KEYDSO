import { Request, Response, NextFunction } from 'express';
import { studentService } from './student.service';
import { StudentRegisterSchema } from '@keydso/validation';
import { sendSuccess, sendPaginated } from '../../common/response';
import { BadRequestError } from '../../common/errors';
import { RoleName } from '@keydso/shared-types';

export class StudentController {
  public async getStudents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = {
        faculty_id: req.query.faculty_id as string | undefined,
        department_id: req.query.department_id as string | undefined,
        search: req.query.search as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        page_size: req.query.page_size ? parseInt(req.query.page_size as string, 10) : 20,
      };

      // Faculty President scope restriction: cannot see other faculties
      if (req.user?.roles.includes(RoleName.FACULTY_PRESIDENT) && !req.user.roles.includes(RoleName.SYSTEM_ADMIN)) {
        filters.faculty_id = req.user.assigned_faculty_id || 'unassigned';
      }

      const { items, total, page, pageSize } = await studentService.getStudents(filters);
      sendPaginated(res, items, total, page, pageSize, 'Students retrieved');
    } catch (err) {
      next(err);
    }
  }

  public async getStudentById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const student = await studentService.getStudentById(req.params.id);
      sendSuccess(res, student, 'Student details retrieved');
    } catch (err) {
      next(err);
    }
  }

  public async registerStudent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = StudentRegisterSchema.parse(req.body);
      const student = await studentService.registerStudent(validated, req.user!.id);
      sendSuccess(res, student, 'Student registered successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  public async bulkImport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { records, academic_year_id, dry_run } = req.body;
      if (!Array.isArray(records) || records.length === 0) {
        throw new BadRequestError('Import payload must contain a non-empty records array');
      }
      if (!academic_year_id) {
        throw new BadRequestError('academic_year_id is required');
      }

      const isDryRun = dry_run !== false; // Default to dry-run preview for safety
      const result = await studentService.bulkImportStudents(records, academic_year_id, isDryRun, req.user!.id);
      sendSuccess(res, result, isDryRun ? 'Dry-run validation complete' : 'Students imported successfully');
    } catch (err) {
      next(err);
    }
  }
}

export const studentController = new StudentController();
