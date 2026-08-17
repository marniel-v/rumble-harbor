import PulseMark from "@/components/PulseMark";

/**
 * The signal marker: micro pulse + technical label.
 * `label` carries the weight, `meta` qualifies it, `status` is the live bit
 * and is the only part that ever takes coral.
 */
export default function SignalMarker({
  icon = true,
  label,
  meta,
  status,
  className = "",
}) {
  return (
    <p className={`marker ${className}`}>
      {icon && <PulseMark size={8} className="marker__mark" />}
      <span className="marker__label">{label}</span>
      {meta && (
        <>
          <span className="marker__rule">/</span>
          <span className="marker__meta">{meta}</span>
        </>
      )}
      {status && (
        <>
          <span className="marker__rule">/</span>
          <span className="marker__status">{status}</span>
        </>
      )}
    </p>
  );
}
