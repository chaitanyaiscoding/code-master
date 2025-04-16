export function Button({ children, className, ...props }) {
    return (
      <button
        {...props}
        className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 ${className || ""}`}
      >
        {children}
      </button>
    );
  }
  