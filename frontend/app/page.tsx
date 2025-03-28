"use client"

import React, { useState } from 'react';
import Link from "next/link"
import Image from "next/image"
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  Target, 
  ShieldCheck, 
  Zap, 
  ArrowRight, 
  Star 
} from 'lucide-react';

export default function Home() {
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    {
      icon: <Sparkles className="w-12 h-12 text-[#F37172] group-hover:text-white" />,
      title: "AI-Powered Matching",
      description: "Cutting-edge AI algorithms seamlessly connect top talent with innovative projects.",
      color: "bg-[#F37172]/10 group-hover:bg-[#F37172]"
    },
    {
      icon: <ShieldCheck className="w-12 h-12 text-[#F37172] group-hover:text-white" />,
      title: "Ironclad Privacy",
      description: "Advanced encryption and confidentiality protocols protect your project details.",
      color: "bg-[#F37172]/10 group-hover:bg-[#F37172]"
    },
    {
      icon: <Target className="w-12 h-12 text-[#F37172] group-hover:text-white" />,
      title: "Precision Matching",
      description: "Smart filtering technology finds candidates with laser-focused skill alignment.",
      color: "bg-[#F37172]/10 group-hover:bg-[#F37172]"
    }
  ];

  return (
    <div className="bg-gradient-to-br from-white to-[#FFF5F5] min-h-screen font-inter">
      {/* Navbar */}
      <motion.nav 
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="fixed top-0 left-0 w-full z-50 bg-white/80 backdrop-blur-md shadow-sm"
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-3xl font-black text-gray-800">
              TalentMatch
              <span className="text-[#F37172] ml-1">.</span>
            </span>
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex space-x-4">
              <Link href="/login" className="text-gray-600 hover:text-[#F37172] transition-colors">
                Job Seeker Login
              </Link>
              <span className="text-gray-300">|</span>
              <Link href="/login" className="text-gray-600 hover:text-[#F37172] transition-colors">
                Company Login
              </Link>
            </div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link href="/register" className="bg-[#F37172] text-white px-4 py-2 rounded-full hover:bg-[#ff5b5b] transition-colors">
                Get Started
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative min-h-screen flex items-center justify-center px-6 pt-20 overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#F37172]/10 to-white opacity-50 -z-10"></div>
        
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="space-y-6"
          >
            <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight">
              Discover Your <span className="text-[#F37172]">Perfect</span> Project Match
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Revolutionary AI-driven platform connecting top-tier talent with groundbreaking projects. Intelligent, secure, and privacy-first matching.
            </p>
            <div className="flex space-x-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link href="/register?type=user" className="bg-[#F37172] text-white px-6 py-3 rounded-full hover:bg-[#ff5b5b] transition-colors flex items-center">
                  Find Jobs <ArrowRight className="ml-2" />
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link href="/register?type=company" className="border-2 border-[#F37172] text-[#F37172] px-6 py-3 rounded-full hover:bg-[#F37172] hover:text-white transition-colors flex items-center">
                  Post Jobs <Star className="ml-2" />
                </Link>
              </motion.div>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex justify-center relative"
          >
            <motion.div
              animate={{
                y: [0, -20, 0],
                transition: {
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }
              }}
            >
              <Image
                src="/image.png"
                alt="TalentMatch Illustration"
                width={600}
                height={600}
                className="object-contain"
              />
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Features Section */}
      <div className="py-20 bg-gradient-to-br from-slate-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1 rounded-full text-sm">
              Why Choose Us
            </span>
            <h2 className="text-4xl font-bold mt-6 bg-gradient-to-r from-purple-600 to-pink-600 inline-block text-transparent bg-clip-text">
              Revolutionizing Talent Matching
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: "🎯",
                title: "AI-Powered Matching",
                description: "Our advanced algorithms analyze skills, experience, and project requirements to find perfect matches",
                gradient: "from-blue-500 to-cyan-400"
              },
              {
                icon: "🔒",
                title: "Project Privacy",
                description: "Enterprise-grade encryption and privacy controls keep your sensitive project details secure",
                gradient: "from-purple-500 to-indigo-500"
              },
              {
                icon: "⚡",
                title: "Smart Filtering",
                description: "Advanced filtering system with real-time matching and instant notifications",
                gradient: "from-pink-500 to-rose-500"
              }
            ].map((feature, index) => (
              <div key={index} 
                className="relative group rounded-2xl bg-white p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-300`}></div>
                <span className="text-4xl mb-6 block">{feature.icon}</span>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white to-[#FFF5F5]"></div>
        <div className="absolute inset-0 bg-[url('/grid.png')] opacity-20"></div>
        
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-8">
            Ready to Transform Your Hiring Process?
          </h2>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Join thousands of companies and professionals who are already experiencing the future of talent matching.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" 
              className="bg-[#F37172] text-white px-8 py-4 rounded-xl font-semibold hover:bg-[#ff5b5b] transition-colors">
              Create Account
            </Link>
            <Link href="/learn-more" 
              className="border-2 border-[#F37172] text-[#F37172] px-8 py-4 rounded-xl font-semibold hover:bg-[#F37172] hover:text-white transition-colors">
              Learn More
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            <div>
              <h3 className="text-white text-lg font-bold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="/careers" className="hover:text-white transition-colors">Careers</Link></li>
                <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white text-lg font-bold mb-4">Solutions</h3>
              <ul className="space-y-2">
                <li><Link href="/talent-matching" className="hover:text-white transition-colors">Talent Matching</Link></li>
                <li><Link href="/project-posting" className="hover:text-white transition-colors">Project Posting</Link></li>
                <li><Link href="/resume-analysis" className="hover:text-white transition-colors">Resume Analysis</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white text-lg font-bold mb-4">Support</h3>
              <ul className="space-y-2">
                <li><Link href="/help" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white text-lg font-bold mb-4">Connect</h3>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd"></path>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"></path>
                  </svg>
                </a>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800 text-center">
            <p>© 2024 TalentMatch. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}