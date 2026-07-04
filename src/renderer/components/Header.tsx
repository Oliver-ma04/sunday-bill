import React from 'react';
import { Moon, Sun } from '@phosphor-icons/react';

interface HeaderProps {
  title: string;
}

function Header({ title }: HeaderProps) {
  const toggleTheme = () => {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  React.useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  const currentTheme = document.documentElement.getAttribute('data-theme');

  return (
    <header className="header">
      <h1 className="header-title">
        <span>Sunday</span>
        <span className="accent">记账</span>
      </h1>
      <div className="header-actions">
        <button
          onClick={toggleTheme}
          className="header-btn"
          aria-label="Toggle theme"
        >
          {currentTheme === 'dark' ? <Sun size={20} weight="bold" /> : <Moon size={20} weight="bold" />}
        </button>
      </div>
    </header>
  );
}

export default Header;
