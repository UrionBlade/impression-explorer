/** Abstract three-diamond mark in the Cuebiq palette. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" className={className} role="img" aria-hidden="true">
      <polygon points="14,3 19,8 14,13 9,8" fill="#3d6db5" />
      <polygon points="9,12 14,17 9,22 4,17" fill="#2ac3c4" />
      <polygon points="19,12 24,17 19,22 14,17" fill="#7fa8d9" />
    </svg>
  );
}
