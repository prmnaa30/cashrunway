import React from 'react';
import { View } from 'react-native';
import {
  Utensils,
  Car,
  ShoppingBag,
  Coffee,
  HeartPulse,
  Home,
  Wifi,
  Zap,
  Tv,
  CreditCard,
  Briefcase,
  Laptop,
  Gift,
  TrendingUp,
  ArrowLeftRight,
  Scale,
  CircleDollarSign,
  type LucideIcon,
} from 'lucide-react-native';

const ICON_MAP: Record<string, LucideIcon> = {
  cat_food: Utensils,
  cat_transport: Car,
  cat_groceries: ShoppingBag,
  cat_coffee: Coffee,
  cat_health: HeartPulse,
  cat_rent: Home,
  cat_wifi: Wifi,
  cat_electricity: Zap,
  cat_subs: Tv,
  cat_installment: CreditCard,
  cat_salary: Briefcase,
  cat_freelance: Laptop,
  cat_bonus: Gift,
  cat_interest: TrendingUp,
};

interface CategoryIconProps {
  categoryId?: string | null;
  type?: 'income' | 'expense' | 'transfer' | 'adjustment';
  size?: number;
  className?: string;
  color?: string;
}

export function CategoryIcon({
  categoryId,
  type,
  size = 18,
  className,
  color,
}: CategoryIconProps) {
  let IconComponent: LucideIcon = CircleDollarSign;

  if (type === 'transfer') {
    IconComponent = ArrowLeftRight;
  } else if (type === 'adjustment') {
    IconComponent = Scale;
  } else if (categoryId && ICON_MAP[categoryId]) {
    IconComponent = ICON_MAP[categoryId];
  } else if (type === 'income') {
    IconComponent = TrendingUp;
  }

  return <IconComponent size={size} color={color} />;
}
