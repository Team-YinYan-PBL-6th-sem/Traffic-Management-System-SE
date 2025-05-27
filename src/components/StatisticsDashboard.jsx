"use client"

import React from "react"

// Statistics Dashboard Component
function StatisticsDashboard({ simulationHistory, currentSimulation }) {
  const { useState } = React
  const [showComparison, setShowComparison] = useState(false)

  const calculateAverageMetrics = (algorithm) => {
    const algorithmRuns = simulationHistory.filter((run) => run.algorithm === algorithm)
    if (algorithmRuns.length === 0) return null

    const totals = algorithmRuns.reduce(
      (acc, run) => ({
        avgWaitingTime: acc.avgWaitingTime + run.metrics.avgWaitingTime,
        throughput: acc.throughput + run.metrics.throughput,
        emergencyDelay: acc.emergencyDelay + run.metrics.emergencyDelay,
      }),
      { avgWaitingTime: 0, throughput: 0, emergencyDelay: 0 },
    )

    return {
      avgWaitingTime: totals.avgWaitingTime / algorithmRuns.length,
      throughput: totals.throughput / algorithmRuns.length,
      emergencyDelay: totals.emergencyDelay / algorithmRuns.length,
      runs: algorithmRuns.length,
    }
  }

  const algorithms = ["roundRobin", "priorityScheduling", "shortestJobNext"]
  const algorithmNames = {
    roundRobin: "Round Robin",
    priorityScheduling: "Priority Scheduling",
    shortestJobNext: "Shortest Job Next",
  }

  return (
    <div className="stats-container">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">📊 Statistics Dashboard</h2>
          <p className="card-description">Performance analysis and algorithm comparison</p>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <button className="button" onClick={() => setShowComparison(!showComparison)} style={{ marginRight: "10px" }}>
            {showComparison ? "📈 Show Current Stats" : "📊 Show Comparison"}
          </button>
        </div>

        {!showComparison ? (
          <div>
            <h3 style={{ marginBottom: "15px", color: "#1f2937" }}>Current Simulation Statistics</h3>
            <div className="stats-grid">
              <div className="metric-card">
                <div className="metric-label">Total Vehicles Generated</div>
                <div className="metric-value">{currentSimulation.getStatistics().totalGenerated}</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Vehicles Processed</div>
                <div className="metric-value">{currentSimulation.getStatistics().totalProcessed}</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">System Efficiency</div>
                <div className="metric-value">{currentSimulation.getStatistics().efficiency.toFixed(1)}%</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Emergency Vehicles</div>
                <div className="metric-value" style={{ color: "#ef4444" }}>
                  {currentSimulation.getStatistics().emergencyCount}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <h3 style={{ marginBottom: "15px", color: "#1f2937" }}>Algorithm Performance Comparison</h3>
            {simulationHistory.length > 0 ? (
              <table className="comparison-table">
                <thead>
                  <tr>
                    <th>Algorithm</th>
                    <th>Runs</th>
                    <th>Avg Wait Time</th>
                    <th>Throughput</th>
                    <th>Emergency Delay</th>
                    <th>Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {algorithms.map((algorithm) => {
                    const metrics = calculateAverageMetrics(algorithm)
                    if (!metrics) return null

                    // Simple rating calculation (lower wait time + higher throughput = better)
                    const rating = Math.max(1, Math.min(5, 5 - metrics.avgWaitingTime / 20 + metrics.throughput / 10))

                    return (
                      <tr key={algorithm}>
                        <td>
                          <strong>{algorithmNames[algorithm]}</strong>
                        </td>
                        <td>{metrics.runs}</td>
                        <td>{metrics.avgWaitingTime.toFixed(1)}s</td>
                        <td>{metrics.throughput.toFixed(1)}/min</td>
                        <td>{metrics.emergencyDelay.toFixed(1)}s</td>
                        <td>
                          <span style={{ color: rating >= 4 ? "#22c55e" : rating >= 3 ? "#f59e0b" : "#ef4444" }}>
                            {"★".repeat(Math.round(rating))}
                            {"☆".repeat(5 - Math.round(rating))}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            ) : (
              <div style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>
                <p>No simulation data available yet.</p>
                <p>Run simulations with different algorithms to see comparison data.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Make it globally available
window.StatisticsDashboard = StatisticsDashboard
