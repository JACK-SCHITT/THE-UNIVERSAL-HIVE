import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Analytics } from '@vercel/analytics/react';
import HomePage from '@/pages/HomePage';
import GrokMaxPage from '@/pages/GrokMaxPage';
import APIDocumentationPage from '@/pages/APIDocumentationPage';

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/grok-max" element={<GrokMaxPage />} />
        <Route path="/docs" element={<APIDocumentationPage />} />
      </Routes>
      <Analytics />
    </BrowserRouter>
  );
}

export default App;
