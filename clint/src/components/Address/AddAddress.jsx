import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { serviceablePincodes } from "../../assets/assets";

const AddAddress = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    house: "",
    landmark: "",
    pincode: "",
    city: "",
    area: "",
  });

  const [pincodeStatus, setPincodeStatus] = useState(null); // null | true | false

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Restrict phone and pincode to digits only
    if ((name === "phone" || name === "pincode") && /\D/.test(value)) return;

    setForm(prev => ({ ...prev, [name]: value }));

    if (name === "pincode") {
      if (value.length === 6) {
        const match = serviceablePincodes.find(p => p.pincode === value);
        if (match) {
          setForm(prev => ({
            ...prev,
            city: match.city,
            area: match.area,
          }));
          setPincodeStatus(true);
        } else {
          setForm(prev => ({ ...prev, city: "", area: "" }));
          setPincodeStatus(false);
        }
      } else {
        setPincodeStatus(null);
        setForm(prev => ({ ...prev, city: "", area: "" }));
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { name, phone, house, pincode, city, area } = form;

    if (!name || !phone || !house || !pincode || !city || !area) {
      toast.error("Please fill all required fields");
      return;
    }

    localStorage.setItem("userAddress", JSON.stringify(form));
    toast.success("Address saved");
    navigate("/cart");
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h2 className="text-xl font-semibold mb-6">Add Delivery Address</h2>
      <form onSubmit={handleSubmit} className="grid gap-4">
        <input
          type="text"
          name="name"
          placeholder="Full Name"
          value={form.name}
          onChange={handleChange}
          className="border px-3 py-2 rounded"
        />
        <input
          type="tel"
          name="phone"
          placeholder="Phone Number"
          value={form.phone}
          onChange={handleChange}
          className="border px-3 py-2 rounded"
          maxLength={10}
        />
        <input
          type="text"
          name="house"
          placeholder="House / Flat / Block"
          value={form.house}
          onChange={handleChange}
          className="border px-3 py-2 rounded"
        />
        <input
          type="text"
          name="landmark"
          placeholder="Landmark (optional)"
          value={form.landmark}
          onChange={handleChange}
          className="border px-3 py-2 rounded"
        />
        <input
          type="text"
          name="pincode"
          placeholder="Pincode"
          value={form.pincode}
          onChange={handleChange}
          className="border px-3 py-2 rounded"
          maxLength={6}
        />
        {pincodeStatus === true && (
          <div className="text-sm text-green-700">
            Serviceable: {form.area}, {form.city}
          </div>
        )}
        {pincodeStatus === false && (
          <div className="text-sm text-red-600">Not serviceable</div>
        )}
        <button
          type="submit"
          className="bg-[#005531] text-white py-2 rounded hover:bg-[#004427] transition"
        >
          Save Address
        </button>
      </form>
    </div>
  );
};

export default AddAddress;