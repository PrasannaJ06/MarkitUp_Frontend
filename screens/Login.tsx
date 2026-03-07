
import React, { useState } from 'react';

interface Props {
  onLogin: (user: any) => void;
  onSignup: () => void;
  onBack: () => void;
}

const Login: React.FC<Props> = ({ onLogin, onSignup, onBack }) => {
  const [email, setEmail] = useState('');

  return (
    <div className="glass-card p-8 rounded-3xl w-full">
      <button onClick={onBack} className="text-sm text-gray-400 mb-4 hover:text-white flex items-center">
        ← Back
      </button>
      <h2 className="text-3xl font-bold mb-8 text-[#00e5ff]">Seller Login</h2>
      <div className="space-y-4">
        <input 
          type="email" 
          placeholder="Email Address" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-4 bg-white/10 rounded-xl border border-white/10 focus:border-[#7c4dff] outline-none text-white"
        />
        <input 
          type="password" 
          placeholder="Password" 
          className="w-full p-4 bg-white/10 rounded-xl border border-white/10 focus:border-[#7c4dff] outline-none text-white"
        />
        <button 
          onClick={() => onLogin({ name: 'George', email, shopName: "George's Artisan Hub" })}
          className="w-full py-4 bg-gradient-to-r from-[#7c4dff] to-[#00e5ff] rounded-xl font-bold mt-4 text-white"
        >
          Login
        </button>
      </div>
      <div className="mt-8 text-center">
        <p className="text-gray-400 mb-2">Don't have an account?</p>
        <button onClick={onSignup} className="text-[#00e5ff] font-semibold hover:underline">
          Create Seller Account
        </button>
      </div>
    </div>
  );
};

export default Login;
