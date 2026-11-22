import { useEffect, useState } from 'react';
import api from '../../redux/api/axiosInstance';
import { isInChristmasWindow, isPreviewForced } from './christmasConfig.js';

// One request per page load, shared by every component that asks.
let themePromise = null;
let cached; // true | false | null (null = admin never set it)

const loadTheme = () => {
  if (!themePromise) {
    themePromise = api
      .get('/banners/theme')
      .then((res) => {
        cached = typeof res.data?.christmas === 'boolean' ? res.data.christmas : null;
        return cached;
      })
      .catch(() => {
        cached = null;
        return null;
      });
  }
  return themePromise;
};

const decide = (adminValue) => {
  if (isPreviewForced()) return true;
  if (typeof adminValue === 'boolean') return adminValue;
  return isInChristmasWindow();
};

/** Lets the admin page update every component instantly after toggling. */
export const setChristmasThemeCache = (value) => {
  cached = value;
  themePromise = Promise.resolve(value);
  window.dispatchEvent(new CustomEvent('hoc:christmas-theme', { detail: value }));
};

/** true when Christmas decorations should show. */
export default function useChristmasTheme() {
  const [active, setActive] = useState(() => decide(cached));

  useEffect(() => {
    let alive = true;
    loadTheme().then((v) => alive && setActive(decide(v)));
    const onChange = (e) => setActive(decide(e.detail));
    window.addEventListener('hoc:christmas-theme', onChange);
    return () => {
      alive = false;
      window.removeEventListener('hoc:christmas-theme', onChange);
    };
  }, []);

  return active;
}
