import React, { useState } from 'react';
import { Category, RecordInput } from '../types';
import RecordForm from './RecordForm';

interface CategorySelectorProps {
  categoriesByParent: Record<number, Category[]>;
  selectedParentId: number | null;
  onSelectParent: (id: number | null) => void;
}

function CategorySelector({ categoriesByParent, selectedParentId, onSelectParent }: CategorySelectorProps) {
  const parentCategories = Object.entries(categoriesByParent).map(([id, cats]) => ({
    id: parseInt(id),
    name: cats.length > 0 ? cats[0].parentId === null ? cats[0].name : '未分类' : '未知',
  }));

  const uniqueParents = parentCategories.filter((cat, index, self) =>
    index === self.findIndex(c => c.id === cat.id)
  );

  const subCategories = selectedParentId ? categoriesByParent[selectedParentId] || [] : [];

  return (
    <div className="category-selector">
      <h3>选择分类</h3>
      <div className="parent-categories">
        {uniqueParents.map((cat) => (
          <button
            key={cat.id}
            className={`category-btn ${selectedParentId === cat.id ? 'active' : ''}`}
            onClick={() => onSelectParent(cat.id)}
          >
            {cat.name}
          </button>
        ))}
      </div>
      {selectedParentId && subCategories.length > 0 && (
        <div className="sub-categories">
          {subCategories.filter(c => c.parentId !== null).map((cat) => (
            <span key={cat.id} className="sub-category-name">
              {cat.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default CategorySelector;
