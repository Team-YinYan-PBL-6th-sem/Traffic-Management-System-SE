"use client"

import { useState, useEffect, useRef } from "react"
import { TrafficSimulation } from "./utils/TrafficSimulation"
import TrafficIntersection from "./components/TrafficIntersection"
import SimulationControls from "./components/SimulationControls"
import PerformanceMetrics from "./components/PerformanceMetrics"
import AlgorithmInfo from "./components/AlgorithmInfo"

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
  }, [isRunning, algorithm, density, speed, simulation])

  const handleReset = () => {
    setIsRunning(false)
    simulation.reset()
    triggerUpdate()
  }

  const handleAlgorithmChange = (newAlgorithm) => {
    if (isRunning) {
      setIsRunning(false)
    }
    setAlgorithm(newAlgorithm)
    simulation.reset()
    triggerUpdate()
  }

  const handleDensityChange = (newDensity) => {
    setDensity(newDensity)
  }

  return (
    <div className="container">
      <div className="header">
        <h1 className="main-title">🚦 Smart Traffic Management Simulation</h1>
        <p className="main-subtitle">CPU Scheduling Algorithms Applied to Traffic Control Systems</p>
      </div>

      <div className="main-grid">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">🏙️ Traffic Intersection</h2>
            <p className="card-description">Real-time 4-way intersection with intelligent traffic control</p>
          </div>

          <TrafficIntersection simulation={simulation} isRunning={isRunning} />

          <div className="signal-timer">
            <div className="timer-info">
              <span>
                🎯 Active Direction: <strong>{simulation.activeDirection.toUpperCase()}</strong>
              </span>
              <span>
                ⏱️ Time Remaining: <strong>{simulation.timeRemaining}s</strong>
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
              <h2 className="card-title">⚙️ Simulation Controls</h2>
              <p className="card-description">Configure and control the traffic simulation</p>
            </div>
            <SimulationControls
              algorithm={algorithm}
              setAlgorithm={handleAlgorithmChange}
              density={density}
              setDensity={handleDensityChange}
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
              <h2 className="card-title">📈 Performance Metrics</h2>
              <p className="card-description">Real-time simulation analytics and statistics</p>
            </div>
            <PerformanceMetrics simulation={simulation} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="footer">
        <p>
          <strong>Traffic Management Simulation</strong> - Demonstrating CPU scheduling algorithms in traffic control
        </p>
        <p style={{ marginTop: "5px" }}>
          Built with React.js | Algorithms: Round Robin, Priority Scheduling, Shortest Job Next
        </p>
      </div>
    </div>
  )
}

export default App
