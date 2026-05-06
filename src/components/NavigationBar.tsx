"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { SyncStatus } from './SyncStatus';
import { useSyncReady, useSyncIndicator } from '@/context/SyncContext';
import { Menu, X, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { haptic } from '@/lib/haptics';

// ─── PWA Top Bar ─────────────────────────────────────────────────────────────
// Fixed at top, safe-area-inset aware, minimal — nav is handled by the bottom tab bar.
// Shown ONLY in standalone (PWA) mode via .pwa-only CSS class.
function PWATopBar() {
  const pathname = usePathname();
  const { syncStatus, errorMessage } = useSyncIndicator();
  const { isDevelopment } = useSyncReady();
  const { resolvedTheme, setTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const isDark = resolvedTheme === 'dark';

  const navLinks = [
    { name: 'Dashboard',      path: '/'              },
    { name: 'Goals',          path: '/goals'         },
    { name: 'Habits',         path: '/habits'        },
    { name: 'Books',          path: '/books'         },
    { name: 'Finances',       path: '/finances'      },
    { name: 'Content System', path: '/content-system'},
    { name: 'Expenses',       path: '/pantry'        },
    { name: 'Wardrobe',       path: '/wardrobe'      },
    { name: 'Health',         path: '/health-system' },
  ];

  return (
    <header
      className="pwa-only fixed top-0 left-0 right-0 z-[998] flex flex-col
                 bg-white/85 dark:bg-zinc-950/90
                 backdrop-blur-xl
                 border-b border-zinc-200/80 dark:border-zinc-800/80"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className="flex items-center justify-between px-4 h-14">
        {/* Left side: Hamburger + App name */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              haptic(4);
              setMenuOpen(!menuOpen);
            }}
            className="p-2 -ml-2 text-zinc-500 dark:text-zinc-400
                       hover:text-zinc-900 dark:hover:text-white
                       transition-colors"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          
          <Link
            href="/"
            onClick={() => {
              haptic(6);
              setMenuOpen(false);
            }}
            className="text-base font-bold text-zinc-900 dark:text-zinc-100
                       hover:opacity-70 transition-opacity"
          >
            Personal OS
          </Link>
        </div>

        {/* Right side: sync + theme toggle */}
        <div className="flex items-center gap-2">
          <SyncStatus
            status={syncStatus}
            errorMessage={errorMessage}
            isDevelopment={isDevelopment}
            compact={true}
          />

          {/* Compact theme toggle for PWA */}
          <button
            onClick={() => {
              haptic(6);
              setTheme(isDark ? 'light' : 'dark');
            }}
            className="flex items-center justify-center w-8 h-8 rounded-xl
                       text-zinc-500 dark:text-zinc-400
                       hover:text-zinc-900 dark:hover:text-white
                       hover:bg-zinc-100 dark:hover:bg-zinc-800
                       transition-all duration-200"
            aria-label="Toggle theme"
          >
            {isDark
              ? <Sun size={18} className="text-amber-400" />
              : <Moon size={18} className="text-indigo-400" />
            }
          </button>
        </div>
      </div>

      {/* PWA Slide-down Menu Overlay */}
      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out
                    ${menuOpen ? 'max-h-[500px] opacity-100 border-t border-zinc-100 dark:border-zinc-800/50' : 'max-h-0 opacity-0 pointer-events-none'}`}
      >
        <nav className="grid grid-cols-2 gap-2 p-4 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              href={link.path}
              onClick={() => {
                haptic(2);
                setMenuOpen(false);
              }}
              className={`flex items-center justify-center py-2.5 px-4 rounded-xl text-xs font-bold transition-all
                          ${pathname === (link.path === '/' ? '/' : link.path) 
                            ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm' 
                            : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
            >
              {link.name}
            </Link>
          ))}
          <button
            onClick={() => { 
              haptic(10);
              setMenuOpen(false); 
              supabase.auth.signOut(); 
            }}
            className="col-span-2 text-xs font-bold text-rose-500 dark:text-rose-400 py-3 mt-2 
                       border-t border-zinc-100 dark:border-zinc-800/50 active:bg-rose-500/5 transition-colors"
          >
            Sign Out
          </button>
        </nav>
      </div>
    </header>
  );
}

// ─── Browser Nav Bar (original, completely unchanged) ─────────────────────────
// Hidden in PWA mode via .pwa-hide CSS class.
function BrowserNavBar() {
  const pathname = usePathname();
  const { isDevelopment } = useSyncReady();
  const { syncStatus, errorMessage } = useSyncIndicator();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Dashboard',      path: '/'              },
    { name: 'Goals',          path: '/goals'         },
    { name: 'Habits',         path: '/habits'        },
    { name: 'Books',          path: '/books'         },
    { name: 'Finances',       path: '/finances'      },
    { name: 'Content System', path: '/content-system'},
    { name: 'Expenses',       path: '/pantry'        },
    { name: 'Wardrobe',       path: '/wardrobe'      },
    { name: 'Health',         path: '/health-system' },
  ];

  return (
    <div className="pwa-hide w-full flex justify-center bg-zinc-50 dark:bg-zinc-950 px-4 md:px-8 xl:px-12 pt-6 pb-2 text-zinc-900 dark:text-zinc-100">
      <header className="flex flex-col sm:flex-row justify-between items-center gap-4 w-full max-w-7xl border-b border-zinc-200 dark:border-zinc-800 pb-4 relative">
        <div className="flex items-center justify-between w-full sm:w-auto">
          <div className="flex items-center flex-wrap gap-2 sm:gap-4">
            <Link href="/" className="text-xl font-semibold hover:opacity-80 transition-opacity whitespace-nowrap">
              Personal OS
            </Link>
            <SyncStatus status={syncStatus} errorMessage={errorMessage} isDevelopment={isDevelopment} />
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="sm:hidden p-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden sm:flex flex-wrap lg:flex-nowrap items-center justify-end gap-x-4 md:gap-x-6 lg:gap-x-2.5 xl:gap-x-6">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              href={link.path}
              className={`text-sm font-semibold transition-colors whitespace-nowrap ${pathname === link.path ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
            >
              {link.name}
            </Link>
          ))}
          <button
            onClick={() => supabase.auth.signOut()}
            className="text-sm font-semibold text-zinc-500 hover:text-rose-500 dark:text-zinc-400 dark:hover:text-rose-400 transition-colors px-2 lg:px-2.5 xl:px-3 py-1.5 rounded-lg border border-transparent hover:border-rose-500/20 hover:bg-rose-500/5 whitespace-nowrap"
          >
            Sign Out
          </button>
        </nav>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="grid sm:hidden grid-cols-2 w-full gap-2 pt-4 pb-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`text-sm font-semibold transition-colors py-2 w-full text-center hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-xl ${pathname === link.path ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
              >
                {link.name}
              </Link>
            ))}
            <button
              onClick={() => { setMobileMenuOpen(false); supabase.auth.signOut(); }}
              className="col-span-2 text-sm font-semibold text-zinc-500 hover:text-rose-500 dark:text-zinc-400 dark:hover:text-rose-400 transition-colors w-full py-2 border-t border-zinc-200 dark:border-zinc-800 mt-2"
            >
              Sign Out
            </button>
          </nav>
        )}
      </header>
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────
// Both bars always in DOM. CSS decides which is shown:
//   browser  → BrowserNavBar  visible, PWATopBar hidden
//   PWA      → PWATopBar visible,      BrowserNavBar hidden
export function NavigationBar() {
  return (
    <>
      <PWATopBar />
      <BrowserNavBar />
    </>
  );
}
