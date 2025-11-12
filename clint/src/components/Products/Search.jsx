import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useappcontext } from "../../context/appcontext.jsx";

export default function Search({ mobile = false }) {
  const { products } = useappcontext();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef(null);

  const baseUrl = import.meta.env.VITE_API_URL ;

  const uniqueCategories = Array.from(
    new Set(products.map((p) => p.category?.trim()).filter(Boolean))
  ).map((name) => ({
    name,
    slug: name.toLowerCase().replace(/\s+/g, "-"),
    icon: getCategoryIcon(name),
  }));

  function getCategoryIcon(name) {
    const iconMap = {
      Fruits: "🍎",
      Vegetables: "🥦",
      Dairy: "🥛",
      Bakery: "🍞",
      Beverages: "🥤",
      Snacks: "🍿",
      Meat: "🥩",
      Seafood: "🐟",
      Grains: "🌾",
      Frozen: "🧊",
      Household: "🏠",
      Spices: "🌶️",
      Seeds: "🌱",
      Instant: "⚡",
      Others: "📦",
    };
    return iconMap[name] || "📦";
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setResults([]);
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setQuery(value);

    if (!value) {
      setResults([]);
      return;
    }

    const categoryMatches = uniqueCategories.filter((cat) =>
      cat.name.toLowerCase().includes(value)
    );

    const productMatches = products.filter((prod) =>
      prod.name.toLowerCase().includes(value)
    );

    const combined = [
      ...categoryMatches.map((c) => ({
        type: "Category",
        label: c.name,
        icon: c.icon,
        href: `/products/${c.slug}`,
      })),
      ...productMatches.map((p) => ({
        type: "Product",
        label: p.name,
        icon: p.images?.[0] ? `${baseUrl}${p.images[0]}` : null,
        href: `/products/${p.category?.toLowerCase()}/${p._id}`,
        price: p.weights?.[0]?.offerPrice || p.weights?.[0]?.price || 0,
      })),
    ].slice(0, 8);

    setResults(combined);
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
  };

  const handleResultClick = (href) => {
    navigate(href);
    setQuery("");
    setResults([]);
    setIsFocused(false);
  };

  return (
    <div
      ref={searchRef}
      className={`relative ${mobile ? "w-full px-4" : "w-full max-w-2xl mx-auto"}`}
    >
      {/* Search Input */}
      <div
        className={`relative flex items-center ${
          mobile
            ? "bg-white border border-gray-200 rounded-full"
            : "bg-white border border-gray-200 shadow-lg rounded-full"
        }`}
      >
        {/* Search Icon */}
        <div
          className={`absolute inset-y-0 left-0 flex items-center ${
            mobile ? "pl-4" : "pl-5"
          } ${isFocused ? "text-emerald-600" : "text-gray-400"}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={mobile ? "w-4 h-4" : "w-5 h-5"}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Input */}
        <input
          placeholder="Search fresh groceries, categories..."
          value={query}
          onChange={handleSearch}
          onFocus={() => setIsFocused(true)}
          className={`w-full bg-transparent focus:outline-none placeholder-gray-400 rounded-full ${
            mobile ? "py-4 pl-10 pr-12 text-base" : "py-4 pl-12 pr-12 text-lg"
          }`}
          type="text"
        />

        {/* Clear Button */}
        {query && (
          <button
            onClick={clearSearch}
            className={`absolute inset-y-0 right-0 flex items-center ${
              mobile ? "pr-10" : "pr-5"
            } text-gray-400`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {isFocused && results.length > 0 && (
        <div
          className={`absolute mt-3 bg-white border border-emerald-100 rounded-2xl shadow-2xl z-50 overflow-hidden ${
            mobile ? "left-4 right-4" : "w-full"
          }`}
        >
          <div className="p-3 border-b border-emerald-50 bg-gradient-to-r from-emerald-50 to-teal-50">
            <p className="text-sm font-semibold text-emerald-800">
              Found {results.length} results
            </p>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {results.map((item, idx) => (
              <div
                key={idx}
                onClick={() => handleResultClick(item.href)}
                className="p-4 cursor-pointer border-b border-emerald-50 last:border-b-0"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center overflow-hidden">
                      {item.type === "Category" ? (
                        <span className="text-lg">{item.icon}</span>
                      ) : item.icon ? (
                        <img
                          src={item.icon}
                          alt={item.label}
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : (
                        <div className="text-gray-300 text-xl">📦</div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-gray-900 truncate">{item.label}</p>
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                          {item.type}
                        </span>
                      </div>
                      {item.price && (
                        <p className="text-sm text-gray-600 mt-1">₹{item.price}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex-shrink-0 text-gray-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

           {/* No Results */}
      {isFocused && query && results.length === 0 && (
        <div
          className={`absolute mt-3 bg-white border border-emerald-100 rounded-2xl shadow-2xl z-50 p-6 text-center ${
            mobile ? "left-4 right-4" : "w-full"
          }`}
        >
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-8 h-8 text-emerald-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">No results found</h3>
          <p className="text-sm text-gray-600">
            Try searching for different keywords or browse categories
          </p>
        </div>
      )}
    </div>
  );
}