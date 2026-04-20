import React from 'react';
import { Outlet } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

const Layout = () => {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white p-2 rounded-lg">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700">
              DocuQuality AI
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-500">System Status: <span className="text-green-500">Operational</span></span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
      
      <footer className="mt-auto py-6 text-center text-sm text-gray-400">
        &copy; {new Date().getFullYear()} DocuQuality Enterprise. All rights reserved.
      </footer>
    </div>
  );
};

export default Layout;
