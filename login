import React, { useState } from 'react';

export default function LoginPage() {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
  };

  const handleLogin = () => {
    console.log('Login attempted with:', credentials);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 overflow-hidden p-4">
      <div className="relative flex bg-white shadow-2xl rounded-2xl overflow-hidden w-full md:max-w-5xl h-[32rem]">
        
        {/* Left side Image */}
        <div className="hidden md:flex items-center justify-center overflow-hidden bg-gradient-to-b from-gray-900 to-slate-800">
          <div className="h-full w-full flex flex-col items-center justify-center p-8 text-white">
            <div className="text-5xl font-bold mb-8">
              <span className="text-orange-500">Co</span>
              <span className="text-white">forge</span>
            </div>
            <div className="text-4xl font-light mb-16">
              <span className="text-white">Let's </span>
              <span className="text-orange-500">engage!</span>
            </div>
            <div className="flex gap-4 mt-auto">
              <div className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center">f</div>
              <div className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center">in</div>
              <div className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center">X</div>
              <div className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center">yt</div>
            </div>
            <div className="text-xs mt-4 text-gray-400">© Coforge, 2024 | Confidential</div>
          </div>
        </div>

        {/* Right side Login Form */}
        <div className="w-full md:flex-1 flex flex-col justify-center px-12 py-8">
          
          {/* Header Section - Centered */}
          <div className="text-center mb-12">
            <div className="mb-2">
              <span className="text-3xl font-bold">
                <span className="text-orange-500">Co</span>
                <span className="text-gray-800">forge Limited</span>
              </span>
            </div>
            <div>
              <span className="text-xl font-light text-red-600">HSBC Account</span>
            </div>
          </div>

          {/* Form Section */}
          <div className="space-y-6">
            
            {/* UserID Field */}
            <div className="flex items-center gap-4">
              <label className="text-base font-semibold w-32 text-right">USER ID :</label>
              <input
                type="text"
                name="email"
                id="email"
                value={credentials.email}
                onChange={handleChange}
                className="flex-1 px-4 py-3 text-sm border-2 border-orange-400 rounded-lg focus:outline-none focus:border-orange-500"
                placeholder=""
              />
            </div>

            {/* Password Field */}
            <div className="flex items-center gap-4">
              <label className="text-base font-semibold w-32 text-right">PASSWORD :</label>
              <input
                type="password"
                name="password"
                id="password"
                value={credentials.password}
                onChange={handleChange}
                className="flex-1 px-4 py-3 text-sm border-2 border-orange-400 rounded-lg focus:outline-none focus:border-orange-500"
                placeholder=""
              />
            </div>

            {/* Sign In Button */}
            <button 
              onClick={handleLogin}
              className="w-full bg-black text-white py-3 text-sm rounded-lg font-medium hover:bg-gray-800 transition mt-8"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}