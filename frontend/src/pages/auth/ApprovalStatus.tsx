import React from 'react';
import { Link } from 'react-router-dom';
import ApprovalStatus from '@/components/auth/ApprovalStatus';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';

const ApprovalStatusPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-6">
      {/* Theme Toggle Button */}
      <div className="fixed top-4 right-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleTheme}
          className="h-10 w-10 rounded-full border-2 hover:border-primary transition-all duration-200"
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>
      </div>

      <div className="w-full max-w-2xl">
        <ApprovalStatus />
        
        <div className="mt-6 text-center">
          <Link to="/auth/login">
            <Button variant="outline">
              Back to Login
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ApprovalStatusPage;
