import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

// Strict UI Palette theme colors
const COLORS = ['#6366f1', '#f59e0b', '#ef4444', '#10b981']; 

const AnalyticsDashboard = () => {
    const [overview, setOverview] = useState(null);
    const [trends, setTrends] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const token = localStorage.getItem('token'); 
                const config = { headers: { Authorization: `Bearer ${token}` } };

                const overviewRes = await axios.get('http://localhost:5000/api/analytics/overview', config);
                const trendsRes = await axios.get('http://localhost:5000/api/analytics/trends', config);

                setOverview(overviewRes.data);
                setTrends(trendsRes.data);
                setLoading(false);
            } catch (err) {
                console.error("Error loading analytics data", err);
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, []);

    if (loading) {
        return <div className="text-center p-10 font-semibold text-indigo-600 text-lg">Compiling analytics metrics...</div>;
    }

    if (!overview) {
        return <div className="text-center p-10 text-red-500 font-medium">Failed to sync data components from host server.</div>;
    }

    // --- LOGIC: DEFINE COMPACT SAFE PIE STRUCTURES ---
    const pieData = overview.statusBreakdown && overview.statusBreakdown.length > 0
        ? overview.statusBreakdown.map(item => ({
            name: item._id || "Unassigned",
            value: item.count
          }))
        : [
            { name: 'Pending (Demo)', value: 3 },
            { name: 'In Progress (Demo)', value: 2 },
            { name: 'Completed (Demo)', value: 4 }
          ];

    // --- LOGIC: DEFINE COMPACT SAFE BAR TREND STRUCTURES ---
    const barData = trends && trends.length > 0 
        ? trends.map(item => ({
            _id: item._id,
            created: item.created || 0,
            completed: item.completed || 0
          }))
        : [
            { _id: 'Mon', created: 4, completed: 2 },
            { _id: 'Tue', created: 3, completed: 3 },
            { _id: 'Wed', created: 5, completed: 1 },
            { _id: 'Thu', created: 2, completed: 4 },
            { _id: 'Fri', created: 6, completed: 5 }
          ];

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6 bg-gray-50 rounded-2xl min-h-screen">
            <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">Advanced Analytics Dashboard</h1>
            
            {/* --- COUNTER CARD --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-md text-white">
                    <h3 className="text-sm font-medium uppercase opacity-80 tracking-wider">Total System Tasks</h3>
                    <p className="text-4xl font-black mt-2">{overview.totalTasks || 0}</p>
                </div>
            </div>

            {/* --- VISUALIZATION BOXES --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
                
                {/* Chart Block 1: Pie Structure */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col items-center">
                    <h3 className="text-lg font-bold text-gray-700 mb-4 w-full text-left">Task Status Distribution</h3>
                    <div className="w-full flex justify-center items-center" style={{ minHeight: '320px' }}>
                        <PieChart width={380} height={300}>
                            <Pie
                                data={pieData}
                                cx="50%" cy="45%"
                                innerRadius={55}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                    </div>
                </div>

                {/* Chart Block 2: Bar Structure */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col items-center">
                    <h3 className="text-lg font-bold text-gray-700 mb-4 w-full text-left">Weekly Productivity Trends</h3>
                    <div className="w-full flex justify-center items-center" style={{ minHeight: '320px' }}>
                        <BarChart width={380} height={300} data={barData}>
                            <XAxis dataKey="_id" stroke="#9ca3af" fontSize={11} tickLine={false} />
                            <YAxis stroke="#9ca3af" fontSize={11} allowDecimals={false} tickLine={false} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="created" fill="#6366f1" name="Created Tasks" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="completed" fill="#10b981" name="Completed Tasks" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AnalyticsDashboard;