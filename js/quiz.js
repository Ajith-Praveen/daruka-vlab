/* ===== quiz.js — DARUKA VLab MCQ Quiz ===== */

var QUESTIONS = [
  {
    q: "What AI model is used for fire detection in the DARUKA robot?",
    opts: ["YOLOv5", "YOLOv8", "ResNet-50", "SSD MobileNet"],
    ans: 1,
    explain: "DARUKA uses YOLOv8 (Ultralytics) for real-time fire detection with bounding boxes and confidence scores."
  },
  {
    q: "What type of fire extinguishing agent does the DARUKA robot use?",
    opts: ["Water spray", "Foam", "Aerosol-based agent", "Dry chemical powder"],
    ans: 2,
    explain: "The robot uses a compact aerosol fire extinguisher that suppresses flames by interrupting combustion."
  },
  {
    q: "How many states does the DARUKA robot's Finite State Machine (FSM) have?",
    opts: ["4", "5", "6", "7"],
    ans: 3,
    explain: "The FSM has 7 states: IDLE → DETECT → NAVIGATE → AIM → EXTINGUISH → VERIFY → COMPLETE."
  },
  {
    q: "Which controller serves as the central processing unit of the robot?",
    opts: ["Arduino Mega", "ESP32", "Raspberry Pi 5", "STM32"],
    ans: 2,
    explain: "The Raspberry Pi 5 handles all sensing, decision-making, and actuation control."
  },
  {
    q: "What does 'Glass-Box AI' mean in the context of the fire detection experiment?",
    opts: [
      "The AI model is hidden from the user",
      "Learners can see detection results, confidence, and thresholds",
      "The robot has a transparent enclosure",
      "The model uses transparent neural networks"
    ],
    ans: 1,
    explain: "Glass-Box AI means the detection process is explainable — learners see bounding boxes, confidence scores, and can adjust the threshold."
  },
  {
    q: "What communication protocol does the PCA9685 servo driver use?",
    opts: ["SPI", "UART", "I²C", "CAN Bus"],
    ans: 2,
    explain: "The PCA9685 communicates with the main controller via the I²C protocol."
  },
  {
    q: "What is the purpose of the VERIFY state in the FSM?",
    opts: [
      "Verify battery level",
      "Re-scan the area for residual fire",
      "Verify motor calibration",
      "Check network connectivity"
    ],
    ans: 1,
    explain: "After extinguishing, the robot re-scans the area to ensure no residual fire remains before declaring mission complete."
  },
  {
    q: "Which motor driver module controls the DC drive motors?",
    opts: ["PCA9685", "L298", "A4988", "DRV8825"],
    ans: 1,
    explain: "The L298 H-bridge motor driver controls speed and direction of the DC drive motors."
  },
  {
    q: "What type of sensor array detects fire direction on the robot?",
    opts: [
      "Ultrasonic array",
      "5-channel infrared flame sensor",
      "LIDAR scanner",
      "Thermal camera"
    ],
    ans: 1,
    explain: "A 5-channel IR flame sensor detects fire from multiple angles to estimate direction."
  },
  {
    q: "What happens if a YOLOv8 detection falls below the confidence threshold?",
    opts: [
      "The robot immediately extinguishes",
      "The detection is logged but no action is taken",
      "The robot shuts down",
      "The threshold is automatically lowered"
    ],
    ans: 1,
    explain: "Detections below the confidence threshold are flagged but do not trigger fire response, demonstrating the importance of threshold tuning."
  }
];

/* ===== Render Quiz ===== */
function renderQuiz() {
  var container = document.getElementById('quizContainer');
  var html = '';

  QUESTIONS.forEach(function(q, i) {
    html += '<div class="quiz-card" id="qcard-' + i + '">';
    html += '<div class="q-num">Question ' + (i + 1) + ' of ' + QUESTIONS.length + '</div>';
    html += '<div class="q-text">' + q.q + '</div>';
    html += '<div class="quiz-options">';
    q.opts.forEach(function(opt, j) {
      html += '<div class="quiz-opt" data-q="' + i + '" data-opt="' + j + '" onclick="selectOption(' + i + ',' + j + ')">' + opt + '</div>';
    });
    html += '</div>';
    html += '<div class="quiz-feedback" id="fb-' + i + '"></div>';
    html += '</div>';
  });

  container.innerHTML = html;
}

var userAnswers = {};

function selectOption(qIdx, optIdx) {
  /* Remove previous selection for this question */
  var opts = document.querySelectorAll('.quiz-opt[data-q="' + qIdx + '"]');
  opts.forEach(function(o) { o.classList.remove('selected'); });

  /* Mark selected */
  var sel = document.querySelector('.quiz-opt[data-q="' + qIdx + '"][data-opt="' + optIdx + '"]');
  if (sel) sel.classList.add('selected');

  userAnswers[qIdx] = optIdx;
}

/* ===== Submit & Grade ===== */
document.getElementById('submitQuiz').onclick = function() {
  var score = 0;

  QUESTIONS.forEach(function(q, i) {
    var opts = document.querySelectorAll('.quiz-opt[data-q="' + i + '"]');
    var fb = document.getElementById('fb-' + i);
    var userAns = userAnswers[i];

    opts.forEach(function(o) {
      o.classList.add('disabled');
      var oi = parseInt(o.getAttribute('data-opt'));
      if (oi === q.ans) {
        o.classList.add('correct');
      }
      if (userAns === oi && oi !== q.ans) {
        o.classList.add('wrong');
      }
    });

    if (userAns === q.ans) {
      score++;
      fb.textContent = '✓ Correct! ' + q.explain;
      fb.className = 'quiz-feedback show correct-fb';
    } else if (userAns !== undefined) {
      fb.textContent = '✗ Incorrect. ' + q.explain;
      fb.className = 'quiz-feedback show wrong-fb';
    } else {
      fb.textContent = '⚠ Not answered. ' + q.explain;
      fb.className = 'quiz-feedback show wrong-fb';
    }
  });

  /* Show result */
  var result = document.getElementById('quizResult');
  result.style.display = 'block';
  document.getElementById('scoreNum').textContent = score + '/' + QUESTIONS.length;

  var pct = Math.round((score / QUESTIONS.length) * 100);
  var msg = pct >= 80 ? 'Excellent! You have a strong understanding of the system.' :
            pct >= 50 ? 'Good effort! Review the architecture and experiments for improvement.' :
            'Keep learning! Explore the experiments and architecture pages.';
  document.getElementById('scoreMsg').textContent = msg;

  /* Hide submit button */
  document.getElementById('submitQuiz').style.display = 'none';

  /* Scroll to result */
  result.scrollIntoView({ behavior: 'smooth' });
};

/* Init */
renderQuiz();
