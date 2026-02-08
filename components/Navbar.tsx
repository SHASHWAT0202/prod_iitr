'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/#features', label: 'Features' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 w-full px-4 sm:px-6 lg:px-8 py-3 sm:py-4"
      >
        <div
          className={`mx-auto max-w-5xl flex items-center justify-between px-4 sm:px-6 py-2.5 sm:py-3 rounded-full transition-all duration-300 ${
            scrolled
              ? 'bg-white shadow-lg shadow-slate-200/50 border border-slate-200'
              : 'bg-white/95 shadow-md border border-slate-200'
          }`}
        >
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <img 
              src="/images.jpg" 
              alt="HPCL Logo" 
              className="h-8 sm:h-10 w-auto object-contain"
            />
            <span className={`font-bold text-sm sm:text-lg ${scrolled ? 'text-slate-800' : 'text-slate-800'}`}>
              LeadSense<span className="text-blue-700">AI</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-0.5 lg:gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 lg:px-4 py-2 rounded-full text-xs lg:text-sm font-medium transition-colors whitespace-nowrap ${
                  scrolled
                    ? 'text-slate-600 hover:text-blue-700 hover:bg-blue-50'
                    : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* CTA Button & Mobile Menu */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <Link href="/login" className="hidden sm:block">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-colors ${
                  scrolled
                    ? 'bg-blue-700 text-white hover:bg-blue-800'
                    : 'bg-blue-700 text-white hover:bg-blue-800'
                }`}
              >
                Get Started
              </motion.button>
            </Link>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className={`md:hidden p-1.5 sm:p-2 rounded-lg transition-colors ${scrolled ? 'hover:bg-gray-100' : 'hover:bg-white/10'}`}
              aria-label="Toggle menu"
            >
              <svg className={`w-5 h-5 sm:w-6 sm:h-6 ${scrolled ? 'text-slate-700' : 'text-slate-700'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
            />
            
            {/* Menu Panel */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed left-4 right-4 top-16 sm:top-20 z-50 md:hidden"
            >
              <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-6 space-y-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-xl font-medium text-sm sm:text-base"
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="pt-2 border-t border-gray-100 mt-2">
                  <Link href="/login" onClick={() => setMobileOpen(false)}>
                    <button className="w-full py-3 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-semibold text-sm sm:text-base">
                      Get Started
                    </button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
