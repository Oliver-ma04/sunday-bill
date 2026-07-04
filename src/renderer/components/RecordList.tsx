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

const categoryColors: Record<string, string> = {
  '餐饮': '#ff7b5c',
  '交通': '#5ba3ff',
  '居住': '#a78bde',
  '购物': '#ffb347',
  '娱乐': '#5dd9a8',
  '其他': '#8c9a9c',
};

const categoryIcons: Record<string, React.ReactNode> = {
  '餐饮': <ForkKnife size={22} weight="fill" />,
  '交通': <Car size={22} weight="fill" />,
  '居住': <House size={22} weight="fill" />,
  '购物': <ShoppingBag size={22} weight="fill" />,
  '娱乐': <GameController size={22} weight="fill" />,
  '其他': <Package size={22} weight="fill" />,
};

interface RecordListProps {
  records: Record[];
  onEdit: (record: Record) => void;
  onDelete: (id: number) => void;
}

function RecordList({ records, onEdit, onDelete }: RecordListProps) {
  if (records.length === 0) {
    return (
      <div className="empty-state">
        <ClipboardText size={72} weight="duotone" />
        <div className="empty-text">暂无记账记录</div>
        <div className="hint">点击下方"新增"开始记账</div>
      </div>
    );
  }

  return (
    <div className="record-list">
      {records.map((record) => (
        <div key={record.id} className="record-item">
          <div
            className="record-icon"
            style={{ backgroundColor: categoryColors[record.parentCategoryName] || '#8c9a9c' }}
          >
            {categoryIcons[record.parentCategoryName] || <Package size={22} weight="fill" />}
          </div>
          <div className="record-info">
            <span className="record-category">
              {record.parentCategoryName} - {record.categoryName}
            </span>
            {record.note && <span className="record-note">{record.note}</span>}
          </div>
          <span className="record-amount">{record.amount.toFixed(2)}</span>
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
