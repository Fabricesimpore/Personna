import React, { useState } from 'react';
import { X, User, Mail, Phone } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onEvent: (eventName: string, data?: any) => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose, onEvent }) => {
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    role: ''
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onEvent('profile.submitted', profileData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold">Settings</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <input
                type="text"
                value={profileData.name}
                onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full p-2 border rounded-md"
                placeholder="Enter your full name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <input
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full p-2 border rounded-md"
                placeholder="Enter your email"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone</label>
              <input
                type="tel"
                value={profileData.phone}
                onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full p-2 border rounded-md"
                placeholder="Enter your phone number"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <select
                value={profileData.role}
                onChange={(e) => setProfileData(prev => ({ ...prev, role: e.target.value }))}
                className="w-full p-2 border rounded-md"
                required
              >
                <option value="">Select your role</option>
                <option value="manager">Manager</option>
                <option value="developer">Developer</option>
                <option value="designer">Designer</option>
                <option value="analyst">Analyst</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <Button type="submit" className="w-full">
              Save Profile
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPanel; 