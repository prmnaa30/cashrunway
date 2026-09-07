import * as React from 'react';
import { View, Text, ViewProps, TextProps } from 'react-native';
import { cn } from '@/lib/utils';

export function Card({ className, ...props }: ViewProps) {
  return (
    <View
      className={cn(
        'rounded-3xl bg-linen-card dark:bg-cypress-card border border-linen-border dark:border-cypress-border p-5 shadow-sm',
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: ViewProps) {
  return <View className={cn('mb-3 flex-row items-center justify-between', className)} {...props} />;
}

export function CardTitle({ className, ...props }: TextProps) {
  return (
    <Text
      className={cn('text-lg font-bold text-linen-text-primary dark:text-cypress-text-primary', className)}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: TextProps) {
  return (
    <Text
      className={cn('text-xs text-linen-text-secondary dark:text-cypress-text-secondary', className)}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }: ViewProps) {
  return <View className={cn('', className)} {...props} />;
}

export function CardFooter({ className, ...props }: ViewProps) {
  return (
    <View
      className={cn('mt-4 border-t border-linen-border dark:border-cypress-border pt-3 flex-row justify-between items-center', className)}
      {...props}
    />
  );
}
