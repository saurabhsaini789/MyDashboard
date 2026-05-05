"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Target,
  Repeat,
  CircleDollarSign,
  ShoppingBasket,
  BookMarked,
  Rocket,
  ChevronUp,
  Shirt,
  Activity,
} from 'lucide-react';
import { haptic } from '@/lib/haptics';

// ─── PWA: 6 Core Tabs ────────────────────────────────────────────────────────
const pwaNavItems = [
  { name: 'Home',     href: '/',               icon: LayoutDashboard },
  { name: 'Habits',   href: '/habits',          icon: Repeat          },
  { name: 'Goals',    href: '/goals',           icon: Target          },
  { name: 'Finance',  href: '/finances',        icon: CircleDollarSign},
  { name: 'Content',  href: '/content-system',  icon: Rocket          },
  { name: 'Expenses', href: '/pantry',          icon: ShoppingBasket  },
];

// ─── Browser: Full nav list (unchanged from original) ────────────────────────
const browserNavItems = [
  { name: 'Dashboard',      href: '/',              icon: LayoutDashboard },
  { name: 'Goals',          href: '/goals',         icon: Target          },
  { name: 'Habits',         href: '/habits',        icon: Repeat          },
  { name: 'Books',          href: '/books',         icon: BookMarked      },
  { name: 'Finances',       href: '/finances',      icon: CircleDollarSign},
  { name: 'Content System', href: '/content-system',icon: Rocket          },
  { name: 'Expenses',       href: '/pantry',        icon: ShoppingBasket  },
  { name: 'Wardrobe',       href: '/wardrobe',      icon: Shirt           },
  { name: 'Health',         href: '/health-system', icon: Activity        },
];

// ─── PWA Bottom Tab Bar ───────────────────────────────────────────────────────
// Rendered in DOM always; CSS `.pwa-only` hides it in the browser,
// shows it only when display-mode === standalone.
function PWATabBar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    const norm = (p: string) => p.replace(/\/$/, '') || '/';
    return norm(pathname ?? '/') === norm(href);
  };

  return (
    <nav
      className="pwa-only fixed bottom-0 left-0 right-0 z-[999] flex-col
                 bg-white/90 dark:bg-zinc-950/95
                 backdrop-blur-xl
                 border-t border-zinc-200/80 dark:border-zinc-800/80"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)' }}
      aria-label="Main navigation"
    >
      <div className="flex items-stretch justify-around px-1 pt-2 pb-1 h-[58px]">
        {pwaNavItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => haptic(8)}
              className="relative flex flex-col items-center justify-center flex-1
                         gap-[3px] py-1 rounded-xl select-none
                         active:opacity-60 transition-opacity duration-100"
              aria-current={active ? 'page' : undefined}
            >
              {/* Active pill background */}
              <span
                className={`absolute inset-x-[8%] top-[3px] h-[30px] rounded-xl
                            transition-all duration-300 ease-out
                            ${active
                              ? 'bg-indigo-50 dark:bg-indigo-500/15 opacity-100 scale-100'
                              : 'opacity-0 scale-90'
                            }`}
              />

              {/* Icon */}
              <Icon
                size={20}
                strokeWidth={active ? 2.2 : 1.8}
                className={`relative z-10 transition-all duration-300
                            ${active
                              ? 'text-indigo-600 dark:text-indigo-400 scale-110'
                              : 'text-zinc-400 dark:text-zinc-500'
                            }`}
              />

              {/* Label */}
              <span
                className={`relative z-10 text-[9px] font-semibold tracking-tight
                            leading-none transition-colors duration-300
                            ${active
                              ? 'text-indigo-600 dark:text-indigo-400'
                              : 'text-zinc-400 dark:text-zinc-500'
                            }`}
              >
                {item.name}
              </span>

              {/* Active dot */}
              {active && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2
                                  w-1 h-1 rounded-full bg-indigo-500
                                  animate-pulse-subtle" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// ─── Browser Floating Nav (original behaviour, untouched) ────────────────────
function BrowserFloatingNav() {
  const pathname = usePathname();
  const [isVisible, setIsVisible]   = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsVisible(window.scrollY > 100);

    const checkModals = () => {
      const modal =
        document.querySelector('.fixed.inset-0.z-\\[100\\]') ||
        document.querySelector('.fixed.inset-0.z-\\[101\\]');
      setIsModalOpen(!!modal);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    checkModals();

    const observer = new MutationObserver(checkModals);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributeFilter: ['class'],
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <div
      className={`pwa-hide fixed bottom-8 left-0 right-0 mx-auto z-[999] w-fit
                  max-w-[95vw] transition-all duration-500
                  cubic-bezier(0.4, 0, 0.2, 1)
                  ${isVisible && !isModalOpen
                    ? 'opacity-100 translate-y-0 scale-100'
                    : 'opacity-0 translate-y-12 scale-90 pointer-events-none'
                  }`}
    >
      <nav className="flex items-center gap-1 p-2 px-4
                      bg-white/70 dark:bg-zinc-900/80 backdrop-blur-2xl
                      border border-zinc-200/50 dark:border-zinc-800/50
                      rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)]
                      dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)]
                      overflow-x-auto scrollbar-hide max-w-full">
        {browserNavItems.map((item) => {
          const norm = (p: string) => p.replace(/\/$/, '') || '/';
          const active = norm(pathname ?? '/') === norm(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center justify-center p-2 sm:p-2.5
                          lg:p-3 rounded-xl transition-all duration-300 group
                          flex-shrink-0
                          ${active
                            ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xl shadow-zinc-900/20 dark:shadow-white/10'
                            : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
                          }`}
            >
              <Icon
                size={22}
                className={`${active ? 'scale-110' : 'group-hover:scale-110'}
                            transition-transform duration-300`}
              />
              {active && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-teal-500
                                  rounded-full border-2 border-white
                                  dark:border-zinc-900 animate-pulse" />
              )}
            </Link>
          );
        })}

        <div className="hidden sm:block w-px h-6 bg-zinc-200/50 dark:bg-zinc-800/50 mx-0.5" />
        <button
          onClick={scrollToTop}
          className="hidden sm:flex items-center justify-center p-2.5 rounded-xl
                     text-zinc-500 hover:text-zinc-900 dark:text-zinc-400
                     dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800
                     transition-all duration-300 group flex-shrink-0"
          aria-label="Scroll to top"
        >
          <ChevronUp size={22} className="group-hover:-translate-y-1 transition-transform duration-300" />
        </button>
      </nav>
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────
// Both bars are always in the DOM.
// CSS handles which one is visible:
//   • browser  → BrowserFloatingNav visible, PWATabBar hidden
//   • PWA      → PWATabBar visible,          BrowserFloatingNav hidden
export function FloatingNavbar() {
  return (
    <>
      <PWATabBar />
      <BrowserFloatingNav />
    </>
  );
}
