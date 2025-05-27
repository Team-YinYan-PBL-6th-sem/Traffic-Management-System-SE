"use client"

import { useState, useEffect, useRef } from "react"

// Traffic Simulation Engine
class TrafficSimulation {
  constructor(algorithmType = "roundRobin") {
    this.algorithmType = algorithmType
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
      avgTurnaroundTime: 0,
      avgResponseTime: 0,
      utilization: 0,
    }
    this.crossingVehicles = []
    this.waitingTimes = []
    this.emergencyWaitingTimes = []
    this.turnaroundTimes = []
    this.responseTimes = []
    this.totalVehiclesGenerated = 0
    this.lastRoundRobinDirection = "west"
    this.realtimeMetrics = []
    this.directionSwitches = 0
    this.totalIdleTime = 0
    this.vehicleIdCounter = 0
  }

  generateVehicle(direction) {
    const isEmergency = Math.random() < 0.08
    const vehicle = {
      id: `${this.algorithmType}-${direction}-${this.vehicleIdCounter++}-${Date.now()}`,
      type: isEmergency ? "emergency" : "regular",
      arrivalTime: this.time,
      crossingTime: Math.floor(Math.random() * 3) + 2,
      waitingTime: 0,
      priority: isEmergency ? 1 : 2,
      startServiceTime: null,
      completionTime: null,
    }
    this.totalVehiclesGenerated++
    return vehicle
  }

  addVehicles(density) {
    const densityFactors = { low: 0.25, medium: 0.45, high: 0.7 }
    const densityFactor = densityFactors[density] || 0.45
    const directions = ["north", "south", "east", "west"]

    directions.forEach((direction) => {
      const spawnChance = densityFactor * (0.8 + Math.random() * 0.4)
      if (Math.random() < spawnChance * 0.3) {
        this.vehicles[direction].push(this.generateVehicle(direction))
      }
      if (this.vehicles[direction].length > 15) {
        this.vehicles[direction] = this.vehicles[direction].slice(0, 15)
      }
    })
  }

  processVehicles() {
    const directions = ["north", "south", "east", "west"]
    directions.forEach((direction) => {
      this.vehicles[direction].forEach((vehicle) => {
        vehicle.waitingTime = this.time - vehicle.arrivalTime
      })
    })

    if (this.vehicles[this.activeDirection].length > 0 && this.timeRemaining > 0) {
      const vehicle = this.vehicles[this.activeDirection].shift()

      vehicle.startServiceTime = this.time
      vehicle.completionTime = this.time + vehicle.crossingTime

      const responseTime = vehicle.startServiceTime - vehicle.arrivalTime
      this.responseTimes.push(responseTime)

      const turnaroundTime = vehicle.completionTime - vehicle.arrivalTime
      this.turnaroundTimes.push(turnaroundTime)

      this.crossingVehicles.push({
        ...vehicle,
        direction: this.activeDirection,
        crossingStartTime: this.time,
      })

      this.processedVehicles[this.activeDirection]++
      this.waitingTimes.push(vehicle.waitingTime)

      if (vehicle.type === "emergency") {
        this.emergencyWaitingTimes.push(vehicle.waitingTime)
      }

      setTimeout(() => {
        this.crossingVehicles = this.crossingVehicles.filter((v) => v.id !== vehicle.id)
      }, vehicle.crossingTime * 1000)
    } else if (this.vehicles[this.activeDirection].length === 0) {
      this.totalIdleTime++
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

    if (this.turnaroundTimes.length > 0) {
      this.metrics.avgTurnaroundTime = this.turnaroundTimes.reduce((a, b) => a + b, 0) / this.turnaroundTimes.length
    }

    if (this.responseTimes.length > 0) {
      this.metrics.avgResponseTime = this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length
    }

    const totalProcessed = Object.values(this.processedVehicles).reduce((a, b) => a + b, 0)
    this.metrics.throughput = this.time > 0 ? (totalProcessed / this.time) * 60 : 0

    this.metrics.utilization = this.time > 0 ? ((this.time - this.totalIdleTime) / this.time) * 100 : 0

    if (this.time % 5 === 0) {
      this.realtimeMetrics.push({
        time: this.time,
        throughput: this.metrics.throughput,
        avgWaitingTime: this.metrics.avgWaitingTime,
        avgTurnaroundTime: this.metrics.avgTurnaroundTime,
        avgResponseTime: this.metrics.avgResponseTime,
        utilization: this.metrics.utilization,
        queueLength: Object.values(this.vehicles).reduce((sum, queue) => sum + queue.length, 0),
        emergencyCount: Object.values(this.vehicles).reduce(
          (sum, queue) => sum + queue.filter((v) => v.type === "emergency").length,
          0,
        ),
      })
    }
  }

  hasEmergencyVehicles() {
    const directions = ["north", "south", "east", "west"]
    for (const direction of directions) {
      if (this.vehicles[direction].some((v) => v.type === "emergency")) {
        return direction
      }
    }
    return null
  }

  getNextRoundRobinDirection() {
    const directions = ["north", "east", "south", "west"]
    const currentIndex = directions.indexOf(this.lastRoundRobinDirection)

    for (let i = 1; i <= directions.length; i++) {
      const nextIndex = (currentIndex + i) % directions.length
      const nextDirection = directions[nextIndex]

      if (this.vehicles[nextDirection].length > 0) {
        this.lastRoundRobinDirection = nextDirection
        return nextDirection
      }
    }

    const nextIndex = (currentIndex + 1) % directions.length
    this.lastRoundRobinDirection = directions[nextIndex]
    return directions[nextIndex]
  }

  getNextDirection() {
    const directions = ["north", "east", "south", "west"]

    switch (this.algorithmType) {
      case "roundRobin":
        const currentIndex = directions.indexOf(this.activeDirection)
        return directions[(currentIndex + 1) % directions.length]

      case "priorityScheduling":
        for (const direction of directions) {
          if (this.vehicles[direction].some((v) => v.type === "emergency")) {
            return direction
          }
        }
        return directions.reduce((max, dir) => (this.vehicles[dir].length > this.vehicles[max].length ? dir : max))

      case "shortestJobNext":
        let shortestDirection = directions[0]
        let shortestTime = this.vehicles[shortestDirection].reduce((sum, v) => sum + v.crossingTime, 0)

        for (let i = 1; i < directions.length; i++) {
          const direction = directions[i]
          const totalTime = this.vehicles[direction].reduce((sum, v) => sum + v.crossingTime, 0)
          if (totalTime < shortestTime && this.vehicles[direction].length > 0) {
            shortestTime = totalTime
            shortestDirection = direction
          }
        }
        return shortestDirection

      case "hybrid":
        const emergencyDirection = this.hasEmergencyVehicles()
        if (emergencyDirection) {
          return emergencyDirection
        }
        return this.getNextRoundRobinDirection()

      default:
        return this.activeDirection
    }
  }

  step(density) {
    this.time++
    this.addVehicles(density)
    this.processVehicles()

    if (this.algorithmType === "hybrid" && this.timeRemaining > 0) {
      const emergencyDirection = this.hasEmergencyVehicles()
      if (emergencyDirection && emergencyDirection !== this.activeDirection) {
        this.activeDirection = emergencyDirection
        this.timeRemaining = this.timeSlice
        this.directionSwitches++
        this.updateMetrics()
        return
      }
    }

    this.timeRemaining--

    if (
      this.timeRemaining <= 0 ||
      (this.algorithmType === "hybrid" && this.vehicles[this.activeDirection].length === 0)
    ) {
      const oldDirection = this.activeDirection

      if (this.algorithmType === "priorityScheduling") {
        const emergencyDirection = this.getNextDirection()
        if (
          emergencyDirection !== this.activeDirection &&
          this.vehicles[emergencyDirection].some((v) => v.type === "emergency")
        ) {
          this.activeDirection = emergencyDirection
          this.timeRemaining = this.timeSlice
        } else {
          this.activeDirection = this.getNextDirection("roundRobin")
          this.timeRemaining = this.timeSlice
        }
      } else {
        this.activeDirection = this.getNextDirection()
        this.timeRemaining = this.timeSlice
      }

      if (oldDirection !== this.activeDirection) {
        this.directionSwitches++
      }
    }

    this.updateMetrics()
  }

  getStatistics() {
    const totalProcessed = Object.values(this.processedVehicles).reduce((a, b) => a + b, 0)
    const totalWaiting = Object.values(this.vehicles).reduce((sum, queue) => sum + queue.length, 0)
    const emergencyCount = Object.values(this.vehicles).reduce(
      (sum, queue) => sum + queue.filter((v) => v.type === "emergency").length,
      0,
    )

    return {
      totalProcessed,
      totalWaiting,
      emergencyCount,
      totalGenerated: this.totalVehiclesGenerated,
      efficiency: this.totalVehiclesGenerated > 0 ? (totalProcessed / this.totalVehiclesGenerated) * 100 : 0,
      directionSwitches: this.directionSwitches,
      ...this.metrics,
    }
  }

  getRealtimeMetrics() {
    return this.realtimeMetrics.slice(-20)
  }
}

// Algorithm Comparison Component
const AlgorithmComparisonDashboard = ({ simulations, density, isRunning }) => {
  const algorithms = {
    roundRobin: { name: "Round Robin", color: "blue", icon: "🔄" },
    priorityScheduling: { name: "Priority Scheduling", color: "green", icon: "🚨" },
    shortestJobNext: { name: "Shortest Job Next", color: "yellow", icon: "⚡" },
    hybrid: { name: "Hybrid Algorithm", color: "purple", icon: "🔀" },
  }

  const getPerformanceRating = (value, metric) => {
    switch (metric) {
      case "throughput":
        if (value > 8) return { rating: "Excellent", color: "green" }
        if (value > 5) return { rating: "Good", color: "yellow" }
        return { rating: "Poor", color: "red" }
      case "avgWaitingTime":
      case "avgResponseTime":
      case "emergencyDelay":
        if (value < 15) return { rating: "Excellent", color: "green" }
        if (value < 25) return { rating: "Good", color: "yellow" }
        return { rating: "Poor", color: "red" }
      case "utilization":
        if (value > 80) return { rating: "High", color: "green" }
        if (value > 60) return { rating: "Medium", color: "yellow" }
        return { rating: "Low", color: "red" }
      default:
        return { rating: "N/A", color: "gray" }
    }
  }

  const getBestPerformer = (metric) => {
    const values = Object.entries(simulations).map(([alg, sim]) => ({
      algorithm: alg,
      value: sim.getStatistics()[metric],
    }))

    if (metric === "throughput" || metric === "utilization") {
      return values.reduce((best, current) => (current.value > best.value ? current : best))
    } else {
      return values.reduce((best, current) => (current.value < best.value ? current : best))
    }
  }

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl shadow-lg p-6 border border-indigo-200">
      <div className="mb-6 border-b border-indigo-200 pb-4">
        <h2 className="text-2xl font-semibold mb-2 text-indigo-800">🏆 Live Algorithm Comparison Dashboard</h2>
        <p className="text-indigo-600">Real-time side-by-side performance comparison of all scheduling algorithms</p>
        <div className="mt-2 flex items-center gap-4 text-sm">
          <span
            className={`px-2 py-1 rounded ${isRunning ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
          >
            {isRunning ? "🟢 Running" : "🔴 Stopped"}
          </span>
          <span className="text-gray-600">
            Traffic Density: <strong>{density.toUpperCase()}</strong>
          </span>
          <span className="text-gray-600">
            Simulation Time: <strong>{Object.values(simulations)[0]?.time || 0}s</strong>
          </span>
        </div>
      </div>

      {/* Performance Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {["throughput", "avgWaitingTime", "avgResponseTime", "utilization"].map((metric) => {
          const best = getBestPerformer(metric)
          const bestAlg = algorithms[best.algorithm]
          return (
            <div key={metric} className="bg-white p-4 rounded-lg border shadow-sm">
              <div className="text-xs text-gray-600 mb-1 uppercase tracking-wide">
                Best {metric.replace(/([A-Z])/g, " $1")}
              </div>
              <div className={`text-lg font-bold text-${bestAlg.color}-600 flex items-center gap-2`}>
                <span>{bestAlg.icon}</span>
                <span>{best.value.toFixed(1)}</span>
              </div>
              <div className="text-xs text-gray-500">{bestAlg.name}</div>
            </div>
          )
        })}
      </div>

      {/* Detailed Comparison Table */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden mb-6">
        <div className="bg-gray-50 px-4 py-3 border-b">
          <h3 className="font-semibold text-gray-800">📊 Detailed Performance Metrics</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Algorithm
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Throughput
                  <br />
                  <span className="text-xs normal-case">(vehicles/min)</span>
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Wait Time
                  <br />
                  <span className="text-xs normal-case">(seconds)</span>
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Response Time
                  <br />
                  <span className="text-xs normal-case">(seconds)</span>
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Turnaround Time
                  <br />
                  <span className="text-xs normal-case">(seconds)</span>
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utilization
                  <br />
                  <span className="text-xs normal-case">(%)</span>
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Emergency Delay
                  <br />
                  <span className="text-xs normal-case">(seconds)</span>
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Efficiency
                  <br />
                  <span className="text-xs normal-case">(%)</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(simulations).map(([algorithmKey, simulation]) => {
                const stats = simulation.getStatistics()
                const algInfo = algorithms[algorithmKey]
                return (
                  <tr key={algorithmKey} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-2xl mr-2">{algInfo.icon}</span>
                        <div>
                          <div className={`text-sm font-medium text-${algInfo.color}-800`}>{algInfo.name}</div>
                          <div className="text-xs text-gray-500">{algorithmKey}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <div
                        className={`text-sm font-bold text-${getPerformanceRating(stats.throughput, "throughput").color}-600`}
                      >
                        {stats.throughput.toFixed(2)}
                      </div>
                      <div
                        className={`text-xs px-2 py-1 rounded bg-${getPerformanceRating(stats.throughput, "throughput").color}-100 text-${getPerformanceRating(stats.throughput, "throughput").color}-800`}
                      >
                        {getPerformanceRating(stats.throughput, "throughput").rating}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <div
                        className={`text-sm font-bold text-${getPerformanceRating(stats.avgWaitingTime, "avgWaitingTime").color}-600`}
                      >
                        {stats.avgWaitingTime.toFixed(2)}
                      </div>
                      <div
                        className={`text-xs px-2 py-1 rounded bg-${getPerformanceRating(stats.avgWaitingTime, "avgWaitingTime").color}-100 text-${getPerformanceRating(stats.avgWaitingTime, "avgWaitingTime").color}-800`}
                      >
                        {getPerformanceRating(stats.avgWaitingTime, "avgWaitingTime").rating}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <div
                        className={`text-sm font-bold text-${getPerformanceRating(stats.avgResponseTime, "avgResponseTime").color}-600`}
                      >
                        {stats.avgResponseTime.toFixed(2)}
                      </div>
                      <div
                        className={`text-xs px-2 py-1 rounded bg-${getPerformanceRating(stats.avgResponseTime, "avgResponseTime").color}-100 text-${getPerformanceRating(stats.avgResponseTime, "avgResponseTime").color}-800`}
                      >
                        {getPerformanceRating(stats.avgResponseTime, "avgResponseTime").rating}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <div className="text-sm font-bold text-orange-600">{stats.avgTurnaroundTime.toFixed(2)}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <div
                        className={`text-sm font-bold text-${getPerformanceRating(stats.utilization, "utilization").color}-600`}
                      >
                        {stats.utilization.toFixed(2)}
                      </div>
                      <div
                        className={`text-xs px-2 py-1 rounded bg-${getPerformanceRating(stats.utilization, "utilization").color}-100 text-${getPerformanceRating(stats.utilization, "utilization").color}-800`}
                      >
                        {getPerformanceRating(stats.utilization, "utilization").rating}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <div
                        className={`text-sm font-bold text-${getPerformanceRating(stats.emergencyDelay, "emergencyDelay").color}-600`}
                      >
                        {stats.emergencyDelay.toFixed(2)}
                      </div>
                      <div
                        className={`text-xs px-2 py-1 rounded bg-${getPerformanceRating(stats.emergencyDelay, "emergencyDelay").color}-100 text-${getPerformanceRating(stats.emergencyDelay, "emergencyDelay").color}-800`}
                      >
                        {getPerformanceRating(stats.emergencyDelay, "emergencyDelay").rating}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <div className="text-sm font-bold text-blue-600">{stats.efficiency.toFixed(2)}</div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Object.entries(simulations).map(([algorithmKey, simulation]) => {
          const stats = simulation.getStatistics()
          const algInfo = algorithms[algorithmKey]
          return (
            <div
              key={algorithmKey}
              className={`bg-white p-4 rounded-lg border-l-4 border-${algInfo.color}-500 shadow-sm`}
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className={`font-semibold text-${algInfo.color}-800 flex items-center gap-2`}>
                  <span>{algInfo.icon}</span>
                  {algInfo.name}
                </h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Vehicles Processed:</span>
                  <span className="font-semibold">{stats.totalProcessed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Queue Length:</span>
                  <span className="font-semibold">{stats.totalWaiting}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Emergency Vehicles:</span>
                  <span className="font-semibold text-red-600">{stats.emergencyCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Direction Switches:</span>
                  <span className="font-semibold">{stats.directionSwitches}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Performance Insights */}
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <h3 className="font-semibold text-gray-800 mb-4">🎯 Performance Insights & Recommendations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-3">🏆 Top Performers</h4>
            <div className="space-y-2 text-sm">
              {["throughput", "avgWaitingTime", "avgResponseTime", "utilization"].map((metric) => {
                const best = getBestPerformer(metric)
                const bestAlg = algorithms[best.algorithm]
                return (
                  <div key={metric} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-gray-600 capitalize">{metric.replace(/([A-Z])/g, " $1")}:</span>
                    <span className={`font-semibold text-${bestAlg.color}-600 flex items-center gap-1`}>
                      {bestAlg.icon} {bestAlg.name}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-3">💡 Recommendations</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="p-2 bg-blue-50 rounded">
                <strong className="text-blue-800">For High Traffic:</strong> Use Shortest Job Next for optimal
                throughput
              </div>
              <div className="p-2 bg-green-50 rounded">
                <strong className="text-green-800">For Emergency Response:</strong> Priority Scheduling or Hybrid
                algorithm
              </div>
              <div className="p-2 bg-purple-50 rounded">
                <strong className="text-purple-800">For Balanced Performance:</strong> Hybrid algorithm adapts to
                conditions
              </div>
              <div className="p-2 bg-yellow-50 rounded">
                <strong className="text-yellow-800">For Predictability:</strong> Round Robin ensures fair timing
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Real-time Metrics Chart Component
const MetricsChart = ({ data, metric, title, color, unit = "" }) => {
  const maxValue = Math.max(...data.map((d) => d[metric]), 1)
  const minValue = Math.min(...data.map((d) => d[metric]), 0)
  const range = maxValue - minValue || 1

  return (
    <div className="bg-white p-4 rounded-lg border shadow-sm">
      <h4 className="font-semibold text-gray-800 mb-3 text-sm">{title}</h4>
      <div className="relative h-24 bg-gray-50 rounded">
        <svg className="w-full h-full" viewBox="0 0 400 96">
          {/* Grid lines */}
          {[0, 25, 50, 75].map((y) => (
            <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="#e5e7eb" strokeWidth="1" />
          ))}

          {/* Data line */}
          {data.length > 1 && (
            <polyline
              fill="none"
              stroke={color}
              strokeWidth="2"
              points={data
                .map((d, i) => {
                  const x = (i / (data.length - 1)) * 400
                  const y = 80 - ((d[metric] - minValue) / range) * 60
                  return `${x},${y}`
                })
                .join(" ")}
            />
          )}

          {/* Data points */}
          {data.map((d, i) => {
            const x = (i / Math.max(data.length - 1, 1)) * 400
            const y = 80 - ((d[metric] - minValue) / range) * 60
            return <circle key={i} cx={x} cy={y} r="2" fill={color} />
          })}
        </svg>

        {/* Current value */}
        <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded text-xs font-bold" style={{ color }}>
          {data.length > 0 ? `${data[data.length - 1][metric].toFixed(1)}${unit}` : "0"}
        </div>
      </div>
    </div>
  )
}

// Real-time Algorithm Performance Dashboard
const RealtimePerformanceDashboard = ({ simulation, algorithm }) => {
  const realtimeData = simulation.getRealtimeMetrics()
  const stats = simulation.getStatistics()

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl shadow-lg p-6 border border-blue-200">
      <div className="mb-6 border-b border-blue-200 pb-4">
        <h2 className="text-2xl font-semibold mb-2 text-blue-800">📊 Real-Time Algorithm Performance</h2>
        <p className="text-blue-600">
          Live metrics for{" "}
          <strong>{algorithm.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}</strong> algorithm
        </p>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border-l-4 border-blue-500 shadow-sm">
          <div className="text-xs text-gray-600 mb-1">THROUGHPUT</div>
          <div className="text-2xl font-bold text-blue-600">{stats.throughput.toFixed(1)}</div>
          <div className="text-xs text-gray-500">vehicles/min</div>
        </div>
        <div className="bg-white p-4 rounded-lg border-l-4 border-green-500 shadow-sm">
          <div className="text-xs text-gray-600 mb-1">AVG WAIT TIME</div>
          <div className="text-2xl font-bold text-green-600">{stats.avgWaitingTime.toFixed(1)}</div>
          <div className="text-xs text-gray-500">seconds</div>
        </div>
        <div className="bg-white p-4 rounded-lg border-l-4 border-yellow-500 shadow-sm">
          <div className="text-xs text-gray-600 mb-1">RESPONSE TIME</div>
          <div className="text-2xl font-bold text-yellow-600">{stats.avgResponseTime.toFixed(1)}</div>
          <div className="text-xs text-gray-500">seconds</div>
        </div>
        <div className="bg-white p-4 rounded-lg border-l-4 border-purple-500 shadow-sm">
          <div className="text-xs text-gray-600 mb-1">UTILIZATION</div>
          <div className="text-2xl font-bold text-purple-600">{stats.utilization.toFixed(1)}</div>
          <div className="text-xs text-gray-500">percent</div>
        </div>
      </div>

      {/* Real-time Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <MetricsChart
          data={realtimeData}
          metric="throughput"
          title="Throughput Over Time"
          color="#3b82f6"
          unit="/min"
        />
        <MetricsChart data={realtimeData} metric="avgWaitingTime" title="Average Wait Time" color="#10b981" unit="s" />
        <MetricsChart
          data={realtimeData}
          metric="avgResponseTime"
          title="Average Response Time"
          color="#f59e0b"
          unit="s"
        />
        <MetricsChart
          data={realtimeData}
          metric="avgTurnaroundTime"
          title="Average Turnaround Time"
          color="#ef4444"
          unit="s"
        />
        <MetricsChart data={realtimeData} metric="utilization" title="System Utilization" color="#8b5cf6" unit="%" />
        <MetricsChart data={realtimeData} metric="queueLength" title="Total Queue Length" color="#06b6d4" unit="" />
      </div>

      {/* Detailed Metrics Table */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b">
          <h3 className="font-semibold text-gray-800">📈 Detailed Performance Metrics</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Throughput:</span>
                <span className="font-semibold text-blue-600">{stats.throughput.toFixed(2)} vehicles/min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg Wait Time:</span>
                <span className="font-semibold text-green-600">{stats.avgWaitingTime.toFixed(2)} seconds</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Max Wait Time:</span>
                <span className="font-semibold text-red-600">{stats.maxWaitingTime.toFixed(2)} seconds</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Avg Response Time:</span>
                <span className="font-semibold text-yellow-600">{stats.avgResponseTime.toFixed(2)} seconds</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg Turnaround Time:</span>
                <span className="font-semibold text-orange-600">{stats.avgTurnaroundTime.toFixed(2)} seconds</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Emergency Delay:</span>
                <span className="font-semibold text-red-600">{stats.emergencyDelay.toFixed(2)} seconds</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">System Utilization:</span>
                <span className="font-semibold text-purple-600">{stats.utilization.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Direction Switches:</span>
                <span className="font-semibold text-indigo-600">{stats.directionSwitches}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">System Efficiency:</span>
                <span className="font-semibold text-cyan-600">{stats.efficiency.toFixed(2)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Vehicle Component
const Vehicle = ({ vehicle, direction, isMoving }) => {
  const isVertical = direction === "north" || direction === "south"
  const vehicleClass = `
    ${isVertical ? "w-6 h-10" : "w-10 h-6"}
    ${vehicle.type === "emergency" ? "bg-red-500 animate-pulse border-red-300" : "bg-blue-500 border-blue-300"}
    ${isMoving ? "absolute z-20" : ""}
    rounded flex items-center justify-center text-white text-xs font-bold
    shadow-lg border-2 transition-all duration-300
  `

  const getAnimationStyle = () => {
    if (!isMoving) return {}

    return {
      left: direction === "north" || direction === "south" ? "50%" : direction === "east" ? "33.33%" : "66.66%",
      top: direction === "east" || direction === "west" ? "50%" : direction === "north" ? "66.66%" : "33.33%",
      transform: "translate(-50%, -50%)",
      animation: `move${direction} ${vehicle.crossingTime}s linear forwards`,
    }
  }

  const getVehicleIcon = () => {
    if (vehicle.type === "emergency") return "🚑"
    const icons = ["🚗", "🚙", "🚐", "🚚"]
    const iconIndex = Math.abs(vehicle.id.charCodeAt(0)) % icons.length
    return icons[iconIndex]
  }

  return (
    <div
      className={vehicleClass}
      style={getAnimationStyle()}
      title={`${vehicle.type} vehicle - Wait: ${vehicle.waitingTime}s`}
    >
      {getVehicleIcon()}
    </div>
  )
}

// Lane Counter Component
const LaneCounter = ({ direction, count, hasEmergency, position }) => {
  return (
    <div
      className={`absolute z-30 ${
        hasEmergency ? "bg-red-500 text-white animate-pulse" : "bg-white/90 text-gray-800"
      } px-3 py-1 rounded-full text-sm font-bold shadow-lg border-2 ${
        hasEmergency ? "border-red-300" : "border-gray-300"
      } transition-all duration-300`}
      style={position}
    >
      <div className="flex items-center gap-1">
        {hasEmergency && <span className="text-xs">🚨</span>}
        <span>{count}</span>
        {hasEmergency && <span className="text-xs">🚨</span>}
      </div>
    </div>
  )
}

// Traffic Intersection Component
const TrafficIntersection = ({ simulation, algorithm }) => {
  const hasEmergencyInActive = simulation.vehicles[simulation.activeDirection]?.some((v) => v.type === "emergency")

  const emergencyStatus = {
    north: simulation.vehicles.north.some((v) => v.type === "emergency"),
    south: simulation.vehicles.south.some((v) => v.type === "emergency"),
    east: simulation.vehicles.east.some((v) => v.type === "emergency"),
    west: simulation.vehicles.west.some((v) => v.type === "emergency"),
  }

  return (
    <div className="relative w-full max-w-lg aspect-square mx-auto border-4 border-gray-300 rounded-xl overflow-hidden bg-gray-200 shadow-inner">
      <style jsx>{`
        @keyframes movenorth {
          from {
            top: 33.33%;
            left: 50%;
            transform: translate(-50%, -50%);
          }
          to {
            top: 66.66%;
            left: 50%;
            transform: translate(-50%, -50%);
          }
        }
        @keyframes movesouth {
          from {
            top: 66.66%;
            left: 50%;
            transform: translate(-50%, -50%);
          }
          to {
            top: 33.33%;
            left: 50%;
            transform: translate(-50%, -50%);
          }
        }
        @keyframes moveeast {
          from {
            left: 66.66%;
            top: 50%;
            transform: translate(-50%, -50%);
          }
          to {
            left: 33.33%;
            top: 50%;
            transform: translate(-50%, -50%);
          }
        }
        @keyframes movewest {
          from {
            left: 33.33%;
            top: 50%;
            transform: translate(-50%, -50%);
          }
          to {
            left: 66.66%;
            top: 50%;
            transform: translate(-50%, -50%);
          }
        }
      `}</style>

      {/* Roads */}
      <div className="absolute top-0 left-1/3 w-1/3 h-1/3 bg-gray-600 border border-gray-700"></div>
      <div className="absolute bottom-0 left-1/3 w-1/3 h-1/3 bg-gray-600 border border-gray-700"></div>
      <div className="absolute right-0 top-1/3 w-1/3 h-1/3 bg-gray-600 border border-gray-700"></div>
      <div className="absolute left-0 top-1/3 w-1/3 h-1/3 bg-gray-600 border border-gray-700"></div>

      {/* Intersection */}
      <div className="absolute top-1/3 left-1/3 w-1/3 h-1/3 bg-gray-500 border-2 border-gray-600"></div>

      {/* Traffic Lights */}
      <div
        className={`absolute w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white transition-all duration-500 border-3 border-white shadow-xl ${
          simulation.activeDirection === "north"
            ? hasEmergencyInActive && algorithm === "hybrid"
              ? "bg-orange-500 shadow-orange-400/80 ring-4 ring-orange-300/50 animate-pulse"
              : "bg-green-500 shadow-green-400/80 ring-4 ring-green-300/50"
            : "bg-red-500 shadow-red-400/60"
        }`}
        style={{ top: "22%", left: "50%", transform: "translate(-50%, -50%)" }}
      >
        {simulation.activeDirection === "north" ? simulation.timeRemaining : "●"}
      </div>
      <div
        className={`absolute w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white transition-all duration-500 border-3 border-white shadow-xl ${
          simulation.activeDirection === "south"
            ? hasEmergencyInActive && algorithm === "hybrid"
              ? "bg-orange-500 shadow-orange-400/80 ring-4 ring-orange-300/50 animate-pulse"
              : "bg-green-500 shadow-green-400/80 ring-4 ring-green-300/50"
            : "bg-red-500 shadow-red-400/60"
        }`}
        style={{ bottom: "22%", right: "50%", transform: "translate(50%, 50%)" }}
      >
        {simulation.activeDirection === "south" ? simulation.timeRemaining : "●"}
      </div>
      <div
        className={`absolute w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white transition-all duration-500 border-3 border-white shadow-xl ${
          simulation.activeDirection === "east"
            ? hasEmergencyInActive && algorithm === "hybrid"
              ? "bg-orange-500 shadow-orange-400/80 ring-4 ring-orange-300/50 animate-pulse"
              : "bg-green-500 shadow-green-400/80 ring-4 ring-green-300/50"
            : "bg-red-500 shadow-red-400/60"
        }`}
        style={{ top: "50%", right: "22%", transform: "translate(50%, -50%)" }}
      >
        {simulation.activeDirection === "east" ? simulation.timeRemaining : "●"}
      </div>
      <div
        className={`absolute w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white transition-all duration-500 border-3 border-white shadow-xl ${
          simulation.activeDirection === "west"
            ? hasEmergencyInActive && algorithm === "hybrid"
              ? "bg-orange-500 shadow-orange-400/80 ring-4 ring-orange-300/50 animate-pulse"
              : "bg-green-500 shadow-green-400/80 ring-4 ring-green-300/50"
            : "bg-red-500 shadow-red-400/60"
        }`}
        style={{ bottom: "50%", left: "22%", transform: "translate(-50%, 50%)" }}
      >
        {simulation.activeDirection === "west" ? simulation.timeRemaining : "●"}
      </div>

      {/* Vehicle Queues */}
      <div className="absolute top-0 left-1/3 w-1/3 h-1/3 flex flex-col-reverse items-center justify-end pb-16 gap-1 z-10">
        {simulation.vehicles.north.map((vehicle) => (
          <Vehicle key={vehicle.id} vehicle={vehicle} direction="north" isMoving={false} />
        ))}
      </div>
      <div className="absolute bottom-0 left-1/3 w-1/3 h-1/3 flex flex-col items-center justify-end pt-16 gap-1 z-10">
        {simulation.vehicles.south.map((vehicle) => (
          <Vehicle key={vehicle.id} vehicle={vehicle} direction="south" isMoving={false} />
        ))}
      </div>
      <div className="absolute right-0 top-1/3 w-1/3 h-1/3 flex flex-row items-center justify-end pl-16 gap-1 z-10">
        {simulation.vehicles.east.map((vehicle) => (
          <Vehicle key={vehicle.id} vehicle={vehicle} direction="east" isMoving={false} />
        ))}
      </div>
      <div className="absolute left-0 top-1/3 w-1/3 h-1/3 flex flex-row-reverse items-center justify-end pr-16 gap-1 z-10">
        {simulation.vehicles.west.map((vehicle) => (
          <Vehicle key={vehicle.id} vehicle={vehicle} direction="west" isMoving={false} />
        ))}
      </div>

      {/* Lane Counters */}
      <LaneCounter
        direction="north"
        count={simulation.vehicles.north.length}
        hasEmergency={emergencyStatus.north}
        position={{ top: "8%", left: "50%", transform: "translateX(-50%)" }}
      />
      <LaneCounter
        direction="south"
        count={simulation.vehicles.south.length}
        hasEmergency={emergencyStatus.south}
        position={{ bottom: "8%", left: "50%", transform: "translateX(-50%)" }}
      />
      <LaneCounter
        direction="east"
        count={simulation.vehicles.east.length}
        hasEmergency={emergencyStatus.east}
        position={{ top: "50%", right: "8%", transform: "translateY(-50%)" }}
      />
      <LaneCounter
        direction="west"
        count={simulation.vehicles.west.length}
        hasEmergency={emergencyStatus.west}
        position={{ top: "50%", left: "8%", transform: "translateY(-50%)" }}
      />

      {/* Crossing Vehicles */}
      {simulation.crossingVehicles.map((vehicle) => (
        <Vehicle key={`crossing-${vehicle.id}`} vehicle={vehicle} direction={vehicle.direction} isMoving={true} />
      ))}

      {/* Direction Labels */}
      <div className="absolute top-2 left-1/2 transform -translate-x-1/2 font-bold text-sm text-gray-800 z-20 bg-white/80 px-2 py-1 rounded">
        NORTH
      </div>
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 font-bold text-sm text-gray-800 z-20 bg-white/80 px-2 py-1 rounded">
        SOUTH
      </div>
      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 font-bold text-sm text-gray-800 z-20 bg-white/80 px-2 py-1 rounded">
        EAST
      </div>
      <div className="absolute left-2 top-1/2 transform -translate-y-1/2 font-bold text-sm text-gray-800 z-20 bg-white/80 px-2 py-1 rounded">
        WEST
      </div>

      {/* Enhanced Legend */}
      <div className="absolute bottom-3 right-3 bg-white/95 p-3 rounded-lg text-xs shadow-lg border z-20">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-4 h-4 bg-blue-500 rounded border border-blue-300"></div>
          <span>Regular Vehicle</span>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-4 h-4 bg-red-500 rounded animate-pulse border border-red-300"></div>
          <span>Emergency Vehicle</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span>Green Light (Go)</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span>Red Light (Stop)</span>
        </div>
        {algorithm === "hybrid" && (
          <div className="flex items-center gap-2 mb-2">
            <div className="w-4 h-4 bg-orange-500 rounded animate-pulse"></div>
            <span>Emergency Override</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded text-white text-xs flex items-center justify-center font-bold">
            #
          </div>
          <span>Lane with Emergency</span>
        </div>
      </div>

      {/* Hybrid Algorithm Status */}
      {algorithm === "hybrid" && (
        <div className="absolute top-3 right-3 bg-purple-100 border border-purple-300 p-2 rounded-lg text-xs z-20">
          <div className="font-bold text-purple-800 mb-1">HYBRID MODE</div>
          <div className="text-purple-700">
            {simulation.hasEmergencyVehicles() ? "🚨 Emergency Override" : "🔄 Round Robin"}
          </div>
        </div>
      )}
    </div>
  )
}

// Main App Component
export default function TrafficSimulationApp() {
  // Create separate simulations for each algorithm
  const [simulations] = useState({
    roundRobin: new TrafficSimulation("roundRobin"),
    priorityScheduling: new TrafficSimulation("priorityScheduling"),
    shortestJobNext: new TrafficSimulation("shortestJobNext"),
    hybrid: new TrafficSimulation("hybrid"),
  })

  const [currentAlgorithm, setCurrentAlgorithm] = useState("roundRobin")
  const [density, setDensity] = useState("medium")
  const [speed, setSpeed] = useState(1)
  const [isRunning, setIsRunning] = useState(false)
  const [, forceUpdate] = useState({})
  const [showRealtimeMetrics, setShowRealtimeMetrics] = useState(false)
  const [showComparison, setShowComparison] = useState(true)

  const intervalRef = useRef(null)

  const triggerUpdate = () => forceUpdate({})

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        // Step all simulations simultaneously
        Object.values(simulations).forEach((sim) => {
          sim.step(density)
        })
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
  }, [isRunning, density, speed, simulations])

  const handleReset = () => {
    setIsRunning(false)
    Object.values(simulations).forEach((sim) => {
      sim.reset()
    })
    triggerUpdate()
  }

  const handleAlgorithmChange = (newAlgorithm) => {
    setCurrentAlgorithm(newAlgorithm)
  }

  const currentSimulation = simulations[currentAlgorithm]
  const stats = currentSimulation.getStatistics()

  const algorithmInfo = {
    roundRobin: {
      title: "Round Robin (RR)",
      description:
        "Each direction gets exactly 10 seconds of green light in a fixed cyclic order: North → East → South → West. This ensures fairness and predictable timing for all directions.",
      timeQuantum: "10 seconds per direction",
      features: ["Fixed time slices", "Predictable timing", "Fair distribution"],
    },
    priorityScheduling: {
      title: "Priority Scheduling (PS)",
      description:
        "Emergency vehicles get immediate priority, interrupting the current cycle. Otherwise, the direction with the most waiting vehicles gets the green light for 10 seconds.",
      timeQuantum: "10 seconds (or until emergency)",
      features: ["Emergency priority", "Queue-based selection", "Dynamic switching"],
    },
    shortestJobNext: {
      title: "Shortest Job Next (SJN)",
      description:
        "The direction with the shortest total crossing time gets the green light for 10 seconds. This minimizes overall waiting time but may cause starvation.",
      timeQuantum: "10 seconds per selected direction",
      features: ["Optimal waiting time", "Job-length based", "Efficiency focused"],
    },
    hybrid: {
      title: "Hybrid (RR + Priority)",
      description:
        "Combines Round Robin with Priority Scheduling. Uses Round Robin for regular traffic, but immediately switches to any lane with emergency vehicles. Also skips empty lanes to improve efficiency.",
      timeQuantum: "10 seconds (adaptive)",
      features: ["Emergency preemption", "Skip empty lanes", "Round Robin fallback", "Adaptive timing"],
    },
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 p-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl shadow-lg">
          <h1 className="text-4xl font-bold mb-2">🚦 Smart Traffic Management Simulation</h1>
          <p className="text-xl opacity-90">CPU Scheduling Algorithms Applied to Traffic Control Systems</p>
          <p className="text-sm opacity-75 mt-2">
            Real-time performance monitoring with comprehensive side-by-side algorithm comparison
          </p>
        </div>

        {/* Algorithm Comparison Dashboard */}
        {showComparison && (
          <div className="mb-8">
            <AlgorithmComparisonDashboard simulations={simulations} density={density} isRunning={isRunning} />
          </div>
        )}

        {/* Real-time Performance Dashboard */}
        {showRealtimeMetrics && (
          <div className="mb-8">
            <RealtimePerformanceDashboard simulation={currentSimulation} algorithm={currentAlgorithm} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Traffic Intersection */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
            <div className="mb-6 border-b pb-4">
              <h2 className="text-2xl font-semibold mb-2">🏙️ Traffic Intersection</h2>
              <p className="text-gray-600">
                Currently viewing: <strong>{algorithmInfo[currentAlgorithm].title}</strong>
              </p>
              <p className="text-sm text-gray-500 mt-1">
                🔴 Red counters indicate lanes with emergency vehicles | Numbers show vehicles waiting in each lane
              </p>
            </div>

            <TrafficIntersection simulation={currentSimulation} algorithm={currentAlgorithm} />

            {/* Enhanced Signal Timer */}
            <div className="mt-6 p-5 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border-2 border-gray-200">
              <div className="flex justify-between items-center mb-4 text-lg font-semibold">
                <span className="flex items-center gap-2">
                  🎯 Active Direction:
                  <span
                    className={`px-3 py-1 rounded-full ${
                      currentAlgorithm === "hybrid" && currentSimulation.hasEmergencyVehicles()
                        ? "text-orange-600 bg-orange-100"
                        : "text-green-600 bg-green-100"
                    }`}
                  >
                    {currentSimulation.activeDirection.toUpperCase()}
                    {currentAlgorithm === "hybrid" && currentSimulation.hasEmergencyVehicles() && " 🚨"}
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  ⏱️ Time Remaining:
                  <span className="text-blue-600 bg-blue-100 px-3 py-1 rounded-full font-mono">
                    {currentSimulation.timeRemaining}s / 10s
                  </span>
                </span>
              </div>
              <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                <div
                  className={`h-full transition-all duration-200 ease-linear shadow-sm relative ${
                    currentAlgorithm === "hybrid" && currentSimulation.hasEmergencyVehicles()
                      ? "bg-gradient-to-r from-orange-500 to-orange-400"
                      : "bg-gradient-to-r from-green-500 to-green-400"
                  }`}
                  style={{ width: `${(currentSimulation.timeRemaining / currentSimulation.timeSlice) * 100}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>0s</span>
                <span>5s</span>
                <span>10s</span>
              </div>
              {currentAlgorithm === "hybrid" && (
                <div className="mt-3 text-sm text-center">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      currentSimulation.hasEmergencyVehicles()
                        ? "bg-orange-100 text-orange-800"
                        : "bg-purple-100 text-purple-800"
                    }`}
                  >
                    {currentSimulation.hasEmergencyVehicles() ? "🚨 Emergency Override Active" : "🔄 Round Robin Mode"}
                  </span>
                </div>
              )}
            </div>

            {/* Algorithm Info */}
            <div
              className={`mt-6 p-5 rounded-lg border-l-4 ${
                currentAlgorithm === "hybrid" ? "bg-purple-50 border-purple-500" : "bg-blue-50 border-blue-500"
              }`}
            >
              <h3
                className={`font-bold mb-2 text-lg ${currentAlgorithm === "hybrid" ? "text-purple-800" : "text-blue-800"}`}
              >
                {algorithmInfo[currentAlgorithm].title}
              </h3>
              <p
                className={`text-sm leading-relaxed mb-3 ${
                  currentAlgorithm === "hybrid" ? "text-purple-700" : "text-blue-700"
                }`}
              >
                {algorithmInfo[currentAlgorithm].description}
              </p>
              <div
                className={`p-3 rounded text-sm mb-3 ${currentAlgorithm === "hybrid" ? "bg-purple-100" : "bg-blue-100"}`}
              >
                <strong className={currentAlgorithm === "hybrid" ? "text-purple-800" : "text-blue-800"}>
                  Time Quantum:
                </strong>
                <span className={`ml-2 ${currentAlgorithm === "hybrid" ? "text-purple-700" : "text-blue-700"}`}>
                  {algorithmInfo[currentAlgorithm].timeQuantum}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {algorithmInfo[currentAlgorithm].features.map((feature, index) => (
                  <div
                    key={index}
                    className={`text-xs px-2 py-1 rounded ${
                      currentAlgorithm === "hybrid" ? "bg-purple-200 text-purple-800" : "bg-blue-200 text-blue-800"
                    }`}
                  >
                    ✓ {feature}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Controls and Metrics */}
          <div className="space-y-6">
            {/* Simulation Controls */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="mb-6 border-b pb-4">
                <h2 className="text-xl font-semibold mb-2">⚙️ Simulation Controls</h2>
                <p className="text-gray-600 text-sm">Configure and control the traffic simulation</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Algorithm View</label>
                  <select
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={currentAlgorithm}
                    onChange={(e) => handleAlgorithmChange(e.target.value)}
                  >
                    <option value="roundRobin">Round Robin (RR) - 10s each</option>
                    <option value="priorityScheduling">Priority Scheduling (PS) - Emergency first</option>
                    <option value="shortestJobNext">Shortest Job Next (SJN) - Optimal time</option>
                    <option value="hybrid">🆕 Hybrid (RR + Priority) - Smart adaptive</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Note: All algorithms are running simultaneously. This controls which one you're viewing.
                  </p>
                </div>

                <div className="flex gap-3 mb-4">
                  <button
                    className={`flex-1 font-semibold py-3 px-4 rounded-lg transition-colors ${
                      showComparison
                        ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                        : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                    }`}
                    onClick={() => setShowComparison(!showComparison)}
                  >
                    {showComparison ? "🏆 Hide Comparison" : "🏆 Show Comparison"}
                  </button>
                </div>

                <div className="flex gap-3 mb-4">
                  <button
                    className={`flex-1 font-semibold py-3 px-4 rounded-lg transition-colors ${
                      showRealtimeMetrics
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                    }`}
                    onClick={() => setShowRealtimeMetrics(!showRealtimeMetrics)}
                  >
                    {showRealtimeMetrics ? "📊 Hide Real-time Metrics" : "📊 Show Real-time Metrics"}
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Traffic Density</label>
                  <select
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={density}
                    onChange={(e) => setDensity(e.target.value)}
                    disabled={isRunning}
                  >
                    <option value="low">Low (Light Traffic)</option>
                    <option value="medium">Medium (Normal Traffic)</option>
                    <option value="high">High (Heavy Traffic)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Simulation Speed: {speed}x</label>
                  <input
                    type="range"
                    className="w-full"
                    min="0.5"
                    max="3"
                    step="0.5"
                    value={speed}
                    onChange={(e) => setSpeed(Number.parseFloat(e.target.value))}
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0.5x (Slow)</span>
                    <span>1x (Normal)</span>
                    <span>2x (Fast)</span>
                    <span>3x (Very Fast)</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                    onClick={() => setIsRunning(!isRunning)}
                  >
                    {isRunning ? "⏸️ Pause All" : "▶️ Start All"}
                  </button>
                  <button
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                    onClick={handleReset}
                  >
                    🔄 Reset All
                  </button>
                </div>

                <div className="text-center p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border">
                  <div className="text-sm text-gray-600 mb-1">Total Simulation Time</div>
                  <div className="text-3xl font-bold text-gray-800 font-mono">{currentSimulation.time}s</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {currentAlgorithm === "hybrid"
                      ? `Mode: ${currentSimulation.hasEmergencyVehicles() ? "Emergency" : "Round Robin"}`
                      : `Cycle: ${Math.floor(currentSimulation.time / 40) + 1} | Position: ${((currentSimulation.time % 40) / 10).toFixed(0)}/4`}
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="mb-6 border-b pb-4">
                <h2 className="text-xl font-semibold mb-2">📈 Current Algorithm Performance</h2>
                <p className="text-gray-600 text-sm">
                  Real-time metrics for <strong>{algorithmInfo[currentAlgorithm].title}</strong>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg text-center border border-blue-200">
                  <div className="text-xs text-blue-600 font-medium mb-1">THROUGHPUT</div>
                  <div className="text-2xl font-bold text-blue-800">{stats.throughput.toFixed(1)}</div>
                  <div className="text-xs text-blue-600">vehicles/min</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center border border-green-200">
                  <div className="text-xs text-green-600 font-medium mb-1">AVG WAIT TIME</div>
                  <div className="text-2xl font-bold text-green-800">{stats.avgWaitingTime.toFixed(1)}</div>
                  <div className="text-xs text-green-600">seconds</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg text-center border border-yellow-200">
                  <div className="text-xs text-yellow-600 font-medium mb-1">RESPONSE TIME</div>
                  <div className="text-2xl font-bold text-yellow-800">{stats.avgResponseTime.toFixed(1)}</div>
                  <div className="text-xs text-yellow-600">seconds</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center border border-purple-200">
                  <div className="text-xs text-purple-600 font-medium mb-1">UTILIZATION</div>
                  <div className="text-2xl font-bold text-purple-800">{stats.utilization.toFixed(1)}</div>
                  <div className="text-xs text-purple-600">percent</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div
                  className={`p-3 rounded text-center border-2 transition-all duration-300 ${
                    currentSimulation.vehicles.north.some((v) => v.type === "emergency")
                      ? "bg-red-100 border-red-300 animate-pulse"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="text-xs text-gray-600 mb-1 flex items-center justify-center gap-1">
                    North Queue
                    {currentSimulation.vehicles.north.some((v) => v.type === "emergency") && (
                      <span className="text-red-500">🚨</span>
                    )}
                  </div>
                  <div className="text-lg font-bold">{currentSimulation.vehicles.north.length}</div>
                  <div className="text-xs text-gray-500">Processed: {currentSimulation.processedVehicles.north}</div>
                </div>
                <div
                  className={`p-3 rounded text-center border-2 transition-all duration-300 ${
                    currentSimulation.vehicles.south.some((v) => v.type === "emergency")
                      ? "bg-red-100 border-red-300 animate-pulse"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="text-xs text-gray-600 mb-1 flex items-center justify-center gap-1">
                    South Queue
                    {currentSimulation.vehicles.south.some((v) => v.type === "emergency") && (
                      <span className="text-red-500">🚨</span>
                    )}
                  </div>
                  <div className="text-lg font-bold">{currentSimulation.vehicles.south.length}</div>
                  <div className="text-xs text-gray-500">Processed: {currentSimulation.processedVehicles.south}</div>
                </div>
                <div
                  className={`p-3 rounded text-center border-2 transition-all duration-300 ${
                    currentSimulation.vehicles.east.some((v) => v.type === "emergency")
                      ? "bg-red-100 border-red-300 animate-pulse"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="text-xs text-gray-600 mb-1 flex items-center justify-center gap-1">
                    East Queue
                    {currentSimulation.vehicles.east.some((v) => v.type === "emergency") && (
                      <span className="text-red-500">🚨</span>
                    )}
                  </div>
                  <div className="text-lg font-bold">{currentSimulation.vehicles.east.length}</div>
                  <div className="text-xs text-gray-500">Processed: {currentSimulation.processedVehicles.east}</div>
                </div>
                <div
                  className={`p-3 rounded text-center border-2 transition-all duration-300 ${
                    currentSimulation.vehicles.west.some((v) => v.type === "emergency")
                      ? "bg-red-100 border-red-300 animate-pulse"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="text-xs text-gray-600 mb-1 flex items-center justify-center gap-1">
                    West Queue
                    {currentSimulation.vehicles.west.some((v) => v.type === "emergency") && (
                      <span className="text-red-500">🚨</span>
                    )}
                  </div>
                  <div className="text-lg font-bold">{currentSimulation.vehicles.west.length}</div>
                  <div className="text-xs text-gray-500">Processed: {currentSimulation.processedVehicles.west}</div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Emergency Vehicles:</strong>
                    <span className="text-red-600 ml-1 font-semibold">{stats.emergencyCount}</span>
                  </div>
                  <div>
                    <strong>Total Processed:</strong>
                    <span className="text-green-600 ml-1 font-semibold">{stats.totalProcessed}</span>
                  </div>
                  <div>
                    <strong>Total Generated:</strong>
                    <span className="ml-1 font-semibold">{stats.totalGenerated}</span>
                  </div>
                  <div>
                    <strong>System Efficiency:</strong>
                    <span className="text-blue-600 ml-1 font-semibold">{stats.efficiency.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 p-6 text-center bg-white rounded-xl shadow-lg">
          <p className="font-semibold">Traffic Management Simulation with Live Algorithm Comparison</p>
          <p className="text-gray-600 text-sm mt-1">
            Comprehensive side-by-side performance analysis of all CPU scheduling algorithms in real-time
          </p>
        </div>
      </div>
    </div>
  )
}
