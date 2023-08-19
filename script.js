const INCOME = "income";
const RATE = "rate";
const RATIO = "ratio";

let incomeChartInstance;
let rateChartInstance;
let ratioChartInstance;

function calculate() {
  const incomeElem = document.getElementById(INCOME);
  const rateElem = document.getElementById(RATE);
  const ratioElem = document.getElementById(RATIO);
  const resultElem = document.getElementById("result");

  const income = parseFloat(incomeElem.value);
  const annualRate = parseFloat(rateElem.value) / 100;
  const ratio = parseFloat(ratioElem.value) / 100;

  if (isNaN(income) || isNaN(annualRate) || isNaN(ratio)) {
    resultElem.innerText = "Please enter valid numbers for all fields.";
    return;
  }

  const estimate = calculateHomePrice(income, annualRate, ratio);
  const result = "Estimated Home Price: " + formatEstimate(estimate);
  resultElem.innerText = result;

  const incomeCanvasElem = document.getElementById("incomeChart");
  const incomeSensitivities = generateSensitivityData(income, 0.2, 10);
  const incomeDerivatives = incomeSensitivities.map((incomeData) =>
    calculateDerivative(incomeData, annualRate, ratio, INCOME)
  );

  const rateCanvasElem = document.getElementById("rateChart");
  const annualRateSensitivities = generateSensitivityData(annualRate, 0.2, 10);
  const annualRateDerivatives = annualRateSensitivities.map((annualRateData) =>
    calculateDerivative(income, annualRateData, ratio, RATE)
  );

  const ratioCanvasElem = document.getElementById("ratioChart");
  const ratioSensitivities = generateSensitivityData(ratio, 0.2, 10);
  const ratioDerivatives = ratioSensitivities.map((ratioData) =>
    calculateDerivative(income, annualRate, ratioData, RATIO)
  );

  console.log(
    JSON.stringify({
      enteredIncome: income,
      enteredAnnualRate: annualRate,
      enteredRatio: ratio,
      incomeSensitivities: incomeSensitivities,
      incomeDerivatives: incomeDerivatives,
      annualRateSensitivities: annualRateSensitivities,
      annualRateDerivatives: annualRateDerivatives,
      ratioSensitivities: ratioSensitivities,
      ratioDerivatives: ratioDerivatives,
    })
  );

  if (incomeChartInstance) {
    incomeChartInstance.destroy();
  }

  incomeChartInstance = renderLineChart(incomeCanvasElem, {
    label: "Income Sensitivity (Derivative)",
    labels: incomeSensitivities.map((value) => `$${value.toFixed(2)}`),
    datapoints: incomeDerivatives,
  });

  if (rateChartInstance) {
    rateChartInstance.destroy();
  }

  rateChartInstance = renderLineChart(rateCanvasElem, {
    label: "Annual Rate Sensitivity (Derivative)",
    labels: annualRateSensitivities.map(
      (value) => `${(value * 100).toFixed(2)}%`
    ),
    datapoints: annualRateDerivatives,
  });

  if (ratioChartInstance) {
    ratioChartInstance.destroy();
  }

  ratioChartInstance = renderLineChart(ratioCanvasElem, {
    label: "Expense Ratio Sensitivity (Derivative)",
    labels: ratioSensitivities.map((value) => `${(value * 100).toFixed(2)}%`),
    datapoints: ratioDerivatives,
  });
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

function renderLineChart(canvasElem, data) {
  canvasElem.parentNode.style.display = "block";
  return new Chart(canvasElem, {
    type: "line",
    data: {
      labels: data.labels,
      datasets: [
        {
          label: data.label,
          data: data.datapoints,
          borderColor: "rgba(255, 215, 0, 1)", // using the gold accent color
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

function calculateDerivative(incomeBase, rateBase, ratioBase, variable) {
  const h = variable === INCOME ? 1 : 0.0001;
  const income = variable === INCOME ? incomeBase + h : incomeBase;
  const rate = variable === RATE ? rateBase + h : rateBase;
  const ratio = variable === RATIO ? ratioBase + h : ratioBase;

  const valueAtBase = calculateHomePrice(incomeBase, rateBase, ratioBase);

  const valueAtIncrement = calculateHomePrice(income, rate, ratio);

  return (valueAtIncrement - valueAtBase) / h;
}
