import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import statusColors from '../statusColors';

const statusDotColors = {
  pending: 'bg-yellow-400',
  'in-progress': 'bg-blue-500',
  resolved: 'bg-green-500',
};

export default function ComplaintDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/api/complaints/' + id)
      .then((res) => setComplaint(res.data))
      .catch(() => setError('Could not load complaint. It may not exist.'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDelete() {
    if (!window.confirm('Are you sure you want to delete this complaint?')) return;
    try {
      await api.delete('/api/complaints/' + id);
      toast.success('Complaint deleted');
      navigate('/my-complaints');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete complaint');
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse max-w-2xl mx-auto">
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-5xl mb-4">😕</p>
        <p className="text-gray-500 dark:text-gray-400">{error}</p>
      </div>
    );
  }

  const canDelete =
    user &&
    complaint &&
    complaint.status === 'pending' &&
    complaint.user &&
    (complaint.user._id === user.id || complaint.user._id === user._id);

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="text-sm text-green-700 dark:text-green-400 underline mb-4 inline-block"
      >
        ← Back
      </button>

      <div className="bg-white dark:bg-gray-800 rounded shadow overflow-hidden dark:text-gray-100">
        {/* Photo */}
        <img src={complaint.photoUrl} alt="waste" className="w-full h-64 object-cover" />

        <div className="p-6">
          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-3">
            <span className={'text-sm px-2 py-1 rounded ' + statusColors[complaint.status]}>
              {complaint.status}
            </span>
            {complaint.category && (
              <span className="text-sm px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                {complaint.category}
              </span>
            )}
            {complaint.priority && (
              <span className={
                'text-sm px-2 py-1 rounded ' +
                (complaint.priority === 'high'
                  ? 'bg-red-100 text-red-800'
                  : complaint.priority === 'medium'
                  ? 'bg-orange-100 text-orange-800'
                  : 'bg-gray-100 text-gray-700')
              }>
                Priority: {complaint.priority}
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-gray-800 dark:text-gray-200 mb-3">{complaint.description}</p>

          {/* Address */}
          {complaint.address && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              📍 {complaint.address}
            </p>
          )}

          {/* Map link */}
          <a
            href={
              'https://www.openstreetmap.org/?mlat=' +
              complaint.lat +
              '&mlon=' +
              complaint.lng +
              '#map=17/' +
              complaint.lat +
              '/' +
              complaint.lng
            }
            target="_blank"
            rel="noreferrer"
            className="text-sm text-green-700 dark:text-green-400 underline"
          >
            View on map ↗
          </a>

          {/* Date */}
          <p className="text-xs text-gray-400 mt-2">
            Reported on {new Date(complaint.createdAt).toLocaleString()}
          </p>

          {/* Delete button */}
          {canDelete && (
            <button
              onClick={handleDelete}
              className="mt-4 text-sm bg-red-100 text-red-700 px-4 py-2 rounded hover:bg-red-200 transition-colors"
            >
              🗑️ Delete Complaint
            </button>
          )}

          {/* Status Timeline */}
          {complaint.statusHistory && complaint.statusHistory.length > 0 && (
            <div className="mt-8">
              <h2 className="font-bold text-lg mb-4 dark:text-white">Status Timeline</h2>
              <div className="relative border-l-2 border-gray-200 dark:border-gray-600 pl-6 space-y-6">
                {complaint.statusHistory.map((item, idx) => (
                  <div key={idx} className="relative">
                    {/* Dot */}
                    <span
                      className={
                        'absolute -left-[1.4rem] top-0 h-4 w-4 rounded-full border-2 border-white dark:border-gray-800 ' +
                        (statusDotColors[item.status] || 'bg-gray-400')
                      }
                    />
                    <p className="font-medium capitalize dark:text-gray-200">{item.status}</p>
                    {item.note && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{item.note}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(item.changedAt || item.date).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
