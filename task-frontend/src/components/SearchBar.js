
export default function SearchBar({ onSearch, onFilter }) {
  return (
    <div className='search-filter-row flex gap-3 mb-4'>
      <input
        type="text"
        placeholder='Search tasks...'
       
        onChange={(e) => onSearch(e.target.value)}
        className='flex-1 border rounded p-2 focus:outline-none focus:ring bg-transparent'
        style={{ color: 'var(--text)', borderColor: 'var(--border)' }}
      />
      <select 
        onChange={(e) => onFilter(e.target.value)}
        className='border rounded p-2 bg-transparent'
        style={{ color: 'var(--text)', borderColor: 'var(--border)' }}
      >
        <option value=''>All Status</option>
        <option value='Pending'>Pending</option>
        <option value='In Progress'>In Progress</option>
        <option value='Completed'>Completed</option>
      </select>
    </div>
  );
}