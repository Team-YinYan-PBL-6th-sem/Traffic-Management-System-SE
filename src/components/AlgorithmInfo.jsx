const AlgorithmInfo = ({ algorithm }) => {
  const algorithmData = {
    roundRobin: {
      title: "Round Robin (RR)",
      description:
        "Allocates equal time slices to each direction in a cyclic order, ensuring fairness. Each direction gets 10 seconds unless there are no vehicles waiting. This algorithm provides predictable timing but may not be optimal for varying traffic loads.",
      advantages: ["Fair distribution", "Predictable timing", "No starvation"],
      disadvantages: ["May not optimize for traffic density", "Fixed time slices"],
    },
    priorityScheduling: {
      title: "Priority Scheduling (PS)",
      description:
        "Prioritizes directions with emergency vehicles first, then directions with the most vehicles. This ensures emergency vehicles get immediate attention while managing regular traffic efficiently.",
      advantages: ["Emergency vehicle priority", "Adapts to traffic density", "Efficient for urgent situations"],
      disadvantages: ["Possible starvation of low-priority directions", "Complex decision making"],
    },
    shortestJobNext: {
      title: "Shortest Job Next (SJN)",
      description:
        "Selects the direction with the shortest total crossing time to minimize overall waiting time. This algorithm is efficient for reducing congestion but requires knowledge of crossing times.",
      advantages: ["Minimizes total waiting time", "Efficient throughput", "Optimal for known job times"],
      disadvantages: ["May cause starvation", "Requires crossing time prediction"],
    },
  }

  const info = algorithmData[algorithm]

  return (
    <div className="algorithm-info">
      <div className="algorithm-title">{info.title}</div>
      <div className="algorithm-description">{info.description}</div>

      <div style={{ marginTop: "15px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
        <div>
          <h4 style={{ color: "#22c55e", marginBottom: "8px", fontSize: "0.9rem" }}>✅ Advantages:</h4>
          <ul style={{ fontSize: "0.8rem", paddingLeft: "15px" }}>
            {info.advantages.map((advantage, index) => (
              <li key={index} style={{ marginBottom: "3px" }}>
                {advantage}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 style={{ color: "#ef4444", marginBottom: "8px", fontSize: "0.9rem" }}>⚠️ Disadvantages:</h4>
          <ul style={{ fontSize: "0.8rem", paddingLeft: "15px" }}>
            {info.disadvantages.map((disadvantage, index) => (
              <li key={index} style={{ marginBottom: "3px" }}>
                {disadvantage}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default AlgorithmInfo
