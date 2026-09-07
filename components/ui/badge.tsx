import * as React from 'react';
import { View, Text, ViewProps } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'flex-row items-center rounded-full px-2.5 py-1',
  {
    variants: {
      variant: {
        default: 'bg-linen-surface dark:bg-cypress-surface border border-linen-border dark:border-cypress-border',
        safe: 'bg-status-safe/15 border border-status-safe/30',
        warning: 'bg-status-warning/15 border border-status-warning/30',
        danger: 'bg-status-danger/15 border border-status-danger/30',
        accent: 'bg-accent-brass/15 dark:bg-accent-champagne/15 border border-accent-brass/30 dark:border-accent-champagne/30',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const badgeTextVariants = cva('text-xs font-semibold', {
  variants: {
    variant: {
      default: 'text-linen-text-secondary dark:text-cypress-text-secondary',
      safe: 'text-status-safe',
      warning: 'text-status-warning',
      danger: 'text-status-danger',
      accent: 'text-accent-brass dark:text-accent-champagne',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export interface BadgeProps extends ViewProps, VariantProps<typeof badgeVariants> {
  label: string;
  icon?: React.ReactNode;
}

export function Badge({ className, variant, label, icon, ...props }: BadgeProps) {
  return (
    <View className={cn(badgeVariants({ variant }), className)} {...props}>
      {icon}
      <Text className={cn(badgeTextVariants({ variant }), icon ? 'ml-1' : '')}>{label}</Text>
    </View>
  );
}
