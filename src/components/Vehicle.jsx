const Vehicle = ({ vehicle, direction, isMoving }) => {
  const isVertical = direction === "north" || direction === "south"
  const vehicleClass = `vehicle ${isVertical ? "vehicle-vertical" : "vehicle-horizontal"} ${
    vehicle.type === "emergency" ? "vehicle-emergency" : "vehicle-regular"
  } ${isMoving ? "vehicle-crossing" : ""}`

  const getAnimationStyle = () => {
    if (!isMoving) return {}

    const animationName = `move${direction.charAt(0).toUpperCase() + direction.slice(1)}To${
      direction === "north" ? "South" : direction === "south" ? "North" : direction === "east" ? "West" : "East"
    }`

    return {
      left: direction === "north" || direction === "south" ? "50%" : direction === "east" ? "33.33%" : "66.66%",
      top: direction === "east" || direction === "west" ? "50%" : direction === "north" ? "66.66%" : "33.33%",
      transform: "translate(-50%, -50%)",
      animation: `${animationName} ${vehicle.crossingTime}s linear forwards`,
    }
  }

  const getVehicleIcon = () => {
    if (vehicle.type === "emergency") {
      return "🚑"
    }

    // Different icons for different vehicle types
    const icons = ["🚗", "🚙", "🚐", "🚚"]
    const iconIndex = Math.abs(vehicle.id.charCodeAt(0)) % icons.length
    return icons[iconIndex]
  }

  return (
    <div
      className={vehicleClass}
      style={getAnimationStyle()}
      title={`${vehicle.type} vehicle - Wait: ${vehicle.waitingTime}s, Crossing: ${vehicle.crossingTime}s`}
    >
      {getVehicleIcon()}
    </div>
  )
}

export default Vehicle
