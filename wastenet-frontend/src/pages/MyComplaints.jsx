import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api';
import statusColors from '../statusColors';
import SkeletonCard from '../components/SkeletonCard';

export default function MyComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get('/api/complaints/mine')
      .then((res) => setComplaints(res.data))
      .catch(() => toast.error('Failed to load complaints'))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(e, id) {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this complaint?')) return;

    try {
      await api.delete('/api/complaints/' + id);
      setComplaints(complaints.filter((c) => c._id !== id));
      toast.success('Complaint deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete complaint');
    }
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4 dark:text-white">My Complaints</h1>
        <div className="grid gap-4 sm:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4 dark:text-white">My Complaints</h1>

      {complaints.length === 0 && (
        <div className="text-center py-16">
          <p className="text-6xl mb-4">🗑️</p>
          <p className="text-gray-500 dark:text-gray-400 mb-3">You haven't reported anything yet.</p>
          <Link to="/report" className="text-green-700 dark:text-green-400 underline font-medium">
            Report your first complaint →
          </Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {complaints.map((c) => (
          <div
            key={c._id}
            className="bg-white dark:bg-gray-800 rounded shadow overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate('/complaints/' + c._id)}
          >
            <img src={c.photoUrl} alt="waste" className="h-48 w-full object-cover" />
            <div className="p-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={'text-xs px-2 py-1 rounded ' + statusColors[c.status]}>
                  {c.status}
                </span>
                {c.category && (
                  <span className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                    {c.category}
                  </span>
                )}
                {c.priority && (
                  <span className={
                    'text-xs px-2 py-1 rounded ' +
                    (c.priority === 'high'
                      ? 'bg-red-100 text-red-800'
                      : c.priority === 'medium'
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-gray-100 text-gray-700')
                  }>
                    {c.priority}
                  </span>
                )}
              </div>

              <p className="mt-2 text-sm dark:text-gray-200 line-clamp-2">{c.description}</p>

              {c.address && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                  📍 {c.address}
                </p>
              )}

              <div className="flex items-center justify-between mt-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(c.createdAt).toLocaleDateString()}
                </p>

                {c.status === 'pending' && (
                  <button
                    onClick={(e) => handleDelete(e, c._id)}
                    className="text-xs text-red-600 hover:text-red-800 underline"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
