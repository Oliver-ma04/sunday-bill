/**
 * CategorySelector - 分类选择组件
 *
 * 功能：让用户选择记账的分类（一级分类 → 二级分类）
 * 为什么需要这个组件：用户记账时需要指定"餐饮-早餐"这样的完整分类路径
 */

import React from 'react';
import { Category } from '../types';

/**
 * props 说明：
 * - categoriesByParent: 以父分类ID为key的分类映射表，用于快速查找子分类
 * - selectedParentId: 当前选中的一级分类ID
 * - onSelectParent: 当用户选择某个一级分类时的回调
 */
interface CategorySelectorProps {
  categoriesByParent: Record<number, Category[]>;
  selectedParentId: number | null;
  onSelectParent: (id: number | null) => void;
}

/**
 * 分类选择器组件
 *
 * 工作流程：
 * 1. 从 categoriesByParent 提取所有一级分类（父分类）
 * 2. 显示一级分类按钮供用户点击
 * 3. 当用户选中某个一级分类后，显示该分类下的所有二级分类供选择
 */
function CategorySelector({ categoriesByParent, selectedParentId, onSelectParent }: CategorySelectorProps) {
  // 使用 Object.keys 代替 Object.entries，避免 string key 类型问题
  // Object.keys 返回 string[]，需要显式转换为 number
  const parentCategories = Object.keys(categoriesByParent).map((id) => {
    const cats = categoriesByParent[Number(id)];
    return {
      id: Number(id),
      // 找到这个分类组中的父分类名称（第一个 parentId 为 null 的就是父分类）
      name: cats.length > 0 ? cats[0].parentId === null ? cats[0].name : '未分类' : '未知',
    };
  });

  // 去重：避免因为数据问题导致同一个父分类出现多次
  // filter + findIndex 的组合可以保留第一个出现的元素
  const uniqueParents = parentCategories.filter((cat, index, self) =>
    index === self.findIndex(c => c.id === cat.id)
  );

  // 根据选中的一级分类，获取对应的二级分类列表
  // 如果没有选中任何一级分类，则不显示二级分类
  const subCategories = selectedParentId ? categoriesByParent[selectedParentId] || [] : [];

  return (
    <div className="category-selector">
      <h3>选择分类</h3>

      {/* 一级分类按钮区域 */}
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

      {/* 二级分类显示区域：只有选中了一级分类后才显示 */}
      {selectedParentId && subCategories.length > 0 && (
        <div className="sub-categories">
          {subCategories.filter(c => c.parentId !== null).map((cat) => (
            // parentId 不为 null 的是二级分类
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
