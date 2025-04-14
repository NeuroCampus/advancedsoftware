
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Login from "./pages/auth/Login";
import ForgotPassword from "./pages/auth/ForgotPassword";
import AdminDashboard from "./pages/admin/Dashboard";
import HodDashboard from "./pages/hod/Dashboard";
import FacultyDashboard from "./pages/faculty/Dashboard";
import StudentDashboard from "./pages/student/Dashboard";
import { DashboardLayout } from "./components/DashboardLayout";
import { LayoutProvider } from "./contexts/LayoutContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import NotFound from "./pages/NotFound";

// Dashboard navigation items for each role
import { adminNavItems, hodNavItems, facultyNavItems, studentNavItems } from "./config/navigation";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <LayoutProvider>
            <Routes>
              {/* Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />

              {/* Admin Routes */}
              <Route path="/admin" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <DashboardLayout 
                    sidebarItems={adminNavItems}
                    appName="AdminHub" 
                    notifications={3}
                  >
                    <AdminDashboard />
                  </DashboardLayout>
                </ProtectedRoute>
              } />

              {/* HOD Routes */}
              <Route path="/hod" element={
                <ProtectedRoute allowedRoles={['hod']}>
                  <DashboardLayout 
                    sidebarItems={hodNavItems}
                    appName="HODPortal"
                    notifications={2}
                  >
                    <HodDashboard />
                  </DashboardLayout>
                </ProtectedRoute>
              } />

              {/* Faculty Routes */}
              <Route path="/faculty" element={
                <ProtectedRoute allowedRoles={['faculty']}>
                  <DashboardLayout 
                    sidebarItems={facultyNavItems}
                    appName="FacultyPortal" 
                    notifications={1}
                  >
                    <FacultyDashboard />
                  </DashboardLayout>
                </ProtectedRoute>
              } />

              {/* Student Routes */}
              <Route path="/student" element={
                <ProtectedRoute allowedRoles={['student']}>
                  <DashboardLayout 
                    sidebarItems={studentNavItems}
                    appName="StudentPortal" 
                    notifications={0}
                  >
                    <StudentDashboard />
                  </DashboardLayout>
                </ProtectedRoute>
              } />

              {/* Redirect root to login */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              
              {/* Catch-all for unknown routes */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </LayoutProvider>

          {/* Toasts */}
          <Toaster />
          <Sonner />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
