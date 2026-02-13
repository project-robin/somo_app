'use client';

import { motion } from 'framer-motion';
import { Check, Loader2, Sparkles, FileSearch, Calculator, Brain } from 'lucide-react';

interface ToolCall {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed';
  startTime: number;
}

interface ToolCallIndicatorProps {
  tool: ToolCall;
}

const toolIcons: Record<string, React.ElementType> = {
  'D10': FileSearch,
  'D1': FileSearch,
  'D9': FileSearch,
  'D7': FileSearch,
  'D12': FileSearch,
  'chart': FileSearch,
  'natal': FileSearch,
  'transit': FileSearch,
  'divisional': FileSearch,
  'calculation': Calculator,
  'analysis': Brain,
  'search': FileSearch,
  'default': Sparkles,
};

const toolDisplayNames: Record<string, string> = {
  'D10': 'D10 Career Chart',
  'D1': 'Rasi Chart',
  'D9': 'Navamsa Chart',
  'D7': 'Saptamsa Chart',
  'D12': 'Dwadasamsa Chart',
  'chart': 'Chart Analysis',
  'natal': 'Natal Analysis',
  'transit': 'Transit Analysis',
  'divisional': 'Divisional Charts',
  'calculation': 'Calculations',
  'analysis': 'Analysis',
  'search': 'Searching',
  'default': 'Processing',
};

export function ToolCallIndicator({ tool }: ToolCallIndicatorProps) {
  const Icon = toolIcons[tool.name] || toolIcons.default;
  const displayName = toolDisplayNames[tool.name] || tool.name;
  
  const getStatusText = () => {
    switch (tool.status) {
      case 'pending':
        return 'Preparing...';
      case 'running':
        return 'Analyzing...';
      case 'completed':
        return 'Complete';
      default:
        return 'Processing...';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg border text-sm transition-all duration-300 ${
        tool.status === 'completed'
          ? 'bg-[var(--surface-secondary)] border-[var(--border-subtle)] text-[var(--text-secondary)]'
          : 'bg-[var(--surface-primary)] border-[var(--border-subtle)] text-[var(--text-primary)]'
      }`}
    >
      <div className={`flex-shrink-0 ${
        tool.status === 'completed' ? 'text-[var(--text-tertiary)]' : 'text-[var(--text-secondary)]'
      }`}>
        {tool.status === 'completed' ? (
          <Check className="w-4 h-4" />
        ) : tool.status === 'running' ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Icon className="w-4 h-4" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">
          {displayName}
        </p>
      </div>
      
      <div className={`text-xs whitespace-nowrap ${
        tool.status === 'completed' 
          ? 'text-[var(--text-tertiary)]' 
          : 'text-[var(--text-secondary)]'
      }`}>
        {getStatusText()}
      </div>
    </motion.div>
  );
}
