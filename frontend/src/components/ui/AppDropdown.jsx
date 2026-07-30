import { Fragment } from "react";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";

/*
 * Shared floating layer for every anchored overlay in the app.
 *
 * Previously this positioned the panel with plain CSS (`absolute top-full
 * right-0`). That silently breaks whenever an ancestor establishes a new
 * containing block or clipping context - `overflow-hidden`, `transform`,
 * `filter`, `backdrop-filter` or `contain`. The glass surfaces (`tf-surface`
 * uses `backdrop-filter`) and the motion wrappers do exactly that, which is
 * why menus rendered detached from their triggers.
 *
 * Headless UI v2 wraps Floating UI, so `anchor` + `portal` gives us real
 * anchoring, viewport collision detection (flip/shift) and reposition on
 * scroll/resize, with the panel rendered at the document root where no
 * ancestor can clip or re-origin it.
 */

const resolvePlacement = (direction, align) => {
  const side = direction === "up" ? "top" : "bottom";

  // Omitting the alignment token centres the panel on the trigger.
  if (align === "center") return side;

  return `${side} ${align === "left" ? "start" : "end"}`;
};

export default function AppDropdown({
  trigger,
  children,
  align = "right",
  direction = "down",
  className = "",
  containerClassName = "",
  widthClass = "w-56",
  gap = 8,
  /** Minimum distance the panel keeps from the viewport edge. */
  padding = 8,
}) {
  return (
    <Menu as="div" className={`relative inline-block text-left ${containerClassName}`}>
      {({ open, close }) => (
        <>
          <MenuButton as={Fragment}>
            {typeof trigger === "function" ? trigger({ open }) : trigger}
          </MenuButton>

          <MenuItems
            portal
            transition
            anchor={{ to: resolvePlacement(direction, align), gap, padding }}
            /*
             * `--anchor-max-height` is computed by Floating UI from the space
             * actually available, so the panel can never run off screen.
             */
            className={`tf-menu z-[70] ${widthClass} max-w-[calc(100vw-1rem)] max-h-[var(--anchor-max-height,80vh)] overflow-y-auto overscroll-contain focus:outline-none transition duration-100 ease-out data-[closed]:opacity-0 data-[closed]:scale-95 data-[leave]:duration-75 data-[leave]:ease-in ${className}`}
          >
            {typeof children === "function" ? children({ open, close }) : children}
          </MenuItems>
        </>
      )}
    </Menu>
  );
}

/*
 * Menu rows share `.tf-menu-item` with the notification panel and the
 * profile menu, so hover, focus and disabled look identical wherever a
 * floating panel appears. Headless UI sets data-focus on the row it has
 * moved keyboard focus to, and the class styles that state directly.
 */
AppDropdown.Item = function AppDropdownItem({
  children,
  onClick,
  className = "",
  disabled = false,
  danger = false,
}) {
  return (
    <MenuItem disabled={disabled}>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`tf-menu-item ${danger ? "tf-menu-item-danger" : ""} ${className}`}
      >
        {children}
      </button>
    </MenuItem>
  );
};

AppDropdown.Label = function AppDropdownLabel({ children }) {
  return <p className="tf-menu-label">{children}</p>;
};

AppDropdown.Separator = function AppDropdownSeparator() {
  return <div className="tf-menu-separator" role="separator" />;
};
