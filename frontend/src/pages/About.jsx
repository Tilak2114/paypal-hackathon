import React from 'react';

export default function About({ onNavigate, onGetStarted }) {
  // 3D Tilt effect for cards on hover
  const handleTilt = (e, el) => {
    if (!el) return;
    const b = el.getBoundingClientRect();
    const x = (e.clientX - b.left) / b.width - 0.5;
    const y = (e.clientY - b.top) / b.height - 0.5;
    el.style.transform = `perspective(1000px) rotateY(${x * 14}deg) rotateX(${-y * 14}deg) translateY(-4px)`;
  };

  const handleResetTilt = (el) => {
    if (!el) return;
    el.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg) translateY(0px)';
  };

  return (
    <div className="relative z-10 w-full min-h-[calc(100vh-140px)] flex flex-col justify-center items-center py-16 px-6 sm:px-12 animate-fadeIn">
      <div className="max-w-7xl w-full">
        {/* Header with back button */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => onNavigate('landing')}
            className="text-xs font-bold text-[#00d2ff] hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer px-3 py-1.5 rounded-full border border-[rgba(0,210,255,0.3)] bg-[rgba(0,210,255,0.06)]"
          >
            ← Back to Overview
          </button>

          <span 
            className="text-xs font-semibold px-3 py-1 rounded-full text-[#00d2ff]"
            style={{
              background: 'rgba(0, 210, 255, 0.08)',
              border: '1px solid rgba(0, 210, 255, 0.3)'
            }}
          >
            How Churn Guard Works
          </span>
        </div>

        <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
          <h1 className="font-display font-extrabold text-3xl sm:text-5xl text-white tracking-tight">
            Three jobs, done for you
          </h1>
          <p className="text-mute text-base sm:text-lg">
            Paste your list or connect PayPal. Churn Guard does the checking so you don’t have to remember.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1: Audit */}
          <div
            onMouseMove={(e) => handleTilt(e, e.currentTarget)}
            onMouseLeave={(e) => handleResetTilt(e.currentTarget)}
            className="bg-card rounded-3xl p-8 backdrop-blur-xl transition-all duration-150 ease-out flex flex-col justify-between"
            style={{
              border: '1px solid rgba(0, 210, 255, 0.25)',
              boxShadow: '0 10px 30px rgba(5, 10, 23, 0.6)'
            }}
          >
            <div>
              <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-inner"
                style={{
                  background: 'rgba(0, 210, 255, 0.12)',
                  color: '#00d2ff',
                  border: '1px solid rgba(0, 210, 255, 0.3)'
                }}
              >
                🔍
              </div>
              <h3 className="font-display font-bold text-2xl text-white mb-3">Audit</h3>
              <p className="text-mute text-sm leading-relaxed">
                Finds subscriptions you haven’t used in weeks and flags overlaps, like two music apps playing the same songs.
              </p>
            </div>
          </div>

          {/* Card 2: Warn */}
          <div
            onMouseMove={(e) => handleTilt(e, e.currentTarget)}
            onMouseLeave={(e) => handleResetTilt(e.currentTarget)}
            className="bg-card rounded-3xl p-8 backdrop-blur-xl transition-all duration-150 ease-out flex flex-col justify-between"
            style={{
              border: '1px solid rgba(255, 61, 113, 0.25)',
              boxShadow: '0 10px 30px rgba(5, 10, 23, 0.6)'
            }}
          >
            <div>
              <div className="w-14 h-14 rounded-2xl bg-coral/20 text-coral flex items-center justify-center text-2xl mb-6 shadow-inner border border-coral/30">
                ⏰
              </div>
              <h3 className="font-display font-bold text-2xl text-white mb-3">Warn</h3>
              <p className="text-mute text-sm leading-relaxed">
                Tells you before a free trial turns into a charge or a price goes up, then suggests pausing or a cheaper plan based on how you use it.
              </p>
            </div>
          </div>

          {/* Card 3: Act */}
          <div
            onMouseMove={(e) => handleTilt(e, e.currentTarget)}
            onMouseLeave={(e) => handleResetTilt(e.currentTarget)}
            className="bg-card rounded-3xl p-8 backdrop-blur-xl transition-all duration-150 ease-out flex flex-col justify-between"
            style={{
              border: '1px solid rgba(37, 99, 235, 0.35)',
              boxShadow: '0 10px 30px rgba(5, 10, 23, 0.6)'
            }}
          >
            <div>
              <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-inner"
                style={{
                  background: 'rgba(37, 99, 235, 0.15)',
                  color: '#60a5fa',
                  border: '1px solid rgba(37, 99, 235, 0.4)'
                }}
              >
                👆
              </div>
              <h3 className="font-display font-bold text-2xl text-white mb-3">Act</h3>
              <p className="text-mute text-sm leading-relaxed">
                Manage, pause or cancel PayPal recurring payments inside Churn Guard with a single tap.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Button to proceed */}
        <div className="mt-14 text-center">
          <button
            onClick={onGetStarted}
            className="px-8 py-3.5 rounded-full font-bold text-sm shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer"
            style={{
              background: '#00d2ff',
              color: '#030814',
              boxShadow: '0 0 25px rgba(0, 210, 255, 0.45)'
            }}
          >
            Ready? Get Started Now →
          </button>
        </div>
      </div>
    </div>
  );
}
