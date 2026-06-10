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
      setTimeout(() => {
        setCountryName(formattedCountry);
      }, 0);
    } else if (propCountryName) {
      // Fallback to prop if provided
      const formattedCountry = propCountryName.charAt(0).toUpperCase() + 
                               propCountryName.slice(1).toLowerCase();
      setTimeout(() => {
        setCountryName(formattedCountry);
      }, 0);
    } else {
      setTimeout(() => {
        setCountryName('');
      }, 0);
    }
  }, [pathname, propCountryName]);

  return (
    <div
      className="hidden w-full lg:block"
      style={{ backgroundColor: '#A35194' }}
    >
      <div className="flex w-full items-center justify-center gap-3 px-4 py-2 text-sm sm:text-base">
        {/* Text */}
        <p className="font-medium text-white">
          Welcome to Floriva Gifts {countryName}
        </p>
      </div>
    </div>
  );
};

export default CountryNotification;