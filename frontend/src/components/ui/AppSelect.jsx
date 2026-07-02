import Select from "react-select";

export default function AppSelect({
  label,
  options,
  value,
  onChange,
  placeholder = "Select...",
  error,
  isClearable = false,
  isDisabled = false,
  required = false,
}) {
  // Convert standard value to react-select format (object)
  const selectedOption = options.find((opt) => opt.value === value) || null;

  const handleChange = (selected) => {
    // If cleared, selected is null
    onChange(selected ? selected.value : "");
  };

    const customStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: "40px",
      borderRadius: "0.5rem",
      backgroundColor: "var(--tw-bg-slate-50)", 
      borderColor: state.isFocused ? "var(--tw-border-slate-400)" : "var(--tw-border-slate-200)",
      boxShadow: state.isFocused ? "0 0 0 1px var(--tw-border-slate-400)" : "none",
      "&:hover": {
        borderColor: "var(--tw-border-slate-300)",
      },
      // Dark mode overwrites
      ".dark &": {
        backgroundColor: "rgba(30, 41, 59, 0.5)", // slate-800/50
        borderColor: state.isFocused ? "var(--tw-border-slate-500)" : "var(--tw-border-slate-700)",
        color: "var(--tw-text-slate-200)",
        "&:hover": {
          borderColor: "var(--tw-border-slate-600)",
        },
      }
    }),
    menu: (base) => ({
      ...base,
      borderRadius: "0.5rem",
      backgroundColor: "#fff",
      border: "1px solid var(--tw-border-slate-200)",
      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
      overflow: "hidden",
      zIndex: 50,
      ".dark &": {
        backgroundColor: "#0f172a", // slate-900
        border: "1px solid rgba(30, 41, 59, 0.8)", // slate-800/80
      }
    }),
    option: (base, state) => ({
      ...base,
      fontSize: "13px",
      cursor: "pointer",
      backgroundColor: state.isSelected 
        ? "var(--tw-bg-slate-100)" 
        : state.isFocused 
          ? "var(--tw-bg-slate-50)" 
          : "transparent",
      color: state.isSelected ? "var(--tw-text-slate-900)" : "var(--tw-text-slate-700)",
      "&:active": {
        backgroundColor: "var(--tw-bg-slate-200)",
      },
      ".dark &": {
        backgroundColor: state.isSelected 
          ? "rgba(30, 41, 59, 1)" 
          : state.isFocused 
            ? "rgba(30, 41, 59, 0.5)" 
            : "transparent",
        color: state.isSelected ? "#fff" : "var(--tw-text-slate-300)",
      }
    }),
    singleValue: (base) => ({
      ...base,
      fontSize: "13px",
      color: "var(--tw-text-slate-800)",
      ".dark &": {
        color: "var(--tw-text-slate-200)",
      }
    }),
    placeholder: (base) => ({
      ...base,
      fontSize: "13px",
      color: "var(--tw-text-slate-400)",
      ".dark &": {
        color: "var(--tw-text-slate-500)",
      }
    }),
    input: (base) => ({
      ...base,
      color: "var(--tw-text-slate-800)",
      ".dark &": {
        color: "var(--tw-text-slate-200)",
      }
    }),
    indicatorSeparator: (base) => ({
      ...base,
      backgroundColor: "var(--tw-border-slate-200)",
      ".dark &": {
        backgroundColor: "var(--tw-border-slate-700)",
      }
    }),
    dropdownIndicator: (base) => ({
      ...base,
      color: "var(--tw-text-slate-400)",
      "&:hover": {
        color: "var(--tw-text-slate-600)",
      },
      ".dark &": {
        color: "var(--tw-text-slate-500)",
        "&:hover": {
          color: "var(--tw-text-slate-300)",
        },
      }
    }),
    clearIndicator: (base) => ({
      ...base,
      color: "var(--tw-text-slate-400)",
      "&:hover": {
        color: "var(--tw-text-red-500)",
      },
    }),
  };

  return (
    <div className={error ? "mb-1" : ""}>
      {label && (
        <label className="mb-1.5 block text-[13px] font-medium text-slate-700 dark:text-slate-300">
          {label} {required && "*"}
        </label>
      )}
      <Select
        value={selectedOption}
        onChange={handleChange}
        options={options}
        placeholder={placeholder}
        isClearable={isClearable}
        isDisabled={isDisabled}
        styles={customStyles}
        classNamePrefix="react-select"
        className={error ? "react-select-error" : ""}
        menuPlacement="auto"
        menuPosition="fixed"
      />
      {error && <p className="mt-1.5 text-[11px] text-red-500">{error}</p>}
    </div>
  );
}
