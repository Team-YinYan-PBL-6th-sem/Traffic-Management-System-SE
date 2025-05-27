# Traffic Management Simulation

A comprehensive React.js application that demonstrates CPU scheduling algorithms applied to traffic control systems.

## 🚀 Features

- **Three CPU Scheduling Algorithms:**
  - Round Robin (RR) - Fair time slicing
  - Priority Scheduling (PS) - Emergency vehicle priority
  - Shortest Job Next (SJN) - Optimal waiting time

- **Interactive Simulation:**
  - Real-time traffic intersection visualization
  - Dynamic vehicle generation and movement
  - Emergency vehicle prioritization
  - Adjustable traffic density and simulation speed

- **Performance Analytics:**
  - Real-time metrics tracking
  - Comprehensive statistics
  - Visual performance indicators

## 🧠 Algorithm Details

### Round Robin (RR)
- **Time Slice:** 10 seconds per direction
- **Behavior:** Cycles through North → East → South → West
- **Best For:** Balanced traffic conditions

### Priority Scheduling (PS)
- **Priority:** Emergency vehicles → Highest queue count
- **Behavior:** Immediately switches for emergency vehicles
- **Best For:** Emergency response scenarios

### Shortest Job Next (SJN)
- **Selection:** Direction with shortest total crossing time
- **Behavior:** Calculates optimal processing order
- **Best For:** Minimizing overall waiting time

## 📊 Key Metrics

- **Average Waiting Time:** Mean time vehicles wait in queue
- **Maximum Waiting Time:** Longest wait time recorded
- **Throughput:** Vehicles processed per minute
- **Emergency Delay:** Average delay for emergency vehicles
- **System Efficiency:** Percentage of vehicles processed

## 🎯 Educational Value

This simulation demonstrates:
- CPU scheduling algorithm concepts in real-world context
- Performance trade-offs between different algorithms
- System optimization and resource management
- Interactive learning through visualization

## 🔧 Technical Stack

- **Frontend:** React.js 
- **Build Tool:** Vite
- **Styling:** CSS3 with modern features
- **Architecture:** Component-based design
- **State Management:** React hooks

