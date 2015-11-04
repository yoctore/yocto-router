exports.fnA = function(req, res) {
  // to do fn A
  console.log('dans fn A');
  console.log(this.get('render'));
  res.send(200).end();
};