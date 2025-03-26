self.addEventListener("message", event => {
  // A sample heavy computation: summing an array of numbers
  let countTill = event.data;
  // Execute the function and send its result
  console.log("countTill, worker in src dir ", countTill);
  const result = countLong(countTill);
  self.postMessage(result);
});

function countLong(countTill) {
  let sum = 0;
  for (let i = 0; i < countTill; i++) {
    sum += i;
  }
  return sum;
}
