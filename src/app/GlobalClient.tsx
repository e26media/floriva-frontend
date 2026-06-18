'use client';

import CountryAccessProvider from '@/components/CountryAccessProvider';
import { Toaster } from 'react-hot-toast';

const GlobalClient = () => {
  return (
    <>
      <CountryAccessProvider />
      <Toaster />
    </>
  );
};

export default GlobalClient;
