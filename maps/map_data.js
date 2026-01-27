const MAP_DATA = {
  kitchen: `
    <svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#1a1f26"/>
      <defs><pattern id="g" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0L0 0 0 40" fill="none" stroke="#2a303c"/></pattern></defs>
      <rect width="100%" height="100%" fill="url(#g)"/>
      
      <rect class="obstacle" x="0" y="0" width="800" height="20" fill="#444"/>
      <rect class="obstacle" x="0" y="580" width="800" height="20" fill="#444"/>
      <rect class="obstacle" x="0" y="0" width="20" height="600" fill="#444"/>
      <rect class="obstacle" x="780" y="0" width="20" height="600" fill="#444"/>

      <g class="obstacle"><rect x="300" y="250" width="200" height="100" rx="8" fill="#2d3542" stroke="#555" stroke-width="2"/></g>
      <g class="obstacle"><rect x="20" y="20" width="200" height="80" fill="#2d3542" stroke="#555" stroke-width="2"/></g>
      <g class="obstacle"><rect x="630" y="20" width="150" height="80" fill="#2d3542" stroke="#555" stroke-width="2"/></g>
    </svg>
  `,

  livingroom: `
    <svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#1f1c1a"/>
      <defs><pattern id="g2" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0L0 0 0 40" fill="none" stroke="#302b28"/></pattern></defs>
      <rect width="100%" height="100%" fill="url(#g2)"/>
      
      <rect class="obstacle" x="0" y="0" width="800" height="20" fill="#444"/>
      <rect class="obstacle" x="0" y="580" width="800" height="20" fill="#444"/>
      <rect class="obstacle" x="0" y="0" width="20" height="600" fill="#444"/>
      <rect class="obstacle" x="780" y="0" width="20" height="600" fill="#444"/>

      <g class="obstacle"><rect x="250" y="250" width="300" height="120" rx="15" fill="#4e342e" stroke="#5d4037" stroke-width="2"/></g>
      <g class="obstacle"><rect x="250" y="20" width="300" height="60" fill="#212121" stroke="#424242"/></g>
      <g class="obstacle"><circle cx="80" cy="520" r="40" fill="#1b5e20"/></g>
      <g class="obstacle"><circle cx="720" cy="520" r="40" fill="#1b5e20"/></g>
    </svg>
  `,

  office: `
    <svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#182026"/>
      <defs><pattern id="g3" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0L0 0 0 40" fill="none" stroke="#25323d"/></pattern></defs>
      <rect width="100%" height="100%" fill="url(#g3)"/>
      
      <rect class="obstacle" x="0" y="0" width="800" height="20" fill="#444"/>
      <rect class="obstacle" x="0" y="580" width="800" height="20" fill="#444"/>
      <rect class="obstacle" x="0" y="0" width="20" height="600" fill="#444"/>
      <rect class="obstacle" x="780" y="0" width="20" height="600" fill="#444"/>

      <rect class="obstacle" x="100" y="100" width="200" height="150" fill="#37474f" stroke="#546e7a"/>
      <rect class="obstacle" x="500" y="100" width="200" height="150" fill="#37474f" stroke="#546e7a"/>
      <rect class="obstacle" x="100" y="350" width="200" height="150" fill="#37474f" stroke="#546e7a"/>
      <rect class="obstacle" x="500" y="350" width="200" height="150" fill="#37474f" stroke="#546e7a"/>
    </svg>
  `
};