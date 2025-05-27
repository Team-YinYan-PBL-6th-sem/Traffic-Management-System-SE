// Traffic Simulation Engine
export class TrafficSimulation {
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
    this.totalVehiclesGenerated = 0
  }

  generateVehicle(direction) {
    const isEmergency = Math.random() < 0.08 // 8% chance of emergency vehicle
    const vehicle = {
      id: `${direction}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: isEmergency ? "emergency" : "regular",
      arrivalTime: this.time,
      crossingTime: Math.floor(Math.random() * 3) + 2, // 2-4 seconds
      waitingTime: 0,
      priority: isEmergency ? 1 : 2, // Lower number = higher priority
    }
    this.totalVehiclesGenerated++
    return vehicle
  }

  addVehicles(density) {
    const densityFactors = {
      low: 0.25,
      medium: 0.45,
      high: 0.7,
    }

    const densityFactor = densityFactors[density] || 0.45
    const directions = ["north", "south", "east", "west"]

    directions.forEach((direction) => {
      // Add some randomness to vehicle generation
      const spawnChance = densityFactor * (0.8 + Math.random() * 0.4)

      if (Math.random() < spawnChance * 0.3) {
        this.vehicles[direction].push(this.generateVehicle(direction))
      }

      // Limit queue length to prevent infinite growth
      if (this.vehicles[direction].length > 15) {
        this.vehicles[direction] = this.vehicles[direction].slice(0, 15)
      }
    })
  }

  processVehicles() {
    // Update waiting times for all vehicles
    const directions = ["north", "south", "east", "west"]
    directions.forEach((direction) => {
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
      ...this.metrics,
    }
  }

  exportData() {
    return {
      time: this.time,
      metrics: this.metrics,
      processedVehicles: this.processedVehicles,
      statistics: this.getStatistics(),
      timestamp: new Date().toISOString(),
    }
  }
}
