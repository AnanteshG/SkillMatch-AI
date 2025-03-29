"use client"

import { useState, useEffect } from 'react';
import { auth, db } from '@/firebase/firebase';
import { doc, addDoc, collection, getDocs, query, where, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { LogOut, Briefcase, MapPin, Clock, Code, Plus, X, Search, FileText, ExternalLink, Users, Building, Star, Grid, List } from 'lucide-react';
import MDEditor from '@uiw/react-md-editor';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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

// latest code

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

      // Get company name from Firebase
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.email!));
      const userData = userDoc.data();
      
      if (!userData) {
        throw new Error('Company data not found');
      }

      const jobData = {
        company_name: userData.name,
        company_email: userData.email,
        job_description: description,
        hiring_type: jobType,
        work_mode: workMode,
        job_role: jobTitle
      };

      const response = await fetch('http://localhost:5000/company', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(jobData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      
      // Update UI and show success message
      setShowForm(false);
      toast.success(`Job posted successfully! Found ${data.total_matches} potential matches.`, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
      
      // Reset form
      setJobTitle('');
      setJobType('full-time');
      setWorkMode('onsite');
      setDescription(defaultTemplate);

      // Refresh job listings
      window.location.reload();

    } catch (error: any) {
      console.error('Error posting job:', error);
      setError(error.message || 'Failed to post job');
      toast.error(error.message || 'Failed to post job', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
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
console.log(response);
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

  // Add this function to handle modal opening
  const handleOpenPostJob = () => {
    setShowForm(true);
    // Reset form fields
    setJobTitle('');
    setJobType('full-time');
    setWorkMode('onsite');
    setDescription(defaultTemplate);
  };

  return (
    <ProtectedRoute userType="company">
      <div className="min-h-screen bg-gradient-to-br from-white to-[#FFF5F5]">
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light" aria-label={undefined}        />
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
                  onClick={handleOpenPostJob}
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
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F37172] text-gray-800"
                >
                  <option value="all">All Work Modes</option>
                  <option value="remote">Remote</option>
                  <option value="onsite">On-site</option>
                  <option value="hybrid">Hybrid</option>
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date' | 'matches')}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F37172] text-gray-800"
                >
                  <option value="date">Sort by Date</option>
                  <option value="matches">Sort by Matches</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded text-gray-800 hover:bg-[#F37172]/10 ${viewMode === 'grid' ? 'bg-[#F37172]/10' : ''}`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded text-gray-800 hover:bg-[#F37172]/10 ${viewMode === 'list' ? 'bg-[#F37172]/10' : ''}`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Search Resumes Section */}
          {showSearch && (
            <div className="fixed inset-0 bg-gradient-to-br from-[#00000080] to-[#00000095] backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl shadow-[0_0_50px_0_rgba(243,113,114,0.1)] w-full max-w-4xl max-h-[90vh] overflow-hidden border border-[#F37172]/10">
                {/* Modal Header */}
                <div className="p-6 border-b border-[#F37172]/10 bg-gradient-to-r from-white to-[#FFF5F5]">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800 mb-1">Search Candidate Pool</h2>
                      <p className="text-sm text-gray-500">Find the perfect match for your team</p>
                    </div>
                    <button
                      onClick={() => setShowSearch(false)}
                      className="text-gray-400 hover:text-gray-600 hover:bg-[#F37172]/5 p-2 rounded-full transition-all"
                    >
                      <X size={24} />
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  {/* Search Input with Enhanced Design */}
                  <div className="flex gap-4 mb-8">
                    <div className="flex-1 relative group">
                      {/* <div className="absolute inset-0 bg-[#F37172]/5 rounded-lg -m-1 transition-all group-focus-within:bg-[#F37172]/10"></div> */}
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black group-focus-within:text-[#F37172] transition-colors" size={20} />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="Search by skills, experience, or qualifications..."
                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F37172]/20 focus:border-[#F37172] transition-all text-black"
                      />
                    </div>
                    <button
                      onClick={handleSearch}
                      disabled={isSearching}
                      className="px-8 py-3 bg-gradient-to-r from-[#F37172] to-[#ff5b5b] text-white rounded-lg hover:shadow-lg hover:shadow-[#F37172]/20 disabled:opacity-50 disabled:hover:shadow-none transition-all flex items-center gap-2 min-w-[120px] justify-center"
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

                  {/* Search Results with Enhanced Cards */}
                  <div className="space-y-4 overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar">
                    {searchResults.length > 0 && (
                      <div className="grid grid-cols-1 gap-4">
                        {searchResults.map((result, idx) => (
                          <div 
                            key={idx} 
                            className="bg-white rounded-xl p-6 hover:shadow-lg hover:shadow-[#F37172]/10 transition-all border border-[#F37172]/10"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h5 className="text-lg font-semibold text-gray-800 mb-1">
                                  {result.personal_info?.name || 'Anonymous Candidate'}
                                </h5>
                                <p className="text-gray-600 flex items-center gap-2">
                                  <span className="inline-block w-2 h-2 rounded-full bg-[#F37172]/60"></span>
                                  {result.personal_info?.email}
                                </p>
                              </div>
                              <a
                                href={result.resume_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-4 py-2 bg-[#F37172]/10 text-[#F37172] rounded-lg hover:bg-[#F37172] hover:text-white transition-all group"
                              >
                                <FileText size={16} />
                                <span>View Resume</span>
                                <ExternalLink size={14} className="group-hover:translate-x-1 transition-transform" />
                              </a>
                            </div>
                            {result.skills && (
                              <div className="mt-4">
                                <div className="flex flex-wrap gap-2">
                                  {result.skills.map((skill: string, skillIdx: number) => (
                                    <span
                                      key={skillIdx}
                                      className="px-3 py-1 bg-white text-[#F37172] text-sm rounded-full border border-[#F37172]/20 shadow-sm"
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

                    {/* Enhanced No Results State */}
                    {searchQuery && !isSearching && searchResults.length === 0 && (
                      <div className="text-center py-12 bg-gradient-to-r from-white to-[#FFF5F5] rounded-xl border border-[#F37172]/10">
                        <div className="bg-[#F37172]/5 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Users className="w-10 h-10 text-[#F37172]" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">No matches found</h3>
                        <p className="text-gray-500">Try different search terms or broaden your search</p>
                      </div>
                    )}
                  </div>
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
                  onClick={handleOpenPostJob}
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
                                    <span className="font-semibold text-gray-800">{resume.match_score}%</span>
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

        {/* Job Posting Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-lg p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Post a New Job</h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-600 hover:text-[#F37172] transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handlePost} className="space-y-6">
                {/* Job Title */}
                <div>
                  <label className="block text-gray-800 font-medium mb-2">
                    Job Title
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600" size={20} />
                    <input
                      type="text"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F37172] focus:border-transparent text-gray-800"
                      placeholder="e.g., Senior Software Engineer"
                      required
                    />
                  </div>
                </div>

                {/* Job Type & Work Mode */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-800 font-medium mb-2">
                      Job Type
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600" size={20} />
                      <select
                        value={jobType}
                        onChange={(e) => setJobType(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F37172] focus:border-transparent appearance-none text-gray-800"
                      >
                        <option value="full-time">Full Time</option>
                        <option value="part-time">Part Time</option>
                        <option value="contract">Contract</option>
                        <option value="internship">Internship</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-800 font-medium mb-2">
                      Work Mode
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600" size={20} />
                      <select
                        value={workMode}
                        onChange={(e) => setWorkMode(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F37172] focus:border-transparent appearance-none text-gray-800"
                      >
                        <option value="onsite">On-site</option>
                        <option value="remote">Remote</option>
                        <option value="hybrid">Hybrid</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Job Description (Markdown) */}
                <div>
                  <label className="block text-gray-800 font-medium mb-2">
                    Job Description (Markdown Supported)
                  </label>
                  <div data-color-mode="light" className="mb-6">
                    <MDEditor
                      value={description}
                      onChange={(val) => setDescription(val || '')}
                      preview="edit"
                      height={400}
                      className="text-gray-800"
                    />
                  </div>
                </div>

                {/* Submit Button - Fixed at bottom */}
                <div className="bottom-0 bg-white pt-4 pb-2 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={isPosting}
                    className="w-full py-3 bg-gradient-to-r from-[#F37172] to-[#ff5b5b] text-white rounded-lg hover:shadow-lg hover:shadow-[#F37172]/20 disabled:opacity-50 disabled:hover:shadow-none transition-all"
                  >
                    {isPosting ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        <span>Posting...</span>
                      </div>
                    ) : (
                      'Post Job'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Add this CSS to your global styles or component */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #F37172;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #ff5b5b;
        }
      `}</style>
   </ProtectedRoute>
);
}