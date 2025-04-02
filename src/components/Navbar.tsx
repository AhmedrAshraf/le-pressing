import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Shield, Laugh } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAdmin } = useAuth();
  const [logoError, setLogoError] = useState(false);

  const navigation = [
    { name: 'Accueil', href: '/' },
    { name: 'Programme', href: '/programme' },
    { name: 'Réservation', href: '/reservation' },
    { name: 'Cours', href: '/cours' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center">
              {!logoError ? (
                <img 
                  src="/logo.png"
                  alt="Le Pressing Comedy Club"
                  className="h-12 w-auto"
                  onError={() => setLogoError(true)}
                  style={{
                    objectFit: 'contain',
                    objectPosition: 'center'
                  }}
                />
              ) : (
                <div className="flex items-center gap-2">
                  <Laugh className="h-8 w-8 text-comedy-orange" />
                  <span className="text-lg font-bold">Le Pressing</span>
                </div>
              )}
            </Link>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'text-gray-700 hover:text-comedy-orange',
                  'px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200'
                )}
              >
                {item.name}
              </Link>
            ))}
            {isAdmin && (
              <Link
                to="/admin/events"
                className="flex items-center gap-2 text-comedy-orange hover:text-comedy-orange-dark px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
              >
                <Shield className="w-4 h-4" />
                Admin
              </Link>
            )}
            {!user ? (
              <Link
                to="/login"
                className="bg-comedy-orange text-white px-4 py-2 rounded-md hover:bg-opacity-90 transition-colors"
              >
                Connexion
              </Link>
            ) : (
              <button
                onClick={() => supabase.auth.signOut()}
                className="text-gray-700 hover:text-comedy-orange px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
              >
                Déconnexion
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-comedy-orange focus:outline-none transition-colors duration-200"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div 
        className={cn(
          'md:hidden transition-all duration-200 ease-in-out',
          isOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
        )}
      >
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'text-gray-700 hover:text-comedy-orange block',
                'px-3 py-2 rounded-md text-base font-medium transition-colors duration-200'
              )}
              onClick={() => setIsOpen(false)}
            >
              {item.name}
            </Link>
          ))}
          {isAdmin && (
            <Link
              to="/admin/events"
              className="flex items-center gap-2 text-comedy-orange hover:text-comedy-orange-dark px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
              onClick={() => setIsOpen(false)}
            >
              <Shield className="w-4 h-4" />
              Admin
            </Link>
          )}
          {!user ? (
            <Link
              to="/login"
              className="block bg-comedy-orange text-white px-4 py-2 rounded-md hover:bg-opacity-90 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Connexion
            </Link>
          ) : (
            <button
              onClick={() => {
                supabase.auth.signOut();
                setIsOpen(false);
              }}
              className="block w-full text-left text-gray-700 hover:text-comedy-orange px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
            >
              Déconnexion
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;