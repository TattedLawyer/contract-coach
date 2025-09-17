import React from 'react';

interface LogoProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'text';
}

const sizeClasses = {
    sm: 'h-8 w-auto',
    md: 'h-12 w-auto',
    lg: 'h-16 w-auto',
    text: 'h-6 w-auto' // Matches text-2xl height (~24px)
};

export const Logo: React.FC<LogoProps> = ({ className = '', size = 'md' }) => {
    return (
        <div className={`flex items-center ${className}`}>
            <img
                src="/EZBIZCONTRACT logo.png"
                alt="EZ Biz Contract"
                className={`${sizeClasses[size]} object-contain`}
                onError={(e) => {
                    // Fallback to text logo if image fails to load
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.parentElement?.querySelector('.fallback-logo');
                    if (fallback) {
                        (fallback as HTMLElement).style.display = 'block';
                    }
                }}
            />
            <div className="fallback-logo hidden">
                <h1 className="text-xl font-bold text-primary">
                    EZ Biz Contract
                </h1>
            </div>
        </div>
    );
};

export default Logo;
