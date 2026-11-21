import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './features/landing/LandingPage';
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
import { LandingPageCustomizer } from './features/admin/LandingPageCustomizer';
import { CampaignManager } from './features/finance/CampaignManager';
import { PaymentRecorder } from './features/finance/PaymentRecorder';
import { PaymentVerificationQueue } from './features/finance/PaymentVerificationQueue';
import { ExpenseWorkflow } from './features/finance/ExpenseWorkflow';
import { LedgerViewer } from './features/finance/LedgerViewer';
import { WelfareManager } from './features/finance/WelfareManager';
import { CouncilDashboard } from './features/governance/CouncilDashboard';
import { FacultyWorkspace } from './features/governance/FacultyWorkspace';
import { CommitteesManager } from './features/governance/CommitteesManager';
import { MeetingsManager } from './features/governance/MeetingsManager';
import { FacultyChallengesPage } from './features/governance/FacultyChallengesPage';
import { ReportsDashboard } from './features/reports/ReportsDashboard';
import { RoleName } from '@keydso/shared-types';

export const App: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Council & Student Portal Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          {/* Universal Role-Tailored Master Dashboard */}
          <Route path="/dashboard" element={<CouncilDashboard />} />

          {/* Student Portal Routes */}
          <Route path="/portal" element={<StudentPortalDashboard />} />
          <Route path="/portal/contributions" element={<StudentContributionsPage />} />
          <Route path="/portal/representatives" element={<RepresentativeDirectoryPage />} />
          <Route path="/portal/transparency" element={<TransparencyFeedPage />} />

          {/* Directory */}
          <Route path="/students" element={<StudentDirectory />} />

          {/* Finance & Treasury Routes */}
          <Route
            element={
              <ProtectedRoute
                allowedRoles={[
                  RoleName.FINANCE_OFFICER,
                  RoleName.GENERAL_PRESIDENT,
                  RoleName.VICE_PRESIDENT,
                  RoleName.SYSTEM_ADMIN,
                ]}
              />
            }
          >
            <Route path="/finance/campaigns" element={<CampaignManager />} />
            <Route path="/finance/payments/record" element={<PaymentRecorder />} />
            <Route path="/finance/payments/verify" element={<PaymentVerificationQueue />} />
            <Route path="/finance/expenses" element={<ExpenseWorkflow />} />
            <Route path="/finance/ledger" element={<LedgerViewer />} />
            <Route path="/finance/welfare" element={<WelfareManager />} />
          </Route>

          {/* Governance & Assembly Routes */}
          <Route
            element={
              <ProtectedRoute
                allowedRoles={[
                  RoleName.GENERAL_PRESIDENT,
                  RoleName.VICE_PRESIDENT,
                  RoleName.FACULTY_PRESIDENT,
                  RoleName.SECRETARY,
                  RoleName.COMMITTEE_CHAIR,
                  RoleName.COMMITTEE_MEMBER,
                  RoleName.SYSTEM_ADMIN,
                ]}
              />
            }
          >
            <Route path="/governance/dashboard" element={<CouncilDashboard />} />
            <Route path="/governance/faculty" element={<FacultyWorkspace />} />
            <Route path="/governance/committees" element={<CommitteesManager />} />
            <Route path="/governance/meetings" element={<MeetingsManager />} />
            <Route path="/governance/challenges" element={<FacultyChallengesPage />} />
          </Route>

          {/* Landing Page CMS Customizer */}
          <Route
            element={
              <ProtectedRoute
                allowedRoles={[RoleName.SYSTEM_ADMIN, RoleName.GENERAL_PRESIDENT]}
              />
            }
          >
            <Route path="/admin/landing-settings" element={<LandingPageCustomizer />} />
          </Route>

          {/* System Admin Routes */}
          <Route element={<ProtectedRoute allowedRoles={[RoleName.SYSTEM_ADMIN]} />}>
            <Route path="/admin/academics" element={<AcademicManager />} />
            <Route path="/admin/roles" element={<UserRoleManager />} />
            <Route path="/admin/import" element={<StudentBulkImportPage />} />
            <Route path="/admin/audit-logs" element={<AuditLogsViewer />} />
          </Route>

          {/* Analytics & Reports */}
          <Route
            path="/reports"
            element={
              <ProtectedRoute
                allowedRoles={[
                  RoleName.GENERAL_PRESIDENT,
                  RoleName.VICE_PRESIDENT,
                  RoleName.FINANCE_OFFICER,
                  RoleName.SYSTEM_ADMIN,
                ]}
              />
            }
          >
            <Route index element={<ReportsDashboard />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>
    </Routes>
  );
};
