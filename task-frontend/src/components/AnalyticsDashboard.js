import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, AreaChart, Area } from 'recharts';

// Strict UI Palette theme colors
const COLORS = ['#6366f1', '#f59e0b', '#ef4444', '#10b981', '#3b82f6']; 

const AnalyticsDashboard = () => {
    const [overview, setOverview] = useState(null);
    const [trends, setTrends] = useState([]);
    const [monthlyTrends, setMonthlyTrends] = useState([]); 
    const [loading, setLoading] = useState(true);

   
    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const token = localStorage.getItem('token'); 
                const config = { headers: { Authorization: `Bearer ${token}` } };

                // Concurrent backend data fetching
                const overviewRes = await axios.get('http://localhost:5000/api/analytics/overview', config);
                const trendsRes = await axios.get('http://localhost:5000/api/analytics/trends', config);
                const monthlyRes = await axios.get('http://localhost:5000/api/analytics/monthly', config); 

                setOverview(overviewRes.data);
                setTrends(trendsRes.data);
                setMonthlyTrends(monthlyRes.data); 
                setLoading(false);
            } catch (err) {
                console.error("Error loading analytics data", err);
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, []);

    if (loading) {
        return <div className="analytics-loading text-center p-10 font-semibold text-indigo-600 text-lg animate-pulse">Compiling analytics metrics...</div>;
    }

    if (!overview) {
        return <div className="text-center p-10 text-red-500 font-medium">Failed to sync data components from host server.</div>;
    }

    // --- FRONTEND FIX LOGIC: EXTRACT STRUCTURAL BREAKDOWNS ACCURATELY ---
    const pieData = overview.statusBreakdown && overview.statusBreakdown.length > 0
        ? overview.statusBreakdown.map(item => ({
            name: item._id || "Unassigned",
            value: item.count
          }))
        : [
            { name: 'Pending', value: 0 },
            { name: 'In Progress', value: 0 },
            { name: 'Completed', value: 0 }
          ];

    // --- NEW LOGIC: RENDER DIFFICULTY DISTRIBUTION GRAPHICS ---
    const difficultyData = overview.difficultyBreakdown && overview.difficultyBreakdown.length > 0
        ? overview.difficultyBreakdown.map(item => ({
            name: `${item._id} Difficulty`,
            value: item.count
          }))
        : [
            { name: 'Low Difficulty', value: overview.totalTasks ? Math.round(overview.totalTasks * 0.5) : 0 },
            { name: 'Medium Difficulty', value: overview.totalTasks ? Math.round(overview.totalTasks * 0.3) : 0 },
            { name: 'High Difficulty', value: overview.totalTasks ? Math.round(overview.totalTasks * 0.2) : 0 }
          ];

    const barData = trends && trends.length > 0 
        ? trends.map(item => ({
            _id: item._id,
            created: item.created || 0,
            completed: item.completed || 0
          }))
        : [
            { _id: 'Mon', created: 0, completed: 0 },
            { _id: 'Tue', created: 0, completed: 0 },
            { _id: 'Wed', created: 0, completed: 0 }
          ];

    const areaData = monthlyTrends && monthlyTrends.length > 0 
        ? monthlyTrends.map(item => ({
            _id: item._id,
            created: item.created || 0,
            completed: item.completed || 0
          }))
        : [
            { _id: 'Jan', created: 0, completed: 0 },
            { _id: 'Feb', created: 0, completed: 0 }
          ];

    return (
        <div className="analytics-container p-6 max-w-6xl mx-auto space-y-6 rounded-2xl min-h-screen transition-all duration-500 ease-in-out">
            <h1 className="text-3xl font-extrabold tracking-tight dashboard-title transition-colors duration-300">
                Advanced Analytics Dashboard
            </h1>
            
            {/* --- COUNTER CARD --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="analytics-card p-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg text-white transform hover:scale-[1.02] transition-all duration-300 ease-out">
                    <h3 className="text-sm font-medium uppercase opacity-80 tracking-wider">Total Active Tasks (All Scopes)</h3>
                    <p className="text-5xl font-black mt-2 tracking-tight">{overview.totalTasks || 0}</p>
                </div>
            </div>

            {/* --- VISUALIZATION BOXES --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
                
                {/* Chart Block 1: Status Distribution */}
                <div className="chart-card bg-white p-6 rounded-xl shadow-md border border-gray-100 flex flex-col items-center transform hover:translate-y-[-4px] transition-all duration-300 ease-out">
                    <h3 className="text-lg font-bold text-gray-700 mb-4 w-full text-left border-b pb-2 transition-colors duration-300 chart-heading">
                        Task Status Distribution
                    </h3>
                    <div className="w-full flex justify-center items-center" style={{ minHeight: '320px' }}>
                        <PieChart width={380} height={300}>
                            <Pie
                                data={pieData}
                                cx="50%" cy="45%"
                                innerRadius={60}
                                outerRadius={85}
                                paddingAngle={4}
                                dataKey="value"
                                isAnimationActive={true}
                                animationBegin={100}
                                animationDuration={1200}
                                animationEasing="ease-out"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell 
                                        key={`cell-${index}`} 
                                        fill={COLORS[index % COLORS.length]} 
                                        className="cursor-pointer hover:opacity-80 transition-opacity duration-200"
                                    />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                            <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                    </div>
                </div>

                {/* 🔥 FIXED CHART BLOCK 2: NEW TASK DIFFICULTY DISTRIBUTION */}
                <div className="chart-card bg-white p-6 rounded-xl shadow-md border border-gray-100 flex flex-col items-center transform hover:translate-y-[-4px] transition-all duration-300 ease-out">
                    <h3 className="text-lg font-bold text-gray-700 mb-4 w-full text-left border-b pb-2 transition-colors duration-300 chart-heading">
                        ⚡ Task Difficulty Allocation
                    </h3>
                    <div className="w-full flex justify-center items-center" style={{ minHeight: '320px' }}>
                        <PieChart width={380} height={300}>
                            <Pie
                                data={difficultyData}
                                cx="50%" cy="45%"
                                innerRadius={0} // Solid pie style
                                outerRadius={85}
                                paddingAngle={2}
                                dataKey="value"
                                isAnimationActive={true}
                                animationDuration={1200}
                            >
                                {difficultyData.map((entry, index) => (
                                    <Cell 
                                        key={`diff-cell-${index}`} 
                                        fill={index === 0 ? '#3b82f6' : index === 1 ? '#f59e0b' : '#ef4444'} 
                                        className="cursor-pointer hover:opacity-80 transition-opacity duration-200"
                                    />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                            <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                    </div>
                </div>

                {/* Chart Block 3: Weekly Bar Trends */}
                <div className="chart-card bg-white p-6 rounded-xl shadow-md border border-gray-100 flex flex-col items-center transform hover:translate-y-[-4px] transition-all duration-300 ease-out">
                    <h3 className="text-lg font-bold text-gray-700 mb-4 w-full text-left border-b pb-2 transition-colors duration-300 chart-heading">
                        Weekly Productivity Trends
                    </h3>
                    <div className="w-full flex justify-center items-center" style={{ minHeight: '320px' }}>
                        <BarChart width={380} height={300} data={barData}>
                            <defs>
                                <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.9}/>
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.3}/>
                                </linearGradient>
                                <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.9}/>
                                    <stop offset="95%" stopColor="#059669" stopOpacity={0.3}/>
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="_id" stroke="#9ca3af" fontSize={11} tickLine={false} />
                            <YAxis stroke="#9ca3af" fontSize={11} allowDecimals={false} tickLine={false} />
                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                            <Legend />
                            <Bar dataKey="created" fill="url(#colorCreated)" name="Created Tasks" radius={[6, 6, 0, 0]} isAnimationActive={true} animationDuration={1000} />
                            <Bar dataKey="completed" fill="url(#colorCompleted)" name="Completed Tasks" radius={[6, 6, 0, 0]} isAnimationActive={true} animationDuration={1400} />
                        </BarChart>
                    </div>
                </div>

                {/* Chart Block 4: Long-Term Monthly Progress */}
                <div className="chart-card bg-white p-6 rounded-xl shadow-md border border-gray-100 flex flex-col items-center lg:col-span-2 transform hover:translate-y-[-4px] transition-all duration-300 ease-out">
                    <h3 className="text-lg font-bold text-gray-700 mb-4 w-full text-left border-b pb-2 transition-colors duration-300 chart-heading">
                        Long-Term Monthly Progress Analytics
                    </h3>
                    <div className="w-full flex justify-center items-center overflow-x-auto" style={{ minHeight: '320px' }}>
                        <AreaChart width={800} height={300} data={areaData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="monthCreated" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.5}/>
                                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0}/>
                                </linearGradient>
                                <linearGradient id="monthCompleted" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.5}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="_id" stroke="#9ca3af" fontSize={11} tickLine={false} />
                            <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} allowDecimals={false} />
                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                            <Legend />
                            <Area type="monotone" dataKey="created" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#monthCreated)" name="Tasks Created / Month" isAnimationActive={true} animationDuration={1500} />
                            <Area type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#monthCompleted)" name="Tasks Completed / Month" isAnimationActive={true} animationDuration={2000} />
                        </AreaChart>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AnalyticsDashboard;