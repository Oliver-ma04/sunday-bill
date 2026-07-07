/**
 * RecordList - 记账记录列表组件
 *
 * 功能：展示某一天的记账记录列表
 * 为什么需要这个组件：用户需要查看自己在某一天记了哪些账，以及快速编辑或删除
 */

import React from 'react';
import { Record } from '../types';
import {
  PencilSimple,
  Trash,
  ClipboardText,
  ForkKnife,
  Car,
  House,
  ShoppingBag,
  GameController,
  Package,
} from '@phosphor-icons/react';

/**
 * 一级分类到颜色的映射
 * 为什么用颜色：帮助用户快速区分不同类型的支出，比如餐饮用橙色、交通用蓝色
 */
const categoryColors: Record<string, string> = {
  '餐饮': '#ff7b5c',
  '交通': '#5ba3ff',
  '居住': '#a78bde',
  '购物': '#ffb347',
  '娱乐': '#5dd9a8',
  '其他': '#8c9a9c',
};

/**
 * 一级分类到图标的映射
 * 为什么用图标：比文字更直观，一眼就能看出是哪类支出
 */
const categoryIcons: Record<string, React.ReactNode> = {
  '餐饮': <ForkKnife size={22} weight="fill" />,
  '交通': <Car size={22} weight="fill" />,
  '居住': <House size={22} weight="fill" />,
  '购物': <ShoppingBag size={22} weight="fill" />,
  '娱乐': <GameController size={22} weight="fill" />,
  '其他': <Package size={22} weight="fill" />,
};

/**
 * props 说明：
 * - records: 要展示的记账记录数组
 * - onEdit: 点击编辑按钮时的回调，传入要编辑的记录
 * - onDelete: 点击删除按钮时的回调，传入要删除的记录ID
 */
interface RecordListProps {
  records: Record[];
  onEdit: (record: Record) => void;
  onDelete: (id: number) => void;
}

/**
 * 记录列表组件
 *
 * 两种状态：
 * 1. 空状态：没有任何记录时显示引导文案
 * 2. 列表状态：有记录时逐条显示，每条显示分类、金额、备注和操作按钮
 */
function RecordList({ records, onEdit, onDelete }: RecordListProps) {
  // 空状态：当没有记录时显示，引导用户开始记账
  if (records.length === 0) {
    return (
      <div className="empty-state">
        <ClipboardText size={72} weight="duotone" />
        <div className="empty-text">暂无记账记录</div>
        <div className="hint">点击下方"新增"开始记账</div>
      </div>
    );
  }

  // 有记录时，逐条展示
  // 每条记录包含：图标（按一级分类）、分类名称、金额、备注、编辑/删除按钮
  return (
    <div className="record-list">
      {records.map((record) => (
        <div key={record.id} className="record-item">
          {/* 左侧图标：根据一级分类显示对应颜色和图标 */}
          <div
            className="record-icon"
            style={{ backgroundColor: categoryColors[record.parentCategoryName] || '#8c9a9c' }}
          >
            {categoryIcons[record.parentCategoryName] || <Package size={22} weight="fill" />}
          </div>

          {/* 中间信息区域：分类名称 + 备注 */}
          <div className="record-info">
            <span className="record-category">
              {/* 格式：一级分类 - 二级分类 */}
              {record.parentCategoryName} - {record.categoryName}
            </span>
            {/* 备注需要转义 HTML 特殊字符，防止 XSS 攻击 */}
            {record.note && (
              <span className="record-note">
                {record.note.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
              </span>
            )}
          </div>

          {/* 右侧金额 */}
          <span className="record-amount">{record.amount.toFixed(2)}</span>

          {/* 操作按钮：编辑和删除 */}
          <div className="record-actions">
            <button className="btn-icon" onClick={() => onEdit(record)}>
              <PencilSimple size={16} weight="bold" />
            </button>
            <button className="btn-icon delete" onClick={() => onDelete(record.id)}>
              <Trash size={16} weight="bold" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default RecordList;
