"use client"

import { useState } from 'react';
import { auth, db } from '@/firebase/firebase';
import { doc, addDoc, collection } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { LogOut, Briefcase, MapPin, Clock, Code, Plus, X } from 'lucide-react';
import MDEditor from '@uiw/react-md-editor';

const defaultTemplate = `## Project Overview
Brief description of the project and its goals.

## Requirements
- Technical skill 1
- Technical skill 2
- Soft skill 1

## Responsibilities
1. Main responsibility
2. Secondary responsibility
3. Additional tasks

## Nice to Have
- Additional skill 1
- Additional skill 2

## Benefits
- Benefit 1
- Benefit 2
`;

export default function CompanyDashboard() {
  const router = useRouter();
  const [jobTitle, setJobTitle] = useState('');
  const [location, setLocation] = useState('');
  const [jobType, setJobType] = useState('full-time');
  const [workMode, setWorkMode] = useState('onsite');
  const [description, setDescription] = useState(defaultTemplate);
  const [isPosting, setIsPosting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    try {
      setIsPosting(true);
      const jobData = {
        userId: auth.currentUser.uid,
        companyName: auth.currentUser.displayName,
        jobTitle,
        location,
        jobType,
        workMode,
        description,
        createdAt: new Date().toISOString(),
        status: 'active'
      };

      await addDoc(collection(db, 'jobs'), jobData);
      setShowForm(false);
      alert('Job posted successfully!');
      // Reset form
      setJobTitle('');
      setLocation('');
      setJobType('full-time');
      setWorkMode('onsite');
      setDescription(defaultTemplate);
    } catch (error) {
      console.error('Error posting job:', error);
      alert('Failed to post job');
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <ProtectedRoute userType="company">
      <div className="min-h-screen bg-gradient-to-br from-white to-[#FFF5F5]">
        <nav className="bg-white shadow-sm">
          <div className="max-w-6xl mx-auto px-8 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">
              Company Dashboard
            </h1>
            <button
              onClick={() => auth.signOut()}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-[#F37172] transition-colors"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </nav>

        <div className="max-w-6xl mx-auto p-8">
          {/* Post Job Button */}
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-6 py-3 bg-[#F37172] text-white rounded-lg hover:bg-[#ff5b5b] transition-all transform hover:scale-105"
            >
              <Plus size={20} />
              <span>Post New Job</span>
            </button>
          )}

          {/* Job Posting Form */}
          {showForm && (
            <div className="bg-white rounded-xl shadow-lg p-8 transition-all">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Post a New Job</h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-500 hover:text-[#F37172] transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handlePost} className="space-y-6">
                {/* Job Title */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Job Title
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F37172] focus:border-transparent"
                      placeholder="e.g., Senior Software Engineer"
                      required
                    />
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F37172] focus:border-transparent"
                      placeholder="e.g., New York, NY"
                      required
                    />
                  </div>
                </div>

                {/* Job Type & Work Mode */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Job Type
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <select
                        value={jobType}
                        onChange={(e) => setJobType(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F37172] focus:border-transparent appearance-none"
                      >
                        <option value="full-time">Full Time</option>
                        <option value="part-time">Part Time</option>
                        <option value="contract">Contract</option>
                        <option value="internship">Internship</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Work Mode
                    </label>
                    <div className="relative">
                      <Code className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <select
                        value={workMode}
                        onChange={(e) => setWorkMode(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F37172] focus:border-transparent appearance-none"
                      >
                        <option value="onsite">On-site</option>
                        <option value="remote">Remote</option>
                        <option value="hybrid">Hybrid</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Project Description
                  </label>
                  <div data-color-mode="light">
                    <MDEditor
                      value={description}
                      onChange={(val) => setDescription(val || '')}
                      preview="edit"
                      height={400}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isPosting}
                  className="w-full py-3 bg-[#F37172] text-white rounded-lg hover:bg-[#ff5b5b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPosting ? 'Posting...' : 'Post Job'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
} 