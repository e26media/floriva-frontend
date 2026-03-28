'use client';

import { FC, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

interface Props {
  countryName?: string;
}

const CountryNotification: FC<Props> = ({ countryName: propCountryName }) => {
  const pathname = usePathname();
  const [countryName, setCountryName] = useState<string>('');

  useEffect(() => {
    // Extract country from URL path
    const pathSegments = pathname.split('/').filter(segment => segment !== '');
    
    // Find the country segment - assuming it's always after '/country/'
    const countryIndex = pathSegments.findIndex(segment => segment === 'country');
    
    let extractedCountry = '';
    
    if (countryIndex !== -1 && pathSegments[countryIndex + 1]) {
      // Get the segment right after 'country'
      extractedCountry = pathSegments[countryIndex + 1];
    }
    
    if (extractedCountry) {
      // Format country name: capitalize first letter, rest lowercase
      const formattedCountry = extractedCountry.charAt(0).toUpperCase() + 
                               extractedCountry.slice(1).toLowerCase();
      setCountryName(formattedCountry);
    } else if (propCountryName) {
      // Fallback to prop if provided
      const formattedCountry = propCountryName.charAt(0).toUpperCase() + 
                               propCountryName.slice(1).toLowerCase();
      setCountryName(formattedCountry);
    } else {
      setCountryName('');
    }
  }, [pathname, propCountryName]);

  return (
    <div className="w-full border-b" style={{ backgroundColor: '#A35194', borderBottomColor: '#8a3f7a' }}>
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-3 py-2 px-4 text-sm sm:text-base">
        {/* Text */}
        <p className="font-medium text-white">
          Welcome to Floriva Gifts {countryName}
        </p>
      </div>
    </div>
  );
};

export default CountryNotification;