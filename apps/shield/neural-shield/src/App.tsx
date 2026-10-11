import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/features/ProtectedRoute";
import { Sidebar } from "@/components/layout/Sidebar";
import { Dashboard } from "@/pages/Dashboard";
import { Transactions } from "@/pages/Transactions";
import { RLAgent } from "@/pages/RLAgent";
import { PrivacyLayer } from "@/pages/PrivacyLayer";
import { ModelHealth } from "@/pages/ModelHealth";
import { Compliance } from "@/pages/Compliance";
import { Login } from "@/pages/Login";
import { Register } from "@/pages/Register";
import { Pricing } from "@/pages/Pricing";
import { AdminPanel } from "@/pages/AdminPanel";
import { PrimeDirective } from "@/pages/PrimeDirective";
import { Settings } from "@/pages/Settings";

function NotFound() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center font-mono">
        <div className="text-6xl font-bold text-cyan-DEFAULT mb-4">404</div>
        <div className="text-[#4a6080] text-sm">Route not found in decision engine.</div>
      </div>
    </div>
  );
}

function AppShell() {
  return (
    <div className="flex h-screen bg-bg-base overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Routes>
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
          <Route path="/agent" element={<ProtectedRoute><RLAgent /></ProtectedRoute>} />
          <Route path="/privacy" element={<ProtectedRoute><PrivacyLayer /></ProtectedRoute>} />
          <Route path="/models" element={<ProtectedRoute><ModelHealth /></ProtectedRoute>} />
          <Route path="/compliance" element={<ProtectedRoute><Compliance /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute adminOnly><AdminPanel /></ProtectedRoute>} />
          <Route path="/prime-directive" element={<ProtectedRoute><PrimeDirective /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: { background: '#0d1424', border: '1px solid #1e2d45', color: '#aac4d8', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' },
          }}
        />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/*" element={<AppShell />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
