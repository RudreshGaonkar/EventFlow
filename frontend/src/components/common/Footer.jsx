import { Ticket } from 'lucide-react';
import { Link } from 'react-router-dom';

import facebookIcon  from '../../assets/facebook-brands-solid-full.svg';
import twitterIcon   from '../../assets/twitter-brands-solid-full.svg';
import instagramIcon from '../../assets/instagram-brands-solid-full.svg';

const SOCIAL_LINKS = [
  { icon: twitterIcon,   alt: 'Twitter',   url: '#' },
  { icon: instagramIcon, alt: 'Instagram', url: '#' },
  { icon: facebookIcon,  alt: 'Facebook',  url: '#' },
];

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-outline-variant/30 pt-16 pb-8 bg-surface-container-lowest">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center">
                <Ticket size={16} className="text-on-primary" fill="currentColor" />
              </div>
              <span className="font-headline font-extrabold text-on-surface text-lg">EventFlow</span>
            </div>
            <p className="text-sm text-on-surface-variant leading-relaxed max-w-sm">
              Your one-stop platform for live events, concerts, movies, and more.
            </p>
          </div>

          {[
            { title: 'Explore',  links: ['Movies', 'Concerts', 'Sports', 'Plays'] },
            { title: 'Company',  links: ['About Us', 'Careers', 'Press', 'Contact'] },
            { title: 'Support',  links: ['Help Center', 'Cancellations', 'Privacy Policy', 'Terms'] },
          ].map(col => (
            <div key={col.title} className="lg:col-span-1">
              <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-6 font-headline">
                {col.title}
              </p>
              <ul className="space-y-3">
                {col.links.map(l => (
                  <li key={l}>
                    <a href="#" className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-8 border-t border-outline-variant/20">
          <p className="text-xs font-medium text-on-surface-variant">© 2026 EventFlow. All rights reserved.</p>
          <div className="flex gap-4">
            {SOCIAL_LINKS.map((s, i) => (
              <a key={i} href={s.url}
                className="w-10 h-10 rounded-full bg-surface-container hover:bg-primary hover:text-on-primary
                  flex items-center justify-center transition-all border border-transparent hover:border-primary/20
                  group">
                <img 
                  src={s.icon} 
                  alt={s.alt} 
                  className="w-4 h-4 opacity-70 group-hover:opacity-100 invert transition-opacity
                             group-hover:invert-0" 
                />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}