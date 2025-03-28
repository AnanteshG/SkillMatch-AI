"use client"

import { useState, useEffect } from 'react';
import { auth, db } from '@/firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { LogOut } from 'lucide-react';

export default function CompanyDashboard() {
  const router = useRouter();
  const [companyData, setCompanyData] = useState<any>(null);

  useEffect(() => {
    const fetchCompanyData = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        setCompanyData(userDoc.data());
      }
    };

    fetchCompanyData();
  }, []);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <ProtectedRoute userType="company">
      <div className="min-h-screen bg-gradient-to-br from-white to-[#FFF5F5]">
        {/* Navbar */}
        <nav className="bg-white shadow-sm">
          <div className="max-w-6xl mx-auto px-8 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">
              Welcome, {companyData?.name}
            </h1>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-[#F37172] transition-colors"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </nav>

        {/* Dashboard Content */}
        <div className="max-w-6xl mx-auto p-8">
          {/* Add dashboard content here */}
        </div>
      </div>
    </ProtectedRoute>
  );
} 