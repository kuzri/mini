const Header = ({ selectedCategory, onCategoryChange }) => {
  const categories = ['EV', 'PBV', '승용', 'RV', '택시상용'];

  return (
    <header className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">카탈로그 / 가격표</h1>
        <h2 className="text-xl text-gray-600 mb-6">EV / PBV / 승용 / RV / 택시 & 상용</h2>
        
        <div className="flex space-x-4">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => onCategoryChange(category)}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-black text-white'
                  : 'bg-white text-gray-700 border hover:bg-gray-50'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};

export default Header;