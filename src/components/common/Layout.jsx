import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';
import { Toaster } from 'react-hot-toast';
import ChristmasDecorations, { ChristmasTop, ChristmasFooter } from '../christmas/ChristmasDecorations.jsx';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-white">
      <Toaster 
        position="top-right" 
        toastOptions={{ 
          duration: 3000,
          style: {
            zIndex: 10000,          
          }
        }} 
        containerStyle={{
          zIndex: 10000,            
          top: '80px'                
        }}
      />
      <Navbar />
      <ChristmasDecorations />
      <main className="pt-[96px] md:pt-[108px]">
        <ChristmasTop />
        {children}
      </main>
      <ChristmasFooter />
      <Footer />
    </div>
  );
}
