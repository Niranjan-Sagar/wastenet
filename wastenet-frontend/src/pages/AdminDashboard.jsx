import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line, CartesianGrid,
} from 'recharts';
import api from '../api';
import statusColors from '../statusColors';

const STATUS_OPTIONS = ['pending', 'in-progress', 'resolved'];
const CATEGORY_OPTIONS = [
  'overflowing bin', 'illegal dumping', 'plastic waste', 'e-waste', 'hazardous', 'other',
];
const PIE_COLORS = ['#facc15', '#3b82f6', '#22c55e'];
const PAGE_SIZE = 10;

// Modal for status change
function StatusModal({ complaint, onClose, onSave }) {
  const [status, setStatus] = useState(complaint.status);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    try {
      setSaving(true);
      const res = await api.put('/api/complaints/' + complaint._id + '/status', { status, note });
      toast.success('Status updated');
      onSave(complaint._id, res.data.status || status);
      onClose();
    } catch {
      toast.error('Could not update status');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm p-6 dark:text-gray-100">
        <h2 className="font-bold text-lg mb-4">Change Status</h2>

        <label className="block text-sm font-medium mb-1">New Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border dark:border-gray-600 p-2 rounded w-full mb-3 bg-white dark:bg-gray-700"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <label className="block text-sm font-medium mb-1">Note (optional)</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows="3"
          placeholder="Add a note about this status change..."
          className="border dark:border-gray-600 p-2 rounded w-full mb-4 bg-white dark:bg-gray-700"
        />

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded border dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm rounded bg-green-700 text-white hover:bg-green-600 disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

function SkeletonStatCard() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded shadow p-4 animate-pulse">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 mx-auto mb-2" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mx-auto" />
    </div>
  );
}

export default function AdminDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingComplaints, setLoadingComplaints] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [modalComplaint, setModalComplaint] = useState(null);

  // Load stats
  useEffect(() => {
    api.get('/api/admin/stats')
      .then((res) => setStats(res.data))
      .catch(() => {
        // Fallback: compute from complaints
      })
      .finally(() => setLoadingStats(false));
  }, []);

  // Load complaints with filters
  useEffect(() => {
    setLoadingComplaints(true);
    const params = new URLSearchParams();
    params.set('page', page);
    params.set('limit', PAGE_SIZE);
    if (statusFilter) params.set('status', statusFilter);
    if (categoryFilter) params.set('category', categoryFilter);
    if (search) params.set('search', search);

    api.get('/api/complaints?' + params.toString())
      .then((res) => {
        // Support both paginated {complaints, total} and plain array
        if (Array.isArray(res.data)) {
          setComplaints(res.data);
          setTotalPages(1);
        } else {
          setComplaints(res.data.complaints || res.data.data || []);
          const total = res.data.total || res.data.totalCount || 0;
          setTotalPages(Math.max(1, Math.ceil(total / PAGE_SIZE)));
        }
      })
      .catch(() => toast.error('Could not load complaints'))
      .finally(() => setLoadingComplaints(false));
  }, [page, statusFilter, categoryFilter, search]);

  function handleStatusSaved(id, newStatus) {
    setComplaints(complaints.map((c) => (c._id === id ? { ...c, status: newStatus } : c)));
  }

  // stats API returns: { byStatus: {pending, 'in-progress', resolved}, byCategory: {}, complaintsPerDay: [], avgResolutionHours }
  // Derive values from stats or fall back to local complaints
  const byStatus = stats ? stats.byStatus : null;
  const byCategory = stats ? stats.byCategory : null;
  const dailyData = stats ? (stats.complaintsPerDay || []) : [];

  const pendingCount = byStatus ? byStatus.pending : complaints.filter((c) => c.status === 'pending').length;
  const inProgressCount = byStatus ? byStatus['in-progress'] : complaints.filter((c) => c.status === 'in-progress').length;
  const resolvedCount = byStatus ? byStatus.resolved : complaints.filter((c) => c.status === 'resolved').length;
  const totalCount = pendingCount + inProgressCount + resolvedCount;

  const statusChartData = [
    { name: 'Pending', value: pendingCount },
    { name: 'In Progress', value: inProgressCount },
    { name: 'Resolved', value: resolvedCount },
  ];

  const categoryChartData = byCategory
    ? CATEGORY_OPTIONS.map((cat) => ({ name: cat, count: byCategory[cat] || 0 }))
    : CATEGORY_OPTIONS.map((cat) => ({
        name: cat,
        count: complaints.filter((c) => c.category === cat).length,
      }));

  // Client-side search filter if backend doesn't support search param
  const displayedComplaints = search
    ? complaints.filter(
        (c) =>
          c.description?.toLowerCase().includes(search.toLowerCase()) ||
          c.category?.toLowerCase().includes(search.toLowerCase())
      )
    : complaints;

  return (
    <div className="dark:text-gray-100">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 text-center">
        {loadingStats ? (
          <>
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
          </>
        ) : (
          <>
            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded">
              <p className="text-2xl font-bold">{totalCount}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
            </div>
            <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded">
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-sm text-yellow-800 dark:text-yellow-300">Pending</p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded">
              <p className="text-2xl font-bold">{inProgressCount}</p>
              <p className="text-sm text-blue-800 dark:text-blue-300">In Progress</p>
            </div>
            <div className="bg-green-100 dark:bg-green-900 p-3 rounded">
              <p className="text-2xl font-bold">{resolvedCount}</p>
              <p className="text-sm text-green-800 dark:text-green-300">Resolved</p>
            </div>
          </>
        )}
      </div>
      {stats && stats.avgResolutionHours !== null && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 text-center">
          ⏱ Avg resolution time: <strong>{stats.avgResolutionHours}h</strong>
        </p>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        {/* Status Pie Chart */}
        <div className="bg-white dark:bg-gray-800 rounded shadow p-4">
          <h2 className="font-semibold mb-3">By Status</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={statusChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                {statusChartData.map((entry, index) => (
                  <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Category Bar Chart */}
        <div className="bg-white dark:bg-gray-800 rounded shadow p-4">
          <h2 className="font-semibold mb-3">By Category</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={categoryChartData} margin={{ top: 5, right: 10, left: -10, bottom: 40 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#16a34a" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Daily Trend Line Chart */}
        {dailyData.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded shadow p-4 sm:col-span-2">
            <h2 className="font-semibold mb-3">Complaints per Day (last 30 days)</h2>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#16a34a" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="Search by description..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="border dark:border-gray-600 p-2 rounded flex-1 bg-white dark:bg-gray-700 dark:text-gray-100"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="border dark:border-gray-600 p-2 rounded bg-white dark:bg-gray-700 dark:text-gray-100"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          className="border dark:border-gray-600 p-2 rounded bg-white dark:bg-gray-700 dark:text-gray-100"
        >
          <option value="">All Categories</option>
          {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Complaints Table */}
      <div className="bg-white dark:bg-gray-800 rounded shadow overflow-x-auto mb-4">
        {loadingComplaints ? (
          <div className="p-6 space-y-3 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
            ))}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-left">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedComplaints.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-400">No complaints found</td>
                </tr>
              )}
              {displayedComplaints.map((c) => (
                <tr key={c._id} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-gray-500 dark:text-gray-400">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium dark:text-gray-200">{c.user?.name || '—'}</p>
                    <p className="text-xs text-gray-400">{c.user?.email || ''}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-xs">
                      {c.category || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={
                      'text-xs px-2 py-1 rounded ' +
                      (c.priority === 'high'
                        ? 'bg-red-100 text-red-800'
                        : c.priority === 'medium'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-gray-100 text-gray-700')
                    }>
                      {c.priority || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={'text-xs px-2 py-1 rounded ' + statusColors[c.status]}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setModalComplaint(c)}
                      className="text-xs bg-green-700 text-white px-3 py-1 rounded hover:bg-green-600 transition-colors"
                    >
                      Change Status
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <button
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
          className="px-4 py-2 text-sm rounded border dark:border-gray-600 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          ← Prev
        </button>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          Page {page} of {totalPages}
        </span>
        <button
          disabled={page >= totalPages}
          onClick={() => setPage(page + 1)}
          className="px-4 py-2 text-sm rounded border dark:border-gray-600 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Next →
        </button>
      </div>

      {/* Status Change Modal */}
      {modalComplaint && (
        <StatusModal
          complaint={modalComplaint}
          onClose={() => setModalComplaint(null)}
          onSave={handleStatusSaved}
        />
      )}
    </div>
  );
}
