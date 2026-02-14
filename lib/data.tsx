import { ReactNode } from "react";
import { FaUser } from "react-icons/fa";
import { FaRegCalendarAlt } from "react-icons/fa";
import { IoIosNotifications } from "react-icons/io";
import { FaClock } from "react-icons/fa";
import { FaFileMedical } from "react-icons/fa6";

export interface Feature {
  icon: ReactNode;
  title: string;
  description: string;
}

export interface Service {
  title: string;
  description: string;
  image: string;
}

export const features: Feature[] = [
  {
    icon: <FaUser className="h-6 w-6 text-blue-400" />,
    title: "Create Your Profile",
    description:
      "Sign up and complete your profile to get dentalcare recommendations and services.",
  },
  {
    icon: <FaRegCalendarAlt className="h-6 w-6 text-blue-400" />,
    title: "Book Appointments",
    description:
      "Browse doctor profiles, check availability, and book appointments that fit your schedule.",
  },
  {
    icon: <IoIosNotifications className="h-6 w-6 text-blue-400" />,
    title: "Get Reminders",
    description:
      "Receive timely notifications about your appointments and important updates.",
  },
  {
    icon: <FaClock className="h-6 w-6 text-blue-400" />,
    title: "Real-Time Availability",
    description:
      "View live doctor availability with a timeline-based booking system that prevents double bookings.",
  },
  {
    icon: <FaFileMedical className="h-6 w-6 text-blue-400" />,
    title: "Appointment History",
    description:
      "Access past appointments, visit notes, and treatment records in one secure place.",
  },
];

export const services: Service[] = [
  {
    title: "Implants",
    description:
      "Dental implants are a permanent solution for missing teeth, designed to look, feel, and function like natural teeth. They restore chewing ability, appearance, and long-term oral health.",
    image: "/services/implants.png",
  },

  {
    title: "Cosmetic & Oral Surgery",
    description:
      "Advanced surgical procedures to improve oral function, facial aesthetics, and overall dental health. Includes corrective surgeries performed with precision and care.",
    image: "/services/oralsurgery.png",
  },

  {
    title: "Cosmetic Filling",
    description:
      "Tooth-colored fillings that repair cavities while maintaining a natural look. These fillings strengthen the tooth and blend seamlessly with your smile.",
    image: "/services/cosmeticfilling.png",
  },

  {
    title: "Dental X-Ray",
    description:
      "Digital dental X-rays help detect hidden dental issues such as cavities, infections, bone loss, and impacted teeth with minimal radiation exposure.",
    image: "/services/xray.png",
  },

  {
    title: "Fixed Orthodontic Treatment",
    description:
      "Braces and fixed appliances used to correct misaligned teeth and bite issues. Helps improve appearance, speech, and long-term dental health.",
    image: "/services/ortho.png",
  },

  {
    title: "Smile Designing",
    description:
      "A customized cosmetic treatment that enhances your smile by correcting shape, color, alignment, and spacing of teeth for a confident appearance.",
    image: "/services/smiledesign.png",
  },

  {
    title: "Root Canal Treatment",
    description:
      "A pain-relieving procedure that removes infected pulp from the tooth, preserving the natural tooth structure and preventing further infection.",
    image: "/services/rootcanal.png",
  },

  {
    title: "Oral Cancer Detection & Treatment",
    description:
      "Early screening and diagnosis of oral cancer followed by appropriate treatment to ensure better outcomes and patient safety.",
    image: "/services/oraldectre.png",
  },

  {
    title: "Denture",
    description:
      "Removable or fixed prosthetic teeth that replace missing teeth, improving chewing, speech, and facial aesthetics.",
    image: "/services/denture.png",
  },

  {
    title: "Bleaching",
    description:
      "Professional teeth whitening treatment that removes stains and discoloration, giving you a brighter and more confident smile.",
    image: "/services/bleaching.png",
  },

  {
    title: "Replantation of Teeth",
    description:
      "Emergency procedure to reposition and stabilize a knocked-out tooth, helping preserve the natural tooth when treated promptly.",
    image: "/services/teethreplant.png",
  },

  {
    title: "Dental Laser Treatment",
    description:
      "Modern laser-based dental procedures that offer painless, precise, and faster healing treatments for gums and teeth.",
    image: "/services/lasertre.png",
  },
];
