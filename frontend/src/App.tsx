import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { MainLayout } from "@/components/layout/MainLayout";

// Pages
import Home from "./pages/Home";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import NotFound from "./pages/NotFound";

// Admin
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProviders from "./pages/admin/AdminProviders";
import AdminSections from "./pages/admin/AdminSections";
import AdminResponses from "./pages/admin/AdminResponses";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminBulkUpload from "./pages/admin/AdminBulkUpload";

// Agent
import AgentLayout from "./pages/agent/AgentLayout";
import AgentDashboard from "./pages/agent/AgentDashboard";
import AgentResponses from "./pages/agent/AgentResponses";
import AgentLeads from "./pages/agent/AgentLeads";

// User
import UserDashboard from "./pages/user/UserDashboard";
import UserForm from "./pages/user/UserForm";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            {/* Public routes with header/footer */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>

            {/* Admin routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="providers" element={<AdminProviders />} />
              <Route path="sections" element={<AdminSections />} />
              <Route path="bulk-upload" element={<AdminBulkUpload />} />
              <Route path="responses" element={<AdminResponses />} />
              <Route path="users" element={<AdminUsers />} />
            </Route>

            {/* Agent routes */}
            <Route
              path="/agent"
              element={
                <ProtectedRoute allowedRoles={['agent']}>
                  <AgentLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AgentDashboard />} />
              <Route path="responses" element={<AgentResponses />} />
              <Route path="leads" element={<AgentLeads />} />
            </Route>

            {/* User routes */}
            <Route element={<MainLayout />}>
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['user']}>
                    <UserDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/form/:sectionId"
                element={
                  <ProtectedRoute allowedRoles={['user']}>
                    <UserForm />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
