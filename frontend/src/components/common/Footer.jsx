import { Ticket } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-white/5 pt-12 pb-8">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center">
              <Ticket size={16} className="text-white" fill="currentColor" />
            </div>
            <span className="font-extrabold text-white text-lg">EventFlow</span>
          </div>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Your one-stop platform for live events, concerts, movies, and more.
          </p>
        </div>

        {[
          { title: 'Explore',  links: ['Movies', 'Concerts', 'Sports', 'Plays'] },
          { title: 'Company',  links: ['About Us', 'Careers', 'Press', 'Contact'] },
          { title: 'Support',  links: ['Help Center', 'Cancellations', 'Privacy Policy', 'Terms'] },
        ].map(col => (
          <div key={col.title}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-4">
              {col.title}
            </p>
            <ul className="space-y-2">
              {col.links.map(l => (
                <li key={l}>
                  <a href="#" className="text-sm text-on-surface-variant hover:text-white transition-colors">
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-white/5">
        <p className="text-xs text-on-surface-variant">© 2026 EventFlow. All rights reserved.</p>
        <div className="flex gap-3">
          {['T', 'I', 'F'].map((s, i) => (
            <a key={i} href="#"
              className="w-8 h-8 rounded-full bg-surface-container hover:bg-primary/20 hover:text-primary
                text-on-surface-variant flex items-center justify-center text-[11px] font-bold transition-all">
              {s}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}