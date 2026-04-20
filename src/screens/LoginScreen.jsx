import React, { useState } from 'react';
import { EyeOff, Eye, User, Check } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import kLogoAsset from '../assets/kodivian.png.jpeg';
import mLogoAsset from '../assets/mckinsey.png';

export default function LoginScreen() {
  const { login } = useAppContext();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState({ user: '', pass: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Hide fallback text variable mapping since we're using raw imports now
  const kLogoPath = kLogoAsset;
  const mLogoPath = mLogoAsset;

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    setTimeout(() => {
      if (credentials.user === 'mckinsey@kodivian.com' && credentials.pass === 'mckinsey@123') {
        login();
        navigate('/');
      } else {
        setError('Invalid credentials required for this instance.');
        setLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen w-full bg-[#cbd5e1] flex items-center justify-center p-4 sm:p-8 xl:p-12 relative overflow-hidden">
      
      {/* Abstract Background Elements (Outside the main card) */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-white rounded-full filter blur-[120px] opacity-20 -translate-y-1/2 translate-x-1/3"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-white rounded-full filter blur-[100px] opacity-40 translate-y-1/3 -translate-x-1/4"></div>

      {/* Main Container mimicking a browser window or large device frame */}
      <div className="max-w-[1150px] w-full min-h-[680px] bg-[#342467] rounded-3xl sm:rounded-[2.5rem] shadow-2xl flex overflow-hidden relative border-[8px] sm:border-[12px] border-white/20">
        
        {/* Abstract 3D shape mimicking the fluid layers in the reference */}
        <div className="absolute -top-32 -left-32 w-[600px] h-[600px] z-0 opacity-90 pointer-events-none">
            {/* Using CSS layering for the fluid effect since an image wasn't provided for the art */}
            <div className="absolute top-20 left-20 w-80 h-96 bg-[#4e3a89] rounded-full blur-2xl transform rotate-45 scale-y-50 shadow-[0_0_80px_rgba(78,58,137,0.8)]"></div>
            <div className="absolute top-40 left-40 w-72 h-80 bg-[#5ccfb9] rounded-full blur-3xl transform rotate-12 opacity-40"></div>
            <div className="absolute top-60 left-10 w-96 h-60 bg-[#2b88ac] rounded-full blur-3xl transform -rotate-12 opacity-60"></div>
            
            {/* SVG implementation of the swooshes for higher fidelity */}
            <svg viewBox="0 0 400 400" className="absolute inset-0 w-full h-full drop-shadow-2xl">
              <path d="M 50,150 C 150,300 300,250 350,150 C 400,50 250,-50 150,0 C 50,50 -50,0 50,150 Z" fill="#7C3AED" opacity="0.6" />
              <path d="M 80,180 C 180,320 320,260 360,170 C 390,90 280,10 180,40 C 80,70 10,80 80,180 Z" fill="#2DD4BF" opacity="0.8" />
              <path d="M 100,200 C 200,340 330,280 360,190 C 380,110 300,50 200,70 C 100,90 30,120 100,200 Z" fill="#1E3A8A" opacity="0.7" />
              <path d="M 120,220 C 220,380 340,310 370,220 C 390,150 290,100 210,120 C 130,140 60,150 120,220 Z" fill="#8B5CF6" />
            </svg>
        </div>

        {/* Content Layout */}
        <div className="w-full relative z-10 flex flex-col md:flex-row">
            
            {/* Left Side: Branding */}
            <div className="flex-1 p-12 md:p-20 flex flex-col justify-center">
              
              <div className="flex flex-col gap-6 mb-12 relative z-20">
                {/* Brand Logos */}
                <div className="flex items-center gap-6 mb-8 mt-2">
                  <div className="rounded-[1rem] inline-block flex items-center justify-center shadow-lg overflow-hidden relative border border-white/10 bg-white">
                     <img src={kLogoPath} alt="Kodivian" className="w-24 h-24 md:w-32 md:h-32 object-contain" 
                          onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
                     <div style={{ display: 'none' }} className="text-black font-bold text-xl p-3">KODIVIAN</div>
                  </div>
                  <span className="text-white/30 text-xl font-light">×</span>
                  <div className="rounded-[1rem] inline-block flex items-center justify-center shadow-lg overflow-hidden relative border border-white/10 bg-[#051c2c]">
                     <img src={mLogoPath} alt="McKinsey & Company" className="w-24 h-24 md:w-32 md:h-32 object-cover" 
                          onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
                     <div style={{ display: 'none' }} className="text-white font-serif tracking-tight text-lg text-center leading-tight p-3">McKinsey<br/>& Company</div>
                  </div>
                </div>
                
                {/* Text Content */}
                <h1 className="text-3xl md:text-4xl font-medium text-white leading-tight tracking-tight max-w-md mb-6">
                  You will be testing one of Scanify AI's core applications: <span className="font-semibold block mt-1 text-white/90">Claim Validation™</span>
                </h1>
              </div>

            </div>

            {/* Right Side: Form Container */}
            <div className="w-full md:w-[500px] lg:w-[600px] flex items-center justify-center p-8 md:p-16">
              
              {/* Glassmorphism Card */}
              <div className="w-full max-w-[420px] bg-white/5 backdrop-blur-[20px] border border-white/10 rounded-2xl p-10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]">
                
                <h2 className="text-[28px] font-semibold text-white mb-8 tracking-tight">Log In to Scanify™</h2>

                <form onSubmit={handleLogin} className="space-y-6">
                  
                  {/* Email Input */}
                  <div className="space-y-2">
                    <label className="text-[13px] text-white/80 font-medium">Your Email</label>
                    <div className="relative group">
                      <input
                        type="email"
                        required
                        value={credentials.user}
                        onChange={(e) => setCredentials({ ...credentials, user: e.target.value })}
                        className="w-full bg-transparent border border-white/20 rounded-xl px-4 py-3.5 text-white placeholder-white/30 focus:outline-none focus:border-[#5ccfb9] focus:bg-white/5 transition-all text-sm"
                        placeholder="mckinsey@kodivian.com"
                      />
                      <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-white/40 group-focus-within:text-[#5ccfb9] transition-colors">
                        <User className="w-[18px] h-[18px]" />
                      </div>
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="space-y-2">
                    <label className="text-[13px] text-white/80 font-medium">Your Password</label>
                    <div className="relative group">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={credentials.pass}
                        onChange={(e) => setCredentials({ ...credentials, pass: e.target.value })}
                        className="w-full bg-transparent border border-white/20 rounded-xl px-4 py-3.5 text-white placeholder-white/30 focus:outline-none focus:border-[#5ccfb9] focus:bg-white/5 transition-all text-sm tracking-widest"
                        placeholder="••••••••"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-4 flex items-center text-white/40 hover:text-white transition-colors"
                      >
                         {showPassword ? <Eye className="w-[18px] h-[18px]" /> : <EyeOff className="w-[18px] h-[18px]" />}
                      </button>
                    </div>
                  </div>

                  {/* Options Row */}
                  <div className="flex items-center justify-between text-[13px] text-white/70 pt-2 pb-2">
                    <label className="flex items-center gap-2 cursor-pointer group" onClick={() => setRememberMe(!rememberMe)}>
                      <div className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-colors ${rememberMe ? 'bg-[#5ccfb9] border-[#5ccfb9]' : 'border-white/30 bg-transparent group-hover:border-white/60'}`}>
                        {rememberMe && <Check className="w-3 h-3 text-[#1e293b]" strokeWidth={4} />}
                      </div>
                      <span className="group-hover:text-white transition-colors select-none">Remember</span>
                    </label>
                    <button type="button" onClick={() => alert('Password resets are managed externally. Please contact your Kodivian administrator.')} className="hover:text-white transition-colors">Forgotten?</button>
                  </div>

                  {/* Error State */}
                  {error && (
                    <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-xs text-center">
                      {error}
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-[#bae6fd] hover:bg-[#a5f3fc] text-[#0f172a] font-semibold text-[14px] transition-colors relative overflow-hidden flex items-center justify-center shadow-[0_0_15px_rgba(186,230,253,0.3)]"
                  >
                    {loading ? (
                       <div className="w-5 h-5 border-2 border-[#0f172a]/20 border-t-[#0f172a] rounded-full animate-spin"></div>
                    ) : (
                       "Log In"
                    )}
                  </button>

                  <div className="pt-5 mt-2 border-t border-white/10 text-center">
                     <p className="text-[12px] text-white/50 mb-3">Don't have an account?</p>
                     <button type="button" onClick={() => alert('Public sign-ups are disabled for this environment. Please reach out to your team lead to request access.')} className="w-full py-2.5 rounded-xl border border-white/10 text-white/80 font-medium text-[13px] hover:bg-white/5 transition-colors">
                        Sign Up
                     </button>
                  </div>
                </form>
              </div>

            </div>

        </div>

      </div>
    </div>
  );
}
