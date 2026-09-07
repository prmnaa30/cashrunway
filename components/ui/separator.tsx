import * as React from 'react';
import { View, ViewProps } from 'react-native';
import { cn } from '@/lib/utils';

export function Separator({ className, ...props }: ViewProps) {
  return (
    <View
      className={cn('h-[1px] w-full bg-linen-border dark:bg-cypress-border my-3', className)}
      {...props}
    />
  );
}
