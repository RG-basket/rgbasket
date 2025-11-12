import React from "react";
import ProductCard from "../Products/ProductCard.jsx";
import { useappcontext } from "../../context/appcontext.jsx";

const RecentViewed = () => {
  const { recentItems } = useappcontext(); // Assuming this is an array

  if (!recentItems || recentItems.length === 0) return null; // 🔒 Fully hide if empty

  return (
    <div className="mt-6 px-4">
      <p className="text-2xl md:text-3xl font-medium">Recently Viewed</p>
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-6">
        {recentItems.slice(0, 6).map((item) => (
          <ProductCard key={item._id} product={item} showCartControls={false} />
        ))}
      </div>
    </div>
  );
};

export default RecentViewed;