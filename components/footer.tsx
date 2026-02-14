import Link from "next/link";
import { FaLinkedinIn } from "react-icons/fa";
import { FaGithub } from "react-icons/fa";
import { MdOutlineEmail } from "react-icons/md";

const Footer = () => {
  return (
    <footer className="border-t border-b bg-background">
      <div className="max-w-7xl mx-auto px-6 py-16 pb-7">
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-white">DentalCare</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Trusted dental care made simple. Book appointments, consult
              verified doctors, and manage your dental health seamlessly.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4 tracking-wide">
              PRODUCT
            </h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/book-appointment"
                  className="hover:text-white transition"
                >
                  Book Appointment
                </Link>
              </li>
              <li>
                <Link href="/doctors" className="hover:text-white transition">
                  Doctors
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-white transition">
                  Services
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4 tracking-wide">
              COMPANY
            </h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <Link href="/about" className="hover:text-white transition">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition">
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4 tracking-wide">
              FOLLOW US
            </h4>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/Payoj20"
                target="_blank"
                rel="noopener noreferre"
                className="p-2 rounded-md bg-muted hover:bg-blue-600 transition"
              >
                <FaGithub className="h-4 w-4 text-white" />
              </a>
              <a
                href="https://www.linkedin.com/in/payoj-mandpe-95a19524a/"
                target="_blank"
                rel="noopener noreferre"
                className="p-2 rounded-md bg-muted hover:bg-blue-600 transition"
              >
                <FaLinkedinIn className="h-4 w-4 text-white" />
              </a>
              <a
                href="mailto:payojmandpe20@gmail.com"
                target="_blank"
                rel="noopener noreferre"
                className="p-2 rounded-md bg-muted hover:bg-blue-600 transition"
              >
                <MdOutlineEmail className="h-4 w-4 text-white" />
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="my-8 border-t border-border/50" />

        {/* Bottom */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} DentalCare. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
