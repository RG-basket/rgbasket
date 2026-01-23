import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import AdminModalDark from './AdminModalDark';
import { Navigation, Save, MapPin } from 'lucide-react';
import L from 'leaflet';
import { tw } from '../../../config/tokyoNightTheme';

// Fix for leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to handle map clicks
const LocationMarker = ({ position, setPosition }) => {
    const map = useMap();

    useMapEvents({
        click(e) {
            setPosition(e.latlng);
            map.flyTo(e.latlng, map.getZoom());
        },
    });

    useEffect(() => {
        if (position) {
            map.flyTo(position, map.getZoom());
        }
    }, [position, map]);

    return position === null ? null : (
        <Marker position={position}></Marker>
    );
};

// Component to update map view when position changes externally
const MapUpdater = ({ position }) => {
    const map = useMap();
    useEffect(() => {
        if (position) {
            map.setView(position, 15);
        }
    }, [position, map]);
    return null;
};

const LocationCaptureModal = ({ isOpen, onClose, order, onSave }) => {
    const [position, setPosition] = useState(null);
    const [addressText, setAddressText] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && order) {
            // Check for existing coordinates in order
            if (order.location?.coordinates?.latitude) {
                setPosition({
                    lat: order.location.coordinates.latitude,
                    lng: order.location.coordinates.longitude
                });
            } else if (order.location?.lat) {
                setPosition({
                    lat: order.location.lat,
                    lng: order.location.lng
                });
            } else {
                setPosition(null); // Reset if no location
            }

            // Pre-fill address text
            const address = order.shippingAddress;
            if (address) {
                const text = `${address.street}, ${address.locality}`; // Simplified
                setAddressText(text);
            }
        }
    }, [isOpen, order]);

    const handleGetLocation = () => {
        setLoading(true);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const newPos = {
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude
                    };
                    setPosition(newPos);
                    setLoading(false);
                },
                (err) => {
                    console.error("Error getting location", err);
                    setLoading(false);
                    alert("Could not get current location: " + err.message);
                }
            );
        } else {
            setLoading(false);
            alert("Geolocation is not supported by this browser.");
        }
    };

    const handleSave = () => {
        if (!position) {
            alert("Please drop a pin on the map");
            return;
        }
        onSave({
            coordinates: position,
            addressText,
            userId: order.user._id || order.user,
            orderId: order._id
        });
    };

    // Default center (India roughly or Bhubaneswar)
    const defaultCenter = { lat: 20.2961, lng: 85.8245 };

    return (
        <AdminModalDark
            isOpen={isOpen}
            onClose={onClose}
            title="Capture User Location"
            size="lg"
            footer={
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className={`px-4 py-2 ${tw.textSecondary} hover:text-white transition-colors`}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading || !position}
                        className={`flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-lg shadow-emerald-900/20`}
                    >
                        <Save className="w-4 h-4" />
                        Save Location
                    </button>
                </div>
            }
        >
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <label className={`block text-sm font-medium ${tw.textSecondary} mb-1`}>Location Description</label>
                        <input
                            type="text"
                            value={addressText}
                            onChange={(e) => setAddressText(e.target.value)}
                            className={`w-full ${tw.bgInput} border ${tw.borderPrimary} rounded-lg px-4 py-2 ${tw.textPrimary} focus:outline-none focus:border-[#7aa2f7]`}
                            placeholder="e.g. Red building, 2nd floor..."
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={handleGetLocation}
                            disabled={loading}
                            className={`flex items-center gap-2 px-4 py-2 ${tw.bgInput} text-[#7aa2f7] border border-[#7aa2f7]/30 rounded-lg hover:bg-[#7aa2f7]/10 transition-colors w-full md:w-auto justify-center`}
                        >
                            <Navigation className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            {loading ? 'Getting Location...' : 'Get My Location'}
                        </button>
                    </div>
                </div>

                <div className={`h-[400px] rounded-xl overflow-hidden border ${tw.borderPrimary} relative z-0`}>
                    <MapContainer
                        center={defaultCenter}
                        zoom={13}
                        style={{ height: '100%', width: '100%' }}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <LocationMarker position={position} setPosition={setPosition} />
                        <MapUpdater position={position} />
                    </MapContainer>
                </div>

                <p className={`text-sm ${tw.textSecondary} flex items-center gap-2`}>
                    <MapPin className="w-4 h-4" />
                    Click on the map to drop a pin at the exact delivery location.
                </p>
            </div>
        </AdminModalDark>
    );
};

export default LocationCaptureModal;
