"use client"

import { useState, useEffect } from 'react';
import { auth, db } from '@/firebase/firebase';
import { doc, addDoc, collection, getDocs, query, where, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { LogOut, Briefcase, MapPin, Clock, Code, Plus, X, Search, FileText, ExternalLink } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState('post'); // 'post' or 'search'
  const [error, setError] = useState('');

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    try {
      setIsPosting(true);
      setError('');
      console.log(auth.currentUser.toJSON());
      // First fetch company name from Firebase
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.email!));
      const userData = userDoc.data();
      
      if (!userData) {
        throw new Error('Company data not found');
      }

      const jobData = {
        company_name: userData.name, // Use company name from Firestore
        job_description: description,
        hiring_type: jobType,
        work_mode: workMode,
        job_role: jobTitle
      };
      
      console.log('Sending data:', jobData);

      const response = await fetch('http://localhost:5000/company', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(jobData),
      });

      console.log('Response status:', response.status);

      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`);
      }

      setShowForm(false);
      alert(`Job posted successfully! Found ${data.total_matches} potential matches.`);
      
      // Reset form
      setJobTitle('');
      setJobType('full-time');
      setWorkMode('onsite');
      setDescription(defaultTemplate);

    } catch (error: any) {
      console.error('Error posting job:', error);
      setError(error.message || 'Failed to post job');
    } finally {
      setIsPosting(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setIsSearching(true);
      setError('');

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/search_resumes?query=${encodeURIComponent(searchQuery)}`
      );

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data = await response.json();
      setSearchResults(data.matching_resumes || []);

    } catch (error: any) {
      console.error('Search error:', error);
      setError(error.message || 'Failed to search resumes');
    } finally {
      setIsSearching(false);
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
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
              {error}
            </div>
          )}
          
          {/* Tabs */}
          <div className="flex space-x-4 mb-8">
            <button
              onClick={() => setActiveTab('post')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'post'
                  ? 'bg-[#F37172] text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Post Jobs
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'search'
                  ? 'bg-[#F37172] text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Search Resumes
            </button>
          </div>

          {activeTab === 'post' ? (
            // Post Jobs Tab
            <>
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
                <div className="bg-white rounded-xl shadow-lg p-8">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Post New Job</h2>
                    <button
                      onClick={() => setShowForm(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  <form onSubmit={handlePost} className="space-y-6">
                    {/* Job Role */}
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">
                        Job Role
                      </label>
                      <input
                        type="text"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F37172]"
                        placeholder="e.g., Backend Engineer"
                        required
                      />
                    </div>

                    {/* Hiring Type */}
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">
                        Hiring Type
                      </label>
                      <select
                        value={jobType}
                        onChange={(e) => setJobType(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F37172]"
                        required
                      >
                        <option value="full-time">Full Time</option>
                        <option value="part-time">Part Time</option>
                        <option value="contract">Contract</option>
                        <option value="intern">Intern</option>
                      </select>
                    </div>

                    {/* Work Mode */}
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">
                        Work Mode
                      </label>
                      <select
                        value={workMode}
                        onChange={(e) => setWorkMode(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F37172]"
                        required
                      >
                        <option value="onsite">On-site</option>
                        <option value="remote">Remote</option>
                        <option value="hybrid">Hybrid</option>
                      </select>
                    </div>

                    {/* Job Description */}
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">
                        Job Description
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
                      className="w-full py-3 bg-[#F37172] text-white rounded-lg hover:bg-[#ff5b5b] transition-colors disabled:opacity-50"
                    >
                      {isPosting ? 'Posting...' : 'Post Job'}
                    </button>
                  </form>
                </div>
              )}
            </>
          ) : (
            // Search Resumes Tab
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Search Resumes</h2>
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      placeholder="Search by skills, experience, or keywords..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F37172] focus:border-transparent"
                    />
                  </div>
                  <button
                    onClick={handleSearch}
                    disabled={isSearching}
                    className="px-6 py-2 bg-[#F37172] text-white rounded-lg hover:bg-[#ff5b5b] transition-colors disabled:opacity-50"
                  >
                    {isSearching ? 'Searching...' : 'Search'}
                  </button>
                </div>
              </div>

              {/* Search Results */}
              <div className="space-y-4">
                {searchResults.map((result: any, index: number) => (
                  <div key={index} className="bg-gray-50 p-6 rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          {result.personal_info?.name || 'Anonymous Candidate'}
                        </h3>
                        <p className="text-gray-600">{result.personal_info?.email}</p>
                      </div>
                      <a
                        href={result.resume_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-[#F37172] hover:text-[#ff5b5b]"
                      >
                        <FileText size={20} />
                        <span>View Resume</span>
                        <ExternalLink size={16} />
                      </a>
                    </div>
                    {result.skills && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Skills</h4>
                        <div className="flex flex-wrap gap-2">
                          {result.skills.map((skill: string, i: number) => (
                            <span
                              key={i}
                              className="px-3 py-1 bg-[#F37172]/10 text-[#F37172] rounded-full text-sm"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {searchResults.length === 0 && searchQuery && !isSearching && (
                  <p className="text-center text-gray-600">No matching resumes found</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
} 