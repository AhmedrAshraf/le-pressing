import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, MapPin, Phone, Mail, Laugh } from 'lucide-react';

const Footer = () => {
  const [logoError, setLogoError] = useState(false);

  return (
    <footer className="bg-comedy-navy text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="mb-4">
              {!logoError ? (
                <img 
                  src="/logo.png"
                  alt="Le Pressing Comedy Club"
                  className="h-16 w-auto"
                  onError={() => setLogoError(true)}
                  style={{
                    objectFit: 'contain',
                    objectPosition: 'left',
                    filter: 'brightness(0) invert(1)'
                  }}
                />
              ) : (
                <div className="flex items-center gap-2">
                  <Laugh className="h-12 w-12 text-comedy-orange" />
                  <span className="text-xl font-bold text-white">Le Pressing</span>
                </div>
              )}
            </div>
            <p className="text-gray-300">
              Le meilleur comedy club du var
            </p>
            <div className="flex space-x-4 mt-4">
              <a href="https://facebook.com" className="hover:text-comedy-orange transition-colors">
                <Facebook className="h-6 w-6" />
              </a>
              <a href="https://instagram.com" className="hover:text-comedy-orange transition-colors">
                <Instagram className="h-6 w-6" />
              </a>
              <a href="https://twitter.com" className="hover:text-comedy-orange transition-colors">
                <Twitter className="h-6 w-6" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Navigation</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/programme" className="hover:text-comedy-orange transition-colors">
                  Programme
                </Link>
              </li>
              <li>
                <Link to="/reservation" className="hover:text-comedy-orange transition-colors">
                  Réservation
                </Link>
              </li>
              <li>
                <Link to="/cours" className="hover:text-comedy-orange transition-colors">
                  Cours
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-comedy-orange transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <ul className="space-y-2">
              <li className="flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                <span>Galerie commerciale "Les Héllènes"<br />Avenue Hélène Vidal<br />83300 DRAGUIGNAN</span>
              </li>
              <li className="flex items-center">
                <Phone className="h-5 w-5 mr-2" />
                <span>07 52 38 55 12</span>
              </li>
              <li className="flex items-center">
                <Mail className="h-5 w-5 mr-2" />
                <span>contact@lepressing.fr</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Informations</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/mentions-legales" className="hover:text-comedy-orange transition-colors">
                  Mentions légales
                </Link>
              </li>
              <li>
                <Link to="/cgv" className="hover:text-comedy-orange transition-colors">
                  CGV
                </Link>
              </li>
              <li>
                <Link to="/confidentialite" className="hover:text-comedy-orange transition-colors">
                  Politique de confidentialité
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-comedy-orange transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-700 text-center text-gray-300">
          <p>&copy; {new Date().getFullYear()} Le Pressing Comedy Club. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;