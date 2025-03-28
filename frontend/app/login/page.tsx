"use client"

import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/firebase/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState('user'); // 'user' or 'company'
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Get user type from Firestore
      const userDoc = await getDoc(doc(db, 'users', email));
      const userData = userDoc.data();

      // Verify if user type matches selected type
      if (userData?.userType !== userType) {
        setError(`Invalid account type. Please select ${userData?.userType} login.`);
        await auth.signOut(); // Sign out the user
        return;
      }

      // Redirect based on user type
      if (userData?.userType === 'company') {
        router.push('/company-dashboard');
      } else {
        router.push('/user-dashboard');
      }
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-[#FFF5F5] flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div>
          <h2 className="text-3xl font-bold text-center text-gray-900">Welcome Back</h2>
          <p className="mt-2 text-center text-gray-600">Sign in to your account</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleLogin}>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Account Type
            </label>
            <select
              value={userType}
              onChange={(e) => setUserType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F37172]"
            >
              <option value="user">Job Seeker</option>
              <option value="company">Company</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F37172]"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F37172]"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#F37172] text-white py-2 px-4 rounded-md hover:bg-[#ff5b5b] transition-colors"
          >
            Sign In
          </button>
        </form>

        <div className="text-center space-y-4">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <Link href="/register" className="text-[#F37172] hover:underline">
              Register here
            </Link>
          </p>
          <div className="flex justify-center space-x-4">
            <Link 
              href="/login" 
              className={`text-sm ${userType === 'company' ? 'text-[#F37172]' : 'text-gray-500'} hover:text-[#F37172]`}
            >
              Company Login
            </Link>
            <span className="text-gray-300">|</span>
            <Link 
              href="/login" 
              className={`text-sm ${userType === 'user' ? 'text-[#F37172]' : 'text-gray-500'} hover:text-[#F37172]`}
            >
              Job Seeker Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
