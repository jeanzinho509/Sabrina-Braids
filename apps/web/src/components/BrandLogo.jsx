export default function BrandLogo({ compact = false, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <img
        src="/brand/sabrina-braids.svg"
        alt="Sabrina Braids"
        width={compact ? 44 : 80}
        height={compact ? 44 : 80}
        className={`shrink-0 rounded-full bg-white object-contain ${compact ? "h-11 w-11" : "h-16 w-16 sm:h-20 sm:w-20"}`}
      />
      <span
        aria-hidden="true"
        className={`font-semibold tracking-tight ${compact ? "text-lg" : "text-xl sm:text-2xl"}`}
      >
        Sabrina Braids
      </span>
    </span>
  );
}
