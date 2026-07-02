import * as React from 'react';
import { Input, type InputProps } from '@/components/ui/input';

/** @deprecated Используйте обычный Input — AI-кнопка убрана. */
export interface AiInputContext {
  scope: string;
  field: string;
  label: string;
}

export interface InputWithAiProps extends InputProps {
  aiContext?: AiInputContext;
  onAiSuggest?: (context: AiInputContext) => void;
}

export const InputWithAi = React.forwardRef<HTMLInputElement, InputWithAiProps>(
  ({ className, aiContext: _aiContext, onAiSuggest: _onAiSuggest, ...props }, ref) => {
    return <Input ref={ref} className={className} {...props} />;
  },
);
InputWithAi.displayName = 'InputWithAi';
