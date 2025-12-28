import React, { useEffect, useState, useCallback } from "react";

const API_URL = `${import.meta.env.VITE_API_URL}/api/slots`;

/* -------------------------------
   IST Timezone Utilities
--------------------------------- */
const IST_TIMEZONE = 'Asia/Kolkata';

// Get current date/time in IST
const getISTDate = () => {
  return new Date(new Date().toLocaleString('en-US', { timeZone: IST_TIMEZONE }));
};

// Get IST date string in YYYY-MM-DD format
const getISTDateString = (date = null) => {
  const d = date || new Date();
  const istDate = new Date(d.toLocaleString('en-US', { timeZone: IST_TIMEZONE }));
  const year = istDate.getFullYear();
  const month = String(istDate.getMonth() + 1).padStart(2, '0');
  const day = String(istDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const SlotManager = () => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ capacity: 20, cutoffHours: 0.0833 }); // 5 minutes

  // Preview State - Initialize with IST tomorrow
  const [previewDate, setPreviewDate] = useState(() => {
    const tomorrow = getISTDate();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return getISTDateString(tomorrow);
  });
  const [previewAvailability, setPreviewAvailability] = useState([]);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Fetch slot configs
  const fetchSlots = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      if (res.ok) {
        setSlots(data);
      } else {
        throw new Error(data.message || "Failed to fetch slots");
      }
    } catch (err) {
      setMessage("❌ Error: " + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Check availability for preview
  const checkAvailability = useCallback(async () => {
    if (!previewDate) return;
    setPreviewLoading(true);
    try {
      const res = await fetch(`${API_URL}/availability?date=${previewDate}`);
      const data = await res.json();
      if (res.ok) {
        setPreviewAvailability(data);
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      console.error("Preview error:", err);
    } finally {
      setPreviewLoading(false);
    }
  }, [previewDate]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  useEffect(() => {
    checkAvailability();
  }, [checkAvailability]);

  const handleEdit = (slot) => {
    setEditingId(slot._id);
    setEditForm({ capacity: slot.capacity, cutoffHours: slot.cutoffHours });
  };

  const handleSave = async (id) => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw new Error("Unauthorized. Please login again.");
        }
        throw new Error("Failed to update");
      }

      setMessage("✅ Slot updated successfully");
      setEditingId(null);
      fetchSlots();
      checkAvailability(); // Refresh preview
    } catch (err) {
      setMessage("❌ Update failed: " + err.message);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Delivery Slot Configuration</h2>

      {message && (
        <div className={`mb-6 p-3 rounded ${message.includes("❌") ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Configuration */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Standard Daily Slots</h3>
          <div className="bg-white rounded-lg shadow overflow-hidden border">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slot Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Capacity</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cutoff (Hrs)</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {slots.map(slot => (
                  <tr key={slot._id}>
                    <td className="px-4 py-4 font-medium text-gray-900">{slot.name}</td>
                    <td className="px-4 py-4 text-gray-500">{slot.startTime} - {slot.endTime}</td>
                    <td className="px-4 py-4">
                      {editingId === slot._id ? (
                        <input
                          type="number"
                          className="w-16 border rounded p-1"
                          value={editForm.capacity}
                          onChange={e => setEditForm({ ...editForm, capacity: e.target.value })}
                        />
                      ) : (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">
                          {slot.capacity}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {editingId === slot._id ? (
                        <input
                          type="number"
                          className="w-16 border rounded p-1"
                          value={editForm.cutoffHours}
                          onChange={e => setEditForm({ ...editForm, cutoffHours: e.target.value })}
                        />
                      ) : (
                        <span className="text-gray-600">{slot.cutoffHours}h</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right">
                      {editingId === slot._id ? (
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => handleSave(slot._id)} className="text-green-600 hover:text-green-900">Save</button>
                          <button onClick={() => setEditingId(null)} className="text-gray-500 hover:text-gray-700">Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => handleEdit(slot)} className="text-blue-600 hover:text-blue-900">Edit</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            * These settings apply to ALL days. Capacity determines how many orders can be taken per slot.
          </p>
        </div>

        {/* Right Column: Preview */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Availability Preview</h3>
          <div className="bg-gray-50 p-4 rounded-lg border">
            <div className="flex items-center gap-4 mb-4">
              <label className="text-sm font-medium text-gray-700">Check Date:</label>
              <input
                type="date"
                value={previewDate}
                onChange={e => setPreviewDate(e.target.value)}
                className="border rounded p-2"
              />
              <button
                onClick={checkAvailability}
                className="text-sm text-blue-600 hover:underline"
              >
                Refresh
              </button>
            </div>

            {previewLoading ? (
              <div className="text-center py-8 text-gray-500">Checking availability...</div>
            ) : (
              <div className="space-y-3">
                {previewAvailability.map(slot => (
                  <div key={slot._id} className={`p-3 rounded border flex justify-between items-center ${slot.isAvailable ? 'bg-white border-green-200' : 'bg-gray-100 border-gray-200 opacity-75'
                    }`}>
                    <div>
                      <div className="font-medium text-gray-900">{slot.name}</div>
                      <div className="text-xs text-gray-500">{slot.startTime} - {slot.endTime}</div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${slot.isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                        {slot.isAvailable ? 'Available' : 'Unavailable'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {slot.booked} / {slot.capacity} booked
                        {!slot.isAvailable && <span className="block text-red-500">{slot.reason}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlotManager;