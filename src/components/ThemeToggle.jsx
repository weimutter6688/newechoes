import { useEffect, useState } from 'react';

export function ThemeToggle({ height = 20, width = 20, fill = "currentColor" }) {
  // 从 document.documentElement.dataset.theme 获取初始主题
  const [theme, setTheme] = useState(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.dataset.theme || 'light';
    }
    return 'light';
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    // 当主题改变时更新 DOM 和 localStorage
    const root = document.documentElement;
    root.dataset.theme = theme;
    
    if (theme === getSystemTheme()) {
      localStorage.removeItem('theme');
    } else {
      localStorage.setItem('theme', theme);
    }
  }, [theme, mounted]);

  function getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function toggleTheme() {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  }

  return (
    <div 
      className="inline-flex items-center justify-center cursor-pointer"
      style={{ height: `${height}px`, width: `${width}px` }}
      onClick={toggleTheme}
    >
      {theme === 'dark' ? (
        <svg
          style={{ height: `${height * 2/3}px`, width: `${width * 2/3}px` }}
          fill={fill}
          viewBox="0 0 16 16"
        >
          <path d="M6 .278a.768.768 0 0 1 .08.858 7.208 7.208 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277.527 0 1.04-.055 1.533-.16a.787.787 0 0 1 .81.316.733.733 0 0 1-.031.893A8.349 8.349 0 0 1 8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.752.752 0 0 1 6 .278z"/>
        </svg>
      ) : (
        <svg
          style={{ height: `${height * 2/3}px`, width: `${width * 2/3}px` }}
          fill={fill}
          viewBox="0 0 16 16"
        >
          <path d="M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0zm0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13zm8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5zM3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8zm10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0zm-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0zm9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707zM4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708z"/>
        </svg>
      )}
    </div>
  );
} 