"use client"

import React from "react"

const { useState, useEffect, useRef } = React

// Traffic Simulation Engine
class TrafficSimulation {
  constructor() {
    this.reset()
  }

  reset() {
    this.time = 0
    this.activeDirection = "north"
    this.timeRemaining = 10
    this.timeSlice = 10
    this.vehicles = {
      north: [],
      south: [],
      east: [],
      west: [],
    }
    this.processedVehicles = {
      north: 0,
      south: 0,
      east: 0,
      west: 0,
    }
    this.metrics = {
      avgWaitingTime: 0,
      maxWaitingTime: 0,
      throughput: 0,
      emergencyDelay: 0,
    }
    this.crossingVehicles = []
    this.waitingTimes = []
    this.emergencyWaitingTimes = []
  }

  generateVehicle(direction) {
    const isEmergency = Math.random() < 0.1 // 10% chance of emergency vehicle
    return {
      id: `${direction}-${Date.now()}-${Math.random()}`,
      type: isEmergency ? "emergency" : "regular",
      arrivalTime: this.time,
      crossingTime: Math.floor(Math.random() * 3) + 2, // 2-4 seconds
      waitingTime: 0,
    }
  }

  addVehicles(density) {
    const densityFactor = density === "low" ? 0.3 : density === "medium" ? 0.6 : 0.9
    ;["north", "south", "east", "west"].forEach((direction) => {
      if (Math.random() < densityFactor * 0.3) {
        // Adjust spawn rate
        this.vehicles[direction].push(this.generateVehicle(direction))
      }
    })
  }

  processVehicles() {
    // Update waiting times for all vehicles
    ;["north", "south", "east", "west"].forEach((direction) => {
      this.vehicles[direction].forEach((vehicle) => {
        vehicle.waitingTime = this.time - vehicle.arrivalTime
      })
    })

    // Process vehicles from active direction
    if (this.vehicles[this.activeDirection].length > 0) {
      const vehicle = this.vehicles[this.activeDirection].shift()

      // Add to crossing vehicles for animation
      this.crossingVehicles.push({
        ...vehicle,
        direction: this.activeDirection,
        crossingStartTime: this.time,
      })

      // Update metrics
      this.processedVehicles[this.activeDirection]++
      this.waitingTimes.push(vehicle.waitingTime)

      if (vehicle.type === "emergency") {
        this.emergencyWaitingTimes.push(vehicle.waitingTime)
      }

      // Remove crossing vehicles after they finish crossing
      setTimeout(() => {
        this.crossingVehicles = this.crossingVehicles.filter((v) => v.id !== vehicle.id)
      }, vehicle.crossingTime * 1000)
    }
  }

  updateMetrics() {
    if (this.waitingTimes.length > 0) {
      this.metrics.avgWaitingTime = this.waitingTimes.reduce((a, b) => a + b, 0) / this.waitingTimes.length
      this.metrics.maxWaitingTime = Math.max(...this.waitingTimes)
    }

    if (this.emergencyWaitingTimes.length > 0) {
      this.metrics.emergencyDelay =
        this.emergencyWaitingTimes.reduce((a, b) => a + b, 0) / this.emergencyWaitingTimes.length
    }

    const totalProcessed = Object.values(this.processedVehicles).reduce((a, b) => a + b, 0)
    this.metrics.throughput = this.time > 0 ? (totalProcessed / this.time) * 60 : 0 // vehicles per minute
  }

  getNextDirection(algorithm) {
    const directions = ["north", "east", "south", "west"]

    switch (algorithm) {
      case "roundRobin":
        const currentIndex = directions.indexOf(this.activeDirection)
        return directions[(currentIndex + 1) % directions.length]

      case "priorityScheduling":
        // Find direction with emergency vehicles first
        for (const direction of directions) {
          if (this.vehicles[direction].some((v) => v.type === "emergency")) {
            return direction
          }
        }
        // If no emergency vehicles, find direction with most vehicles
        return directions.reduce((max, dir) => (this.vehicles[dir].length > this.vehicles[max].length ? dir : max))

      case "shortestJobNext":
        // Find direction with shortest total crossing time
        return directions.reduce((shortest, dir) => {
          const totalTime = this.vehicles[dir].reduce((sum, v) => sum + v.crossingTime, 0)
          const shortestTime = this.vehicles[shortest].reduce((sum, v) => sum + v.crossingTime, 0)
          return totalTime < shortestTime && this.vehicles[dir].length > 0 ? dir : shortest
        })

      default:
        return this.activeDirection
    }
  }

  step(algorithm, density) {
    this.time++
    this.addVehicles(density)

    // Decrement time remaining
    this.timeRemaining--

    // Process vehicles if there's time remaining and vehicles in queue
    if (this.timeRemaining > 0 && this.vehicles[this.activeDirection].length > 0) {
      this.processVehicles()
    }

    // Switch direction when time slice is up or no vehicles in current direction
    if (this.timeRemaining <= 0 || this.vehicles[this.activeDirection].length === 0) {
      this.activeDirection = this.getNextDirection(algorithm)
      this.timeRemaining = this.timeSlice
    }

    this.updateMetrics()
  }
}

// Vehicle Component
function Vehicle({ vehicle, direction, isMoving }) {
  const isVertical = direction === "north" || direction === "south"
  const vehicleClass = `vehicle ${isVertical ? "vehicle-vertical" : "vehicle-horizontal"} ${
    vehicle.type === "emergency" ? "vehicle-emergency" : "vehicle-regular"
  } ${isMoving ? "vehicle-crossing" : ""}`

  const style = isMoving
    ? {
        left: direction === "north" || direction === "south" ? "50%" : direction === "east" ? "33.33%" : "66.66%",
        top: direction === "east" || direction === "west" ? "50%" : direction === "north" ? "66.66%" : "33.33%",
        transform: "translate(-50%, -50%)",
        animation: `move${direction.charAt(0).toUpperCase() + direction.slice(1)}To${
          direction === "north" ? "South" : direction === "south" ? "North" : direction === "east" ? "West" : "East"
        } ${vehicle.crossingTime}s linear forwards`,
      }
    : {}

  return (
    <div className={vehicleClass} style={style} title={`${vehicle.type} vehicle - Wait: ${vehicle.waitingTime}s`}>
      {vehicle.type === "emergency" ? "🚑" : "🚗"}
    </div>
  )
}

// Traffic Intersection Component
function TrafficIntersection({ simulation, isRunning }) {
  return (
    <div className="intersection-container">
      {/* Roads */}
      <div className="road road-north"></div>
      <div className="road road-south"></div>
      <div className="road road-east"></div>
      <div className="road road-west"></div>

      {/* Intersection */}
      <div className="intersection"></div>

      {/* Traffic Lights */}
      <div
        className={`traffic-light light-north ${simulation.activeDirection === "north" ? "light-green" : "light-red"}`}
      >
        {simulation.activeDirection === "north" ? simulation.timeRemaining : ""}
      </div>
      <div
        className={`traffic-light light-south ${simulation.activeDirection === "south" ? "light-green" : "light-red"}`}
      >
        {simulation.activeDirection === "south" ? simulation.timeRemaining : ""}
      </div>
      <div
        className={`traffic-light light-east ${simulation.activeDirection === "east" ? "light-green" : "light-red"}`}
      >
        {simulation.activeDirection === "east" ? simulation.timeRemaining : ""}
      </div>
      <div
        className={`traffic-light light-west ${simulation.activeDirection === "west" ? "light-green" : "light-red"}`}
      >
        {simulation.activeDirection === "west" ? simulation.timeRemaining : ""}
      </div>

      {/* Vehicle Queues */}
      <div className="vehicle-queue queue-north">
        {simulation.vehicles.north.map((vehicle, index) => (
          <Vehicle key={vehicle.id} vehicle={vehicle} direction="north" isMoving={false} />
        ))}
      </div>
      <div className="vehicle-queue queue-south">
        {simulation.vehicles.south.map((vehicle, index) => (
          <Vehicle key={vehicle.id} vehicle={vehicle} direction="south" isMoving={false} />
        ))}
      </div>
      <div className="vehicle-queue queue-east">
        {simulation.vehicles.east.map((vehicle, index) => (
          <Vehicle key={vehicle.id} vehicle={vehicle} direction="east" isMoving={false} />
        ))}
      </div>
      <div className="vehicle-queue queue-west">
        {simulation.vehicles.west.map((vehicle, index) => (
          <Vehicle key={vehicle.id} vehicle={vehicle} direction="west" isMoving={false} />
        ))}
      </div>

      {/* Crossing Vehicles */}
      {simulation.crossingVehicles.map((vehicle) => (
        <Vehicle key={`crossing-${vehicle.id}`} vehicle={vehicle} direction={vehicle.direction} isMoving={true} />
      ))}

      {/* Direction Labels */}
      <div className="direction-label label-north">North</div>
      <div className="direction-label label-south">South</div>
      <div className="direction-label label-east">East</div>
      <div className="direction-label label-west">West</div>

      {/* Legend */}
      <div className="legend">
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: "#3b82f6" }}></div>
          <span>Regular</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: "#ef4444" }}></div>
          <span>Emergency</span>
        </div>
      </div>
    </div>
  )
}

// Simulation Controls Component
function SimulationControls({
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
}) {
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
          <option value="roundRobin">Round Robin</option>
          <option value="priorityScheduling">Priority Scheduling</option>
          <option value="shortestJobNext">Shortest Job Next</option>
        </select>
      </div>

      <div className="control-group">
        <label className="control-label">Traffic Density</label>
        <select className="select" value={density} onChange={(e) => setDensity(e.target.value)} disabled={isRunning}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      <div className="control-group">
        <label className="control-label">Speed: {speed}x</label>
        <input
          type="range"
          className="slider"
          min="0.5"
          max="3"
          step="0.5"
          value={speed}
          onChange={(e) => setSpeed(Number.parseFloat(e.target.value))}
        />
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

// Performance Metrics Component
function PerformanceMetrics({ simulation }) {
  const totalVehicles = Object.values(simulation.vehicles).reduce((sum, queue) => sum + queue.length, 0)
  const totalProcessed = Object.values(simulation.processedVehicles).reduce((sum, count) => sum + count, 0)
  const emergencyCount = Object.values(simulation.vehicles).reduce(
    (sum, queue) => sum + queue.filter((v) => v.type === "emergency").length,
    0,
  )

  return (
    <div>
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Avg. Waiting Time</div>
          <div className="metric-value">{simulation.metrics.avgWaitingTime.toFixed(1)}s</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Max Waiting Time</div>
          <div className="metric-value">{simulation.metrics.maxWaitingTime.toFixed(1)}s</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Throughput</div>
          <div className="metric-value">{simulation.metrics.throughput.toFixed(1)}/min</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Emergency Delay</div>
          <div className="metric-value">{simulation.metrics.emergencyDelay.toFixed(1)}s</div>
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

      <div style={{ marginTop: "15px", textAlign: "center" }}>
        <div style={{ fontSize: "0.9rem", color: "#666" }}>
          Emergency Vehicles in Queue: <strong style={{ color: "#ef4444" }}>{emergencyCount}</strong>
        </div>
        <div style={{ fontSize: "0.9rem", color: "#666", marginTop: "5px" }}>
          Total Processed: <strong>{totalProcessed}</strong>
        </div>
      </div>
    </div>
  )
}

// Algorithm Information Component
function AlgorithmInfo({ algorithm }) {
  const algorithmData = {
    roundRobin: {
      title: "Round Robin (RR)",
      description:
        "Allocates equal time slices to each direction in a cyclic order, ensuring fairness. Each direction gets 10 seconds unless there are no vehicles waiting.",
    },
    priorityScheduling: {
      title: "Priority Scheduling (PS)",
      description:
        "Prioritizes directions with emergency vehicles first, then directions with the most vehicles. Ensures emergency vehicles get immediate attention.",
    },
    shortestJobNext: {
      title: "Shortest Job Next (SJN)",
      description:
        "Selects the direction with the shortest total crossing time to minimize overall waiting time. Efficient for reducing congestion.",
    },
  }

  const info = algorithmData[algorithm]

  return (
    <div className="algorithm-info">
      <div className="algorithm-title">{info.title}</div>
      <div className="algorithm-description">{info.description}</div>
    </div>
  )
}

// Main App Component
function App() {
  const [simulation] = useState(new TrafficSimulation())
  const [algorithm, setAlgorithm] = useState("roundRobin")
  const [density, setDensity] = useState("medium")
  const [speed, setSpeed] = useState(1)
  const [isRunning, setIsRunning] = useState(false)
  const [, forceUpdate] = useState({})

  const intervalRef = useRef(null)

  // Force component re-render
  const triggerUpdate = () => forceUpdate({})

  // Simulation loop
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        simulation.step(algorithm, density)
        triggerUpdate()
      }, 1000 / speed)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, algorithm, density, speed])

  const handleReset = () => {
    setIsRunning(false)
    simulation.reset()
    triggerUpdate()
  }

  return (
    <div className="container">
      <div className="header">
        <h1 className="card-title" style={{ fontSize: "2.5rem", marginBottom: "10px" }}>
          Smart Traffic Management Simulation
        </h1>
        <p className="card-description" style={{ fontSize: "1.1rem" }}>
          CPU Scheduling Algorithms Applied to Traffic Control
        </p>
      </div>

      <div className="main-grid">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Traffic Intersection</h2>
            <p className="card-description">4-way intersection with real-time vehicle simulation</p>
          </div>
          <TrafficIntersection simulation={simulation} isRunning={isRunning} />

          <div className="signal-timer">
            <div className="timer-info">
              <span>
                Active Direction: <strong>{simulation.activeDirection.toUpperCase()}</strong>
              </span>
              <span>
                Time Remaining: <strong>{simulation.timeRemaining}s</strong>
              </span>
            </div>
            <div className="timer-bar">
              <div
                className="timer-progress"
                style={{ width: `${(simulation.timeRemaining / simulation.timeSlice) * 100}%` }}
              ></div>
            </div>
          </div>

          <AlgorithmInfo algorithm={algorithm} />
        </div>

        <div>
          <div className="card" style={{ marginBottom: "20px" }}>
            <div className="card-header">
              <h2 className="card-title">Simulation Controls</h2>
              <p className="card-description">Configure and control the simulation</p>
            </div>
            <SimulationControls
              algorithm={algorithm}
              setAlgorithm={setAlgorithm}
              density={density}
              setDensity={setDensity}
              speed={speed}
              setSpeed={setSpeed}
              isRunning={isRunning}
              setIsRunning={setIsRunning}
              simulation={simulation}
              onReset={handleReset}
            />
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Performance Metrics</h2>
              <p className="card-description">Real-time simulation statistics</p>
            </div>
            <PerformanceMetrics simulation={simulation} />
          </div>
        </div>
      </div>
    </div>
  )
}

// Render the app
const root = ReactDOM.createRoot(document.getElementById("root"))
root.render(<App />)
