import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { PageLoader } from './components/ui';
import ProtectedRoute, { PublicOnlyRoute } from './components/shared/ProtectedRoute';
import { ClientLayout, AdminLayout } from './layouts/AppShell';
import PublicLayout from './layouts/PublicLayout';

// Public
import HomePage from './pages/public/HomePage';
import ServicesPage from './pages/public/ServicesPage';
import ServiceDetailPage from './pages/public/ServiceDetailPage';
import ProjectsPage from './pages/public/ProjectsPage';
import ProjectDetailPage from './pages/public/ProjectDetailPage';
import QuotationPage from './pages/public/QuotationPage';
import AnnouncementsPage from './pages/public/AnnouncementsPage';
import AboutPage from './pages/public/AboutPage';
import ContactPage from './pages/public/ContactPage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';
import ForgotPasswordPage from './pages/public/ForgotPasswordPage';

// Client
import ClientDashboard from './pages/client/DashboardPage';
import ClientQuotations from './pages/client/QuotationsPage';
import ClientQuotationDetail from './pages/client/QuotationDetailPage';
import ClientInquiries from './pages/client/InquiriesPage';
import ClientInquiryDetail from './pages/client/InquiryDetailPage';
import ClientInquiryNew from './pages/client/InquiryNewPage';
import ClientNotifications from './pages/client/NotificationsPage';
import ClientProfile from './pages/client/ProfilePage';

// Admin
import AdminDashboard from './pages/admin/DashboardPage';
import AdminServices from './pages/admin/ServicesPage';
import AdminCategories from './pages/admin/CategoriesPage';
import AdminProjects from './pages/admin/ProjectsPage';
import AdminAnnouncements from './pages/admin/AnnouncementsPage';
import AdminPricing from './pages/admin/PricingPage';
import AdminAdditionalServices from './pages/admin/AdditionalServicesPage';
import AdminQuotations from './pages/admin/QuotationsPage';
import AdminQuotationDetail from './pages/admin/QuotationDetailPage';
import AdminUsers from './pages/admin/UsersPage';
import AdminInquiries from './pages/admin/InquiriesPage';
import AdminInquiryDetail from './pages/admin/InquiryDetailPage';
import AdminReports from './pages/admin/ReportsPage';
import AdminAuditLogs from './pages/admin/AuditLogsPage';
import AdminNotifications from './pages/admin/NotificationsPage';
import AdminSettings from './pages/admin/SettingsPage';
import AdminProfile from './pages/admin/ProfilePage';

function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-display text-7xl font-extrabold text-agorange">404</p>
      <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-agdark-800">Page not found</h1>
      <p className="max-w-sm text-sm text-agdark-500">The page you're looking for doesn't exist or has been moved.</p>
      <a href="/" className="btn-primary mt-2">Back to home</a>
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public site */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/services/:slug" element={<ServiceDetailPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:id" element={<ProjectDetailPage />} />
          <Route path="/quotation" element={<QuotationPage />} />
          <Route path="/announcements" element={<AnnouncementsPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
        </Route>

        {/* Auth */}
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <RegisterPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicOnlyRoute>
              <ForgotPasswordPage />
            </PublicOnlyRoute>
          }
        />

        {/* Client portal */}
        <Route
          element={
            <ProtectedRoute roles={['client']}>
              <ClientLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/client/dashboard" element={<ClientDashboard />} />
          <Route path="/client/services" element={<ServicesPage />} />
          <Route path="/client/projects" element={<ProjectsPage />} />
          <Route path="/client/quotations" element={<ClientQuotations />} />
          <Route path="/client/quotations/:id" element={<ClientQuotationDetail />} />
          <Route path="/client/inquiries" element={<ClientInquiries />} />
          <Route path="/client/inquiries/new" element={<ClientInquiryNew />} />
          <Route path="/client/inquiries/:id" element={<ClientInquiryDetail />} />
          <Route path="/client/notifications" element={<ClientNotifications />} />
          <Route path="/client/profile" element={<ClientProfile />} />
        </Route>

        {/* Admin portal */}
        <Route
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/services" element={<AdminServices />} />
          <Route path="/admin/categories" element={<AdminCategories />} />
          <Route path="/admin/projects" element={<AdminProjects />} />
          <Route path="/admin/announcements" element={<AdminAnnouncements />} />
          <Route path="/admin/pricing" element={<AdminPricing />} />
          <Route path="/admin/additional-services" element={<AdminAdditionalServices />} />
          <Route path="/admin/quotations" element={<AdminQuotations />} />
          <Route path="/admin/quotations/:id" element={<AdminQuotationDetail />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/inquiries" element={<AdminInquiries />} />
          <Route path="/admin/inquiries/:id" element={<AdminInquiryDetail />} />
          <Route path="/admin/reports" element={<AdminReports />} />
          <Route path="/admin/audit-logs" element={<AdminAuditLogs />} />
          <Route path="/admin/notifications" element={<AdminNotifications />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
          <Route path="/admin/profile" element={<AdminProfile />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
