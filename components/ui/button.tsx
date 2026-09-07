import * as React from 'react';
import { Pressable, Text, PressableProps } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'flex-row items-center justify-center rounded-2xl active:opacity-80',
  {
    variants: {
      variant: {
        primary: 'bg-accent-brass dark:bg-accent-champagne',
        secondary: 'bg-linen-surface dark:bg-cypress-surface border border-linen-border dark:border-cypress-border',
        danger: 'bg-status-danger',
        ghost: 'bg-transparent',
      },
      size: {
        default: 'h-12 px-5',
        sm: 'h-9 px-3',
        lg: 'h-14 px-8',
        icon: 'h-11 w-11 p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
);

const buttonTextVariants = cva('font-bold', {
  variants: {
    variant: {
      primary: 'text-[#0C1513]',
      secondary: 'text-linen-text-primary dark:text-cypress-text-primary',
      danger: 'text-white',
      ghost: 'text-linen-text-secondary dark:text-cypress-text-secondary',
    },
    size: {
      default: 'text-sm',
      sm: 'text-xs',
      lg: 'text-base',
      icon: 'text-sm',
    },
  },
  defaultVariants: {
    variant: 'primary',
    size: 'default',
  },
});

export interface ButtonProps extends PressableProps, VariantProps<typeof buttonVariants> {
  label?: string;
  children?: React.ReactNode;
  icon?: React.ReactNode;
}

export function Button({ className, variant, size, label, children, icon, ...props }: ButtonProps) {
  return (
    <Pressable className={cn(buttonVariants({ variant, size }), className)} {...props}>
      {icon}
      {label ? (
        <Text className={cn(buttonTextVariants({ variant, size }), icon ? 'ml-2' : '')}>
          {label}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  );
}
