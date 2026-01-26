export const scenarios = {
  kitchen: {
    name: "Kitchen",
    mapClass: "kitchen",
    fire: { top: 30, left: 65 },
    patrol: [
      { top: 70, left: 20 },
      { top: 50, left: 40 },
      { top: 40, left: 70 }
    ]
  },

  lab: {
    name: "Laboratory",
    mapClass: "lab",
    fire: { top: 25, left: 55 },
    patrol: [
      { top: 80, left: 20 },
      { top: 60, left: 60 },
      { top: 30, left: 40 }
    ]
  },

  room: {
    name: "Room",
    mapClass: "room-map",
    fire: { top: 40, left: 70 },
    patrol: [
      { top: 70, left: 30 },
      { top: 50, left: 50 },
      { top: 30, left: 60 }
    ]
  }
};
