import { Dialog, DialogPanel, DialogTitle, Transition } from "@headlessui/react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { easeOutFast, springSoft } from "./ui3d/motionTokens";

/*
 * Every dialog in the app renders through this, so entrance, backdrop,
 * elevation and geometry are defined once.
 *
 * The shell is Headless UI's Dialog rather than a hand-rolled overlay.
 * That is what supplies the accessibility behaviour the previous version
 * was missing: focus is trapped inside the panel, focus returns to the
 * element that opened it on close, Escape closes, the rest of the page is
 * marked inert for screen readers, and body scroll is locked without
 * mutating document.body.style by hand.
 *
 * `static` hands open/close control to AnimatePresence so the exit
 * animation still plays.
 */

const sizes = {
  sm: "md:max-w-sm",
  md: "md:max-w-md",
  lg: "md:max-w-2xl",
  xl: "md:max-w-4xl",
};

function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  wide,
  maxWidth,
}) {
  // `wide` predates the size prop and is still used by several callers.
  // `maxWidth` was also used by notification settings, so keep that alias
  // functional instead of silently falling back to the medium dialog.
  const panelMaxWidth = sizes[wide ? "lg" : (maxWidth || size)] || sizes.md;

  return (
    <AnimatePresence>
      {open && (
        <Transition show={open}>
          <Dialog static open={open} onClose={onClose} className="relative z-50">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={easeOutFast}
              aria-hidden="true"
              className="fixed inset-0 bg-stone-950/55 backdrop-blur-sm"
            />

            <div className="fixed inset-0 flex items-center justify-center p-4">
              <DialogPanel
                as={motion.div}
                initial={{ opacity: 0, scale: 0.96, y: 24 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: 12 }}
                transition={springSoft}
                className={`tf-card-elevated relative flex max-h-[88dvh] w-full flex-col overflow-hidden rounded-[var(--tf-r-xl)] ${panelMaxWidth}`}
              >
                <div className="tf-bd flex shrink-0 items-start justify-between gap-3 border-b px-4 py-4 sm:px-6 sm:py-5">
                  <div className="min-w-0">
                    <DialogTitle className="tf-title-card break-anywhere sm:text-[16px]">
                      {title}
                    </DialogTitle>

                    {description && (
                      <p className="tf-body-sm tf-text-muted mt-1">{description}</p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close dialog"
                    className="tf-btn-icon tf-size-sm -mr-1 shrink-0"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
                  {children}
                </div>

                {footer && (
                  <div className="tf-bd tf-bg-2 flex shrink-0 flex-wrap items-center justify-end gap-2 border-t px-4 py-3 sm:px-6">
                    {footer}
                  </div>
                )}
              </DialogPanel>
            </div>
          </Dialog>
        </Transition>
      )}
    </AnimatePresence>
  );
}

export default Modal;
