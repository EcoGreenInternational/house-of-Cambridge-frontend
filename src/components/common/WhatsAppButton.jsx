import React from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Floating WhatsApp contact button.
 * Remains fixed at the bottom right across all public pages,
 * but hidden on admin dashboard routes.
 */
export default function WhatsAppButton() {
  const location = useLocation();

  // Hide WhatsApp button inside the admin dashboard
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  const phoneNumber = '94764604227';
  const message = 'Hello, I would like to get more information from House Of Cambridge.';
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <>
      <style>{`
        @keyframes hoc-wa-pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(37, 211, 102, 0.65), 0 4px 12px rgba(0, 0, 0, 0.25);
          }
          70% {
            box-shadow: 0 0 0 16px rgba(37, 211, 102, 0), 0 4px 12px rgba(0, 0, 0, 0.25);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(37, 211, 102, 0), 0 4px 12px rgba(0, 0, 0, 0.25);
          }
        }
        .hoc-whatsapp-float {
          position: fixed;
          bottom: 25px;
          right: 25px;
          z-index: 9999;
          width: 50px;
          height: 50px;
          background-color: #25D366;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
          cursor: pointer;
          transition: transform 0.25s ease, background-color 0.25s ease;
          animation: hoc-wa-pulse 2.2s infinite ease-in-out;
          text-decoration: none;
          outline: none;
          -webkit-tap-highlight-color: transparent;
        }
        .hoc-whatsapp-float:hover {
          transform: scale(1.1);
          background-color: #22bf5b;
        }
        .hoc-whatsapp-float:active {
          transform: scale(0.96);
        }
        .hoc-whatsapp-float svg {
          width: 30px;
          height: 30px;
          fill: #ffffff;
          display: block;
        }
      `}</style>
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="hoc-whatsapp-float"
        aria-label="Chat on WhatsApp"
        title="Chat with us on WhatsApp"
      >
        <svg
          viewBox="0 0 32 32"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M16 2.05C8.3 2.05 2.02 8.33 2.02 16.03c0 2.62.72 5.07 1.98 7.16L2 30l7.04-1.95c2.01 1.15 4.35 1.79 6.96 1.79 7.7 0 13.98-6.28 13.98-13.98C29.98 8.33 23.7 2.05 16 2.05zm0 25.57c-2.3 0-4.43-.65-6.23-1.78l-.45-.28-4.47 1.24 1.24-4.35-.29-.46c-1.27-2-1.96-4.33-1.96-6.96 0-6.42 5.23-11.64 11.65-11.64s11.65 5.22 11.65 11.64c.01 6.42-5.22 11.64-11.64 11.64zm6.47-8.73c-.35-.18-2.09-1.03-2.42-1.15-.32-.12-.56-.18-.8.18-.24.35-.92 1.15-1.13 1.39-.21.24-.42.27-.77.1-.35-.18-1.5-.55-2.85-1.76-1.05-.94-1.76-2.11-1.97-2.46-.21-.35-.02-.54.15-.72.16-.16.35-.42.53-.63.18-.21.24-.35.35-.59.12-.24.06-.44-.03-.62-.09-.18-.8-1.93-1.1-2.65-.29-.7-.59-.6-.8-.61-.21-.01-.44-.01-.68-.01-.24 0-.62.09-.95.44-.32.35-1.24 1.22-1.24 2.97s1.27 3.44 1.45 3.68c.18.24 2.5 3.82 6.06 5.35.85.37 1.51.58 2.03.75.85.27 1.63.23 2.24.14.68-.1 2.09-.85 2.39-1.68.29-.82.29-1.53.21-1.68-.09-.15-.33-.24-.68-.42z" />
        </svg>
      </a>
    </>
  );
}
