import { describe, it, expect } from 'vitest';
import { generateId, Category } from '../types';

describe('Category Management DB & Logic', () => {
  let mockCategories: Category[] = [
    {
      id: 'cat_food',
      name: 'Makanan & Minuman',
      type: 'expense',
      icon: '🍔',
      isFixed: 0,
      isDefault: 1,
    },
    {
      id: 'cat_salary',
      name: 'Gaji Utama',
      type: 'income',
      icon: '💼',
      isFixed: 0,
      isDefault: 1,
    },
  ];

  function createCategoryMock(data: {
    name: string;
    type: 'income' | 'expense';
    icon: string;
    isFixed?: number;
  }): Category {
    const trimmedName = data.name.trim();
    if (!trimmedName) {
      throw new Error('Category name cannot be empty');
    }

    const newCat: Category = {
      id: generateId('cat'),
      name: trimmedName,
      type: data.type,
      icon: data.icon || (data.type === 'income' ? '💰' : '💸'),
      isFixed: data.isFixed ?? 0,
      isDefault: 0,
    };

    mockCategories.push(newCat);
    return newCat;
  }

  function updateCategoryMock(
    id: string,
    updates: { name?: string; icon?: string }
  ): Category {
    const cat = mockCategories.find((c) => c.id === id);
    if (!cat) throw new Error('Category not found');

    if (updates.name !== undefined) {
      const trimmed = updates.name.trim();
      if (!trimmed) throw new Error('Category name cannot be empty');
      cat.name = trimmed;
    }
    if (updates.icon !== undefined) {
      cat.icon = updates.icon;
    }

    return cat;
  }

  function deleteCategoryMock(id: string): void {
    const cat = mockCategories.find((c) => c.id === id);
    if (!cat) throw new Error('Category not found');
    if (cat.isDefault === 1) {
      throw new Error('Cannot delete default system category');
    }

    mockCategories = mockCategories.filter((c) => c.id !== id);
  }

  it('creates custom category with isDefault=0 and unique id', () => {
    const created = createCategoryMock({
      name: '  Skincare & Selfcare  ',
      type: 'expense',
      icon: '🧴',
    });

    expect(created.id.startsWith('cat_')).toBe(true);
    expect(created.name).toBe('Skincare & Selfcare');
    expect(created.type).toBe('expense');
    expect(created.icon).toBe('🧴');
    expect(created.isDefault).toBe(0);
    expect(created.isFixed).toBe(0);
    expect(mockCategories.some((c) => c.id === created.id)).toBe(true);
  });

  it('updates category name and icon', () => {
    const custom = createCategoryMock({
      name: 'Langganan SaaS',
      type: 'expense',
      icon: '💻',
    });

    const updated = updateCategoryMock(custom.id, {
      name: 'Software Subscription',
      icon: '⚡',
    });

    expect(updated.name).toBe('Software Subscription');
    expect(updated.icon).toBe('⚡');
  });

  it('prevents deleting default categories', () => {
    expect(() => deleteCategoryMock('cat_food')).toThrow(
      'Cannot delete default system category'
    );
    expect(mockCategories.some((c) => c.id === 'cat_food')).toBe(true);
  });

  it('successfully deletes custom category', () => {
    const custom = createCategoryMock({
      name: 'Temporary Cat',
      type: 'expense',
      icon: '📦',
    });

    deleteCategoryMock(custom.id);
    expect(mockCategories.some((c) => c.id === custom.id)).toBe(false);
  });
});
