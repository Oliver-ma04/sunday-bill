import React, { useState, useEffect } from 'react';
import { Record, RecordInput, Category } from '../types';
import {
  ForkKnife,
  Car,
  House,
  ShoppingBag,
  GameController,
  Package,
  Plus,
  Coffee,
  BowlFood,
  CookingPot,
  AppleLogo,
  Cookie,
  Bus,
  Train,
  Taxi,
  GasPump,
  Buildings,
  CreditCard,
  Drop,
  Lightbulb,
  Flame,
  BuildingOffice,
  TShirt,
  HandSoap,
  Flower,
  DeviceMobile,
  Books,
  FilmSlate,
  MicrophoneStage,
  AirplaneTilt,
  Barbell,
  FirstAidKit,
  GraduationCap,
  Phone,
  Heart,
  Gift,
  X,
  Check,
  Trash,
  ArrowUp,
  ArrowDown,
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
  '餐饮': <ForkKnife size={24} weight="fill" />,
  '交通': <Car size={24} weight="fill" />,
  '居住': <House size={24} weight="fill" />,
  '购物': <ShoppingBag size={24} weight="fill" />,
  '娱乐': <GameController size={24} weight="fill" />,
  '其他': <Package size={24} weight="fill" />,
};

const subCategoryIcons: Record<string, React.ReactNode> = {
  '早餐': <Coffee size={18} weight="fill" />,
  '午餐': <BowlFood size={18} weight="fill" />,
  '晚餐': <CookingPot size={18} weight="fill" />,
  '饮料': <Coffee size={18} weight="fill" />,
  '水果': <AppleLogo size={18} weight="fill" />,
  '零食': <Cookie size={18} weight="fill" />,
  '外卖': <Package size={18} weight="fill" />,
  '公交': <Bus size={18} weight="fill" />,
  '地铁': <Train size={18} weight="fill" />,
  '出租车': <Taxi size={18} weight="fill" />,
  '加油': <GasPump size={18} weight="fill" />,
  '停车': <Car size={18} weight="fill" />,
  '高速费': <Car size={18} weight="fill" />,
  '房租': <Buildings size={18} weight="fill" />,
  '房贷': <CreditCard size={18} weight="fill" />,
  '水费': <Drop size={18} weight="fill" />,
  '电费': <Lightbulb size={18} weight="fill" />,
  '燃气费': <Flame size={18} weight="fill" />,
  '物业费': <BuildingOffice size={18} weight="fill" />,
  '服装': <TShirt size={18} weight="fill" />,
  '日用品': <HandSoap size={18} weight="fill" />,
  '化妆品': <Flower size={18} weight="fill" />,
  '电子产品': <DeviceMobile size={18} weight="fill" />,
  '书籍': <Books size={18} weight="fill" />,
  '电影': <FilmSlate size={18} weight="fill" />,
  'KTV': <MicrophoneStage size={18} weight="fill" />,
  '旅游': <AirplaneTilt size={18} weight="fill" />,
  '游戏': <GameController size={18} weight="fill" />,
  '健身': <Barbell size={18} weight="fill" />,
  '医疗': <FirstAidKit size={18} weight="fill" />,
  '教育': <GraduationCap size={18} weight="fill" />,
  '通讯': <Phone size={18} weight="fill" />,
  '人情': <Heart size={18} weight="fill" />,
  '捐赠': <Gift size={18} weight="fill" />,
};

const subCategoryColors: Record<string, string> = {
  '早餐': '#ff9a7a',
  '午餐': '#ff7b5c',
  '晚餐': '#e85d3a',
  '饮料': '#ffb89a',
  '水果': '#ff8a65',
  '零食': '#ffc4a8',
  '外卖': '#ff6b4a',
  '公交': '#7ab8ff',
  '地铁': '#4a9eff',
  '出租车': '#8cc4ff',
  '加油': '#3d8be8',
  '停车': '#5ba3ff',
  '高速费': '#6bb3ff',
  '房租': '#b89de8',
  '房贷': '#9575de',
  '水费': '#7dd6f0',
  '电费': '#ffd54f',
  '燃气费': '#ff8a65',
  '物业费': '#a78bde',
  '服装': '#ffc35b',
  '日用品': '#ffb74d',
  '化妆品': '#ffab91',
  '电子产品': '#ffd54f',
  '书籍': '#e8c87a',
  '电影': '#6ee0b0',
  'KTV': '#4dd9a8',
  '旅游': '#5dd9a8',
  '游戏': '#7ae8c4',
  '健身': '#4dd9a8',
  '医疗': '#ff8a8a',
  '教育': '#8aadff',
  '通讯': '#7dd6f0',
  '人情': '#ff9a9a',
  '捐赠': '#a8d4a8',
};

// 预设的二级分类名称，用于判断是否为自定义分类
const presetSubCategories = new Set([
  '早餐', '午餐', '晚餐', '饮料', '水果', '零食', '外卖',
  '公交', '地铁', '出租车', '加油', '停车', '高速费',
  '房租', '房贷', '水费', '电费', '燃气费', '物业费',
  '服装', '日用品', '化妆品', '电子产品', '书籍',
  '电影', 'KTV', '旅游', '游戏', '健身',
  '医疗', '教育', '通讯', '人情', '捐赠',
]);

interface RecordFormProps {
  record?: Record;
  categories: Category[];
  categoriesByParent: Record<number, Category[]>;
  selectedParentId?: number | null;
  onSelectParent?: (id: number | null) => void;
  onSubmit: (input: RecordInput) => void;
  onCancel: () => void;
  onCategoryAdded?: () => void;
  onCategoryDeleted?: () => void;
}

function RecordForm({
  record,
  categories,
  categoriesByParent,
  selectedParentId: externalParentId,
  onSelectParent,
  onSubmit,
  onCancel,
  onCategoryAdded,
  onCategoryDeleted,
}: RecordFormProps) {
  const [amount, setAmount] = useState(record?.amount.toString() || '');
  const [note, setNote] = useState(record?.note || '');
  const [internalParentId, setInternalParentId] = useState<number | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isExpense, setIsExpense] = useState(true); // true = 支出, false = 收入

  // 一级分类自定义输入
  const [showParentCustomInput, setShowParentCustomInput] = useState(false);
  const [parentCustomName, setParentCustomName] = useState('');
  const [isAddingParentCategory, setIsAddingParentCategory] = useState(false);

  // 删除分类后的撤销
  const [showUndo, setShowUndo] = useState(false);
  const [undoTimeout, setUndoTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  const selectedParentId = externalParentId !== undefined ? externalParentId : internalParentId;
  const handleSelectParent = onSelectParent || setInternalParentId;

  useEffect(() => {
    if (record) {
      const category = categories.find(c => c.id === record.categoryId);
      if (category) {
        handleSelectParent(category.parentId);
        setSelectedCategoryId(category.id);
      }
    } else if (!externalParentId && Object.keys(categoriesByParent).length > 0) {
      const parents = categories.filter(c => c.parentId === null);
      if (parents.length > 0) {
        handleSelectParent(parents[0].id);
      }
    }
  }, [record, categories, categoriesByParent, externalParentId, handleSelectParent]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  // 实际提交处理（由添加按钮触发）
  const handleActualSubmit = () => {
    if (!amount || !selectedCategoryId) {
      alert('请填写金额并选择分类');
      return;
    }
    const finalAmount = isExpense ? parseFloat(amount) : -parseFloat(amount);
    onSubmit({
      amount: finalAmount,
      categoryId: selectedCategoryId,
      date: record?.date || new Date().toISOString().split('T')[0],
      note: note.trim(),
    });
  };

  const handleAddCustomCategory = async () => {
    if (!customCategoryName.trim() || !selectedParentId) return;

    setIsAddingCategory(true);
    try {
      const newCategory = await window.electronAPI.addCategory(customCategoryName.trim(), selectedParentId);
      setSelectedCategoryId(newCategory.id);
      setCustomCategoryName('');
      setShowCustomInput(false);
      onCategoryAdded?.();
    } catch (error) {
      console.error('添加分类失败:', error);
    } finally {
      setIsAddingCategory(false);
    }
  };

  // 添加一级分类
  const handleAddParentCategory = async () => {
    if (!parentCustomName.trim()) return;

    setIsAddingParentCategory(true);
    try {
      const newCategory = await window.electronAPI.addParentCategory(parentCustomName.trim());
      setParentCustomName('');
      setShowParentCustomInput(false);
      handleSelectParent(newCategory.id);
      onCategoryAdded?.();
    } catch (error) {
      console.error('添加一级分类失败:', error);
    } finally {
      setIsAddingParentCategory(false);
    }
  };

  // 撤销删除分类
  const handleUndoDeleteCategory = async () => {
    try {
      const result = await window.electronAPI.undoDeleteCategory();
      if (result.success) {
        onCategoryDeleted?.();
        onCategoryAdded?.();
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('撤销删除失败:', error);
    }
    setShowUndo(false);
    if (undoTimeout) {
      clearTimeout(undoTimeout);
      setUndoTimeout(null);
    }
  };

  const handleDeleteCategory = async (catId: number, catName: string) => {
    if (!confirm(`确定要删除分类"${catName}"吗？`)) return;

    try {
      const result = await window.electronAPI.deleteCategory(catId);
      if (result.success) {
        if (selectedCategoryId === catId) {
          setSelectedCategoryId(null);
        }
        if (result.canUndo) {
          setShowUndo(true);
          // 清除之前的timeout
          if (undoTimeout) clearTimeout(undoTimeout);
          // 30秒后自动隐藏
          const timeout = setTimeout(() => {
            setShowUndo(false);
            setUndoTimeout(null);
          }, 30000);
          setUndoTimeout(timeout);
        }
        onCategoryDeleted?.();
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('删除分类失败:', error);
    }
  };

  const isCustomCategory = (name: string) => !presetSubCategories.has(name);

  const parentCategories = categories.filter(c => c.parentId === null);
  const subCategories = selectedParentId
    ? categories.filter(c => c.parentId === selectedParentId)
    : [];

  const getCategoryColor = (name: string) => categoryColors[name] || '#8c9a9c';

  return (
    <form className="record-form" onSubmit={handleFormSubmit} onKeyDown={(e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
      }
    }}>
      <h3>{record ? '编辑记录' : (isExpense ? '新增支出' : '新增收入')}</h3>

      {/* 支出/收入切换 */}
      <div className="type-toggle">
        <button
          type="button"
          className={`type-btn ${isExpense ? 'active' : ''}`}
          onClick={() => setIsExpense(true)}
        >
          <ArrowDown size={16} weight="bold" />
          支出
        </button>
        <button
          type="button"
          className={`type-btn ${!isExpense ? 'active' : ''}`}
          onClick={() => setIsExpense(false)}
        >
          <ArrowUp size={16} weight="bold" />
          收入
        </button>
      </div>

      <div className="form-group">
        <label>金额</label>
        <div className="amount-input-wrapper">
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="form-group">
        <label>一级分类</label>
        <div className="category-grid">
          {parentCategories.map((cat) => (
            <div
              key={cat.id}
              className={`category-btn ${selectedParentId === cat.id ? 'active' : ''}`}
              onClick={() => {
                handleSelectParent(cat.id);
                setSelectedCategoryId(null);
              }}
            >
              <div
                className="cat-icon"
                style={{ backgroundColor: getCategoryColor(cat.name) }}
              >
                {categoryIcons[cat.name] || <Package size={24} weight="fill" />}
              </div>
              <span className="category-name">{cat.name}</span>
              <button
                type="button"
                className="cat-delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteCategory(cat.id, cat.name);
                }}
              >
                <X size={12} weight="bold" />
              </button>
            </div>
          ))}
        </div>
        {/* 添加一级分类 - 单独一行 */}
        {showParentCustomInput ? (
          <div className="custom-category-row">
            <input
              type="text"
              className="custom-category-text-input"
              value={parentCustomName}
              onChange={(e) => setParentCustomName(e.target.value)}
              placeholder="输入新分类名称，回车确认"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.stopPropagation();
                  handleAddParentCategory();
                }
                if (e.key === 'Escape') {
                  setShowParentCustomInput(false);
                  setParentCustomName('');
                }
              }}
            />
            <button
              type="button"
              className="custom-category-confirm"
              onClick={handleAddParentCategory}
              disabled={!parentCustomName.trim() || isAddingParentCategory}
            >
              <Check size={18} weight="bold" />
            </button>
            <button
              type="button"
              className="custom-category-cancel"
              onClick={() => {
                setShowParentCustomInput(false);
                setParentCustomName('');
              }}
            >
              <X size={18} weight="bold" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="add-category-row-btn"
            onClick={() => setShowParentCustomInput(true)}
          >
            <Plus size={16} weight="bold" />
            <span>添加一级分类</span>
          </button>
        )}
      </div>

      {selectedParentId && (
        <div className="form-group">
          <label>二级分类</label>
          <div className="category-grid">
            {subCategories.map((cat) => (
              <div
                key={cat.id}
                className={`category-btn small ${selectedCategoryId === cat.id ? 'active' : ''}`}
                onClick={() => setSelectedCategoryId(cat.id)}
              >
                <div
                  className="cat-icon"
                  style={{ backgroundColor: subCategoryColors[cat.name] || getCategoryColor(cat.parentCategoryName || '') }}
                >
                  {subCategoryIcons[cat.name] || <Package size={18} weight="fill" />}
                </div>
                <span className="category-name">{cat.name}</span>
                <button
                  type="button"
                  className="cat-delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCategory(cat.id, cat.name);
                  }}
                >
                  <X size={12} weight="bold" />
                </button>
              </div>
            ))}
          </div>
          {/* 添加自定义分类 - 单独一行 */}
          {showCustomInput ? (
            <div className="custom-category-row">
              <input
                type="text"
                className="custom-category-text-input"
                value={customCategoryName}
                onChange={(e) => setCustomCategoryName(e.target.value)}
                placeholder="输入新分类名称，按回车确认"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.stopPropagation();
                    handleAddCustomCategory();
                  }
                  if (e.key === 'Escape') {
                    setShowCustomInput(false);
                    setCustomCategoryName('');
                  }
                }}
              />
              <button
                type="button"
                className="custom-category-confirm"
                onClick={handleAddCustomCategory}
                disabled={!customCategoryName.trim() || isAddingCategory}
              >
                <Check size={18} weight="bold" />
              </button>
              <button
                type="button"
                className="custom-category-cancel"
                onClick={() => {
                  setShowCustomInput(false);
                  setCustomCategoryName('');
                }}
              >
                <X size={18} weight="bold" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="add-category-row-btn"
              onClick={() => setShowCustomInput(true)}
            >
              <Plus size={16} weight="bold" />
              <span>添加自定义分类</span>
            </button>
          )}
        </div>
      )}

      <div className="form-group">
        <label>备注（可选）</label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="添加备注..."
        />
      </div>

      <div className="form-actions">
        <button type="button" className="btn-cancel" onClick={onCancel}>
          取消
        </button>
        <button type="button" className="btn-submit" onClick={handleActualSubmit}>
          {record ? '保存' : '添加'}
        </button>
      </div>

      {/* 分类删除撤销提示 */}
      {showUndo && (
        <div className="undo-snackbar">
          <span>分类已删除</span>
          <button onClick={handleUndoDeleteCategory}>撤销</button>
        </div>
      )}
    </form>
  );
}

export default RecordForm;
