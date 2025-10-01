import React, { useEffect, useState } from 'react';
import { Nav } from 'react-bootstrap';
import { MdDarkMode, MdLightMode, MdBrightnessAuto } from 'react-icons/md';

const THEME_KEY = "theme";

const getStoredTheme = () => localStorage.getItem(THEME_KEY);

const getPreferredTheme = () => {
  const storedTheme = getStoredTheme();
  if (storedTheme) return storedTheme;

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

const setThemeOnDocument = (theme) => {
  if (theme === "auto") {
    document.documentElement.setAttribute(
      "data-bs-theme",
      window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    );
  } else {
    document.documentElement.setAttribute("data-bs-theme", theme);
  }
};

const mapping = {
  light: <MdLightMode />,
  dark: <MdDarkMode />, 
  auto: <MdBrightnessAuto />
};

const indexes = ['light', 'dark', 'auto'];

const ThemeToggle = () => {
  const [theme, setTheme] = useState(getPreferredTheme());
  const [index, setIndex] = useState(indexes.indexOf(theme));
  
  useEffect(() => {
    setThemeOnDocument(theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (theme === "auto") {
        setThemeOnDocument("auto");
      }
    };
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, [theme]);

  useEffect(() => {
    setTheme(indexes[index]);
  }, [index]);

  const updateTheme = () => {
    setIndex(prevState => {
      return prevState === 2 ? 0 : (prevState + 1);
    });
  };  

  return (
    <Nav.Link 
      type="button"
      onClick={updateTheme}
    >
      <span className="h5">{mapping[theme]}</span>
    </Nav.Link>
  )
};

export default ThemeToggle;
