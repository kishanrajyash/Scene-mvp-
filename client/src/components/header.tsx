import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, Users } from "lucide-react";
import type { User } from "@shared/schema";

interface HeaderProps {
  user?: User;
}

export default function Header({ user }: HeaderProps) {
  const [location] = useLocation();

  const navigation = [
    { name: "Dashboard", href: "/", active: location === "/" },
    { name: "My Activities", href: "/activities", active: location === "/activities" },
    { name: "Matches", href: "/matches", active: location === "/matches" },
    { name: "Profile", href: "/profile", active: location === "/profile" },
  ];

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <div className="flex items-center space-x-2 cursor-pointer">
                <Users className="text-primary text-2xl" />
                <span className="text-xl font-semibold text-gray-900">ActivityMatch</span>
              </div>
            </Link>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link key={item.name} href={item.href}>
                <Button
                  variant="ghost"
                  className={`transition-colors ${
                    item.active
                      ? "text-primary font-medium hover:text-primary/80"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {item.name}
                </Button>
              </Link>
            ))}
          </nav>

          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="relative p-2">
              <Bell className="h-5 w-5 text-gray-600" />
              <span className="absolute -top-1 -right-1 bg-accent text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                3
              </span>
            </Button>
            
            {user && (
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.profilePicture || undefined} alt={user.name} />
                  <AvatarFallback>
                    {user.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:block text-sm font-medium text-gray-700">
                  {user.name}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
