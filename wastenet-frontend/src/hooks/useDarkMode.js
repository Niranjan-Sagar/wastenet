import { useState, useEffect } from 'react';

export function useDarkMode() {
  const [dark, setDark] = useState(localStorage.getItem('darkMode') === 'true');

  useEffect(() => {
    if (dark) {
      document.body.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [dark]);

  return [dark, setDark];
}
