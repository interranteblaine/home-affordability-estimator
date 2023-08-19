function calculate() {
  const incomeElem = document.getElementById("income");
  const rateElem = document.getElementById("rate");
  const ratioElem = document.getElementById("ratio");
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

  console.log(iterationCount);

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
