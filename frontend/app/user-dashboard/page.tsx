"use client"

import { useState, useEffect } from 'react';
import { auth, db } from '@/firebase/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { LogOut, Upload, FileText, Loader2, X, ArrowUpCircle } from 'lucide-react';

export default function UserDashboard() {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.email!));
        setUserData(userDoc.data());
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
    } else {
      alert('Please upload a PDF file');
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
    } else {
      alert('Please upload a PDF file');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      const user = auth.currentUser;
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('userId', user.uid);  // Send user ID to backend
      formData.append('userEmail', user.email || '');

      const response = await fetch('http://localhost:5000/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload resume');
      }

      // Update user document in Firebase with the resume URL
      await updateDoc(doc(db, 'users', user.email!), {
        resumeUrl: data.pdf_url,
        resumeId: data.document_id,
        lastUpdated: new Date().toISOString()
      });

      setSelectedFile(null);
      alert('Resume uploaded and parsed successfully!');

    } catch (error) {
      console.error('Upload error:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload resume');
    } finally {
      setUploading(false);
    }
  };

  return (
    <ProtectedRoute userType="user">
      <div className="min-h-screen bg-gradient-to-br from-white to-[#FFF5F5]">
        <nav className="bg-white shadow-sm">
          <div className="max-w-6xl mx-auto px-8 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">
              Welcome, {userData?.name}
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

        <div className="max-w-6xl mx-auto p-8">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Upload Your Resume</h2>

            <div 
              className={`relative border-2 border-dashed rounded-xl p-10 transition-all duration-200 ease-in-out ${
                dragActive 
                  ? 'border-[#F37172] bg-[#F37172]/5' 
                  : 'border-gray-300 hover:border-[#F37172] hover:bg-gray-50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
                id="resume-upload"
                // disabled={uploading}
              />
              
              {selectedFile ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-center gap-3">
                    <FileText className="text-[#F37172]" size={24} />
                    <span className="text-gray-700 font-medium">{selectedFile.name}</span>
                    <button 
                      onClick={() => setSelectedFile(null)}
                      className="text-gray-500 hover:text-[#F37172] transition-colors"
                      // disabled={uploading}
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <button
                    onClick={handleUpload}
                    // disabled={uploading}
                    className="flex items-center justify-center gap-2 w-full px-6 py-3 rounded-lg bg-[#F37172] text-white hover:bg-[#ff5b5b] transition-colors disabled:cursor-not-allowed"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload size={20} />
                        <span>Upload Resume</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <label 
                  htmlFor="resume-upload" 
                  className="flex flex-col items-center cursor-pointer"
                >
                  <ArrowUpCircle 
                    className="text-[#F37172] mb-4" 
                    size={40} 
                  />
                  <p className="text-gray-700 font-medium mb-2">
                    Drag and drop your resume here, or click to browse
                  </p>
                  <p className="text-sm text-gray-500">
                    Supports PDF files only
                  </p>
                </label>
              )}
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-700 mb-2">Guidelines for Resume Upload:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• File format: PDF only</li>
                <li>• Maximum file size: 5MB</li>
                <li>• Make sure your resume is up to date</li>
                <li>• Include relevant skills and experience</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 