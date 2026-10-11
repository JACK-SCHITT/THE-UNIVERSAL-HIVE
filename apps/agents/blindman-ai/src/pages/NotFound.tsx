import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="text-center">
        <h1 className="text-yellow-400 font-black text-7xl mb-4">404</h1>
        <p className="text-zinc-400 font-mono text-lg mb-8 uppercase tracking-wider">Wrong turn, soldier.</p>
        <button
          onClick={() => navigate('/')}
          className="bg-yellow-400 text-black font-black text-lg px-8 py-4 rounded-lg uppercase tracking-widest active:scale-95 transition-transform"
        >
          BACK TO BASE
        </button>
      </div>
    </div>
  );
};

export default NotFound;
