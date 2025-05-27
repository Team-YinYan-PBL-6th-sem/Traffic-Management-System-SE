import Vehicle from "./Vehicle"

const TrafficIntersection = ({ simulation, isRunning }) => {
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
        {simulation.vehicles.north.map((vehicle) => (
          <Vehicle key={vehicle.id} vehicle={vehicle} direction="north" isMoving={false} />
        ))}
      </div>
      <div className="vehicle-queue queue-south">
        {simulation.vehicles.south.map((vehicle) => (
          <Vehicle key={vehicle.id} vehicle={vehicle} direction="south" isMoving={false} />
        ))}
      </div>
      <div className="vehicle-queue queue-east">
        {simulation.vehicles.east.map((vehicle) => (
          <Vehicle key={vehicle.id} vehicle={vehicle} direction="east" isMoving={false} />
        ))}
      </div>
      <div className="vehicle-queue queue-west">
        {simulation.vehicles.west.map((vehicle) => (
          <Vehicle key={vehicle.id} vehicle={vehicle} direction="west" isMoving={false} />
        ))}
      </div>

      {/* Crossing Vehicles */}
      {simulation.crossingVehicles.map((vehicle) => (
        <Vehicle key={`crossing-${vehicle.id}`} vehicle={vehicle} direction={vehicle.direction} isMoving={true} />
      ))}

      {/* Direction Labels */}
      <div className="direction-label label-north">NORTH</div>
      <div className="direction-label label-south">SOUTH</div>
      <div className="direction-label label-east">EAST</div>
      <div className="direction-label label-west">WEST</div>

      {/* Legend */}
      <div className="legend">
        <div className="legend-item">
          <div className="legend-color" style={{ background: "linear-gradient(135deg, #3b82f6, #1d4ed8)" }}></div>
          <span>Regular</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}></div>
          <span>Emergency</span>
        </div>
      </div>
    </div>
  )
}

export default TrafficIntersection
