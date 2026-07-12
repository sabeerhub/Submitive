import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing.js";
import Login from "./pages/Login.js";
import Register from "./pages/Register.js";
import ForgotPassword from "./pages/ForgotPassword.js";
import Onboarding from "./pages/Onboarding.js";
import WorkspaceList from "./pages/WorkspaceList.js";
import Dashboard from "./pages/Dashboard.js";
import { ComingSoon } from "./pages/ComingSoon.js";
import FormBuilder from "./pages/FormBuilder.js";
import PublicSubmission from "./pages/PublicSubmission.js";
import SubmissionReceipt from "./pages/SubmissionReceipt.js";
import FormsList from "./pages/dashboard/FormsList.js";
import FormSubmissions from "./pages/dashboard/FormSubmissions.js";
import SubmissionDetail from "./pages/dashboard/SubmissionDetail.js";
import NotFound from "./pages/NotFound.js";
import { ProtectedRoute } from "./components/ProtectedRoute.js";

export default function App() {
  return (
    <Routes>
      {/* Marketing + auth */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Public submission experience — no auth, ever */}
      <Route path="/s/:slug" element={<PublicSubmission />} />
      <Route path="/s/:slug/receipt/:submissionId" element={<SubmissionReceipt />} />

      {/* Onboarding */}
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute requireWorkspace={false}>
            <Onboarding />
          </ProtectedRoute>
        }
      />

      {/* Owner dashboard */}
      <Route path="/workspaces" element={<ProtectedRoute><WorkspaceList /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/dashboard/forms" element={<ProtectedRoute><FormsList /></ProtectedRoute>} />
      <Route path="/dashboard/forms/:id" element={<ProtectedRoute><FormSubmissions /></ProtectedRoute>} />
      <Route path="/dashboard/templates" element={<ProtectedRoute><ComingSoon title="Templates" /></ProtectedRoute>} />
      <Route path="/dashboard/team" element={<ProtectedRoute><ComingSoon title="Team" /></ProtectedRoute>} />
      <Route path="/dashboard/settings" element={<ProtectedRoute><ComingSoon title="Settings" /></ProtectedRoute>} />
      <Route
        path="/dashboard/forms/:id/submissions/:submissionId"
        element={<ProtectedRoute><SubmissionDetail /></ProtectedRoute>}
      />

      {/* Submission Builder */}
      <Route path="/forms/new" element={<ProtectedRoute><FormBuilder /></ProtectedRoute>} />
      <Route path="/forms/:id/edit" element={<ProtectedRoute><FormBuilder /></ProtectedRoute>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
