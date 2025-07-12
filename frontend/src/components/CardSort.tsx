import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { X, CheckCircle } from 'lucide-react';

interface CardSortProps {
  isOpen: boolean;
  onClose: () => void;
  onEvent: (eventName: string, data?: any) => void;
}

interface CardItem {
  id: string;
  title: string;
  category: string;
}

interface Category {
  id: string;
  name: string;
  cards: CardItem[];
}

const CardSort: React.FC<CardSortProps> = ({ isOpen, onClose, onEvent }) => {
  const [categories, setCategories] = useState<Category[]>([
    { id: 'electronics', name: 'Electronics', cards: [] },
    { id: 'clothing', name: 'Clothing', cards: [] },
    { id: 'books', name: 'Books', cards: [] },
    { id: 'home', name: 'Home & Garden', cards: [] }
  ]);

  const [unassignedCards, setUnassignedCards] = useState<CardItem[]>([
    { id: '1', title: 'iPhone 15 Pro', category: 'electronics' },
    { id: '2', title: 'Nike Running Shoes', category: 'clothing' },
    { id: '3', title: 'The Great Gatsby', category: 'books' },
    { id: '4', title: 'Coffee Maker', category: 'home' },
    { id: '5', title: 'Samsung TV', category: 'electronics' },
    { id: '6', title: 'Denim Jeans', category: 'clothing' },
    { id: '7', title: 'Python Programming', category: 'books' },
    { id: '8', title: 'Garden Tools', category: 'home' }
  ]);

  const [isCompleted, setIsCompleted] = useState(false);

  const handleDragStart = (e: React.DragEvent, card: CardItem) => {
    e.dataTransfer.setData('text/plain', JSON.stringify(card));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, categoryId: string) => {
    e.preventDefault();
    const cardData = e.dataTransfer.getData('text/plain');
    const card: CardItem = JSON.parse(cardData);

    // Remove from unassigned
    setUnassignedCards(prev => prev.filter(c => c.id !== card.id));

    // Add to category
    setCategories(prev => prev.map(cat => {
      if (cat.id === categoryId) {
        return { ...cat, cards: [...cat.cards, card] };
      }
      return cat;
    }));

    // Check if all cards are assigned
    setTimeout(() => {
      const totalAssigned = categories.reduce((sum, cat) => sum + cat.cards.length, 0);
      if (totalAssigned === 8) { // All cards assigned
        setIsCompleted(true);
        onEvent('cardSort.completed', { categories });
      }
    }, 100);
  };

  const handleCardRemove = (cardId: string, categoryId: string) => {
    const card = categories.find(cat => cat.id === categoryId)?.cards.find(c => c.id === cardId);
    if (card) {
      // Remove from category
      setCategories(prev => prev.map(cat => {
        if (cat.id === categoryId) {
          return { ...cat, cards: cat.cards.filter(c => c.id !== cardId) };
        }
        return cat;
      }));

      // Add back to unassigned
      setUnassignedCards(prev => [...prev, card]);
      setIsCompleted(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold">Card Sort Exercise</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-sm text-gray-600 mb-4">
            Drag each product card into the appropriate category bucket. 
            {isCompleted && (
              <div className="flex items-center space-x-2 text-green-600 mt-2">
                <CheckCircle className="h-4 w-4" />
                <span>All cards sorted successfully!</span>
              </div>
            )}
          </div>

          {/* Unassigned Cards */}
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-3">Unassigned Cards</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {unassignedCards.map(card => (
                <div
                  key={card.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, card)}
                  className="p-3 bg-gray-50 border rounded cursor-move hover:bg-gray-100 transition-colors"
                >
                  <div className="text-sm font-medium">{card.title}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map(category => (
              <div
                key={category.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, category.id)}
                className="border-2 border-dashed border-gray-300 rounded-lg p-4 min-h-[200px]"
              >
                <h3 className="font-medium mb-3 text-center">{category.name}</h3>
                <div className="space-y-2">
                  {category.cards.map(card => (
                    <div
                      key={card.id}
                      className="p-2 bg-blue-50 border rounded flex items-center justify-between"
                    >
                      <span className="text-sm">{card.title}</span>
                      <button
                        onClick={() => handleCardRemove(card.id, category.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {isCompleted && (
            <div className="flex justify-center">
              <Button onClick={onClose} className="bg-green-600 hover:bg-green-700">
                Complete Exercise
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CardSort; 