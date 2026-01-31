import React, { useState } from 'react';
import { Globe } from 'lucide-react';

export default function LoginWithRegionSelector() {
  const [selectedRegion, setSelectedRegion] = useState('AP');
  const [isRegionOpen, setIsRegionOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const regions = [
    { code: 'AP', name: 'Asia Pacific', flag: '🌏' },
    { code: 'ME', name: 'Middle East', flag: '🌍' },
    { code: 'CHINA', name: 'China', flag: '🇨🇳' }
  ];

  const handleLogin = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
    console.log('Logging in to region:', selectedRegion);
  };

  return (
    <div className='relative w-full h-screen overflow-hidden bg-gray-900'>
      {/* Background Image */}
      <img
        src='https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1920&q=80'
        alt='background'
        className="absolute inset-0 w-full h-full object-cover object-right"
      />
      
      {/* Gradient Overlay */}
      <div className='absolute inset-0 bg-gradient-to-r from-black via-black/90 to-black/10'></div>

      {/* Content */}
      <div className='relative z-10 h-full flex items-center'>
        <div className='max-w-2xl px-12 md:px-16 lg:px-24'>
          {/* Orange Accent Line */}
          <div className='w-16 h-1 bg-orange-500 mb-12'></div>

          {/* Title */}
          <h1 className='text-white text-5xl md:text-6xl font-bold mb-4 leading-tight'>
            Payment<br />Enrichment
          </h1>

          {/* Subtitle */}
          <p className='text-white text-xl md:text-2xl font-light mb-12 leading-relaxed max-w-lg'>
            Enrich payment data with supporting details to make it straight through processing
          </p>

          {/* Region Selector */}
          <div className='mb-6 relative max-w-md'>
            <label className='text-white/80 text-sm font-medium mb-2 block flex items-center gap-2'>
              <Globe className='w-4 h-4' />
              Select Region
            </label>
            
            <button
              onClick={() => setIsRegionOpen(!isRegionOpen)}
              className='w-full bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-lg px-6 py-3 flex items-center justify-between hover:bg-white/15 transition-all duration-200 shadow-lg'
            >
              <span className='flex items-center gap-3'>
                <span className='text-2xl'>{regions.find(r => r.code === selectedRegion)?.flag}</span>
                <span className='font-medium'>{regions.find(r => r.code === selectedRegion)?.name}</span>
              </span>
              <svg
                className={`w-5 h-5 transition-transform duration-200 ${isRegionOpen ? 'rotate-180' : ''}`}
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
              </svg>
            </button>

            {/* Dropdown */}
            {isRegionOpen && (
              <div className='absolute top-full mt-2 w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg shadow-2xl overflow-hidden z-20'>
                {regions.map((region) => (
                  <button
                    key={region.code}
                    onClick={() => {
                      setSelectedRegion(region.code);
                      setIsRegionOpen(false);
                    }}
                    className={`w-full px-6 py-4 flex items-center gap-3 hover:bg-white/20 transition-colors duration-150 text-white ${
                      selectedRegion === region.code ? 'bg-white/15 border-l-4 border-orange-500' : ''
                    }`}
                  >
                    <span className='text-2xl'>{region.flag}</span>
                    <span className='font-medium'>{region.name}</span>
                    {selectedRegion === region.code && (
                      <svg className='w-5 h-5 text-orange-500 ml-auto' fill='currentColor' viewBox='0 0 20 20'>
                        <path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Get Started Button */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className='bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-semibold text-lg px-10 py-4 rounded-md transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
          >
            {loading ? (
              <span className='flex items-center gap-2 justify-center'>
                <svg className='animate-spin h-5 w-5' viewBox='0 0 24 24'>
                  <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' fill='none' />
                  <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z' />
                </svg>
                Signing In...
              </span>
            ) : (
              'Get Started'
            )}
          </button>

          {/* Region Info Badge */}
          <div className='mt-6 inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full'>
            <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></div>
            <span className='text-white/70 text-sm'>Connected to {selectedRegion} region</span>
          </div>
        </div>
      </div>
    </div>
  );
}
