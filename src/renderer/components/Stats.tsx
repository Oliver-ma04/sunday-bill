import React, { useState, useEffect } from 'react';
import {
  ForkKnife,
  Car,
  House,
  ShoppingBag,
  GameController,
  Package,
  ChartPie,
} from '@phosphor-icons/react';

interface StatsProps {
  date: string;
}

interface MonthlyStats {
  total: number;
  byCategory: Record<string, number>;
}

const categoryColors: Record<string, string> = {
  '餐饮': '#ff7b5c',
  '交通': '#5ba3ff',
  '居住': '#a78bde',
  '购物': '#ffb347',
  '娱乐': '#5dd9a8',
  '其他': '#8c9a9c',
};

const categoryIcons: Record<string, React.ReactNode> = {
  '餐饮': <ForkKnife size={18} weight="fill" />,
  '交通': <Car size={18} weight="fill" />,
  '居住': <House size={18} weight="fill" />,
  '购物': <ShoppingBag size={18} weight="fill" />,
  '娱乐': <GameController size={18} weight="fill" />,
  '其他': <Package size={18} weight="fill" />,
};

function Stats({ date }: StatsProps) {
  const [stats, setStats] = useState<MonthlyStats>({ total: 0, byCategory: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      const d = new Date(date);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const result = await window.electronAPI.getMonthlyStats(year, month);
      setStats(result);
      setLoading(false);
    };
    loadStats();
  }, [date]);

  const formatMonth = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}年${d.getMonth() + 1}月`;
  };

  const sortedCategories = Object.entries(stats.byCategory).sort((a, b) => b[1] - a[1]);

  const getPieGradient = () => {
    let currentDeg = 0;
    const gradients: string[] = [];

    for (const [category, amount] of sortedCategories) {
      const percent = stats.total > 0 ? (amount / stats.total) * 100 : 0;
      const deg = (percent / 100) * 360;
      gradients.push(`${categoryColors[category] || '#999'} ${currentDeg}deg ${currentDeg + deg}deg`);
      currentDeg += deg;
    }

    return `conic-gradient(${gradients.join(', ')})`;
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="stats">
      <div className="stats-main">
        <div className="stats-section">
          <h3>{formatMonth(date)} 支出统计</h3>
          <div className="stats-total">
            <span className="total-label">本月支出</span>
            <span className="total-amount">¥{stats.total.toFixed(2)}</span>
          </div>

          {sortedCategories.length === 0 ? (
            <div className="empty-state">
              <ChartPie size={72} weight="duotone" />
              <div className="empty-text">暂无支出记录</div>
              <div className="hint">开始记账看看你的消费分布吧</div>
            </div>
          ) : (
            <>
              <div className="pie-chart-container">
                <div className="pie-chart" style={{ background: getPieGradient() }}>
                  <div className="pie-center">
                    <div className="pie-center-amount">¥{stats.total.toFixed(0)}</div>
                    <div className="pie-center-label">本月支出</div>
                  </div>
                </div>
              </div>

              <div className="stats-list">
                {sortedCategories.map(([category, amount]) => (
                  <div key={category} className="stats-item">
                    <div className="stats-category">
                      <div className="cat-icon" style={{ backgroundColor: categoryColors[category] }}>
                        {categoryIcons[category] || <Package size={16} weight="fill" />}
                      </div>
                      <span className="stats-category-name">{category}</span>
                    </div>
                    <div className="stats-bar-container">
                      <div
                        className="stats-bar"
                        style={{
                          width: `${stats.total > 0 ? (amount / stats.total) * 100 : 0}%`,
                          backgroundColor: categoryColors[category] || '#999',
                        }}
                      />
                    </div>
                    <span className="stats-amount">¥{amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="stats-section">
          <div className="stats-cards">
            {sortedCategories.map(([category, amount]) => (
              <div key={category} className="stats-card">
                <div className="cat-icon" style={{ backgroundColor: categoryColors[category] }}>
                  {categoryIcons[category] || <Package size={20} weight="fill" />}
                </div>
                <div className="stats-card-info">
                  <div className="stats-card-name">{category}</div>
                  <div className="stats-card-amount">¥{amount.toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Stats;
