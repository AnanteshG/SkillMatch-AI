"use client"

import { useState, useEffect } from 'react';
import { auth, db } from '@/firebase/firebase';
import { doc, addDoc, collection, getDocs, query, where, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { LogOut, Briefcase, MapPin, Clock, Code, Plus, X, Search, FileText, ExternalLink, Users, Building, Star, Grid, List } from 'lucide-react';
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

interface MatchingResume {
  document_id: string;
  match_score: number;
  match_explanation: string;
  matching_skills: string[];
  personal_info: {
    name: string;
    email: string;
    phone: string;
  };
  resume_url: string;
}

interface JobPosting {
  company_name: string;
  created_at: any;
  hiring_type: string;
  job_description: string;
  job_role: string;
  work_mode: string;
  matching_resumes: MatchingResume[];
}

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
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyStats, setCompanyStats] = useState({
    totalJobs: 0,
    totalMatches: 0,
    averageMatchScore: 0,
    activeJobs: 0
  });
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'date' | 'matches'>('date');
  const [filterWorkMode, setFilterWorkMode] = useState<string>('all');
  const [showSearch, setShowSearch] = useState(false);

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
        `http://localhost:5000/search_resumes?query=${encodeURIComponent(searchQuery)}`
      );

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Search results:', data);
      setSearchResults(data.matching_resumes || []);

    } catch (error: any) {
      console.error('Search error:', error);
      setError(error.message || 'Failed to search resumes');
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const fetchJobPostings = async () => {
      try {
        // Wait for auth to initialize
        if (!auth.currentUser) {
          setLoading(false);
          return;
        }

        const userEmail = auth.currentUser.email;
        if (!userEmail) {
          setLoading(false);
          return;
        }

        // Get user data
        const userDoc = await getDoc(doc(db, 'users', userEmail));
        const userData = userDoc.data();
        
        if (!userData?.name) {
          setLoading(false);
          return;
        }

        // Get company data using the company name
        const companyRef = doc(db, 'companies', userData.name);
        const companyDoc = await getDoc(companyRef);
        
        if (companyDoc.exists()) {
          const data = companyDoc.data() as JobPosting;
          setJobPostings([data]);
        }
        
      } catch (error) {
        console.error('Error fetching job postings:', error);
        setError('Failed to load job postings');
      } finally {
        setLoading(false);
      }
    };

    // Add auth state listener
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchJobPostings();
      } else {
        setLoading(false);
      }
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []); // Empty dependency array since we're using auth.onAuthStateChanged

  // Calculate company stats
  useEffect(() => {
    if (jobPostings.length > 0) {
      const stats = {
        totalJobs: jobPostings.length,
        totalMatches: jobPostings.reduce((acc, job) => acc + (job.matching_resumes?.length || 0), 0),
        averageMatchScore: Math.round(
          jobPostings.reduce((acc, job) => {
            const scores = job.matching_resumes?.map(r => r.match_score) || [];
            return acc + (scores.reduce((a, b) => a + b, 0) / (scores.length || 1));
          }, 0) / jobPostings.length
        ),
        activeJobs: jobPostings.length // You can add status to jobs if needed
      };
      setCompanyStats(stats);
    }
  }, [jobPostings]);

  // Sort and filter jobs
  const filteredJobs = jobPostings
    .filter(job => filterWorkMode === 'all' || job.work_mode.toLowerCase() === filterWorkMode)
    .sort((a, b) => {
      if (sortBy === 'date') {
        return b.created_at?.seconds - a.created_at?.seconds;
      }
      return (b.matching_resumes?.length || 0) - (a.matching_resumes?.length || 0);
    });

  return (
    <ProtectedRoute userType="company">
      <div className="min-h-screen bg-gradient-to-br from-white to-[#FFF5F5]">
        {/* Dashboard Header */}
        <nav className="bg-white shadow-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-8 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Company Dashboard</h1>
                <p className="text-sm text-gray-600">Manage your job postings and candidates</p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowSearch(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Search size={20} />
                  <span>Search Candidates</span>
                </button>
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#F37172] text-white rounded-lg hover:bg-[#ff5b5b] transition-all"
                >
                  <Plus size={20} />
                  <span>Post Job</span>
                </button>
                <button
                  onClick={() => auth.signOut()}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-[#F37172] transition-colors"
                >
                  <LogOut size={20} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto p-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[
              { title: 'Total Jobs', value: companyStats.totalJobs, icon: Briefcase },
              { title: 'Total Matches', value: companyStats.totalMatches, icon: Users },
              { title: 'Avg. Match Score', value: `${companyStats.averageMatchScore}%`, icon: Star },
              { title: 'Active Jobs', value: companyStats.activeJobs, icon: Clock }
            ].map((stat, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</p>
                  </div>
                  <stat.icon className="w-8 h-8 text-[#F37172]" />
                </div>
              </div>
            ))}
          </div>

          {/* Filters and Controls */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <select
                  value={filterWorkMode}
                  onChange={(e) => setFilterWorkMode(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F37172]"
                >
                  <option value="all">All Work Modes</option>
                  <option value="remote">Remote</option>
                  <option value="onsite">On-site</option>
                  <option value="hybrid">Hybrid</option>
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date' | 'matches')}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F37172]"
                >
                  <option value="date">Sort by Date</option>
                  <option value="matches">Sort by Matches</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-gray-100' : ''}`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-gray-100' : ''}`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Search Resumes Section */}
          {showSearch && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800">Search Candidate Pool</h2>
                    <button
                      onClick={() => setShowSearch(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X size={24} />
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex gap-4 mb-6">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="Search by skills, experience, or qualifications..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F37172]"
                      />
                    </div>
                    <button
                      onClick={handleSearch}
                      disabled={isSearching}
                      className="px-6 py-2 bg-[#F37172] text-white rounded-lg hover:bg-[#ff5b5b] transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {isSearching ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                          <span>Searching...</span>
                        </>
                      ) : (
                        <>
                          <Search size={18} />
                          <span>Search</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <div className="space-y-4">
                      {searchResults.map((result, idx) => (
                        <div key={idx} className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start">
                            <div>
                              <h5 className="font-medium text-gray-800">
                                {result.personal_info?.name || 'Anonymous Candidate'}
                              </h5>
                              <p className="text-sm text-gray-600">{result.personal_info?.email}</p>
                            </div>
                            <a
                              href={result.resume_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#F37172] hover:text-[#ff5b5b] flex items-center gap-1 text-sm"
                            >
                              <FileText size={16} />
                              <span>View Resume</span>
                            </a>
                          </div>
                          {result.skills && (
                            <div className="mt-3">
                              <div className="flex flex-wrap gap-2">
                                {result.skills.map((skill: string, skillIdx: number) => (
                                  <span
                                    key={skillIdx}
                                    className="px-2 py-1 bg-[#F37172]/10 text-[#F37172] text-xs rounded-full"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* No Results State */}
                  {searchQuery && !isSearching && searchResults.length === 0 && (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">No matching candidates found</p>
                      <p className="text-sm text-gray-500 mt-1">Try different search terms</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Job Listings */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F37172]"></div>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-white rounded-xl shadow-lg p-8 max-w-md mx-auto">
                <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No Job Postings Yet</h3>
                <p className="text-gray-600 mb-6">Start by posting your first job requirement</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-[#F37172] text-white rounded-lg hover:bg-[#ff5b5b] transition-all mx-auto"
                >
                  <Plus size={20} />
                  <span>Post New Job</span>
                </button>
              </div>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : 'space-y-6'}>
              {filteredJobs.map((posting, index) => (
                <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden">
                  {/* Job Header */}
                  <div className="p-6 border-b">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">{posting.job_role}</h2>
                        <div className="flex items-center gap-4 text-gray-600">
                          <div className="flex items-center gap-1">
                            <Briefcase size={18} />
                            <span>{posting.hiring_type}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin size={18} />
                            <span>{posting.work_mode}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock size={18} />
                            <span>{new Date(posting.created_at?.seconds * 1000).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="text-[#F37172]" />
                        <span className="text-lg font-semibold text-gray-800">
                          {posting.matching_resumes?.length || 0} Matches
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Job Description */}
                  <div className="p-6 bg-gray-50">
                    <h3 className="font-semibold text-gray-800 mb-2">Job Description</h3>
                    <p className="text-gray-600 whitespace-pre-wrap">{posting.job_description}</p>
                  </div>

                  {/* Matching Candidates */}
                  <div className="p-6">
                    <h3 className="font-semibold text-gray-800 mb-4">Matching Candidates</h3>
                    {posting.matching_resumes?.length > 0 ? (
                      <div className="space-y-4">
                        {posting.matching_resumes.map((resume, idx) => (
                          <div key={idx} className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium text-gray-800">{resume.personal_info.name}</h4>
                                <p className="text-gray-600 text-sm">{resume.personal_info.email}</p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {resume.matching_skills.map((skill, skillIdx) => (
                                    <span
                                      key={skillIdx}
                                      className="px-2 py-1 bg-[#F37172]/10 text-[#F37172] text-sm rounded-full"
                                    >
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <div className="flex items-center gap-1">
                                    <Star className="text-yellow-400" size={20} />
                                    <span className="font-semibold">{resume.match_score}%</span>
                                  </div>
                                  <a
                                    href={resume.resume_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[#F37172] hover:text-[#ff5b5b] text-sm flex items-center gap-1"
                                  >
                                    <FileText size={16} />
                                    View Resume
                                  </a>
                                </div>
                              </div>
                            </div>
                            <p className="mt-2 text-sm text-gray-600">{resume.match_explanation}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600">No matching candidates found yet</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Job Details Modal */}
        {selectedJob && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* ... detailed job view ... */}
            </div>
          </div>
        )}

        {/* Post Job Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
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
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
} 