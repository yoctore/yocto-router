exports.fnA = function(req, res) {
  // to do fn A
  console.log('dans fn A');
  console.log(this.get());
  res.send(200).end();
};