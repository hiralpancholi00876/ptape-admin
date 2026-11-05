// Counts open overlays so a dialog closing on top of a drawer doesn't unlock the page beneath.
let locks = 0

export function lockBodyScroll() {
  if (locks++ === 0) document.body.style.overflow = 'hidden'
  return () => {
    if (--locks === 0) document.body.style.overflow = ''
  }
}
