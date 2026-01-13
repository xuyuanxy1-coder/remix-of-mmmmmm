import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="w-9 h-9 rounded-full"
    >
      {theme === 'light' ? (
        <Moon className="w-5 h-5" />
      ) : (
        <Sun className="w-5 h-5" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
};

export default ThemeToggle;
