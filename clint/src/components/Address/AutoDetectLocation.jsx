import React, { useState, useEffect } from "react";
import { useGeolocated } from "react-geolocated";
import { serviceablePincodes } from "../../assets/assets";

const AutoDetectLocation = () => {
  const [location, setLocation] = useState(null);
  const [isServiceable, setIsServiceable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isManualTriggered, setIsManualTriggered] = useState(false);

  const {
    coords,
    isGeolocationAvailable,
    isGeolocationEnabled,
    positionError,
    getPosition, // Add this to trigger manually
  } = useGeolocated({
    positionOptions: {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    },
    userDecisionTimeout: 10000,
    suppressLocationOnMount: true, // 🛑 CHANGED: Stop auto-requesting
  });

  // Function to handle the manual click
  const handleDetectClick = () => {
    setIsManualTriggered(true);
    getPosition();
  };

  useEffect(() => {
    if (coords && isManualTriggered) {
      reverseGeocode(coords);
    }
  }, [coords, isManualTriggered]);

  const reverseGeocode = async ({ latitude, longitude }) => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/geocode/reverse?lat=${latitude}&lon=${longitude}`
      );

      if (res.ok) {
        const data = await res.json();

        if (data.success && data.location) {
          const detectedLocation = {
            area: data.location.area,
            district: data.location.district,
            state: data.location.state,
            pincode: data.location.pincode,
          };

          setLocation(detectedLocation);

          const match = serviceablePincodes.find(
            (entry) => entry.pincode === detectedLocation.pincode
          );

          setIsServiceable(!!match);
        }
      }
    } catch (error) {
      console.error("Geocoding failed:", error);
    } finally {
      setIsLoading(false);
      setIsManualTriggered(false);
    }
  };

  return (
    <div className="text-xs text-gray-700 leading-tight max-w-full">
      {isLoading ? (
        <div className="flex items-center gap-1.5 text-blue-600">
          <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span>Detecting...</span>
        </div>
      ) : location ? (
        <div
          onClick={handleDetectClick}
          className="cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors"
        >
          <div className="whitespace-nowrap overflow-hidden text-ellipsis font-medium">
            {location.area}, {location.pincode}
          </div>
          <div className={`font-semibold ${isServiceable ? "text-green-600" : "text-amber-600"}`}>
            {isServiceable ? (
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-600 rounded-full" />
                Serviceable
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-amber-600 rounded-full" />
                Not Serviceable
              </span>
            )}
          </div>
        </div>
      ) : (
        <button
          onClick={handleDetectClick}
          className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium transition-colors"
          title="Click to detect location"
        >
          <span>📍</span>
          <span>Check Serviceability</span>
        </button>
      )}

      {positionError && isManualTriggered && (
        <div className="text-[10px] text-red-500 mt-1">
          Permission denied or error.
        </div>
      )}
    </div>
  );
};

export default AutoDetectLocation;