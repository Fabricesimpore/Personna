import React from 'react';

interface PrototypeImageProps {
  className?: string;
}

const PrototypeImage: React.FC<PrototypeImageProps> = ({ className = '' }) => {
  return (
    <div className={`bg-white border rounded-lg p-6 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Product Dashboard</h2>
        <div className="flex space-x-4">
          <button className="text-blue-600 hover:text-blue-800">Dashboard</button>
          <button className="text-blue-600 hover:text-blue-800">Analytics</button>
          <button className="text-blue-600 hover:text-blue-800">Settings</button>
          <button className="text-blue-600 hover:text-blue-800">Profile</button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-2">📊 Analytics Overview</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Total Users</span>
              <span className="font-medium">1,234</span>
            </div>
            <div className="flex justify-between">
              <span>Active Sessions</span>
              <span className="font-medium">567</span>
            </div>
            <div className="flex justify-between">
              <span>Conversion Rate</span>
              <span className="font-medium text-green-600">12.5%</span>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-2">🚀 Recent Activity</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              <span>New user registration</span>
            </div>
            <div className="flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
              <span>Feature update completed</span>
            </div>
            <div className="flex items-center">
              <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
              <span>System maintenance</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-6 bg-gray-50 p-4 rounded">
        <h3 className="font-medium mb-2">Quick Actions</h3>
        <div className="flex space-x-4">
          <button className="bg-blue-500 text-white px-4 py-2 rounded">Create Report</button>
          <button className="bg-green-500 text-white px-4 py-2 rounded">Export Data</button>
          <button className="bg-purple-500 text-white px-4 py-2 rounded">Share Dashboard</button>
        </div>
      </div>
    </div>
  );
};

export default PrototypeImage; 