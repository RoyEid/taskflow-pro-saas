/* The one panel primitive. Everything that should read as a floating
   object — cards, sidebars, modals, dropdowns, empty states — composes
   this so elevation and edge treatment stay identical app-wide.

   `glass` costs a compositing layer, so pass glass={false} for anything
   repeated in a long list. */
function Surface({
  as: Tag = "div",
  elevation = 2,
  glass = true,
  hairline = true,
  lift = false,
  sheen = false,
  rounded = "rounded-2xl",
  className = "",
  children,
  ...rest
}) {
  const classes = [
    glass ? "tf-surface" : "tf-surface-solid",
    glass ? `tf-elev-${elevation}` : "",
    hairline ? "tf-hairline" : "",
    lift ? "tf-lift" : "",
    sheen ? "tf-sheen" : "",
    rounded,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Tag className={classes} {...rest}>
      {children}
    </Tag>
  );
}

export default Surface;
