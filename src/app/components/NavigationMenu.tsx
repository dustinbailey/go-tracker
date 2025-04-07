"use client";

import { useState } from "react";
import Link from "next/link";

export default function NavigationMenu() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Mobile hamburger button */}
      <button 
        className="sm:hidden flex flex-col justify-center items-center gap-1.5"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="Toggle menu"
      >
        <span className={`block w-6 h-0.5 bg-white transition-transform duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
        <span className={`block w-6 h-0.5 bg-white transition-opacity duration-300 ${mobileMenuOpen ? 'opacity-0' : 'opacity-100'}`}></span>
        <span className={`block w-6 h-0.5 bg-white transition-transform duration-300 ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
      </button>
      
      {/* Desktop navigation */}
      <nav className="hidden sm:flex sm:flex-row gap-3">
        <Link 
          href="/log" 
          className="px-4 py-2 text-base rounded-lg bg-blue-700 hover:bg-blue-800 transition-colors duration-200 font-medium shadow-sm text-center"
        >
          New Go
        </Link>
        <Link 
          href="/stats" 
          className="px-4 py-2 text-base rounded-lg bg-blue-700 hover:bg-blue-800 transition-colors duration-200 font-medium shadow-sm text-center"
        >
          Stats & Records
        </Link>
        <Link 
          href="/export" 
          className="px-4 py-2 text-base rounded-lg bg-blue-700 hover:bg-blue-800 transition-colors duration-200 font-medium shadow-sm text-center"
        >
          Export Data
        </Link>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden absolute top-16 left-0 right-0 bg-blue-600 px-4 pb-4 border-t border-blue-500 z-50">
          <nav className="flex flex-col gap-2 pt-3">
            <Link 
              href="/log" 
              className="px-3 py-2 text-sm rounded-lg bg-blue-700 hover:bg-blue-800 transition-colors duration-200 font-medium shadow-sm text-center"
              onClick={() => setMobileMenuOpen(false)}
            >
              New Go
            </Link>
            <Link 
              href="/stats" 
              className="px-3 py-2 text-sm rounded-lg bg-blue-700 hover:bg-blue-800 transition-colors duration-200 font-medium shadow-sm text-center"
              onClick={() => setMobileMenuOpen(false)}
            >
              Stats & Records
            </Link>
            <Link 
              href="/export" 
              className="px-3 py-2 text-sm rounded-lg bg-blue-700 hover:bg-blue-800 transition-colors duration-200 font-medium shadow-sm text-center"
              onClick={() => setMobileMenuOpen(false)}
            >
              Export Data
            </Link>
          </nav>
        </div>
      )}
    </>
  );
} 