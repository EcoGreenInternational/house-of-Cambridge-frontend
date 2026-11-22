import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../redux/api/axiosInstance';

/** Loads active banners for one section of the home page. */
export function useBanners(placement) {
  const [state, setState] = useState({ banners: [], loaded: false });

  useEffect(() => {
    let alive = true;
    api
      .get('/banners', { params: { placement } })
      .then((res) => alive && setState({ banners: Array.isArray(res.data?.banners) ? res.data.banners : [], loaded: true }))
      .catch(() => alive && setState({ banners: [], loaded: true }));
    return () => {
      alive = false;
    };
  }, [placement]);

  return state;
}

const isExternal = (href) => /^https?:\/\//i.test(href || '');

/** <Link> for site paths, <a target=_blank> for outside links. */
export function SmartLink({ to, children, ...rest }) {
  if (!to) return <span {...rest}>{children}</span>;
  if (isExternal(to)) {
    return (
      <a href={to} target="_blank" rel="noopener noreferrer" {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link to={to} {...rest}>
      {children}
    </Link>
  );
}

const BUTTON_CLASSES = {
  primary: 'bg-[#FFB700] text-black hover:bg-amber-500',
  secondary: 'bg-white text-[#1A1A1A] hover:bg-gray-100',
  outline: 'border-2 border-white text-white hover:bg-white/15',
  christmas: 'hoc-btn-christmas',
};

export function BannerButton({ button, size = 'md' }) {
  const sizing =
    size === 'sm'
      ? 'text-[12px] px-4 h-8'
      : 'text-[13px] md:text-[15px] px-5 md:px-7 h-9 md:h-11';
  return (
    <SmartLink
      to={button.link || '/shop'}
      className={`inline-flex items-center justify-center rounded-full font-semibold transition-all ${sizing} ${
        BUTTON_CLASSES[button.style] || BUTTON_CLASSES.primary
      }`}
    >
      {button.label}
    </SmartLink>
  );
}
