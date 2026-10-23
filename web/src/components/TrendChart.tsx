import { EmptyState } from "./EmptyState";
export function TrendChart({
  points,
  demo,
}: {
  points: { date: string; score: number }[];
  demo: boolean;
}) {
  if (!points.length) return <EmptyState title="No health history yet" />;
  const line = points
    .map(
      (p, i) =>
        `${50 + (i / Math.max(1, points.length - 1)) * 680},${190 - p.score * 1.5}`,
    )
    .join(" ");
  return (
    <div className="trend-chart">
      <svg
        viewBox="0 0 760 230"
        role="img"
        aria-labelledby="chart-title chart-desc"
      >
        <title id="chart-title">
          {demo ? "DEMO · " : ""}SEO health over the selected period
        </title>
        <desc id="chart-desc">
          {points.length} daily observations. First score {points[0].score},
          latest score {points.at(-1)?.score}. Scores indicate audit
          completeness, not search rankings.
        </desc>
        <defs>
          <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#839580" stopOpacity=".22" />
            <stop offset="1" stopColor="#839580" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[25, 50, 75, 100].map((n) => (
          <g key={n}>
            <line
              x1="50"
              x2="730"
              y1={190 - n * 1.5}
              y2={190 - n * 1.5}
              stroke="#e9e9e2"
              strokeDasharray="4 5"
            />
            <text x="12" y={195 - n * 1.5} className="chart-label">
              {n}
            </text>
          </g>
        ))}
        <polygon points={`50,190 ${line} 730,190`} fill="url(#area)" />
        <polyline
          points={line}
          fill="none"
          stroke="#657d62"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <circle
          cx="730"
          cy={190 - (points.at(-1)?.score || 0) * 1.5}
          r="5"
          fill="#657d62"
          stroke="white"
          strokeWidth="3"
        />
        <text x="50" y="220" className="chart-label">
          {points[0].date}
        </text>
        <text x="730" y="220" textAnchor="end" className="chart-label">
          {points.at(-1)?.date}
        </text>
      </svg>
      <details>
        <summary>View chart data</summary>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Health score</th>
              </tr>
            </thead>
            <tbody>
              {points.map((p) => (
                <tr key={p.date}>
                  <td>{p.date}</td>
                  <td>{p.score}/100</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
