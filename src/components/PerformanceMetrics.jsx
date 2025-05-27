const PerformanceMetrics = ({ simulation }) => {
  const stats = simulation.getStatistics()

  return (
    <div>
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Avg. Waiting Time</div>
          <div className="metric-value">{stats.avgWaitingTime.toFixed(1)}s</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Max Waiting Time</div>
          <div className="metric-value">{stats.maxWaitingTime.toFixed(1)}s</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Throughput</div>
          <div className="metric-value">{stats.throughput.toFixed(1)}/min</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Emergency Delay</div>
          <div className="metric-value">{stats.emergencyDelay.toFixed(1)}s</div>
        </div>
      </div>

      <div className="queue-info">
        <div className="queue-card">
          <div className="queue-label">North Queue</div>
          <div className="queue-count">{simulation.vehicles.north.length}</div>
          <div className="queue-processed">Processed: {simulation.processedVehicles.north}</div>
        </div>
        <div className="queue-card">
          <div className="queue-label">South Queue</div>
          <div className="queue-count">{simulation.vehicles.south.length}</div>
          <div className="queue-processed">Processed: {simulation.processedVehicles.south}</div>
        </div>
        <div className="queue-card">
          <div className="queue-label">East Queue</div>
          <div className="queue-count">{simulation.vehicles.east.length}</div>
          <div className="queue-processed">Processed: {simulation.processedVehicles.east}</div>
        </div>
        <div className="queue-card">
          <div className="queue-label">West Queue</div>
          <div className="queue-count">{simulation.vehicles.west.length}</div>
          <div className="queue-processed">Processed: {simulation.processedVehicles.west}</div>
        </div>
      </div>

      <div style={{ marginTop: "20px", padding: "15px", background: "#f8fafc", borderRadius: "8px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", fontSize: "0.9rem" }}>
          <div>
            <strong>Emergency Vehicles:</strong>
            <span style={{ color: "#ef4444", marginLeft: "5px" }}>{stats.emergencyCount}</span>
          </div>
          <div>
            <strong>Total Processed:</strong>
            <span style={{ color: "#22c55e", marginLeft: "5px" }}>{stats.totalProcessed}</span>
          </div>
          <div>
            <strong>Total Generated:</strong>
            <span style={{ marginLeft: "5px" }}>{stats.totalGenerated}</span>
          </div>
          <div>
            <strong>Efficiency:</strong>
            <span style={{ color: "#3b82f6", marginLeft: "5px" }}>{stats.efficiency.toFixed(1)}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PerformanceMetrics
