"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import ThemeToggle from "./ThemeToggle";

type navItem = {
  href: string;
  label: string;
};

export function MainNav() {
  const pathname = usePathname();

  const navItems: navItem[] = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About Us" },
    { href: "/blog", label: "Blog" },
    { href: "/disclaimer", label: "Disclaimer" },
    { href: "/video-editor", label: "Video Editor" },
    { href: "/transcribe", label: "Transcribe" },
  ];

  return (
    <NavigationMenu>
      <NavigationMenuList>
        {navItems.map(item => (
          <NavigationMenuItem key={item.href}>
            <Link href={item.href} legacyBehavior passHref>
              <NavigationMenuLink
                className={cn(
                  navigationMenuTriggerStyle(),
                  pathname === item.href && "bg-accent text-accent-foreground"
                )}
              >
                {item.label}
              </NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
        ))}
        <NavigationMenuItem>
          <ThemeToggle />
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
