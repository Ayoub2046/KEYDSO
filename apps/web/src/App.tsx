import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './features/auth/LoginPage';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { StudentPortalDashboard } from './features/student-portal/StudentPortalDashboard';
import { StudentContributionsPage } from './features/student-portal/StudentContributionsPage';
import { RepresentativeDirectoryPage } from './features/student-portal/RepresentativeDirectoryPage';
import { TransparencyFeedPage } from './features/student-portal/TransparencyFeedPage';
import { StudentDirectory } from './features/students/StudentDirectory';
import { AcademicManager } from './features/admin/AcademicManager';
import { UserRoleManager } from './features/admin/UserRoleManager';
import { StudentBulkImportPage } from './features/admin/StudentBulkImportModal';
import { AuditLogsViewer } from './features/admin/AuditLogsViewer';
import { RoleName } from '@keydso/shared-types';

export const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/portal" replace />} />

          {/* Student Portal Routes */}
          <Route path="/portal" element={<StudentPortalDashboard />} />
          <Route path="/portal/contributions" element={<StudentContributionsPage />} />
          <Route path="/portal/representatives" element={<RepresentativeDirectoryPage />} />
          <Route path="/portal/transparency" element={<TransparencyFeedPage />} />

          {/* Directory */}
          <Route path="/students" element={<StudentDirectory />} />

          {/* Admin Restricted Routes */}
          <Route element={<ProtectedRoute allowedRoles={[RoleName.SYSTEM_ADMIN]} />}>
            <Route path="/admin/academic" element={<AcademicManager />} />
            <Route path="/admin/users" element={<UserRoleManager />} />
            <Route path="/admin/import" element={<StudentBulkImportPage />} />
            <Route path="/admin/audit" element={<AuditLogsViewer />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/portal" replace />} />
    </Routes>
  );
};
