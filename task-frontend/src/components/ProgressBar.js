// src/components/ProgressBar.jsx
export default function ProgressBar({ tasks }) {
const total = tasks.length;
const completed = tasks.filter(t => t.status === 'Completed').length;
const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
return (
<div className='mb-6'>
<p className='text-sm text-gray-600 mb-1'>
{completed} of {total} tasks completed ({percent}%)
</p>
<div className='w-full bg-gray-200 rounded-full h-3'>
<div
className='bg-indigo-600 h-3 rounded-full transition-all duration-500'
style={{ width: `${percent}%` }}
/>
</div>
</div>
);
}