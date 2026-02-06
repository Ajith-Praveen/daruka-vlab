const viewer = document.getElementById("robotViewer");
const initialCamera = { orbit: "-65deg 85deg 0.8m", target: "0m 0.08m 0m" };

const components = {
  camera: { title: "Vision Camera Module", icon: "📷", sub: "Raspberry Pi Camera", desc: "The Raspberry Pi Camera Module serves as the primary visual sensing unit. It captures real-time images for fire detection using computer vision algorithms, enabling autonomous identification of fire sources.", orbit: "-90deg 80deg 0.35m", target: "-0.08m 0.15m 0.02m" },
  flame: { title: "Flame Sensor Array", icon: "🔥", sub: "5-Channel IR Sensor", desc: "5-channel flame sensor module detects the presence and direction of fire using infrared sensing. Each channel monitors flame intensity from a different angle for directional estimation.", orbit: "-60deg 85deg 0.4m", target: "-0.12m 0.04m 0.01m" },
  rp5: { title: "Raspberry Pi 5", icon: "🧠", sub: "Main Controller", desc: "Central processing unit coordinating all sensing, decision-making, and actuation. Runs YOLOv8 inference, navigation logic, and FSM controller in real time.", orbit: "-168deg 78.14deg 0.3621m", target: "-0.05m 0.05m -0.04m" },
  pca: { title: "PCA9685 Driver", icon: "⚡", sub: "I²C Servo Controller", desc: "Servo motor driver communicating via I²C protocol. Generates PWM signals for precise servo operation — nozzle positioning and actuation mechanisms.", orbit: "-171.5deg 46.66deg 0.25m", target: "0.01m 0.04m -0.0m" },
  fe: { title: "Aerosol Extinguisher", icon: "🧯", sub: "Fire Suppression Unit", desc: "Releases aerosol-based agent that suppresses flames by interrupting combustion chemical reactions. Compact and suitable for enclosed hazardous environments.", orbit: "-126.3deg 71.84deg 0.3621m", target: "0.06m 0.1m -0.03m" },
  extinguisher_motor: { title: "Piston Motor", icon: "⚙️", sub: "Linear Actuator", desc: "Actuates the linear motion to press the aerosol extinguisher nozzle with precision, ensuring consistent and reliable discharge of the extinguishing agent.", orbit: "-48.79deg 86.8deg 0.3711m", target: "-0.10m 0.09m 0.01m" },
  piston: { title: "Piston Module", icon: "🔧", sub: "Mechanical Actuation", desc: "Generates controlled linear motion to activate the fire extinguisher. Works with the piston motor for precise, repeatable operation.", orbit: "-180.2deg 82.02deg 0.3621m", target: "-0.02m 0.09m -0.01m" },
  nm: { title: "Nozzle Motor", icon: "🎯", sub: "Aim Controller", desc: "Controls nozzle orientation to direct extinguishing agent toward the fire source based on sensor and vision feedback.", orbit: "-125.5deg 95deg 0.3621m", target: "-0.02m 0.09m -0.01m" },
  nozzle: { title: "Nozzle", icon: "💨", sub: "Spray Outlet", desc: "Terminal component directing the aerosol agent toward fire. Integrated with nozzle motor and piston for precise aiming and controlled discharge.", orbit: "-33.04deg 80.05deg 0.3621m", target: "-0.13m 0.10m -0.03m" },
  w_m: { title: "Wheels & Motors", icon: "🛞", sub: "Drive System", desc: "DC motors convert electrical energy into rotational motion, driving wheels for autonomous navigation toward fire sources with controlled speed and direction.", orbit: "-45.25deg 112.8deg 0.5677m", target: "-0.06m 0.03m 0.08m" },
  md: { title: "L298 Motor Driver", icon: "🔌", sub: "DC Motor H-Bridge", desc: "H-bridge motor driver interfacing low-power controller signals with high-current motors. Enables forward, reverse, and differential motion control.", orbit: "9.443deg 161.1deg 0.4118m", target: "-0.09m -0.02m 0.02m" },
  chasis: { title: "Body Chassis", icon: "🏗️", sub: "Structural Frame", desc: "Structural framework supporting all mechanical, electronic, and sensing components. Designed for strength, stability, and protection.", orbit: "-56.27deg 84.43deg 0.5987m", target: "-0.07m 0.08m 0.01m" },
  battery: { title: "LiPo Battery", icon: "🔋", sub: "3300mAh Power", desc: "Primary power source providing stable, high-energy output for the controller, sensors, motors, and actuation systems.", orbit: "-86.95deg 172.1deg 0.5765m", target: "0.0m 0.0m -0.01m" }
};

// Build sidebar list
const listEl = document.getElementById('compList');
let activeKey = null;

Object.entries(components).forEach(([key, c]) => {
  const item = document.createElement('div');
  item.className = 'comp-item';
  item.dataset.key = key;
  item.innerHTML = `<span class="ci-icon">${c.icon}</span><div><div class="ci-name">${c.title}</div><div class="ci-sub">${c.sub}</div></div>`;
  item.addEventListener('click', () => focusComponent(key));
  listEl.appendChild(item);
});

function focusComponent(key) {
  const comp = components[key];
  if (!comp) return;

  activeKey = key;
  document.getElementById('partTitle').innerText = comp.title;
  document.getElementById('partDesc').innerText = comp.desc;

  viewer.cameraOrbit = comp.orbit;
  viewer.cameraTarget = comp.target;

  document.querySelectorAll('.comp-item').forEach(el => {
    el.classList.toggle('active', el.dataset.key === key);
  });
}

viewer.addEventListener('click', (e) => {
  if (e.target.tagName === 'MODEL-VIEWER') resetView();
});

function resetView() {
  activeKey = null;
  viewer.cameraOrbit = initialCamera.orbit;
  viewer.cameraTarget = initialCamera.target;
  document.getElementById('partTitle').innerText = 'Select a Component';
  document.getElementById('partDesc').innerText = 'Tap on any highlighted hotspot on the 3D model or choose from the list above.';
  document.querySelectorAll('.comp-item').forEach(el => el.classList.remove('active'));
}
