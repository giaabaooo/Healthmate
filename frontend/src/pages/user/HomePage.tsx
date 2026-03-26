import { Link } from "react-router-dom";
import Footer from "../../components/Footer";
import Navbar from "../../components/Navbar";

const HomePage = () => {
  // Kiểm tra xem user đã đăng nhập chưa
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden font-display bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100">
      
      {/* ── Navbar ── */}
      <Navbar />

      <main className="flex-1">
        
        {/* ── Hero Section ── */}
        <section className="px-4 md:px-8 py-6">
          <div
            className="relative flex min-h-[85vh] flex-col items-center justify-center overflow-hidden rounded-3xl bg-cover bg-center bg-no-repeat p-8 shadow-2xl"
            style={{
              backgroundImage: `linear-gradient(to bottom right, rgba(15, 23, 42, 0.8), rgba(15, 23, 42, 0.4)), url("https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2000&auto=format&fit=crop")`,
            }}
          >
            <div className="relative z-10 flex w-full max-w-[800px] flex-col items-center gap-6 text-center animate-fade-in">
              <span className="rounded-full bg-primary/20 border border-primary/50 px-5 py-2 text-xs font-black uppercase tracking-[0.2em] text-primary backdrop-blur-md">
                Next-Gen Fitness App
              </span>
              
              <h1 className="text-4xl font-black leading-[1.1] tracking-tight text-white md:text-6xl lg:text-7xl">
                Your AI-Powered Journey to a <span className="text-primary">Healthier You</span>
              </h1>
              
              <p className="mx-auto max-w-[600px] text-lg font-medium leading-relaxed text-slate-300 md:text-xl">
                Personalized fitness and nutrition plans powered by advanced AI to help you reach your goals faster with 24/7 expert guidance.
              </p>
              
              <div className="mt-4 flex w-full flex-col items-center justify-center gap-4 sm:flex-row">
                {/* Đổi Logic nút bấm dựa trên trạng thái Đăng nhập */}
                <Link
                  to={token ? "/overview" : "/register"}
                  className="flex h-14 w-full sm:w-auto items-center justify-center rounded-xl bg-primary px-8 text-lg font-black text-slate-900 shadow-[0_0_20px_rgba(18,236,91,0.3)] transition-transform hover:scale-105 hover:brightness-110"
                >
                  {token ? "Go to Dashboard" : "Start Your Free Trial"}
                </Link>
                <Link 
                  to={token ? "/schedule" : "/subscription"}
                  className="flex h-14 w-full sm:w-auto items-center justify-center rounded-xl border border-white/30 bg-white/10 px-8 text-lg font-bold text-white backdrop-blur-md transition-colors hover:bg-white/20"
                >
                  <span className="material-symbols-outlined mr-2 text-2xl">{token ? 'calendar_month' : 'play_circle'}</span>
                  {token ? "View My Schedule" : "Watch Demo"}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── THÊM MỚI: Our Impact (Stats Section) ── */}
        <section className="border-b border-slate-200 dark:border-slate-800/50 bg-white dark:bg-slate-900/20 py-16">
            <div className="mx-auto max-w-7xl px-6 md:px-10">
                <div className="grid grid-cols-2 gap-8 md:grid-cols-4 text-center">
                    <div className="flex flex-col gap-2">
                        <span className="text-4xl font-black text-slate-900 dark:text-white">50k+</span>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Users</span>
                    </div>
                    <div className="flex flex-col gap-2">
                        <span className="text-4xl font-black text-slate-900 dark:text-white">1.2M</span>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Workouts Done</span>
                    </div>
                    <div className="flex flex-col gap-2">
                        <span className="text-4xl font-black text-slate-900 dark:text-white">98%</span>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Goal Reached</span>
                    </div>
                    <div className="flex flex-col gap-2">
                        <span className="text-4xl font-black text-slate-900 dark:text-white">24/7</span>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">AI Support</span>
                    </div>
                </div>
            </div>
        </section>

        {/* ── THÊM MỚI: How It Works Section ── */}
        <section className="mx-auto max-w-7xl px-6 py-24 md:px-10">
          <div className="mb-16 flex flex-col items-center gap-4 text-center">
            <span className="text-primary font-black tracking-widest uppercase text-xs">Simple Process</span>
            <h2 className="text-4xl font-black leading-tight tracking-tight text-slate-900 dark:text-slate-100 md:text-5xl">
              How HealthMate Works
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-1/2 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent -translate-y-1/2 z-0"></div>
            
            {[
              { step: '01', icon: 'person_add', title: 'Create Profile', desc: 'Input your BMI, fitness goals, and dietary preferences.' },
              { step: '02', icon: 'auto_awesome', title: 'AI Analysis', desc: 'Our AI engine builds a 100% personalized 7-day roadmap.' },
              { step: '03', icon: 'monitoring', title: 'Track Daily', desc: 'Log your meals, check off workouts, and sync biological data.' },
              { step: '04', icon: 'emoji_events', title: 'Get Results', desc: 'Crush your goals and share your transformation with the community.' },
            ].map(({ step, icon, title, desc }) => (
              <div key={step} className="relative z-10 flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 rounded-full bg-white dark:bg-slate-900 border-4 border-slate-50 dark:border-slate-950 shadow-xl flex items-center justify-center text-primary relative">
                    <span className="material-symbols-outlined text-2xl">{icon}</span>
                    <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-900 text-white text-[10px] font-black flex items-center justify-center">{step}</span>
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Features Section ── */}
        <section className="bg-slate-100 dark:bg-slate-900/30 py-24 border-y border-slate-200 dark:border-slate-800/50">
          <div className="mx-auto max-w-7xl px-6 md:px-10">
              <div className="mb-16 flex flex-col items-center gap-4 text-center">
                <h2 className="text-4xl font-black leading-tight tracking-tight text-slate-900 dark:text-slate-100 md:text-5xl">
                  Smart Fitness for Everyone
                </h2>
                <p className="max-w-[700px] text-lg font-medium text-slate-600 dark:text-slate-400">
                  We combine advanced machine learning with sports science to give you a truly personalized, world-class experience.
                </p>
              </div>
              
              <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                {[
                  {
                    icon: "smart_toy",
                    title: "AI Coaching",
                    desc: "24/7 access to your personal AI trainer for form correction, workout adjustments, and real-time motivation.",
                  },
                  {
                    icon: "restaurant",
                    title: "Personalized Nutrition",
                    desc: "Tailored meal plans and macro tracking based on your unique metabolism, preferences, and daily activity.",
                  },
                  {
                    icon: "groups",
                    title: "Community Support",
                    desc: "Join thousands of members sharing their journey, competing in challenges, and celebrating every win together.",
                  },
                ].map(({ icon, title, desc }) => (
                  <div
                    key={title}
                    className="group flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:-translate-y-2 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-slate-900">
                      <span className="material-symbols-outlined text-3xl">{icon}</span>
                    </div>
                    <div className="flex flex-col gap-3">
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{title}</h3>
                      <p className="font-medium leading-relaxed text-slate-600 dark:text-slate-400">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
          </div>
        </section>

        {/* ── Testimonials Section ── */}
        <section className="py-24">
          <div className="mx-auto max-w-7xl px-6 md:px-10">
            <div className="mb-12 flex flex-col justify-between items-start gap-4 md:flex-row md:items-end">
              <div>
                <h2 className="mb-2 text-3xl font-black text-slate-900 dark:text-slate-100 md:text-4xl">Success Stories</h2>
                <p className="text-lg font-medium text-slate-600 dark:text-slate-400">Real results from real people.</p>
              </div>
              
              {/* Đã sửa Logic Text và Routing để hợp lý hóa UX */}
              <Link to={token ? "/community-feed" : "/register"} className="flex items-center gap-2 font-bold text-primary transition-colors hover:text-primary/70">
                Explore Community <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
            </div>
            
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {[
                {
                  name: "Sarah Jenkins",
                  since: "Member since 2023",
                  avatar: "https://i.pravatar.cc/150?img=47",
                  quote: "\"HealthMate completely changed how I look at fitness. The AI coach is like having a world-class pro in my pocket. I've never felt stronger.\"",
                },
                {
                  name: "Mark Thompson",
                  since: "Member since 2024",
                  avatar: "https://i.pravatar.cc/150?img=11",
                  quote: "\"I lost 20lbs in just 4 months thanks to the personalized meal plans. It takes the guesswork out of nutrition entirely. Highly recommended!\"",
                },
                {
                  name: "Elena Rodriguez",
                  since: "Member since 2023",
                  avatar: "https://i.pravatar.cc/150?img=32",
                  quote: "\"The community keeps me accountable. It's the first time I've stuck to a routine for over a year. The support is just incredible.\"",
                },
              ].map(({ name, since, avatar, quote }) => (
                <div key={name} className="flex flex-col gap-6 rounded-3xl bg-white p-8 shadow-sm dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-primary/30 transition-colors">
                  <div className="flex gap-1 text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className="material-symbols-outlined text-[20px]">star</span>
                    ))}
                  </div>
                  <p className="flex-1 text-base font-medium italic leading-relaxed text-slate-700 dark:text-slate-300">
                    {quote}
                  </p>
                  <div className="mt-auto flex items-center gap-4 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full ring-2 ring-primary/30 p-0.5">
                      <img src={avatar} alt={name} className="h-full w-full rounded-full object-cover" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-100">{name}</p>
                      <p className="text-xs font-medium text-slate-500">{since}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA Section ── */}
        <section className="px-4 py-24 md:px-8">
          <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[40px] bg-slate-900 px-6 py-20 text-center shadow-2xl dark:bg-primary/5 dark:border dark:border-primary/20">
            {/* Background Glow Effects */}
            <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/20 blur-[120px]" />
            <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-primary/20 blur-[120px]" />
            
            <div className="relative z-10 mx-auto max-w-[700px]">
              <h2 className="mb-6 text-4xl font-black text-white dark:text-slate-100 md:text-5xl">
                Ready to Start Your Transformation?
              </h2>
              <p className="mb-10 text-lg font-medium text-slate-400 dark:text-slate-300">
                Get your personalized fitness and nutrition plan today. Start your 7-day free trial. No credit card required.
              </p>
              
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  to={token ? "/overview" : "/register"}
                  className="flex h-14 w-full sm:w-auto items-center justify-center rounded-xl bg-primary px-10 text-lg font-black text-slate-900 shadow-[0_0_20px_rgba(18,236,91,0.2)] transition-transform hover:scale-105"
                >
                  {token ? "Go to Dashboard" : "Get Started for Free"}
                </Link>
                <Link 
                  to="/subscription"
                  className="flex h-14 w-full sm:w-auto items-center justify-center rounded-xl border border-slate-700 bg-transparent px-10 text-lg font-bold text-white transition-colors hover:bg-white/10"
                >
                  Compare Plans
                </Link>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* ── Footer ── */}
      <Footer />

    </div>
  );
};

export default HomePage;