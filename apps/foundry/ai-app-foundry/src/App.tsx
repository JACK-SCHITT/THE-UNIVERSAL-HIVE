import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthContext, useAuthProvider } from "@/hooks/useAuth";
import LandingPage from "@/pages/LandingPage";
import ChatPage from "@/pages/ChatPage";
import Dashboard from "@/pages/Dashboard";
import BuyoutCenter from "@/pages/BuyoutCenter";
import LegalPage from "@/pages/LegalPage";
import NotFound from "@/pages/NotFound";
import AuthPage from "@/pages/AuthPage";
import PricingPage from "@/pages/PricingPage";
import PaymentSuccess from "@/pages/PaymentSuccess";
import AdminPage from "@/pages/AdminPage";
import AccountPage from "@/pages/AccountPage";
import AssimilatePage from "@/pages/AssimilatePage";
import ShareablePage from "@/pages/ShareablePage";
import TerminalPage from "@/pages/TerminalPage";
import SubAppsPage from "@/pages/SubAppsPage";
import Navbar from "@/components/layout/Navbar";

// Pages that use the Navbar layout
function WithNavbar({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background grid-bg flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  );
}

function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuthProvider();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "hsl(220,20%,9%)",
              border: "1px solid hsl(220,20%,18%)",
              color: "hsl(210,40%,96%)",
              fontFamily: "Space Grotesk, sans-serif",
            },
          }}
        />
        <Routes>
          {/* Standalone pages (no main Navbar) */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/admin" element={<AdminPage />} />
          {/* Shareable public app page */}
          <Route path="/app/:appId" element={<ShareablePage />} />
          {/* Assimilate Or Die — has its own dark layout */}
          <Route path="/assimilate" element={<AssimilatePage />} />

          {/* Pages with Navbar */}
          <Route
            path="/command"
            element={
              <WithNavbar>
                <ChatPage />
              </WithNavbar>
            }
          />
          <Route
            path="/dashboard"
            element={
              <WithNavbar>
                <Dashboard />
              </WithNavbar>
            }
          />
          <Route
            path="/account"
            element={
              <WithNavbar>
                <AccountPage />
              </WithNavbar>
            }
          />
          <Route
            path="/buyout"
            element={
              <WithNavbar>
                <BuyoutCenter />
              </WithNavbar>
            }
          />
          <Route
            path="/legal"
            element={
              <WithNavbar>
                <LegalPage />
              </WithNavbar>
            }
          />
          <Route
            path="/terminal"
            element={
              <WithNavbar>
                <TerminalPage />
              </WithNavbar>
            }
          />
          <Route
            path="/apps"
            element={
              <WithNavbar>
                <SubAppsPage />
              </WithNavbar>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
