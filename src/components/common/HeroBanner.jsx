import React, { useEffect, useState } from 'react';
import axios from '../../utils/payhere'; // placeholder, replace with your axios instance

const HeroBanner = () => {
  const [banner, setBanner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBanner = async () => {
      try {
        const { data } = await axios.get('/api/hero-banner'); // public endpoint should be created in backend
        setBanner(data.banner);
      } catch (err) {
        setError('Failed to load banner');
      } finally {
        setLoading(false);
      }
    };
    fetchBanner();
  }, []);

  if (loading) return null;
  if (error) return null;
  if (!banner) return null;

  return (
    <section className="relative w-full h-96 bg-gray-100 flex items-center justify-center" style={{ backgroundImage: `url(${banner.image?.url})`, backgroundSize: 'cover' }}>
      <div className="text-center text-white bg-black bg-opacity-50 p-4 rounded">
        <h1 className="text-4xl font-bold mb-2">{banner.title}</h1>
        <p className="text-lg mb-4">{banner.subtitle}</p>
        <div className="flex gap-4 justify-center">
          {banner.buttons?.map((btn, idx) => (
            <a
              key={idx}
              href={btn.url}
              className={`px-6 py-2 rounded ${btn.style === 'secondary' ? 'bg-white text-black' : 'bg-primary text-white'}`}
            >
              {btn.label}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;
