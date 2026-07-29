import { useId } from "react";
import Select from "react-select";

/*
 * The shared select.
 *
 * Every colour here previously referenced variables like
 * `var(--tw-bg-slate-50)` and `var(--tw-text-slate-700)`, which Tailwind
 * has never defined - v4 names them `--color-slate-*`. All of them
 * resolved to nothing, so react-select silently fell back to its own
 * defaults: a blue focus ring, black option text, and a white menu that
 * stayed white in dark mode. That is why selects looked unrelated to
 * every other control in the app.
 *
 * The styles below read the design tokens instead. Because those tokens
 * are redefined under `.dark`, a single set of rules covers both themes -
 * react-select renders its menu in a portal-less div inside the same
 * tree, so `var()` resolves against the themed root.
 */

const token = (name) => `var(--${name})`;

const controlBase = {
  minHeight: "var(--tf-h-md)",
  borderRadius: "var(--tf-r-md)",
  fontSize: "13px",
  backgroundColor: token("tf-bg-1"),
  transition: "border-color .18s, box-shadow .18s",
};

export default function AppSelect({
  label,
  options,
  value,
  onChange,
  placeholder = "Select...",
  error,
  helpText,
  isClearable = false,
  isDisabled = false,
  required = false,
  inputId,
}) {
  const generatedId = useId();
  const resolvedInputId = inputId || `app-select-${generatedId.replace(/:/g, "")}`;

  // react-select works in option objects; the rest of the app works in
  // plain values, so translate at the boundary.
  const selectedOption = (options || []).find((option) => option.value === value) || null;

  const handleChange = (selected) => {
    onChange(selected ? selected.value : "");
  };

  const styles = {
    control: (base, state) => ({
      ...base,
      ...controlBase,
      borderColor: error
        ? token("tf-error")
        : state.isFocused
          ? token("tf-accent")
          : token("tf-border"),
      boxShadow: state.isFocused
        ? `0 0 0 3px ${error ? "rgb(244 63 94 / .22)" : token("tf-accent-ring")}`
        : "none",
      opacity: state.isDisabled ? 0.6 : 1,
      "&:hover": {
        borderColor: state.isFocused
          ? token("tf-accent")
          : token("tf-border-strong"),
      },
    }),
    valueContainer: (base) => ({ ...base, padding: "0 0.75rem" }),
    menu: (base) => ({
      ...base,
      zIndex: 70,
      overflow: "hidden",
      borderRadius: "var(--tf-r-lg)",
      border: `1px solid ${token("tf-border")}`,
      backgroundColor: token("tf-bg-elevated"),
      boxShadow: token("tf-elev-3"),
    }),
    menuPortal: (base) => ({ ...base, zIndex: 80 }),
    menuList: (base) => ({ ...base, padding: "0.25rem" }),
    option: (base, state) => ({
      ...base,
      fontSize: "13px",
      fontWeight: state.isSelected ? 600 : 500,
      borderRadius: "var(--tf-r-sm)",
      padding: "0.5rem 0.625rem",
      cursor: "pointer",
      color: state.isSelected ? token("tf-fg") : token("tf-fg-secondary"),
      backgroundColor: state.isSelected
        ? token("tf-accent-bg")
        : state.isFocused
          ? token("tf-bg-3")
          : "transparent",
      "&:active": { backgroundColor: token("tf-bg-3") },
    }),
    singleValue: (base) => ({ ...base, fontSize: "13px", color: token("tf-fg") }),
    placeholder: (base) => ({
      ...base,
      fontSize: "13px",
      color: token("tf-fg-subtle"),
    }),
    input: (base) => ({ ...base, color: token("tf-fg") }),
    noOptionsMessage: (base) => ({
      ...base,
      fontSize: "13px",
      color: token("tf-fg-muted"),
    }),
    indicatorSeparator: (base) => ({
      ...base,
      backgroundColor: token("tf-border"),
    }),
    dropdownIndicator: (base) => ({
      ...base,
      color: token("tf-fg-muted"),
      "&:hover": { color: token("tf-fg") },
    }),
    clearIndicator: (base) => ({
      ...base,
      color: token("tf-fg-muted"),
      "&:hover": { color: token("tf-error") },
    }),
  };

  const describedBy = error
    ? `${resolvedInputId}-error`
    : helpText
      ? `${resolvedInputId}-help`
      : undefined;

  return (
    <div>
      {label && (
        <label className="tf-label" htmlFor={resolvedInputId}>
          {label}
          {required && <span className="tf-text-danger"> *</span>}
        </label>
      )}

      <Select
        inputId={resolvedInputId}
        value={selectedOption}
        onChange={handleChange}
        options={options}
        placeholder={placeholder}
        isClearable={isClearable}
        isDisabled={isDisabled}
        styles={styles}
        classNamePrefix="react-select"
        menuPlacement="auto"
        menuPosition="fixed"
        menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
        aria-invalid={error ? true : undefined}
        aria-errormessage={error ? describedBy : undefined}
        aria-describedby={!error ? describedBy : undefined}
      />

      {error ? (
        <p id={describedBy} className="tf-msg-error mt-1.5">
          {error}
        </p>
      ) : helpText ? (
        <p id={describedBy} className="tf-help mt-1.5">
          {helpText}
        </p>
      ) : null}
    </div>
  );
}
