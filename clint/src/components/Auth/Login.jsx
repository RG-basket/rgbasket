import React from "react";
import { useappcontext } from "../../context/appcontext.jsx";

const Login = () => {
  const { loginWithGoogle, loading } = useappcontext();

  return (
    <div className="flex flex-col gap-6 w-full max-w-sm">
      <h2 className="text-xl font-bold text-center text-[#005531]">
        Login to RG Basket
      </h2>

      <button
        onClick={loginWithGoogle}
        disabled={loading}
        aria-label="Sign in with Google"
        className={`w-full flex items-center justify-center gap-2 bg-[#005531] text-white py-2 rounded-md transition ${
          loading ? "opacity-70 cursor-not-allowed" : "hover:bg-[#004024]"
        }`}
      >
        {loading && (
          <svg
            className="animate-spin h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            ></path>
          </svg>
        )}
        <span>{loading ? "Signing in..." : "Sign in with Google"}</span>
      </button>
    </div>
  );
};

export default Login;