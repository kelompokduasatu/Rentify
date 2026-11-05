import React from "react";

interface NavItem {
  label: string;
  href: string;
  isActive?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Explore", href: "#", isActive: true },
  { label: "Become a Host", href: "#" },
  { label: "Help", href: "#" },
];

export default function Navbar() {
  return (
    <header className="w-full bg-white border-b border-stone-200/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <a
          href="#"
          className="text-xl font-bold tracking-tight text-[#135d54]"
        >
          rentify
        </a>

        {/* Navigation Links & Action Buttons */}
        <nav className="flex items-center gap-2 sm:gap-5">
          <div className="hidden sm:flex items-center gap-2">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className={
                  item.isActive
                    ? "px-3.5 py-1.5 rounded-lg bg-[#e6f0ee] text-[#135d54] text-xs sm:text-sm font-medium transition-colors"
                    : "px-3 py-1.5 rounded-lg text-stone-700 hover:text-[#135d54] text-xs sm:text-sm font-medium transition-colors"
                }
              >
                {item.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <a
              href="#"
              className="px-4 sm:px-6 py-2 rounded-lg bg-[#135d54] hover:bg-[#0f4a43] text-white text-xs sm:text-sm font-medium transition-colors"
            >
              Sign Up
            </a>
            <a
              href="#"
              className="px-4 sm:px-5 py-2 rounded-lg border border-[#135d54] text-[#135d54] hover:bg-[#e6f0ee]/50 text-xs sm:text-sm font-medium transition-colors"
            >
              Login
            </a>
          </div>
        </nav>
      </div>
    </header>
  );
}
