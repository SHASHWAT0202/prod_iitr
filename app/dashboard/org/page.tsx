'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiUsers, FiUserPlus, FiEdit2, FiTrash2, FiSearch, FiFilter, FiX, FiCheck, FiAlertCircle, FiTrendingUp, FiActivity, FiMapPin, FiMail, FiPhone, FiShield, FiLogOut } from 'react-icons/fi';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  region: string;
  territory: string;
  phone?: string;
  avatar?: string;
  status?: string;
  lastLogin?: string;
  stats?: {
    assignedLeads: number;
    convertedLeads: number;
    conversionRate: number;
  };
}

interface Stats {
  totalUsers: number;
  activeUsers: number;
  salesReps: number;
  managers: number;
}

const roleColors: Record<string, string> = {
  sales: 'bg-blue-50 text-blue-700 border-blue-200',
  manager: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  admin: 'bg-red-50 text-red-700 border-red-200',
  org_admin: 'bg-amber-50 text-amber-700 border-amber-200'
};

const statusColors: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700',
  inactive: 'bg-slate-100 text-slate-500',
  suspended: 'bg-red-50 text-red-700'
};

export default function OrgDashboard() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, activeUsers: 0, salesReps: 0, managers: 0 });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'sales',
    region: 'North',
    territory: '',
    phone: ''
  });

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (roleFilter !== 'all') params.set('role', roleFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (searchQuery) params.set('search', searchQuery);

      const res = await fetch(`/api/users?${params}`);
      const data = await res.json();
      
      if (data.ok) {
        setUsers(data.data);
        // Calculate stats
        const allUsers = data.data;
        setStats({
          totalUsers: allUsers.length,
          activeUsers: allUsers.filter((u: User) => u.status === 'active').length,
          salesReps: allUsers.filter((u: User) => u.role === 'sales').length,
          managers: allUsers.filter((u: User) => u.role === 'manager').length
        });
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      showNotification('error', 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [roleFilter, statusFilter, searchQuery]);

  useEffect(() => {
    // Check if user is logged in as org_admin
    const userType = localStorage.getItem('userType');
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    
    if (!isLoggedIn || userType !== 'organization') {
      router.push('/login');
      return;
    }
    
    fetchUsers();
  }, [fetchUsers, router]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Add user
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (data.ok) {
        showNotification('success', 'User created successfully');
        setShowAddModal(false);
        resetForm();
        fetchUsers();
      } else {
        showNotification('error', data.error || 'Failed to create user');
      }
    } catch (error) {
      showNotification('error', 'Failed to create user');
    }
  };

  // Update user
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      const updateData: any = { ...formData };
      if (!updateData.password) delete updateData.password;

      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      const data = await res.json();
      
      if (data.ok) {
        showNotification('success', 'User updated successfully');
        setShowEditModal(false);
        resetForm();
        fetchUsers();
      } else {
        showNotification('error', data.error || 'Failed to update user');
      }
    } catch (error) {
      showNotification('error', 'Failed to update user');
    }
  };

  // Delete user
  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      
      if (data.ok) {
        showNotification('success', 'User deleted successfully');
        setShowDeleteModal(false);
        setSelectedUser(null);
        fetchUsers();
      } else {
        showNotification('error', data.error || 'Failed to delete user');
      }
    } catch (error) {
      showNotification('error', 'Failed to delete user');
    }
  };

  // Toggle user status
  const handleToggleStatus = async (user: User) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      
      if (data.ok) {
        showNotification('success', `User ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
        fetchUsers();
      } else {
        showNotification('error', data.error || 'Failed to update status');
      }
    } catch (error) {
      showNotification('error', 'Failed to update status');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'sales',
      region: 'North',
      territory: '',
      phone: ''
    });
    setSelectedUser(null);
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      region: user.region,
      territory: user.territory,
      phone: user.phone || ''
    });
    setShowEditModal(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userType');
    localStorage.removeItem('user');
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-white text-slate-800">
      {/* Subtle Background Pattern */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-100/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-sky-100/20 rounded-full blur-3xl" />
      </div>
      
      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border text-white ${
              notification.type === 'success' 
                ? 'bg-emerald-600 border-emerald-500 shadow-emerald-200/50' 
                : 'bg-red-600 border-red-500 shadow-red-200/50'
            }`}
          >
            {notification.type === 'success' ? <FiCheck className="w-5 h-5" /> : <FiAlertCircle className="w-5 h-5" />}
            <span className="font-medium">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-2xl border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-3 group">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity" />
                  <img 
                    src="/images.jpg" 
                    alt="HPCL" 
                    className="relative w-12 h-12 rounded-2xl object-cover shadow-lg"
                  />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">LeadSense AI</h1>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                    <p className="text-xs text-blue-600 font-medium">Admin Control Center</p>
                  </div>
                </div>
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <Link 
                href="/dashboard" 
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all border border-transparent hover:border-blue-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                Sales Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600 hover:text-red-600 bg-slate-50 hover:bg-red-50 rounded-xl transition-all border border-slate-200 hover:border-red-200"
              >
                <FiLogOut className="w-4 h-4" />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-xl">
              <FiShield className="w-6 h-6 text-blue-700" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900">Team Management</h2>
          </div>
          <p className="text-slate-500 ml-14">Manage your sales team members, roles, and permissions</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Users', value: stats.totalUsers, icon: FiUsers, color: 'from-blue-600 to-blue-700', bgGlow: 'bg-blue-100' },
            { label: 'Active Users', value: stats.activeUsers, icon: FiActivity, color: 'from-emerald-600 to-emerald-700', bgGlow: 'bg-emerald-100' },
            { label: 'Sales Reps', value: stats.salesReps, icon: FiTrendingUp, color: 'from-indigo-600 to-indigo-700', bgGlow: 'bg-indigo-100' },
            { label: 'Managers', value: stats.managers, icon: FiShield, color: 'from-amber-500 to-amber-600', bgGlow: 'bg-amber-100' }
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="relative group bg-white border border-slate-200 rounded-2xl p-6 overflow-hidden hover:border-blue-300 hover:shadow-lg hover:shadow-blue-100/50 transition-all duration-300"
            >
              <div className={`absolute -top-12 -right-12 w-32 h-32 ${stat.bgGlow} rounded-full blur-2xl opacity-60 group-hover:scale-150 transition-transform duration-500`} />
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
                  <p className="text-4xl font-bold mt-2 text-slate-900">{stat.value}</p>
                </div>
                <div className={`w-14 h-14 bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center shadow-lg text-white`}>
                  <stat.icon className="w-7 h-7" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="relative flex-1 group">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-400 text-slate-800"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-3">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:border-blue-500 outline-none cursor-pointer hover:border-blue-300 transition-all text-slate-700"
            >
              <option value="all">All Roles</option>
              <option value="sales">Sales</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:border-blue-500 outline-none cursor-pointer hover:border-blue-300 transition-all text-slate-700"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Add User Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { resetForm(); setShowAddModal(true); }}
            className="relative group flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl font-semibold whitespace-nowrap shadow-lg shadow-blue-200/50 overflow-hidden text-white"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-800 opacity-0 group-hover:opacity-100 transition-opacity" />
            <FiUserPlus className="relative w-5 h-5" />
            <span className="relative">Add User</span>
          </motion.button>
        </div>

        {/* Users Table */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-14 h-14 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-500">Loading team members...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FiUsers className="w-10 h-10 text-blue-600" />
              </div>
              <p className="text-slate-500">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">User</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Role</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Region</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Performance</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Status</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((user, index) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-blue-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center border border-blue-200">
                            <span className="text-lg font-semibold text-blue-700">{user.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{user.name}</p>
                            <p className="text-sm text-slate-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${roleColors[user.role] || 'bg-slate-100 text-slate-500'}`}>
                          {user.role.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <FiMapPin className="w-4 h-4 text-slate-400" />
                          <span>{user.region}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {user.stats && (
                          <div className="text-sm">
                            <p className="text-slate-500">
                              {user.stats.assignedLeads} leads • {user.stats.conversionRate}% conv.
                            </p>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleStatus(user)}
                          className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[user.status || 'active']}`}
                        >
                          {(user.status || 'active').toUpperCase()}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(user)}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit user"
                          >
                            <FiEdit2 className="w-4 h-4 text-blue-600" />
                          </button>
                          {user.role !== 'org_admin' && (
                            <button
                              onClick={() => { setSelectedUser(user); setShowDeleteModal(true); }}
                              className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete user"
                            >
                              <FiTrash2 className="w-4 h-4 text-red-400" />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Add/Edit User Modal */}
      <AnimatePresence>
        {(showAddModal || showEditModal) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => { setShowAddModal(false); setShowEditModal(false); resetForm(); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-white border border-slate-200 rounded-3xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              {/* Modal glow effect */}
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-100/50 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-indigo-100/30 rounded-full blur-3xl" />
              
              <div className="relative flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">
                    {showAddModal ? 'Add New User' : 'Edit User'}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">{showAddModal ? 'Create a new team member' : 'Update user information'}</p>
                </div>
                <button
                  onClick={() => { setShowAddModal(false); setShowEditModal(false); resetForm(); }}
                  className="p-2.5 hover:bg-slate-100 rounded-xl transition-colors border border-transparent hover:border-slate-200"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={showAddModal ? handleAddUser : handleUpdateUser} className="relative space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-700">Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-slate-800"
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-700">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-slate-800"
                    placeholder="user@hpcl.in"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-700">
                    {showAddModal ? 'Password' : 'New Password (leave blank to keep current)'}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-slate-800"
                    placeholder="••••••••"
                    required={showAddModal}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-700">Role</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none cursor-pointer text-slate-800"
                    >
                      <option value="sales">Sales Rep</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-700">Region</label>
                    <select
                      value={formData.region}
                      onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none cursor-pointer text-slate-800"
                    >
                      <option value="North">North</option>
                      <option value="South">South</option>
                      <option value="East">East</option>
                      <option value="West">West</option>
                      <option value="All">All Regions</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-700">Territory</label>
                  <input
                    type="text"
                    value={formData.territory}
                    onChange={(e) => setFormData({ ...formData, territory: e.target.value })}
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-slate-800"
                    placeholder="e.g., Delhi NCR"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-700">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-slate-800"
                    placeholder="+91-9876543210"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => { setShowAddModal(false); setShowEditModal(false); resetForm(); }}
                    className="flex-1 px-6 py-3.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all border border-slate-200 text-slate-700"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="flex-1 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl font-semibold shadow-lg shadow-blue-200/50 text-white"
                  >
                    {showAddModal ? 'Add User' : 'Save Changes'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-white border border-slate-200 rounded-3xl p-8 w-full max-w-md shadow-2xl"
            >
              <div className="text-center">
                <div className="w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-red-200">
                  <FiTrash2 className="w-10 h-10 text-red-500" />
                </div>
                <h3 className="text-2xl font-bold mb-2 text-slate-900">Delete User</h3>
                <p className="text-slate-500 mb-6 leading-relaxed">
                  Are you sure you want to delete <strong className="text-slate-900">{selectedUser.name}</strong>? This action cannot be undone. All their assigned leads will be unassigned.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 px-6 py-3.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all border border-slate-200 text-slate-700"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleDeleteUser}
                    className="flex-1 px-6 py-3.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 rounded-xl font-semibold transition-all shadow-lg shadow-red-200/50 text-white"
                  >
                    Delete
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
