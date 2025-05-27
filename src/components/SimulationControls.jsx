"use client"

const SimulationControls = ({
  algorithm,
  setAlgorithm,
  density,
  setDensity,
  speed,
  setSpeed,
  isRunning,
  setIsRunning,
  simulation,
  onReset,
}) => {
  return (
    <div className="controls">
      <div className="control-group">
        <label className="control-label">Scheduling Algorithm</label>
        <select
          className="select"
          value={algorithm}
          onChange={(e) => setAlgorithm(e.target.value)}
          disabled={isRunning}
        >
          <option value="roundRobin">Round Robin (RR)</option>
          <option value="priorityScheduling">Priority Scheduling (PS)</option>
          <option value="shortestJobNext">Shortest Job Next (SJN)</option>
        </select>
      </div>

      <div className="control-group">
        <label className="control-label">Traffic Density</label>
        <select className="select" value={density} onChange={(e) => setDensity(e.target.value)} disabled={isRunning}>
          <option value="low">Low (Light Traffic)</option>
          <option value="medium">Medium (Normal Traffic)</option>
          <option value="high">High (Heavy Traffic)</option>
        </select>
      </div>

      <div className="control-group">
        <label className="control-label">Simulation Speed: {speed}x</label>
        <input
          type="range"
          className="slider"
          min="0.5"
          max="3"
          step="0.5"
          value={speed}
          onChange={(e) => setSpeed(Number.parseFloat(e.target.value))}
        />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "#666" }}>
          <span>0.5x</span>
          <span>1x</span>
          <span>2x</span>
          <span>3x</span>
        </div>
      </div>

      <div className="button-group">
        <button className="button" onClick={() => setIsRunning(!isRunning)}>
          {isRunning ? "⏸️ Pause" : "▶️ Start"}
        </button>
        <button className="button button-secondary" onClick={onReset}>
          🔄 Reset
        </button>
      </div>

      <div className="simulation-time">
        <div className="time-label">Simulation Time</div>
        <div className="time-value">{simulation.time}s</div>
      </div>
    </div>
  )
}

export default SimulationControls
