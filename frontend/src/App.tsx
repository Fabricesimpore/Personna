/**
 * App.tsx
 * Entry point with authentication flow and protected routes
 */
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import CreateTest from './pages/CreateTest';
import TestInstancePage from './pages/TestInstancePage';
import TestRunner from './pages/TestRunner';
import TestSuiteRunner from './pages/TestSuiteRunner';
import CompletionPage from './pages/CompletionPage';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import PersonaPage from './pages/PersonaPage';
import PersonaSuccess from './pages/PersonaSuccess';
import RequireAuth from './components/RequireAuth';
import './App.css';

// Splash component with the main CTA
const Splash: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Create Testings Demo
        </h1>
        <p className="text-xl text-gray-600 mb-12 max-w-md mx-auto">
          Experience seamless persona creation with our UserTesting-inspired interface
        </p>
        <div className="space-y-4">
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors duration-200 shadow-lg hover:shadow-xl"
            onClick={() => navigate('/signup')}
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
};

// App initialization component that checks for current run
const AppInitializer: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkCurrentRun = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      try {
        const response = await fetch('http://localhost:3001/api/tests/runs/current', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            // User has an active run, navigate to resume it
            navigate(`/run-suite/fullPersonaRun?runId=${data.data.runId}`);
          }
        }
      } catch (error) {
        console.error('Error checking current run:', error);
        // Fallback to localStorage if API fails
        const savedRun = localStorage.getItem('currentRunState');
        if (savedRun) {
          try {
            const runData = JSON.parse(savedRun);
            if (runData.runId) {
              navigate(`/run-suite/fullPersonaRun?runId=${runData.runId}`);
            }
          } catch (e) {
            console.error('Error parsing saved run:', e);
          }
        }
      }
    };

    checkCurrentRun();
  }, [navigate]);

  return null;
};

const App: React.FC = () => {
  return (
    <Router>
      <AppInitializer />
      <Routes>
        <Route path="/" element={<Splash />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        } />
        <Route path="/persona/:id" element={
          <RequireAuth>
            <PersonaPage />
          </RequireAuth>
        } />
        <Route path="/persona-success" element={<PersonaSuccess />} />
        <Route path="/create-test" element={<CreateTest />} />
        <Route path="/tests/:testId" element={<TestInstancePage />} />
        <Route path="/run-test/:templateId" element={<TestRunner />} />
        <Route path="/run-suite/:suiteId" element={
          <RequireAuth>
            <TestSuiteRunner />
          </RequireAuth>
        } />
        <Route path="/complete" element={<CompletionPage />} />
      </Routes>
    </Router>
  );
};

export default App; 