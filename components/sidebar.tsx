"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChartBarIcon, TrendingUpIcon } from "lucide-react";

const menuItems = [
  {
    title: "Top Market",
    icon: ChartBarIcon,
    href: "/",
  },
  {
    title: "TOP pump.fun",
    icon: TrendingUpIcon,
    href: "/pump-fun",
  },
];

export function Sidebar() {
  const [selected, setSelected] = useState(menuItems[0].title);

  return (
    <div className="h-screen w-64 bg-card border-r">
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">StalkFun</h2>
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <Link key={item.title} href={item.href}>
              <Button
                variant={selected === item.title ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  selected === item.title && "bg-secondary"
                )}
                onClick={() => setSelected(item.title)}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.title}
              </Button>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}