import { Menu, Transition } from "@headlessui/react";
import { Fragment } from "react";

export default function AppDropdown({ trigger, children, align = "right", direction = "down", className = "", containerClassName = "", positionClass = "absolute", showBackdropOnMobile = false }) {
  return (
    <Menu as="div" className={`relative inline-block text-left ${containerClassName}`}>
      {({ open }) => (
        <>
          {showBackdropOnMobile && open && (
            <div
              className="fixed inset-0 z-40 bg-slate-950/20 backdrop-blur-[1px] transition-opacity duration-300 sm:hidden"
              aria-hidden="true"
            />
          )}
          <Menu.Button as="div" className={`focus:outline-none cursor-pointer ${containerClassName}`}>
            {typeof trigger === 'function' ? trigger({ open }) : trigger}
          </Menu.Button>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items
              className={`${positionClass} z-50 w-56 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white p-1.5 shadow-lg ring-1 ring-black/5 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:ring-white/10 ${
                align === "right" ? "right-0" : align === "left" ? "left-0" : "-left-1/2 translate-x-1/4"
              } ${direction === "up" ? "bottom-full mb-2 origin-bottom" : "top-full mt-2 origin-top"} ${className}`}
            >
              {children}
            </Menu.Items>
          </Transition>
        </>
      )}
    </Menu>
  );
}

AppDropdown.Item = function AppDropdownItem({ children, onClick, className = "", disabled = false }) {
  return (
    <Menu.Item disabled={disabled}>
      {({ active, disabled: isDisabled }) => (
        <button
          onClick={onClick}
          disabled={isDisabled}
          className={`${
            active && !isDisabled ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white" : "text-slate-700 dark:text-slate-300"
          } ${
            isDisabled ? "opacity-50 cursor-not-allowed text-slate-400 dark:text-slate-600" : ""
          } group flex w-full items-center rounded-xl px-3 py-2 text-[13px] font-medium transition-colors ${className}`}
        >
          {children}
        </button>
      )}
    </Menu.Item>
  );
};
