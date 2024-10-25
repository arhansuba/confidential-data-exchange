import { useState, useEffect } from 'react';
//import { cn } from '@/lib/utils'; // Utility for conditional classes
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { XIcon } from 'lucide-react';

export type ToastProps = {
  title?: string;
  description: string;
  duration?: number; // Duration in ms
  onClose?: () => void;
};

export const Toast = ({ title, description, duration = 5000, onClose }: ToastProps) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onClose && onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!visible) return null;

    function cn(arg0: string, arg1: string): string | undefined {
        throw new Error('Function not implemented.');
    }

  return (
    <div className={cn('fixed bottom-4 right-4 z-50 w-80', 'shadow-md')}>
      <Alert className="bg-white border rounded-lg shadow-lg p-4 flex items-start space-x-2">
        <div className="flex-1">
          {title && <AlertTitle className="font-semibold">{title}</AlertTitle>}
          <AlertDescription>{description}</AlertDescription>
        </div>
        <button
          onClick={() => {
            setVisible(false);
            onClose && onClose();
          }}
          className="text-gray-500 hover:text-gray-700"
        >
          <XIcon size={20} />
        </button>
      </Alert>
    </div>
  );
};