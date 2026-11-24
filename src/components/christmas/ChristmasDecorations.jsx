import { useState } from 'react';
import Snowfall from './Snowfall.jsx';
import Garland from './Garland.jsx';
import { FooterScene } from './Scenes.jsx';
import { Holly } from './art.jsx';
import useChristmasTheme from './useChristmasTheme.js';
import { CHRISTMAS, prefersReducedMotion } from './christmasConfig.js';
import './christmas.css';

const SNOW_KEY = 'hoc_xmas_snow_off';
const GREETING_KEY = 'hoc_xmas_greeting_closed';

const read = (storage, key) => {
  try {
    return storage.getItem(key) === '1';
  } catch {
    return false;
  }
};
const write = (storage, key, on) => {
  try {
    if (on) storage.setItem(key, '1');
    else storage.removeItem(key);
  } catch {
    // storage unavailable
  }
};

/** Falling snow + the snow on/off button (fixed to the screen). */
export default function ChristmasDecorations() {
  const active = useChristmasTheme();
  const [snowOff, setSnowOff] = useState(() => prefersReducedMotion() || read(window.localStorage, SNOW_KEY));
  if (!active) return null;

  const toggle = () => {
    setSnowOff(!snowOff);
    write(window.localStorage, SNOW_KEY, !snowOff);
  };

  return (
    <>
      {!snowOff && <Snowfall />}
      <button
        type="button"
        className="hoc-xmas-toggle"
        onClick={toggle}
        aria-pressed={!snowOff}
        title={snowOff ? 'Turn snow on' : 'Turn snow off'}
      >
        <span aria-hidden="true">❄</span>
        <span className="hoc-xmas-toggle-label">{snowOff ? 'Snow on' : 'Snow off'}</span>
      </button>
    </>
  );
}

/** Pine garland + greeting bar at the top of the page content. */
export function ChristmasTop() {
  const active = useChristmasTheme();
  const [greeting, setGreeting] = useState(() => !read(window.sessionStorage, GREETING_KEY));
  if (!active) return null;

  const close = () => {
    setGreeting(false);
    write(window.sessionStorage, GREETING_KEY, true);
  };

  return (
    <div className="hoc-xmas-top">
      {greeting && (
        <div className="hoc-xmas-greeting" role="note">
          <span className="hoc-xmas-greeting-text">
            <Holly size={22} />
            <span>{CHRISTMAS.GREETING}</span>
            <Holly size={22} />
          </span>
          <button type="button" className="hoc-xmas-greeting-close" onClick={close} aria-label="Close Christmas greeting">
            ×
          </button>
        </div>
      )}
      <div className="hoc-xmas-garland-anchor">
        <Garland />
      </div>
    </div>
  );
}

/** Snowy night scene with snowmen, placed just above the footer. */
export function ChristmasFooter() {
  const active = useChristmasTheme();
  if (!active) return null;
  return <FooterScene />;
}
