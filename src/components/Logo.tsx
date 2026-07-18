/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import logo from "@/assets/Bvlogo.png"; // <-- Change this if you're not using @ alias

interface LogoProps {
  className?: string;
  variant?: "light" | "dark";
}

export const Logo: React.FC<LogoProps> = ({
  className = "",
  variant = "dark",
}) => {
  const isDark = variant === "dark";

  return (
    <div
      className={`inline-flex items-center gap-2 ${
        isDark
          ? ""
          : "bg-white px-1 py-1 sm:px-2 sm:py-1 rounded-full shadow-md border border-brand-gold-500/10"
      } ${className}`}
    >
      <img
        src={logo}
        alt="BV Life Logo"
        className="h-15 sm:h-16 md:h-17 lg:h-18 w-auto object-contain max-w-[190px] sm:max-w-[260px] md:max-w-[320px]"
      />
    </div>
  );
};