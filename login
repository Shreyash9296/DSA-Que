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
        <div className="hidden md:flex items-center justify-center overflow-hidden">
          <img
            src="/cfg.png"
            alt="Login Illustration"
            className="w-auto h-[32rem] object-contain"
          />
        </div>

        {/* Right side Login Form */}
        <div className="w-full md:w-96 flex flex-col justify-center px-8 py-8">
          
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
          <div className="space-y-5">
            
            {/* UserID Field */}
            <div className="flex items-center gap-3">
              <label className="text-sm font-semibold w-24 text-left whitespace-nowrap">USER ID :</label>
              <input
                type="text"
                name="email"
                id="email"
                value={credentials.email}
                onChange={handleChange}
                className="flex-1 px-3 py-2 text-sm border-2 border-orange-400 rounded-md focus:outline-none focus:border-orange-500"
                placeholder=""
              />
            </div>

            {/* Password Field */}
            <div className="flex items-center gap-3">
              <label className="text-sm font-semibold w-24 text-left whitespace-nowrap">PASSWORD :</label>
              <input
                type="password"
                name="password"
                id="password"
                value={credentials.password}
                onChange={handleChange}
                className="flex-1 px-3 py-2 text-sm border-2 border-orange-400 rounded-md focus:outline-none focus:border-orange-500"
                placeholder=""
              />
            </div>

            {/* Sign In Button */}
            <button 
              onClick={handleLogin}
              className="w-full bg-black text-white py-2.5 text-sm rounded-md font-medium hover:bg-gray-800 transition mt-8"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}