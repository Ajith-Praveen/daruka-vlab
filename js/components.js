const viewer = document.getElementById("robotViewer");

const initialCamera = {
  orbit: "-65deg 85deg 0.8m",
  target: "0m 0.08m 0m"
};

const components = {
  camera: {
    title: "Vision Camera Module",
    desc: "The Raspberry Pi Camera Module serves as the primary visual sensing unit of the DARUKA firefighting robot. It continuously captures real-time images and video of the surrounding environment and provides visual input to the onboard processor for analysis. Using this data, computer vision algorithms such as fire detection, object recognition, and navigation logic are executed. The camera enables the robot to autonomously identify fire sources, assess their location, and make intelligent decisions for movement and extinguishing actions, making it a critical component for perception and autonomy.",
    orbit: "-90deg 80deg 0.35m",
    target: "-0.08m 0.15m 0.02m"
  },

  flame: {
    title: "Flame Sensor Array",
    desc: "The 5-channel flame sensor module is responsible for detecting the presence and direction of fire using infrared sensing. Each channel monitors flame intensity from a different angle, allowing the robot to estimate the direction of the fire source. This directional information helps the DARUKA robot align itself accurately toward the flame before activating the extinguishing mechanism. The sensor provides fast and reliable fire detection, enabling quick response in emergency situations and supporting autonomous decision-making during firefighting operations.",
    orbit: "-60deg 85deg 0.4m",
    target: "-0.12m 0.04m 0.01m"
  },

  extinguisher_motor: {
    title: "Piston Motor",
    desc: "The piston motor is responsible for actuating the linear motion required to operate the fire extinguishing mechanism of the DARUKA robot. It converts electrical energy into controlled linear movement, allowing the system to press the aerosol extinguisher nozzle with precision. This ensures consistent and reliable discharge of the extinguishing agent when fire is detected. The piston motor plays a crucial role in automating the firefighting process by enabling accurate mechanical control without human intervention.",
    orbit: "-48.79deg 86.8deg 0.3711m",
    target: "-0.10m 0.09m 0.01m"
  },

  rp5: {
    title: "Main Controller (Raspberry Pi 5)",
    desc: "The Raspberry Pi 5 acts as the central processing and control unit of the DARUKA firefighting robot. It coordinates all sensing, decision-making, and actuation processes within the system. Sensor data from the camera and flame sensors is processed in real time to detect fire and determine appropriate actions. The controller executes navigation logic, control algorithms, and communication between hardware modules, enabling autonomous operation and intelligent response during firefighting scenarios.",
    orbit: "-168deg 78.14deg 0.3621m",
    target: "-0.05m 0.05m -0.04m"
  },

  pca: {
    title: "Servo Motor Driver Module(PCA9685)",
    desc: "The PCA9685 servo motor driver module is used to control multiple servo motors with high precision and stability. It communicates with the main controller through the I²C protocol and generates accurate pulse-width modulation (PWM) signals required for servo operation. In the DARUKA robot, this module enables smooth and synchronized movement of mechanical components such as nozzle positioning and actuation mechanisms. By offloading PWM generation from the main controller, the PCA9685 improves system efficiency and ensures reliable motor control during firefighting operations.",
    orbit: "-171.5deg 46.66deg 0.25m",
    target: "0.01m 0.04m -0.0m"
  },

  fe: {
    title: "Aerosol Fire Extinguisher",
    desc: "The aerosol fire extinguisher is the primary fire suppression unit of the DARUKA firefighting robot. It releases a fine aerosol-based extinguishing agent that effectively suppresses flames by interrupting the chemical reactions of combustion. The extinguisher is compact, lightweight, and suitable for enclosed or hazardous environments. When activated by the control system, it delivers a controlled discharge through the nozzle, allowing the robot to safely extinguish fires without direct human involvement.",
    orbit: "-126.3deg 71.84deg 0.3621m",
    target: "0.06m 0.1m -0.03m"
  },

  chasis: {
    title: "Body Chasis",
    desc: "The body chassis forms the structural framework of the DARUKA firefighting robot and supports all mechanical, electronic, and sensing components. It is designed to provide strength, stability, and protection while maintaining a compact and lightweight form. The chassis ensures proper alignment of modules such as the motors, controller, sensors, and fire extinguisher, enabling efficient operation. Its robust design allows the robot to navigate challenging environments while safeguarding internal components from heat, impact, and environmental hazards during firefighting tasks.",
    orbit: "-56.27deg 84.43deg 0.5987m",
    target: "-0.07m 0.08m 0.01m"
  },

  w_m: {
    title: "Wheels & Motors",
    desc: "The wheels and drive motors provide mobility to the DARUKA firefighting robot, enabling it to navigate autonomously toward fire sources. The motors convert electrical energy into rotational motion, driving the wheels with controlled speed and direction. By coordinating motor control signals, the robot can move forward, reverse, and turn accurately within confined or hazardous environments. This mobility system is essential for positioning the robot effectively during firefighting operations and ensuring precise alignment before deploying the extinguishing mechanism.",
    orbit: "-45.25deg 112.8deg 0.5677m",
    target: "-0.06m 0.03m 0.08m"
  },

  battery: {
    title: "Battery Pack (LiPo 3300mah)",
    desc: "The LiPo 3300 mAh battery pack serves as the primary power source for the DARUKA firefighting robot. It provides stable and high-energy electrical output required to operate the controller, sensors, motors, and actuation systems. Lithium-polymer batteries are chosen for their high energy density, lightweight construction, and ability to deliver high current when needed. This power system enables sustained autonomous operation while maintaining a compact form factor suitable for mobile firefighting applications.",
    orbit: "-86.95deg 172.1deg 0.5765m",
    target: "0.0m 0.0m -0.01m"
  },

  md: {
    title: "DC Motor Driver Module(L298)",
    desc: "The L298 DC motor driver module is used to control the speed and direction of the drive motors in the DARUKA firefighting robot. It acts as an interface between the low-power control signals from the main controller and the high-current requirements of the motors. By using an H-bridge configuration, the L298 allows forward, reverse, and differential motion control. This module enables precise navigation and maneuverability, ensuring the robot can move accurately toward fire sources during autonomous firefighting operations.",
    orbit: "9.443deg 161.1deg 0.4118m",
    target: "-0.09m -0.02m 0.02m"
  },

  piston: {
    title: "Piston Module",
    desc: "The piston module is a mechanical actuation system responsible for generating controlled linear motion within the DARUKA firefighting robot. It works in coordination with the piston motor to apply precise force required to activate the aerosol fire extinguisher. This module ensures consistent and repeatable operation of the extinguishing mechanism, improving reliability during firefighting tasks. By automating the physical actuation process, the piston module eliminates the need for manual intervention and enhances the robot’s overall efficiency and safety.",
    orbit: "-180.2deg 82.02deg 0.3621m",
    target: "-0.02m 0.09m -0.01m"
  },

  nm: {
    title: "Nozzle Motor",
    desc: "The nozzle motor is responsible for controlling the orientation and direction of the fire extinguisher nozzle in the DARUKA firefighting robot. It enables precise angular movement of the nozzle, allowing the extinguishing agent to be accurately directed toward the fire source. By adjusting the spray direction based on sensor and vision feedback, the nozzle motor improves targeting efficiency and minimizes wastage of the extinguishing agent. This controlled motion plays a key role in effective and reliable autonomous firefighting operations.",
    orbit: "-125.5deg 95deg 0.3621m",
    target: "-0.02m 0.09m -0.01m"
  },

  nozzle: {
    title: "Nozzle",
    desc: "The nozzle is the terminal component of the firefighting system that directs the aerosol extinguishing agent toward the fire source. It is designed to control the spray pattern and flow direction, ensuring effective coverage of the flame area. Integrated with the nozzle motor and piston mechanism, the nozzle enables precise aiming and controlled discharge. This targeted delivery improves extinguishing efficiency, reduces agent wastage, and enhances the robot’s ability to suppress fires accurately in confined or hazardous environments.",
    orbit: "-33.04deg 80.05deg 0.3621m",
    target: "-0.13m 0.10m -0.03m"
  }

};

/* Focus on component */
function focusComponent(key) {
  const comp = components[key];

  document.getElementById("part-title").innerText = comp.title;
  document.getElementById("part-desc").innerText = comp.desc;

  viewer.cameraOrbit = comp.orbit;
  viewer.cameraTarget = comp.target;
}

/* Reset view when clicking empty space */
viewer.addEventListener("click", (e) => {
  if (e.target.tagName === "MODEL-VIEWER") {
    resetView();
  }
});

function resetView() {
  viewer.cameraOrbit = initialCamera.orbit;
  viewer.cameraTarget = initialCamera.target;

  document.getElementById("part-title").innerText = "Select a Component";
  document.getElementById("part-desc").innerText =
    "Click on the highlighted components of the robot to understand their role in the overall robotic system.";
}
