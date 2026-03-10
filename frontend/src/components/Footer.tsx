const Footer = () => {
  return (
    <>
      {/* Standard Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 px-4 md:px-10">
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
            © 2026 HealthMate. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="/privacy" className="text-slate-500 dark:text-slate-400 hover:text-primary transition-colors text-sm font-medium">Privacy Policy</a>
            <a href="/terms" className="text-slate-500 dark:text-slate-400 hover:text-primary transition-colors text-sm font-medium">Terms of Service</a>
            <a href="/contact" className="text-slate-500 dark:text-slate-400 hover:text-primary transition-colors text-sm font-medium">Support</a>
          </div>
        </div>
      </footer>

      {/* Bottom Floating Action Bar for Mobile/Quick Access */}
      <div className="fixed bottom-6 right-6 lg:hidden z-50">
        <button className="size-14 bg-primary rounded-full shadow-lg flex items-center justify-center text-slate-900 transition-transform active:scale-90">
          <span className="material-symbols-outlined text-3xl">add</span>
        </button>
      </div>
    </>
  );
};

export default Footer;