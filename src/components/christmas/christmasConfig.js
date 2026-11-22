/**
 * Christmas season settings.
 *
 * Admins switch the decorations on/off in Admin → Banners ("Christmas decorations").
 * Until an admin has used that switch, the dates below decide automatically.
 * To preview at any time, open a page with ?christmas=1
 */
export const CHRISTMAS = {
  START: { month: 11, day: 20 }, // 20 November
  END: { month: 1, day: 6 },     // 6 January (inclusive)
  GREETING: 'Merry Christmas & a Happy New Year from House of Cambridge',
};

const toKey = (month, day) => month * 100 + day;

export const isPreviewForced = () => {
  try {
    return new URLSearchParams(window.location.search).get('christmas') === '1';
  } catch {
    return false;
  }
};

export const isInChristmasWindow = (date = new Date()) => {
  const today = toKey(date.getMonth() + 1, date.getDate());
  const start = toKey(CHRISTMAS.START.month, CHRISTMAS.START.day);
  const end = toKey(CHRISTMAS.END.month, CHRISTMAS.END.day);
  return start <= end ? today >= start && today <= end : today >= start || today <= end;
};

export const prefersReducedMotion = () => {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
};
