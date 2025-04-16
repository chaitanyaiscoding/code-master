export function Input({ className, ...props }) {
    return (
      <input
        {...props}
        className={`border p-2 rounded w-full ${className || ""}`}
      />
    );
  }
  