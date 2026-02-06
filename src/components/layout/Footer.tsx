import { Link } from 'react-router-dom';
import {  Mail, Phone, MapPin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-foreground text-background/80">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl">
  <img
    src="/xcyber360-logo.png"
    alt="XCyber Logo"
    className="h-8 w-auto object-contain"
  />
</div>


              <span className="text-xl font-bold text-background">XCYBER360</span>
            </Link>
            <p className="text-sm text-background/60">
              Streamlining insurance data collection with secure, efficient, and user-friendly forms.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-background mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-background transition-colors">Home</Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-background transition-colors">Login</Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-background transition-colors">Register</Link>
              </li>
            </ul>
          </div>

          {/* For Users */}
          <div>
            <h4 className="font-semibold text-background mb-4">For Users</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/register?role=user" className="hover:text-background transition-colors">User Registration</Link>
              </li>
              <li>
                <Link to="/register?role=agent" className="hover:text-background transition-colors">Agent Registration</Link>
              </li>
              <li>
                <Link to="/register?role=admin" className="hover:text-background transition-colors">Admin Portal</Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-background mb-4">Contact</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                support@xcyber.com
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                +1 (555) 123-4567
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5" />
                <span>123 Insurance Ave, Suite 100<br />New York, NY 10001</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-background/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-background/60">
            © {new Date().getFullYear()} XCYBER360. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm">
            <Link to="/privacy" className="hover:text-background transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-background transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
