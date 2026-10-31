import type { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg {...props} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <rect x="5.5" y="6" width="4" height="20" rx="2" />
            <rect x="22.5" y="6" width="4" height="20" rx="2" />
            <rect x="9" y="14" width="14" height="4" />
            <circle cx="7.5" cy="6" r="3.5" />
            <circle cx="24.5" cy="26" r="3.5" />
        </svg>
    );
}
