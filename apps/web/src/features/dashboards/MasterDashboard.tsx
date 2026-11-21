import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { RoleName } from '@keydso/shared-types';
import { SystemAdminDashboardView } from './SystemAdminDashboardView';
import { GeneralPresidentDashboardView } from './GeneralPresidentDashboardView';
import { FinanceCommitteeDashboardView } from './FinanceCommitteeDashboardView';
import { FacultyPresidentDashboardView } from './FacultyPresidentDashboardView';
import { CommitteeMemberDashboardView } from './CommitteeMemberDashboardView';
import { StudentPortalDashboardView } from './StudentPortalDashboardView';
import { SecretaryDashboardView } from './SecretaryDashboardView';

export const MasterDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const roles = user?.roles || [];

  // Automatically render the user's specific dashboard matching their assigned role
  if (roles.includes(RoleName.SYSTEM_ADMIN)) {
    return <SystemAdminDashboardView userName={user?.full_name || 'Dr. Ahmed Ali'} />;
  }

  if (roles.includes(RoleName.GENERAL_PRESIDENT) || roles.includes(RoleName.VICE_PRESIDENT)) {
    return <GeneralPresidentDashboardView userName={user?.full_name || 'Prof. Hassan Mohamed'} />;
  }

  if (roles.includes(RoleName.FINANCE_OFFICER)) {
    return <FinanceCommitteeDashboardView userName={user?.full_name || 'Finance Committee'} />;
  }

  if (roles.includes(RoleName.FACULTY_PRESIDENT)) {
    return (
      <FacultyPresidentDashboardView
        userName={user?.full_name || 'Dr. Amina Farah'}
        facultyName="Faculty of Engineering"
      />
    );
  }

  if (roles.includes(RoleName.SECRETARY)) {
    return <SecretaryDashboardView userName={user?.full_name || 'Council Secretary'} />;
  }

  if (roles.includes(RoleName.COMMITTEE_CHAIR) || roles.includes(RoleName.COMMITTEE_MEMBER)) {
    return <CommitteeMemberDashboardView userName={user?.full_name || 'Ahmed Yusuf'} />;
  }

  // Default for Students
  return (
    <StudentPortalDashboardView
      studentName={user?.full_name || 'Mohamed Ali'}
      studentId={user?.student_id || 'STU-2025-001'}
      facultyName="Faculty of Engineering"
    />
  );
};
