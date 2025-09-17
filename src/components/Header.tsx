import React from 'react';
import { Logo } from './Logo';
import { Button } from './ui/button';
import { useAuth } from '@/hooks/useAuth';

export const Header: React.FC = () => {
    const { user, signOut } = useAuth();

    return (
        <header className="bg-background border-b border-border">
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center">
                        <Logo size="md" />
                    </div>

                    {/* Navigation */}
                    <nav className="hidden md:flex items-center space-x-6">
                        <a href="#features" className="text-foreground hover:text-primary transition-colors">
                            Features
                        </a>
                        <a href="#pricing" className="text-foreground hover:text-primary transition-colors">
                            Pricing
                        </a>
                        <a href="#contact" className="text-foreground hover:text-primary transition-colors">
                            Contact
                        </a>
                    </nav>

                    {/* Auth Buttons */}
                    <div className="flex items-center space-x-4">
                        {user ? (
                            <Button
                                variant="outline"
                                onClick={() => signOut()}
                                className="text-sm"
                            >
                                Sign Out
                            </Button>
                        ) : (
                            <>
                                <Button variant="ghost" className="text-sm">
                                    Sign In
                                </Button>
                                <Button className="text-sm">
                                    Get Started
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;

