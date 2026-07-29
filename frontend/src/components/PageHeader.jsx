/*
 * The standard top of every page: breadcrumb, title, optional subtitle,
 * primary action, and an optional row for filters and search.
 *
 * `action`/`actionLabel` are kept because most pages already call it that
 * way. `children` is the escape hatch for headers needing more than one
 * control, and `toolbar` holds filters/search, so no page has to hand-roll
 * its own header markup again.
 */
function PageHeader({
  breadcrumb,
  title,
  subtitle,
  action,
  actionLabel,
  actionIcon,
  children,
  toolbar,
}) {
  return (
    <header className="mb-6 sm:mb-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          {breadcrumb && (
            <div className="tf-caption mb-1.5 flex items-center gap-2 font-medium">
              {breadcrumb}
            </div>
          )}

          <h1 className="tf-title-page break-anywhere">{title}</h1>

          {subtitle && <p className="tf-body mt-1 max-w-2xl">{subtitle}</p>}
        </div>

        {(children || (action && actionLabel)) && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {children}

            {action && actionLabel && (
              <button
                type="button"
                onClick={action}
                className="tf-btn-base tf-btn-primary"
              >
                {actionIcon}
                {actionLabel}
              </button>
            )}
          </div>
        )}
      </div>

      {toolbar && (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          {toolbar}
        </div>
      )}
    </header>
  );
}

export default PageHeader;
