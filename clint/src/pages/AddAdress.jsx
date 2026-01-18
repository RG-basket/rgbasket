import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { cityLookup, assets } from "../assets/assets";
import { useAppContext } from "../context/AppContext";

// Reusable Input Field
const InputField = ({ type, placeholder, name, value, handleChange }) => (
  <input
    type={type}
    name={name}
    value={value}
    placeholder={placeholder}
    onChange={handleChange}
    className="w-full px-2 py-2.5 border border-gray-500/30 rounded outline-none text-gray-500 focus:border-primary transition"
    required={name !== "landmark"}
    maxLength={name === "phone" ? 10 : name === "pincode" ? 6 : undefined}
  />
);

const AddAddress = () => {
  const navigate = useNavigate();
  const { serviceAreas } = useAppContext();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    street: "",
    landmark: "",
    pincode: "",
    city: "",
    state: "",
    country: "",
  });

  const [pincodeStatus, setPincodeStatus] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if ((name === "phone" || name === "pincode") && /\D/.test(value)) return;

    setForm((prev) => ({ ...prev, [name]: value }));

    // Auto-fill from pincode
    if (name === "pincode") {
      if (value.length === 6) {
        const match = serviceAreas.find((p) => p.pincode === value);
        if (match) {
          // If the area name is set, we can try to guess city/state
          // For now, let's assume we can parse it from name or keep simple
          setForm((prev) => ({
            ...prev,
            city: match.name.split(',')[1]?.trim() || "Cuttack", // Fallback or dynamic
            state: "Odisha",
            country: "India",
          }));
          setPincodeStatus(true);
        } else {
          setForm((prev) => ({
            ...prev,
            city: "",
            state: "",
            country: "",
          }));
          setPincodeStatus(false);
        }
      } else {
        setPincodeStatus(null);
        setForm((prev) => ({
          ...prev,
          city: "",
          state: "",
          country: "",
        }));
      }
    }

    // Auto-fill from city
    if (name === "city") {
      const match = cityLookup[value.trim()];
      if (match) {
        setForm((prev) => ({
          ...prev,
          state: match.state,
          country: match.country,
        }));
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    localStorage.setItem("userAddress", JSON.stringify(form));
    toast.success("Address saved");
    navigate("/cart");
  };

  const isFormComplete =
    form.name &&
    form.email &&
    form.phone &&
    form.street &&
    form.pincode &&
    form.city &&
    form.state &&
    form.country;

  return (
    <div className="mt-16 pb-16">
      <p className="text-2xl md:text-3xl text-gray-500">
        Add Delivery <span className="font-semibold text-primary">Address</span>
      </p>

      <div className="flex flex-col-reverse md:flex-row justify-between mt-10">
        <div className="flex-1 max-w-md">
          <form onSubmit={handleSubmit} className="space-y-3 mt-6 text-sm">
            <InputField
              type="text"
              name="name"
              placeholder="Full Name"
              value={form.name}
              handleChange={handleChange}
            />
            <InputField
              type="email"
              name="email"
              placeholder="Email Address"
              value={form.email}
              handleChange={handleChange}
            />
            <InputField
              type="text"
              name="street"
              placeholder="Street Address"
              value={form.street}
              handleChange={handleChange}
            />
            <InputField
              type="text"
              name="landmark"
              placeholder="Landmark (optional)"
              value={form.landmark}
              handleChange={handleChange}
            />

            <div className="grid grid-cols-2 gap-4">
              <InputField
                type="text"
                name="city"
                placeholder="City"
                value={form.city}
                handleChange={handleChange}
              />
              <InputField
                type="text"
                name="state"
                placeholder="State"
                value={form.state}
                handleChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <InputField
                type="text"
                name="pincode"
                placeholder="Pincode"
                value={form.pincode}
                handleChange={handleChange}
              />
              <InputField
                type="text"
                name="country"
                placeholder="Country"
                value={form.country}
                handleChange={handleChange}
              />
            </div>

            {pincodeStatus === true && (
              <div className="text-sm text-green-700">
                ✅ Serviceable: <strong>{form.city}, {form.state}</strong>
              </div>
            )}
            {pincodeStatus === false && (
              <div className="text-sm text-red-600">❌ Not serviceable</div>
            )}

            <InputField
              type="tel"
              name="phone"
              placeholder="Phone Number"
              value={form.phone}
              handleChange={handleChange}
            />

            {isFormComplete && (
              <button
                type="submit"
                className="w-full mt-6 bg-[#005531] text-white py-3 rounded hover:bg-[#004427] transition cursor-pointer uppercase tracking-wide"
              >
                Save Address
              </button>
            )}
          </form>
        </div>

        <img
          className="md:mr-16 mb-16 md:mt-0"
          src={assets.add_address_iamge}
          alt="Add Address"
        />
      </div>
    </div>
  );
};

export default AddAddress;