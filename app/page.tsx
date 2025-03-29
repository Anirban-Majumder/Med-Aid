"use client";
import Button from "@/components/ui/button2";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Clock,
  Heart,
  Shield,
  Tablet,
  Check,
  PlusCircle,
  ChevronDown,
  Star,
  User,
  Stethoscope,
  Loader2,
} from "lucide-react";

export default function Home() {
  const [isPatientLoading, setIsPatientLoading] = useState(false);
  const [isDoctorLoading, setIsDoctorLoading] = useState(false);
  const router = useRouter();

  const handlePatientLogin = () => {
    setIsPatientLoading(true);
    router.push("/SignIn?type=patient");
  };

  const handleDoctorSignup = () => {
    setIsDoctorLoading(true);
    router.push("/SignIn?type=doctor&signup=true");
  };

  return (
    <>
      {/* Hero Section with Gradient Background */}
      <section className="relative flex flex-col items-center justify-center pt-28 pb-20 min-h-screen text-center px-4 overflow-hidden bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-950">
        <div className="absolute inset-0 -z-10 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/30 to-purple-600/30" />
        </div>
        <div className="absolute top-4 left-4">
          <Image src="/icon.svg" alt="Icon" width={50} height={50} />
        </div>
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/30 rounded-full blur-3xl -z-10" />

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent animate-fade-in">
            Your Personal Health Assistant
          </h1>

          <p className="text-lg sm:text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-gray-600 dark:text-gray-300 animate-fade-in-delayed px-2">
            PharmaAI is your trusted companion for all your medical needs. We
            provide intelligent medication management, appointment scheduling,
            and personalized health tracking.
          </p>

          {/* Login Options with Enhanced Buttons */}
          <div className="flex flex-col md:flex-row justify-center items-center gap-4 mt-8 animate-fade-in-delayed-more">
            <button
              onClick={handlePatientLogin}
              disabled={isPatientLoading}
              className="group relative w-full md:w-auto px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 rounded-xl shadow-lg hover:shadow-blue-500/30 transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-80 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-center gap-3">
                {isPatientLoading ? (
                  <Loader2 size={22} className="text-white animate-spin" />
                ) : (
                  <User size={22} className="text-white" />
                )}
                <span className="text-lg font-semibold text-white">
                  {isPatientLoading ? "Loading..." : "Patient Login"}
                </span>
              </div>
              <div className="absolute inset-0 -z-10 bg-gradient-to-r from-blue-600 to-blue-800 opacity-0 group-hover:opacity-100 blur-xl transition-opacity rounded-xl"></div>
            </button>
          </div>

          {/* New Doctor Signup CTA */}
          <div className="mt-12 p-6 bg-white dark:bg-gray-800/60 rounded-2xl shadow-xl max-w-2xl mx-auto animate-fade-in-delayed-more border border-gray-100 dark:border-gray-700">
            <h2 className="text-2xl font-bold mb-3 text-gray-800 dark:text-white">
              Are you a healthcare provider?
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Join our platform to streamline patient care, manage prescriptions
              efficiently, and improve medication adherence.
            </p>
            <button
              onClick={handleDoctorSignup}
              disabled={isDoctorLoading}
              className="group relative inline-block px-6 py-3 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 rounded-xl shadow-lg hover:shadow-green-500/30 transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-80 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-center gap-2">
                {isDoctorLoading ? (
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                ) : null}
                <span className="text-white font-medium">
                  {isDoctorLoading ? "Loading..." : "Create Doctor Account"}
                </span>
                {!isDoctorLoading && (
                  <ArrowRight
                    size={18}
                    className="text-white transition-transform group-hover:translate-x-1"
                  />
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-8 h-8 text-gray-500" />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-20 md:py-24 bg-gray-50 dark:bg-gray-800/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-10 sm:mb-16">
            How PharmaAI Helps You
          </h2>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8 md:gap-12 max-w-6xl mx-auto">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow hover:-translate-y-1 duration-300">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-full w-fit mb-6">
                <Tablet className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">
                Smart Medication Management
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Never miss a dose with intelligent reminders and comprehensive
                medication tracking.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-2" />
                  <span>Personalized reminders</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-2" />
                  <span>Medication history</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-2" />
                  <span>Interaction warnings</span>
                </li>
              </ul>
            </div>

            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow hover:-translate-y-1 duration-300">
              <div className="bg-purple-100 dark:bg-purple-900/30 p-4 rounded-full w-fit mb-6">
                <Clock className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">
                Appointment Scheduling
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Easily schedule and keep track of all your medical appointments
                in one place.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-2" />
                  <span>Calendar integration</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-2" />
                  <span>Automated reminders</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-2" />
                  <span>Doctor details</span>
                </li>
              </ul>
            </div>

            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow hover:-translate-y-1 duration-300">
              <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-full w-fit mb-6">
                <Heart className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">Health Analytics</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Gain valuable insights into your health with personalized
                analytics and tracking.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-2" />
                  <span>Health trends</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-2" />
                  <span>Personalized insights</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-2" />
                  <span>Progress tracking</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Doctor Portal Features */}
          <div className="mt-12 sm:mt-16 md:mt-20 bg-white dark:bg-gray-800/60 p-6 sm:p-8 rounded-2xl shadow-xl max-w-4xl mx-auto border border-gray-100 dark:border-gray-700">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-center text-gray-800 dark:text-white">
              Doctor Portal Features
            </h2>
            <div className="grid sm:grid-cols-2 gap-6 sm:gap-8">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="flex-shrink-0 bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full">
                  <Stethoscope className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">
                    Patient Management
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                    Easily track and manage all your patients in one unified
                    platform.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 sm:gap-4">
                <div className="flex-shrink-0 bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600"
                  >
                    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">
                    Prescription Management
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                    Write, update and manage prescriptions digitally with easy
                    tracking.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 sm:gap-4">
                <div className="flex-shrink-0 bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-5 h-5 sm:w-6 sm:h-6 text-green-600"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path>
                    <path d="M2 12h20"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">
                    Virtual Consultations
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                    Conduct secure video consultations and follow-ups remotely.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 sm:gap-4">
                <div className="flex-shrink-0 bg-red-100 dark:bg-red-900/30 p-3 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-5 h-5 sm:w-6 sm:h-6 text-red-600"
                  >
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">
                    Treatment Analytics
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                    Monitor treatment efficacy and patient adherence with
                    detailed analytics.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-center mt-10">
              <button
                onClick={handleDoctorSignup}
                disabled={isDoctorLoading}
                className="group relative inline-block px-7 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 rounded-xl shadow-lg hover:shadow-indigo-500/30 transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-80 disabled:cursor-not-allowed"
              >
                <div className="flex items-center justify-center gap-3">
                  {isDoctorLoading ? (
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  ) : null}
                  <span className="text-lg font-semibold text-white">
                    {isDoctorLoading
                      ? "Loading..."
                      : "Join as Healthcare Provider"}
                  </span>
                  {!isDoctorLoading && (
                    <ArrowRight
                      size={20}
                      className="text-white transition-transform group-hover:translate-x-1"
                    />
                  )}
                </div>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-gray-50 dark:bg-gray-800/30">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16">
            What Our Users Say
          </h2>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                name: "Sarah Johnson",
                role: "Patient with chronic condition",
                quote:
                  "PharmaAI has transformed how I manage my medications. I never miss a dose now, and the health tracking features have given me insights I never had before.",
                rating: 5,
                image:
                  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=faces&q=80",
              },
              {
                name: "Dr. Michael Chen",
                role: "Healthcare Provider",
                quote:
                  "As a doctor, I've recommended PharmaAI to many of my patients. The improvement in medication adherence has been remarkable and leads to better outcomes.",
                rating: 5,
                image:
                  "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&h=150&fit=crop&crop=faces&q=80",
              },
              {
                name: "Robert Martinez",
                role: "Caregiver",
                quote:
                  "Managing medications for my elderly father used to be challenging. This app has simplified everything and gives me peace of mind knowing he's taking his medications correctly.",
                rating: 4,
                image:
                  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces&q=80",
              },
            ].map((testimonial, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className="flex mb-4">
                  {Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${i < testimonial.rating
                          ? "text-yellow-500 fill-yellow-500"
                          : "text-gray-300"
                          }`}
                      />
                    ))}
                </div>
                <p className="text-gray-600 dark:text-gray-300 italic mb-6">
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full mr-4 overflow-hidden">
                    <Image
                      src={testimonial.image}
                      alt={testimonial.name}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold">{testimonial.name}</h4>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8 text-center">
            <div className="p-6">
              <div className="text-5xl font-bold text-blue-600 mb-2">98%</div>
              <p className="text-gray-600 dark:text-gray-300">
                Medication adherence rate
              </p>
            </div>
            <div className="p-6">
              <div className="text-5xl font-bold text-purple-600 mb-2">10k+</div>
              <p className="text-gray-600 dark:text-gray-300">Active users</p>
            </div>
            <div className="p-6">
              <div className="text-5xl font-bold text-green-600 mb-2">35%</div>
              <p className="text-gray-600 dark:text-gray-300">
                Reduction in missed medications
              </p>
            </div>
            <div className="p-6">
              <div className="text-5xl font-bold text-orange-600 mb-2">24/7</div>
              <p className="text-gray-600 dark:text-gray-300">
                Support available
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section with Enhanced Visuals */}
      <section className="py-24 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center relative">
            {/* Decorative elements */}
            <div className="absolute -top-10 -left-10 w-20 h-20 border-2 border-blue-200 dark:border-blue-800 rounded-full opacity-50"></div>
            <div className="absolute -bottom-10 -right-10 w-20 h-20 border-2 border-purple-200 dark:border-purple-800 rounded-full opacity-50"></div>

            <h2 className="text-4xl font-bold mb-6">Why Trust PharmaAI</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
              Built with privacy and security at its core. Our platform ensures
              your health data stays private while providing you with the best
              healthcare management experience.
            </p>
            <div className="flex justify-center items-center gap-3 mb-10">
              <Shield className="text-blue-600 dark:text-blue-400 w-8 h-8" />
              <span className="font-medium text-lg">
                HIPAA Compliant & Secure
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow">
                <p className="font-medium">End-to-End Encryption</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow">
                <p className="font-medium">Regular Security Audits</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow">
                <p className="font-medium">Data Privacy</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow">
                <p className="font-medium">Secure Cloud Storage</p>
              </div>
            </div>

            {/* Login Options with Enhanced Styling */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-6 mb-2">
              <button
                onClick={handlePatientLogin}
                disabled={isPatientLoading}
                className="w-full sm:w-auto group relative px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 rounded-xl shadow-lg hover:shadow-blue-500/30 transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-80 disabled:cursor-not-allowed"
              >
                <div className="flex items-center justify-center gap-2">
                  {isPatientLoading ? (
                    <Loader2 size={18} className="text-white animate-spin" />
                  ) : (
                    <User size={18} className="text-white" />
                  )}
                  <span className="font-medium text-white">
                    {isPatientLoading ? "Loading..." : "Patient Login"}
                  </span>
                </div>
              </button>

              <button
                onClick={handleDoctorSignup}
                disabled={isDoctorLoading}
                className="w-full sm:w-auto group relative px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 rounded-xl shadow-lg hover:shadow-purple-500/30 transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-80 disabled:cursor-not-allowed"
              >
                <div className="flex items-center justify-center gap-2">
                  {isDoctorLoading ? (
                    <Loader2 size={18} className="text-white animate-spin" />
                  ) : (
                    <Stethoscope size={18} className="text-white" />
                  )}
                  <span className="font-medium text-white">
                    {isDoctorLoading ? "Loading..." : "Doctor Login"}
                  </span>
                </div>
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
              Choose your account type to get started
            </p>
          </div>
        </div>
      </section>

      {/* Footer - Simplified */}
      <footer className="bg-gray-100 dark:bg-gray-800 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-center space-y-6">
            <div className="flex justify-center gap-8">
              <Link
                href="/terms"
                className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
              >
                Terms of Service
              </Link>
              <Link
                href="/privacypolicy"
                className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
              >
                Privacy Policy
              </Link>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400">
              © {new Date().getFullYear()} PharmaAI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* CSS for animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.8s ease-in forwards;
        }
        .animate-fade-in-delayed {
          opacity: 0;
          animation: fadeIn 0.8s ease-in forwards;
          animation-delay: 0.3s;
        }
        .animate-fade-in-delayed-more {
          opacity: 0;
          animation: fadeIn 0.8s ease-in forwards;
          animation-delay: 0.6s;
        }
        
        /* Fix for scrollbar-induced layout shifts */
        html {
          overflow-y: scroll;
          scrollbar-width: thin; /* For Firefox */
          scrollbar-color: rgba(155, 155, 155, 0.5) transparent;
        }
        
        body {
          width: 100%;
          overflow-x: hidden;
          margin-right: 0 !important;
        }
        
        /* Custom scrollbar styling for webkit browsers */
        ::-webkit-scrollbar {
          width: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        
        ::-webkit-scrollbar-thumb {
          background-color: rgba(155, 155, 155, 0.5);
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background-color: rgba(155, 155, 155, 0.7);
        }
      `}</style>
    </>
  );
}