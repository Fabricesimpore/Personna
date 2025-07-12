import React, { useState } from 'react';
import { Settings, Search, UserPlus, Send, Star, Plus, FileText } from 'lucide-react';
import { Button } from './ui/button';
import SettingsPanel from './SettingsPanel';
import SurveyWizard from './SurveyWizard';
import CardSort from './CardSort';

interface DemoInterfaceProps {
  onEvent: (eventName: string, data?: any) => void;
  currentTask?: string;
}

const DemoInterface: React.FC<DemoInterfaceProps> = ({ onEvent, currentTask }) => {
  // Hide-to-reveal state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSurveyWizardOpen, setIsSurveyWizardOpen] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isContactFormVisible, setIsContactFormVisible] = useState(false);
  const [isCardSortVisible, setIsCardSortVisible] = useState(false);
  const [isSurveyWizardVisible, setIsSurveyWizardVisible] = useState(false);
  const [isCardSortOpen, setIsCardSortOpen] = useState(false);
  const [contacts, setContacts] = useState<Array<{id: string, name: string, email: string, phone: string}>>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredContacts, setFilteredContacts] = useState<Array<{id: string, name: string, email: string, phone: string}>>([]);
  
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const handleSettingsClick = () => {
    setIsSettingsOpen(true);
    onEvent('settings.opened');
  };

  const handleSearchClick = () => {
    setIsSearchActive(true);
    onEvent('search.activated');
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.trim()) {
      const filtered = contacts.filter(contact => 
        contact.name.toLowerCase().includes(query.toLowerCase()) ||
        contact.email.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredContacts(filtered);
    } else {
      setFilteredContacts([]);
    }
  };

  const handleAddContact = () => {
    setIsContactFormVisible(true);
    onEvent('contact.added');
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newContact = {
      id: Date.now().toString(),
      ...contactForm
    };
    setContacts(prev => [...prev, newContact]);
    onEvent('form.submitted', contactForm);
    setContactForm({ name: '', email: '', phone: '' });
    setIsContactFormVisible(false);
  };

  const handleSurveyClick = () => {
    setIsSurveyWizardVisible(true);
    setIsSurveyWizardOpen(true);
  };

  const handleRatingSubmit = (rating: number) => {
    onEvent('rating.submitted', { rating });
  };

  const handleCardSortLaunch = () => {
    setIsCardSortVisible(true);
    setIsCardSortOpen(true);
    onEvent('cardSort.launched');
  };

  return (
    <div className="bg-white border rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Demo Interface</h3>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSettingsClick}
            className="flex items-center space-x-1"
          >
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSearchClick}
            className="flex items-center space-x-1"
          >
            <Search className="h-4 w-4" />
            <span>Search</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddContact}
            className="flex items-center space-x-1"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add Contact</span>
          </Button>
        </div>
      </div>
      
      <div className="space-y-6">
        {/* Contact Form Section - Hide to Reveal */}
        <div className="p-4 border rounded-lg">
          <h4 className="font-medium mb-3">Contact Management</h4>
          {!isContactFormVisible ? (
            <Button onClick={handleAddContact} className="flex items-center space-x-1">
              <Plus className="h-4 w-4" />
              <span>Add Contact</span>
            </Button>
          ) : (
            <form onSubmit={handleContactSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={contactForm.name}
                  onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                  placeholder="Enter contact name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                  placeholder="Enter email address"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="tel"
                  value={contactForm.phone}
                  onChange={(e) => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                  placeholder="Enter phone number"
                />
              </div>
              <Button type="submit" className="flex items-center space-x-1">
                <Send className="h-4 w-4" />
                <span>Submit</span>
              </Button>
            </form>
          )}
        </div>

        {/* Search Section */}
        {isSearchActive && (
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-3">Search Contacts</h4>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search contacts..."
              className="w-full p-2 border rounded-md mb-3"
            />
            <div className="space-y-2">
              {filteredContacts.length > 0 ? (
                filteredContacts.map(contact => (
                  <div key={contact.id} className="p-2 bg-gray-50 rounded">
                    {contact.name} - {contact.email}
                  </div>
                ))
              ) : searchQuery ? (
                <div className="text-gray-500 text-sm">No contacts found</div>
              ) : (
                <div className="text-gray-500 text-sm">Start typing to search contacts</div>
              )}
            </div>
          </div>
        )}

        {/* Contacts List */}
        {contacts.length > 0 && (
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-3">Your Contacts ({contacts.length})</h4>
            <div className="space-y-2">
              {contacts.map(contact => (
                <div key={contact.id} className="p-2 bg-blue-50 rounded">
                  <div className="font-medium">{contact.name}</div>
                  <div className="text-sm text-gray-600">{contact.email}</div>
                  {contact.phone && (
                    <div className="text-sm text-gray-600">{contact.phone}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Survey Section - Hide to Reveal */}
        <div className="p-4 border rounded-lg">
          <h4 className="font-medium mb-3">User Experience Survey</h4>
          <p className="text-sm text-gray-600 mb-3">
            Help us improve by completing this short survey.
          </p>
          {!isSurveyWizardVisible ? (
            <Button onClick={handleSurveyClick} variant="outline" className="flex items-center space-x-1">
              <FileText className="h-4 w-4" />
              <span>Launch Survey</span>
            </Button>
          ) : (
            <div className="text-sm text-green-600">
              ✓ Survey wizard launched
            </div>
          )}
        </div>

        {/* Card Sort Section - Hide to Reveal */}
        <div className="p-4 border rounded-lg">
          <h4 className="font-medium mb-3">Product Organization</h4>
          <p className="text-sm text-gray-600 mb-3">
            Organize products into logical categories.
          </p>
          {!isCardSortVisible ? (
            <Button onClick={handleCardSortLaunch} variant="outline" className="flex items-center space-x-1">
              <FileText className="h-4 w-4" />
              <span>Launch Card Sort</span>
            </Button>
          ) : (
            <div className="text-sm text-green-600">
              ✓ Card sort interface launched
            </div>
          )}
        </div>

        {/* Rating Section */}
        <div className="p-4 border rounded-lg">
          <h4 className="font-medium mb-3">Rate Your Experience</h4>
          <div className="flex space-x-2">
            {[1, 2, 3, 4, 5].map(rating => (
              <button
                key={rating}
                onClick={() => handleRatingSubmit(rating)}
                className="p-2 border rounded hover:bg-gray-50 flex items-center space-x-1"
              >
                <Star className="h-4 w-4" />
                <span>{rating}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Modal Components */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onEvent={onEvent}
      />
      
      <SurveyWizard
        isOpen={isSurveyWizardOpen}
        onClose={() => setIsSurveyWizardOpen(false)}
        onEvent={onEvent}
      />
      
      <CardSort
        isOpen={isCardSortOpen}
        onClose={() => setIsCardSortOpen(false)}
        onEvent={onEvent}
      />
    </div>
  );
};

export default DemoInterface; 