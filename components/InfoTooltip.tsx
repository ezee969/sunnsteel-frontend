import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface InfoTooltipProps {
  content: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
}

export const InfoTooltip = ({ content, side = 'right' }: InfoTooltipProps) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <button
        type="button"
        className="inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-accent hover:text-accent-foreground transition-colors"
      >
        <Info className="w-3 h-3 text-muted-foreground" />
      </button>
    </TooltipTrigger>
    <TooltipContent side={side} className="max-w-xs">
      <p>{content}</p>
    </TooltipContent>
  </Tooltip>
);
