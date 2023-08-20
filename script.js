const INCOME = "income";
const RATE = "rate";
const RATIO = "ratio";
const STEPS = 21; // 21 * 21 * 21 = 9,261 data points
const VARIANCE = 0.2; // range +/- user provided values

let incomeChartInstance;
let rateChartInstance;
let ratioChartInstance;

function calculate() {
  const incomeElem = document.getElementById(INCOME);
  const rateElem = document.getElementById(RATE);
  const ratioElem = document.getElementById(RATIO);
  const resultElem = document.getElementById("result");
  const spinner = document.getElementById("loadingSpinner");
  const calculateButton = document.getElementById("calculateButton");

  const income = parseFloat(incomeElem.value);
  const annualRate = parseFloat(rateElem.value) / 100;
  const ratio = parseFloat(ratioElem.value) / 100;

  if (isNaN(income) || isNaN(annualRate) || isNaN(ratio)) {
    resultElem.innerText = "Please enter valid numbers for all fields.";
    return;
  }

  calculateButton.style.display = "none";
  spinner.style.display = "block";

  // Use setTimeout to defer computation, allowing the event loop to update the UI before proceeding.
  setTimeout(() => {
    const estimate = calculateHomePrice(income, annualRate, ratio);
    const result = "Estimated Home Price: " + formatEstimate(estimate);
    resultElem.innerText = result;

    const incomeCanvasElem = document.getElementById("incomeChart");
    const incomeSensitivities = generateSensitivityData(
      income,
      VARIANCE,
      STEPS
    );

    const rateCanvasElem = document.getElementById("rateChart");
    const annualRateSensitivities = generateSensitivityData(
      annualRate,
      VARIANCE,
      STEPS
    );

    const ratioCanvasElem = document.getElementById("ratioChart");
    const ratioSensitivities = generateSensitivityData(ratio, VARIANCE, STEPS);

    const data = generateDataSet(
      incomeSensitivities,
      annualRateSensitivities,
      ratioSensitivities
    );

    if (incomeChartInstance) {
      incomeChartInstance.destroy();
    }

    incomeChartInstance = renderScatterPlot(incomeCanvasElem, {
      label: "Income Sensitivity",
      datapoints: data.map(({ income, price }) => ({ x: income, y: price })),
    });

    if (rateChartInstance) {
      rateChartInstance.destroy();
    }

    rateChartInstance = renderScatterPlot(rateCanvasElem, {
      label: "Rate Sensitivity",
      datapoints: data.map(({ rate, price }) => ({ x: rate, y: price })),
    });

    if (ratioChartInstance) {
      ratioChartInstance.destroy();
    }

    ratioChartInstance = renderScatterPlot(ratioCanvasElem, {
      label: "Ratio Sensitivity",
      datapoints: data.map(({ ratio, price }) => ({ x: ratio, y: price })),
    });

    spinner.style.display = "none";
    calculateButton.style.display = "block";
  }, 0);
}

function calculateHomePrice(income, annualRate, ratio = 0.28) {
  const monthlyRate = annualRate / 12;
  const maxPayment = ratio * income;

  let guess = maxPayment / monthlyRate;
  let iterationCount = 0;

  while (iterationCount < 1000) {
    let f =
      (guess * monthlyRate * Math.pow(1 + monthlyRate, 360)) /
        (Math.pow(1 + monthlyRate, 360) - 1) -
      maxPayment;
    let fPrime =
      (monthlyRate * Math.pow(1 + monthlyRate, 360)) /
        (Math.pow(1 + monthlyRate, 360) - 1) -
      (monthlyRate * guess * 360 * Math.pow(1 + monthlyRate, 359)) /
        Math.pow(Math.pow(1 + monthlyRate, 360) - 1, 2);
    let nextGuess = guess - f / fPrime;

    if (Math.abs(nextGuess - guess) < 0.01) {
      break;
    }

    guess = nextGuess;
    iterationCount++;
  }

  return guess;
}

function formatEstimate(estimate) {
  return estimate.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function renderScatterPlot(canvasElem, data) {
  canvasElem.parentNode.style.display = "block";
  return new Chart(canvasElem, {
    type: "scatter",
    data: {
      datasets: [
        {
          label: data.label,
          data: data.datapoints, // Expected to be an array of { x: , y: } objects
          borderColor: "rgba(255, 215, 0, 1)",
          pointBackgroundColor: "rgba(255, 215, 0, 1)",
          fill: false,
          showLine: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          ticks: {
            color: "#e8e9eb",
          },
          grid: {
            color: "#555",
          },
        },
        y: {
          ticks: {
            color: "#e8e9eb",
          },
          grid: {
            color: "#555",
          },
        },
      },
      plugins: {
        legend: {
          labels: {
            color: "#e8e9eb",
          },
        },
        tooltip: {
          enabled: false,
        },
      },
    },
  });
}

function renderLineChart(canvasElem, data) {
  canvasElem.parentNode.style.display = "block";
  return new Chart(canvasElem, {
    type: "line",
    data: {
      labels: data.labels,
      datasets: [
        {
          label: data.label, // array of labels
          data: data.datapoints, // array for y axis
          borderColor: "rgba(255, 215, 0, 1)",
          pointBackgroundColor: "rgba(255, 215, 0, 1)",
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          ticks: {
            color: "#e8e9eb",
          },
          grid: {
            color: "#555",
          },
        },
        y: {
          ticks: {
            color: "#e8e9eb",
          },
          grid: {
            color: "#555",
          },
        },
      },
      plugins: {
        legend: {
          labels: {
            color: "#e8e9eb",
          },
        },
        tooltip: {
          backgroundColor: "rgba(32, 36, 40, 0.8)",
        },
      },
    },
  });
}

function generateSensitivityData(baseValue, variancePercent, steps) {
  const stepSize = (2 * variancePercent * baseValue) / steps;
  const startValue = baseValue - variancePercent * baseValue;
  const values = [];

  for (let i = 0; i <= steps; i++) {
    values.push(startValue + stepSize * i);
  }

  return values;
}

function generateDataSet(
  incomeSensitivities,
  rateSensitivities,
  ratioSensitivities
) {
  const dataPoints = [];

  incomeSensitivities.forEach((income) => {
    rateSensitivities.forEach((rate) => {
      ratioSensitivities.forEach((ratio) => {
        const price = calculateHomePrice(income, rate, ratio);
        dataPoints.push({ income, rate, ratio, price });
      });
    });
  });

  return dataPoints;
}
