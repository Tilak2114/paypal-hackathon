import React from 'react';

export default function Landing({ onNavigate }) {
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
    <div className="relative z-10 w-full">
      {/* Hero Section: Centered max-width container with responsive padding */}
      <section className="min-h-[calc(100vh-80px)] flex items-center justify-center px-6 sm:px-12 py-16">
        <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Compact Content Area in Navy & Icy Blue */}
          <div className="lg:col-span-6 flex flex-col justify-center items-start text-left space-y-4 max-w-lg">
            <div 
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold tracking-wide shadow-sm"
              style={{
                border: '1px solid rgba(0, 210, 255, 0.5)',
                background: 'rgba(0, 210, 255, 0.08)',
                color: '#00d2ff'
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full animate-ping" style={{ background: '#00d2ff' }} />
              PayPal Subscriptions & Recurring Payments Guard
            </div>

            <h1 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl text-white leading-[1.08] tracking-tight">
              Cancel what you forgot you were paying for.
            </h1>

            <p className="text-mute text-sm sm:text-base font-normal leading-relaxed max-w-md">
              Churn Guard reads your subscriptions, spots the ones you never open, and warns you before trials end or prices rise. Pause or cancel with one tap through PayPal.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                onClick={() => onNavigate('dashboard')}
                className="px-6 py-3 rounded-full font-bold text-sm shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer"
                style={{
                  background: '#00d2ff',
                  color: '#030814',
                  boxShadow: '0 0 25px rgba(0, 210, 255, 0.4)'
                }}
              >
                Launch Dashboard Demo →
              </button>

              <button
                onClick={() => onNavigate('add')}
                className="px-5 py-3 rounded-full text-white font-semibold text-sm backdrop-blur-md hover:-translate-y-0.5 transition-all cursor-pointer"
                style={{
                  border: '1px solid rgba(0, 210, 255, 0.4)',
                  background: 'rgba(255, 255, 255, 0.04)'
                }}
              >
                Scan Raw Text (AI)
              </button>
            </div>

            {/* Quick Stat Bar */}
            <div className="pt-4 border-t border-line/40 grid grid-cols-3 gap-4 text-left w-full">
              <div>
                <div className="font-display font-black text-xl" style={{ color: '#00d2ff' }}>$420+</div>
                <div className="text-[11px] text-mute mt-0.5">Avg. Yearly Saved</div>
              </div>
              <div>
                <div className="font-display font-black text-xl text-white">1-Tap</div>
                <div className="text-[11px] text-mute mt-0.5">PayPal Pause/Cancel</div>
              </div>
              <div>
                <div className="font-display font-black text-xl text-coral">48h</div>
                <div className="text-[11px] text-mute mt-0.5">Advance Warnings</div>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Anchor on Widescreen */}
          <div className="hidden lg:flex lg:col-span-6 flex-col items-center justify-center pointer-events-none">
            <div className="w-full h-[450px]" />
          </div>

        </div>
      </section>

      {/* Feature Section: Navy & Ice Blue Cards */}
      <section className="py-24 px-6 sm:px-12 border-t border-line/40 flex justify-center">
        <div className="max-w-7xl w-full">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <h2 className="font-display font-extrabold text-3xl sm:text-5xl text-white tracking-tight">
              Three jobs, done for you
            </h2>
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
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-24 px-6 sm:px-12 border-t border-line/30 flex justify-center text-center">
        <div className="max-w-3xl w-full flex flex-col items-center space-y-6">
          <h2 className="font-display font-extrabold text-3xl sm:text-5xl text-white tracking-tight">
            Keep the money you meant to keep.
          </h2>
          <p className="text-mute text-base sm:text-lg max-w-xl">
            See your total monthly drain and start reclaiming yearly cash in under 60 seconds.
          </p>
          <button
            onClick={() => onNavigate('dashboard')}
            className="mt-4 px-10 py-4 rounded-full font-extrabold text-base shadow-xl hover:-translate-y-1 transition-all cursor-pointer"
            style={{
              background: '#00d2ff',
              color: '#030814',
              boxShadow: '0 0 30px rgba(0, 210, 255, 0.45)'
            }}
          >
            Start My Audit Now →
          </button>
        </div>
      </section>
    </div>
  );
}
