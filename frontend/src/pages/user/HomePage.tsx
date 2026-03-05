import Footer from "../../components/Footer";
import Navbar from "../../components/Navbar";

const HomePage = () => {
    return (
      <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden font-display bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100">
  
        {/* ── Navbar ── */}
        <Navbar/>
  
        <main className="flex-1">
  
          {/* ── Hero Section ── */}
          <section>
            <div className="p-0 md:p-10">
              <div
                className="flex min-h-[600px] flex-col gap-8 bg-cover bg-center bg-no-repeat rounded-none md:rounded-xl items-center justify-center p-8 relative overflow-hidden"
                style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.7) 100%), url("https://lh3.googleusercontent.com/aida-public/AB6AXuBYot3hAiwKRtjMeMMa4Ym8nw9ICFWq_LIwg-wQl3OjwQQxN-bPiVwYZ8uOVCaXw817ahjDPR4RiFuQydq8L7BgHgueOANl-IBg_-T2qosAywnUPNogYLtERgErp8hq5fUlSsW2LBcd5-kl05bhCMODp1PJwbrMcTcsn5tabMLFXoShURYA8A5pXApi8QgKpyTj63MtJo3lJ5UKDhd3UUk6TPDDOTb85y5Hd2vjQ9tnf3T2bIglrnl0MntHTEPM9EdmzhuL7HGpbkU")` }}
              >
                <div className="flex flex-col gap-4 text-center max-w-[800px] relative z-10">
                  <span className="bg-primary/20 border border-primary/30 text-primary px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest self-center">
                    Next-Gen Fitness
                  </span>
                  <h1 className="text-white text-5xl md:text-7xl font-black leading-[1.1] tracking-tight">
                    Your AI-Powered Journey to a <span className="text-primary">Healthier You</span>
                  </h1>
                  <p className="text-slate-200 text-lg md:text-xl font-normal leading-relaxed max-w-[600px] mx-auto">
                    Personalized fitness and nutrition plans powered by advanced AI to help you reach your goals faster with 24/7 expert guidance.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 relative z-10">
                  <button className="flex min-w-[200px] cursor-pointer items-center justify-center rounded-lg h-14 px-8 bg-primary text-slate-900 text-lg font-bold shadow-lg shadow-primary/20 transition-transform hover:scale-105">
                    Start Your Free Trial
                  </button>
                  <button className="flex min-w-[200px] cursor-pointer items-center justify-center rounded-lg h-14 px-8 bg-white/10 backdrop-blur-md border border-white/20 text-white text-lg font-bold hover:bg-white/20">
                    Watch How It Works
                  </button>
                </div>
              </div>
            </div>
          </section>
  
          {/* ── Features Section ── */}
          <section className="max-w-7xl mx-auto px-6 md:px-10 py-24">
            <div className="flex flex-col items-center text-center gap-4 mb-16">
              <h2 className="text-slate-900 dark:text-slate-100 text-4xl md:text-5xl font-black leading-tight tracking-tight">
                Smart Fitness for Everyone
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-lg max-w-[700px]">
                We combine advanced machine learning with sports science to give you a truly personalized experience.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { icon: 'smart_toy', title: 'AI Coaching', desc: '24/7 access to your personal AI trainer for form correction, workout adjustments, and real-time motivation.' },
                { icon: 'restaurant', title: 'Personalized Nutrition', desc: 'Tailored meal plans and macro tracking based on your unique metabolism, preferences, and daily activity.' },
                { icon: 'groups', title: 'Community Support', desc: 'Join thousands of members sharing their journey, competing in challenges, and celebrating every win together.' },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="flex flex-col gap-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-sm hover:shadow-xl transition-shadow group">
                  <div className="bg-primary/10 w-16 h-16 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-slate-900 transition-colors">
                    <span className="material-symbols-outlined text-3xl">{icon}</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <h3 className="text-slate-900 dark:text-slate-100 text-xl font-bold">{title}</h3>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
  
          {/* ── Testimonials Section ── */}
          <section className="bg-white dark:bg-slate-900 py-24">
            <div className="max-w-7xl mx-auto px-6 md:px-10">
              <div className="flex justify-between items-end mb-12">
                <div>
                  <h2 className="text-slate-900 dark:text-slate-100 text-3xl font-black mb-2">Success Stories</h2>
                  <p className="text-slate-600 dark:text-slate-400">Join 50,000+ people who transformed their lives.</p>
                </div>
                <button className="hidden md:flex items-center gap-2 text-primary font-bold hover:text-primary/70 transition-colors">
                  View All Stories <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  {
                    name: 'Sarah Jenkins', since: 'Member since 2023',
                    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCc9ayHOBK7LVfZYXOV2DG3LsDZMIeF5pu07uPd5kYCC-p-gRES4ts3WE1zAOWEJpTQK4eGl-e1Dxk98XuS2rlvkgS2Mia6aSHDaAmrAJKTKzVJis77LEVPOHSx8JmTf6T9uYoWpJHMIx28Uqk10CnB43zfmDad_ZSYrLjAghsN2whesdhaXmRDqNBvCWtICopVbQYtpROWYFy-w7dz9AKKo7G_pEYj0Y2Ch0lE7lPSioC3Bsv6jiLkcph6VV5zGUS6oXEBZtbmoLo',
                    quote: '"HealthMate completely changed how I look at fitness. The AI coach is like having a world-class pro in my pocket. I\'ve never felt stronger."',
                  },
                  {
                    name: 'Mark Thompson', since: 'Member since 2024',
                    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDKGv91DB4RS19JZh2Bh-UfKrN6zJkWKNLykGZPfVWyaeAojiA6pl5iigPvAaE6mXPxQHkSbT0gnpSsLSBHJ6MdQhc-mO0kz9YQ123iR5nFUCrHL3MB9mR0eEsrA88_DyXgGHGsSVc3uUI9sWfo7yS5WKhNMq8QD7krGegQCzZ0_dOyZS0dszKasnKk04yEATpqjw78Q0RB2YPDqwv0hgUH8gcHw66DwMAhQJ0BAn0hS6NlPxurPnsAE9MTNltu8CtrSgtJ0UOr98M',
                    quote: '"I lost 20lbs in just 4 months thanks to the personalized meal plans. It takes the guesswork out of nutrition entirely. Highly recommended!"',
                  },
                  {
                    name: 'Elena Rodriguez', since: 'Member since 2023',
                    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAOhxo80d7t2-d5fjk61CmF3XGI3m5LxU-_r3Jv7ktrVPn6ivnqFSzalxvAvPKnNJAR4eII0nvjmJyRJIu3HE_-jyECRcDX8q8IovoaDgF6wdqPZ0mUYM6wdJyfne5BGFXN1AqGZj_DxFJ7JO_veBvhjsmQDK8Jj9t4k0-FkutafIGROPVooWOnOntL1q9CuiVLgTlVzEGIzUPp4QnxJCe_RSxq77bl6oXlmkaHPZl-Rl8-nnh75F5Du57AA3AONn6CN5bI2apB4L4',
                    quote: '"The community keeps me accountable. It\'s the first time I\'ve stuck to a routine for over a year. The support is just incredible."',
                  },
                ].map(({ name, since, avatar, quote }) => (
                  <div key={name} className="flex flex-col gap-5 p-8 rounded-2xl bg-background-light dark:bg-slate-800/50">
                    <div className="flex items-center gap-4">
                      <div className="rounded-full size-12 overflow-hidden ring-2 ring-primary/20">
                        <img src={avatar} alt={name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="text-slate-900 dark:text-slate-100 font-bold">{name}</p>
                        <p className="text-slate-500 text-sm">{since}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 text-primary">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className="material-symbols-outlined text-[20px]">star</span>
                      ))}
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 italic leading-relaxed">{quote}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
  
          {/* ── CTA Section ── */}
          <section className="py-24 px-6 md:px-10">
            <div className="max-w-5xl mx-auto rounded-3xl bg-slate-900 dark:bg-primary/10 border border-slate-800 dark:border-primary/20 p-12 text-center relative overflow-hidden">
              <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
              <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
              <div className="relative z-10">
                <h2 className="text-white dark:text-slate-100 text-4xl md:text-5xl font-black mb-6">
                  Ready to Start Your Transformation?
                </h2>
                <p className="text-slate-400 dark:text-slate-300 text-lg mb-10 max-w-[600px] mx-auto">
                  Get your personalized fitness and nutrition plan today. Start your 7-day free trial. No credit card required.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button className="bg-primary text-slate-900 px-10 py-4 rounded-xl font-black text-lg hover:scale-105 transition-transform shadow-xl shadow-primary/20">
                    Get Started for Free
                  </button>
                  <button className="bg-transparent text-white border border-slate-700 px-10 py-4 rounded-xl font-bold text-lg hover:bg-white/5 transition-colors">
                    Compare Plans
                  </button>
                </div>
              </div>
            </div>
          </section>
  
        </main>
  
        {/* ── Footer ── */}
        <Footer/>
  
      </div>
    );
  };
  
  export default HomePage;