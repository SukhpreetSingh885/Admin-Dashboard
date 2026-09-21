import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../auth/ProtectedRoute';
import AdminLayout from '../layouts/AdminLayout';
import Courses from '../pages/Courses';
import CreateCourse from '../pages/CreateCourse';
import Dashboard from '../pages/Dashboard';
import EditCourse from '../pages/EditCourse';
import Enrollments from '../pages/Enrollments';
import Lessons from '../pages/Lessons';
import Login from '../pages/Login';
import Payments from '../pages/Payments';
import Progress from '../pages/Progress';
import Students from '../pages/Students';
import Settings from '../pages/Settings';

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="courses" element={<Courses />} />
            <Route path="courses/new" element={<CreateCourse />} />
            <Route path="courses/:id/edit" element={<EditCourse />} />
            <Route path="lessons" element={<Lessons />} />
            <Route path="students" element={<Students />} />
            <Route path="enrollments" element={<Enrollments />} />
            <Route path="payments" element={<Payments />} />
            <Route path="progress" element={<Progress />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}