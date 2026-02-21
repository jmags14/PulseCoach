type Props = {
  label: string;
  value: string | number;
  highlight?: boolean;
};

export default function MetricCard({ label, value, highlight }: Props) {
  return (
    <div className={`metric-card ${highlight ? "good" : ""}`}>
      <h3>{value}</h3>
      <p>{label}</p>
    </div>
  );
}