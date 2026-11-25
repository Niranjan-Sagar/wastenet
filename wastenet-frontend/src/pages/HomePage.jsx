import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

function AnimatedCounter({ target }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!target) return;
    let start = 0;
    const step = Math.ceil(target / 40);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 30);
    return () => clearInterval(timer);
  }, [target]);

  return <span>{count.toLocaleString()}</span>;
}

export default function HomePage() {
  const [stats, setStats] = useState({ total: 0, resolved: 0, facilities: 0 });
  const [statsLoaded, setStatsLoaded] = useState(false);

  useEffect(() => {
    async function loadStats() {
      try {
        const [complaintsRes, facilitiesRes] = await Promise.allSettled([
          api.get('/api/complaints/public'),
          api.get('/api/facilities'),
        ]);

        const complaintsData = complaintsRes.status === 'fulfilled' ? complaintsRes.value.data : {};
        const facilitiesData = facilitiesRes.status === 'fulfilled' ? facilitiesRes.value.data : [];

        // Get resolved count separately (filter by status=resolved)
        let resolvedCount = 0;
        try {
          const resolvedRes = await api.get('/api/complaints/public?status=resolved&limit=1');
          resolvedCount = resolvedRes.data.total || 0;
        } catch {
          resolvedCount = 0;
        }

        setStats({
          total: complaintsData.total || 0,
          resolved: resolvedCount,
          facilities: Array.isArray(facilitiesData) ? facilitiesData.length : 0,
        });
        setStatsLoaded(true);
      } catch {
        setStatsLoaded(true);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="dark:bg-gray-900 dark:text-gray-100 min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-green-600 to-green-800 text-white py-20 px-4 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold mb-4">
          Smart Recycling &amp; Reporting
        </h1>
        <p className="text-lg sm:text-xl text-green-100 mb-8 max-w-xl mx-auto">
          Report waste, track complaints, and find recycling centres near you.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/map"
            className="bg-white text-green-700 font-bold px-8 py-3 rounded-full hover:bg-green-50 transition-colors shadow-lg"
          >
            🗺️ View Map
          </Link>
          <Link
            to="/report"
            className="bg-green-500 text-white font-bold px-8 py-3 rounded-full hover:bg-green-400 transition-colors shadow-lg border-2 border-green-300"
          >
            📸 Report Waste
          </Link>
        </div>
      </div>

      {/* Live Stats */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-center mb-8 dark:text-white">
          Community Impact
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
            <p className="text-4xl font-bold text-green-600">
              {statsLoaded ? <AnimatedCounter target={stats.total} /> : '...'}
            </p>
            <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">Total Reported</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
            <p className="text-4xl font-bold text-blue-600">
              {statsLoaded ? <AnimatedCounter target={stats.resolved} /> : '...'}
            </p>
            <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">Resolved</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
            <p className="text-4xl font-bold text-yellow-600">
              {statsLoaded ? <AnimatedCounter target={stats.facilities} /> : '...'}
            </p>
            <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">Facilities</p>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-gray-50 dark:bg-gray-800 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10 dark:text-white">
            How It Works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center gap-3">
              <span className="text-5xl">📸</span>
              <h3 className="font-bold text-lg dark:text-white">1. Spot Waste</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Take a photo of waste and report it through the app in seconds.
              </p>
            </div>
            <div className="flex flex-col items-center gap-3">
              <span className="text-5xl">🔍</span>
              <h3 className="font-bold text-lg dark:text-white">2. We Track It</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Our admin team reviews each complaint and follows up with the right teams.
              </p>
            </div>
            <div className="flex flex-col items-center gap-3">
              <span className="text-5xl">✅</span>
              <h3 className="font-bold text-lg dark:text-white">3. It Gets Clean</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                The issue is resolved and the community celebrates a cleaner environment.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="text-center py-16 px-4 dark:bg-gray-900">
        <h2 className="text-2xl font-bold mb-4 dark:text-white">Ready to explore?</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Browse waste reports and recycling facilities on the interactive map.
        </p>
        <Link
          to="/map"
          className="bg-green-700 text-white font-bold px-10 py-3 rounded-full hover:bg-green-600 transition-colors shadow-lg"
        >
          🗺️ Explore Map
        </Link>
      </div>
    </div>
  );
}
