/* This should be pseudo random counter on purpose
*/
module.exports = function gedID() {
  let counter = 1234567890987;
  return function ID(){
    counter++;
    return counter.toString(36).substr(-8);
  }
}
