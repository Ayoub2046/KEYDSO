import { Request, Response, NextFunction } from 'express';
import { academicService } from './academic.service';
import {
  AcademicYearSchema,
  SemesterSchema,
  FacultySchema,
  DepartmentSchema,
  ClassCohortSchema,
} from '@keydso/validation';
import { sendSuccess } from '../../common/response';

export class AcademicController {
  // Years
  public async getAcademicYears(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await academicService.getAcademicYears();
      sendSuccess(res, data, 'Academic years retrieved');
    } catch (err) {
      next(err);
    }
  }

  public async createAcademicYear(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = AcademicYearSchema.parse(req.body);
      const data = await academicService.createAcademicYear(validated, req.user!.id);
      sendSuccess(res, data, 'Academic year created', 201);
    } catch (err) {
      next(err);
    }
  }

  // Semesters
  public async getSemesters(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const academicYearId = req.query.academic_year_id as string | undefined;
      const data = await academicService.getSemesters(academicYearId);
      sendSuccess(res, data, 'Semesters retrieved');
    } catch (err) {
      next(err);
    }
  }

  public async createSemester(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = SemesterSchema.parse(req.body);
      const data = await academicService.createSemester(validated, req.user!.id);
      sendSuccess(res, data, 'Semester created', 201);
    } catch (err) {
      next(err);
    }
  }

  // Faculties
  public async getFaculties(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await academicService.getFaculties();
      sendSuccess(res, data, 'Faculties retrieved');
    } catch (err) {
      next(err);
    }
  }

  public async createFaculty(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = FacultySchema.parse(req.body);
      const data = await academicService.createFaculty(validated, req.user!.id);
      sendSuccess(res, data, 'Faculty created', 201);
    } catch (err) {
      next(err);
    }
  }

  // Departments
  public async getDepartments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const facultyId = req.query.faculty_id as string | undefined;
      const data = await academicService.getDepartments(facultyId);
      sendSuccess(res, data, 'Departments retrieved');
    } catch (err) {
      next(err);
    }
  }

  public async createDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = DepartmentSchema.parse(req.body);
      const data = await academicService.createDepartment(validated, req.user!.id);
      sendSuccess(res, data, 'Department created', 201);
    } catch (err) {
      next(err);
    }
  }

  // Classes
  public async getClasses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const departmentId = req.query.department_id as string | undefined;
      const data = await academicService.getClasses(departmentId);
      sendSuccess(res, data, 'Classes retrieved');
    } catch (err) {
      next(err);
    }
  }

  public async createClass(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = ClassCohortSchema.parse(req.body);
      const data = await academicService.createClass(validated, req.user!.id);
      sendSuccess(res, data, 'Class created', 201);
    } catch (err) {
      next(err);
    }
  }
}

export const academicController = new AcademicController();
