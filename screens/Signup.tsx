
import React from 'react';

interface Props {
  onComplete: () => void;
  onBack: () => void;
}

const Signup: React.FC<Props> = ({ onComplete, onBack }) => {
  return (
    <div className="glass-card p-8 rounded-3xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar">
      <button onClick={onBack} className="text-sm text-gray-400 mb-4 hover:text-white flex items-center">
        ← Back
      </button>
      <h2 className="text-2xl font-bold mb-6 text-[#00e5ff]">Create Seller Profile</h2>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-gray-400 ml-1">Full Name</label>
          <input className="w-full p-3 bg-white/10 rounded-lg border border-white/10" placeholder="John Doe" />
        </div>
        <div>
          <label className="text-xs text-gray-400 ml-1">Brand Logo</label>
          <input type="file" className="w-full p-2 bg-white/10 rounded-lg border border-white/10 text-xs" />
        </div>
        <div>
          <label className="text-xs text-gray-400 ml-1">Shop Name</label>
          <input className="w-full p-3 bg-white/10 rounded-lg border border-white/10" placeholder="Eco Crafts" />
        </div>
        <div>
          <label className="text-xs text-gray-400 ml-1">Category</label>
          <select className="w-full p-3 bg-white/10 rounded-lg border border-white/10 text-white">
            <option>Handcrafts</option>
            <option>Electronics</option>
            <option>Fashion</option>
            <option>Organic Foods</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-400 ml-1">Address</label>
          <textarea className="w-full p-3 bg-white/10 rounded-lg border border-white/10 resize-none h-20" placeholder="Shop Address..." />
        </div>
        <div>
          <label className="text-xs text-gray-400 ml-1">Udyam Aadhaar ID (Optional)</label>
          <input className="w-full p-3 bg-white/10 rounded-lg border border-white/10" placeholder="UDYAM-XX-00-0000000" />
        </div>
        <button 
          onClick={onComplete}
          className="w-full py-4 bg-gradient-to-r from-[#7c4dff] to-[#00e5ff] rounded-xl font-bold mt-4"
        >
          Register & Start Selling
        </button>
      </div>
      <div className="mt-6 p-4 bg-[#7c4dff]/10 rounded-xl text-center">
        <p className="text-xs text-gray-300">Need help setting up?</p>
        <a href="#" className="text-xs text-[#00e5ff] hover:underline">Watch YouTube Tutorial Guide</a>
      </div>
    </div>
  );
};

export default Signup;
