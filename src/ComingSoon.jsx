import React from "react";

const ComingSoon = () => {
  return (
    <div className="hoc-wrapper">
      <style>{`
        .hoc-wrapper {
          min-height: 100vh;
          width: 100%;
          overflow-x: hidden;
          font-family: 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
          background: linear-gradient(180deg, #faf9f7 0%, #fcf1e4 25%, #fdb52c 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px;
        }

        .hoc-container {
          width: 100%;
          max-width: 1100px;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 30px 20px 20px;
        }

        .hoc-logo-section {
          text-align: center;
          margin-bottom: 20px;
        }
        .hoc-logo {
          display: block;
          width: 100px;
          margin: 0 auto;
          height: auto;
          object-fit: contain;
        }
        .hoc-brand-name {
          font-size: 18px;
          font-weight: 700;
          color: #f39e03;
          margin-top: 8px;
          font-style: italic;
        }

        .hoc-heading-section {
          text-align: center;
          margin-bottom: 12px;
        }
        .hoc-heading {
          font-size: clamp(32px, 5vw, 64px);
          font-weight: 900;
          line-height: 1.1;
          margin: 0;
          letter-spacing: 2px;
        }
        .hoc-heading-black { color: #1a1a1a; }
        .hoc-heading-orange {
          font-style: italic;
          background: linear-gradient(90deg, #FF8C00, #ffd580, #FF8C00);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: gradient-flow 3s linear infinite;
        }

        .hoc-subtext {
          font-size: 15px;
          color: #555;
          text-align: center;
          line-height: 1.6;
          margin-bottom: 20px;
          font-weight: 400;
        }

        .hoc-notification-banner {
          display: flex;
          align-items: center;
          gap: 12px;
          background-color: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(8px);
          padding: 10px 20px;
          border-radius: 50px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
          margin-bottom: 10px;
        }
        .hoc-bell-icon {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background-color: #FFF3E0;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .hoc-notification-text {
          font-size: 12px;
          color: #333;
          font-weight: 500;
        }

        /* Desktop: showcase image + contact card sit side by side */
        .hoc-main-row {
          width: 100%;
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
          gap: 40px;
          margin: 10px 0 30px;
        }

        .hoc-showcase-section {
          flex: 1 1 380px;
          max-width: 420px;
          margin: -30px 0 0;
        }
        .hoc-showcase-image {
          width: 100%;
          height: auto;
          object-fit: contain;
        }

        .hoc-contact-section {
          flex: 1 1 420px;
          max-width: 500px;
          background-color: rgba(255, 255, 255, 0.6);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
        }
        .hoc-contact-title {
          text-align: center;
          font-size: 16px;
          font-weight: 800;
          color: #FF8C00;
          margin-bottom: 14px;
          letter-spacing: 1px;
        }
        .hoc-contact-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 18px;
        }
        .hoc-contact-column {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .hoc-contact-item {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .hoc-contact-icon-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background-color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        }
        .hoc-contact-value {
          font-size: 12px;
          font-weight: 600;
          color: #333;
        }
        .hoc-contact-label {
          font-size: 11px;
          color: #888;
          font-weight: 400;
        }

        .hoc-social-section {
          text-align: center;
          margin-bottom: 20px;
        }
        .hoc-social-title {
          font-size: 14px;
          font-weight: 800;
          color: #FF8C00;
          margin-bottom: 12px;
          letter-spacing: 1px;
        }
        .hoc-social-icons {
          display: flex;
          gap: 12px;
          justify-content: center;
        }
        .hoc-social-icon {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background-color: #333;
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          transition: background-color 0.3s ease;
        }

        .hoc-footer {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: auto;
          padding-top: 16px;
          padding-bottom: 10px;
        }
        .hoc-footer-diamond { color: #FF8C00; font-size: 8px; }
        .hoc-footer-text { font-size: 11px; color: #666; font-weight: 400; }

        /* ---- Mobile ---- */
        @media (max-width: 768px) {
          .hoc-main-row {
            flex-direction: column;
            gap: 10px;
            margin: 0 0 20px;
          }
          .hoc-showcase-section {
            max-width: 400px;
            margin: -30px 0 -10px;
          }
          .hoc-contact-section {
            width: 100%;
            max-width: 650px;
          }
          .hoc-contact-grid {
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          }
          .hoc-heading {
            font-size: clamp(32px, 7vw, 52px);
          }
        }

        @keyframes gradient-flow {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
      `}</style>

      <div className="hoc-container">
        {/* Logo */}
        <div className="hoc-logo-section">
          <img src="/images/logo_plane.png" alt="House of Cambridge" className="hoc-logo" />
          <h2 className="hoc-brand-name">House of Cambridge</h2>
        </div>

        {/* Coming Soon Heading */}
        <div className="hoc-heading-section">
          <h1 className="hoc-heading">
            <span className="hoc-heading-black">COMING</span>{' '}
            <span className="hoc-heading-orange">SOON!</span>
          </h1>
        </div>

        {/* Subtext */}
        <p className="hoc-subtext">
          We're working hard to bring you
          <br />
          an amazing shopping experience.
        </p>

        {/* Notification Banner */}
        <div className="hoc-notification-banner">
          <div className="hoc-bell-icon">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.36 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5C11.17 2.5 10.5 3.17 10.5 4V4.68C7.63 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16Z"
                fill="#FF8C00"
              />
            </svg>
          </div>
          <span style={styles.notificationText}>
            Stay tuned! Something great is on the way.
          </span>
        </div>


        {/* Contact Section */}
        <div style={styles.contactSection}>
          <h3 style={styles.contactTitle}>GET IN TOUCH</h3>
          <div style={styles.contactGrid}>
            {/* Left Column */}
            <div style={styles.contactColumn}>
              <div style={styles.contactItem}>
                <div style={styles.contactIconCircle}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"
                      fill="#FF8C00"
                    />
                    <path
                      d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a7.96 7.96 0 01-4.108-1.14l-.292-.174-3.034.796.81-2.962-.19-.302A7.963 7.963 0 014 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z"
                      fill="#FF8C00"
                    />
                  </svg>
                </div>
                <div>
                  <div style={styles.contactValue}>076 460 4227</div>
                  <div style={styles.contactLabel}>WhatsApp</div>
                </div>
              </div>

              <div style={styles.contactItem}>
                <div style={styles.contactIconCircle}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"
                      fill="#FF8C00"
                    />
                  </svg>
                </div>
                <div>
                  <div style={styles.contactValue}>0112 847 846</div>
                  <div style={styles.contactLabel}>Call Us</div>
                </div>
              </div>

              <div style={styles.contactItem}>
                <div style={styles.contactIconCircle}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"
                      fill="#FF8C00"
                    />
                  </svg>
                </div>
                <div>
                  <div style={styles.contactValue}>
                    info@houseofcambridge.co.uk
                  </div>
                  <div style={styles.contactLabel}>Email Us</div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div style={styles.contactColumn}>
              <div style={styles.contactItem}>
                <div style={styles.contactIconCircle}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
                      fill="#FF8C00"
                    />
                  </svg>
                </div>
                <div>
                  <div style={styles.contactValue}>
                    No 63 Old Road,
                    <br />
                    Pannipitiya
                  </div>
                  <div style={styles.contactLabel}>Visit Us</div>
                </div>
              </div>

              <div style={styles.contactItem}>
                <div style={styles.contactIconCircle}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"
                      fill="#FF8C00"
                    />
                  </svg>
                </div>
                <div>
                  <div style={styles.contactValue}>
                    Mon – Sun | 8:00 AM – 9:00 PM
                  </div>
                  <div style={styles.contactLabel}>Business Hours</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div style={styles.socialSection}>
          <h3 style={styles.socialTitle}>FOLLOW US</h3>
          <div style={styles.socialIcons}>
            <a
              href="https://www.facebook.com/share/1EvLTYix5L/?mibextid=wwXIfr"
              target="_blank"
              rel="noopener noreferrer"
              style={styles.socialIcon}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>
            <a
              href="https://www.instagram.com/houseofcambridge.lk?igsh=MXIzcjV5anhtMGYyMA=="
              target="_blank"
              rel="noopener noreferrer"
              style={styles.socialIcon}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
            </a>
            <a
              href="https://www.tiktok.com/@houseofcambridge1"
              target="_blank"
              rel="noopener noreferrer"
              style={styles.socialIcon}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <span style={styles.footerDiamond}>◆</span>
          <span style={styles.footerText}>
            © 2024 House of Cambridge. All rights reserved.
          </span>
          <span style={styles.footerDiamond}>◆</span>
        </div>
      </div>
    </div>
  );
};

const styles = {
  wrapper: {
    minHeight: '100vh',
    width: '100%',
    position: 'relative',
    overflowX: 'hidden',
    fontFamily: "'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
    background: 'linear-gradient(180deg, #fcf1e4 20%, #fdb52c 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px',
  },
  container: {
    zIndex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '30px 20px 20px',
  },
  logoSection: {
    textAlign: 'center',
    marginBottom: '20px',
  },
  logo: {
    display: 'block',
    width: '100px',
    margin: '0 auto',
    height: 'auto',
    objectFit: 'contain',
  },
  brandName: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#FF8C00',
    marginTop: '8px',
    fontStyle: 'italic',
  },
  headingSection: {
    textAlign: 'center',
    marginBottom: '12px',
  },
  heading: {
    fontSize: 'clamp(32px, 7vw, 52px)',
    fontWeight: '900',
    lineHeight: 1.1,
    margin: 0,
    letterSpacing: '2px',
  },
  headingBlack: {
    color: '#1a1a1a',
  },
  headingOrange: {
    color: '#FF8C00',
    fontStyle: 'italic',
  },
  subtext: {
    fontSize: '14px',
    color: '#555',
    textAlign: 'center',
    lineHeight: 1.6,
    marginBottom: '20px',
    fontWeight: '400',
  },
  notificationBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(8px)',
    padding: '10px 20px',
    borderRadius: '50px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
    marginBottom: '0px',
  },
  bellIcon: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#FFF3E0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  notificationText: {
    fontSize: '10px',
    color: '#333',
    fontWeight: '500',
  },
  showcaseSection: {
    width: '100%',
    maxWidth: '400px',
    margin: '-40px 0 -20px',
  },
  showcaseImage: {
    width: '100%',
    height: 'auto',
    objectFit: 'contain',
  },
  contactSection: {
    width: '100%',
    maxWidth: '650px',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '20px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
  },
  contactTitle: {
    textAlign: 'center',
    fontSize: '16px',
    fontWeight: '800',
    color: '#FF8C00',
    marginBottom: '10px',
    letterSpacing: '1px',
  },
  contactGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '16px',
  },
  contactColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  contactItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  contactIconCircle: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },
  contactValue: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#333',
  },
  contactLabel: {
    fontSize: '11px',
    color: '#888',
    fontWeight: '400',
  },
  socialSection: {
    textAlign: 'center',
    marginBottom: '20px',
  },
  socialTitle: {
    fontSize: '14px',
    fontWeight: '800',
    color: '#291803',
    marginBottom: '12px',
    letterSpacing: '1px',
  },
  socialIcons: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
  },
  socialIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: '#333',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textDecoration: 'none',
    transition: 'background-color 0.3s ease',
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: 'auto',
    paddingTop: '16px',
    paddingBottom: '10px',
  },
  footerDiamond: {
    color: '#FF8C00',
    fontSize: '8px',
  },
  footerText: {
    fontSize: '11px',
    color: '#666',
    fontWeight: '400',
  },
};

export default ComingSoon;
