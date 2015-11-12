exports.notFound = function(req, res) {
  // to do fn A
  console.log('dans not found');
  res.status(400).send('Sorry cant find that!');
};

exports.systemError = function(err, req, res, next) {
  // to do fn A
  console.log('dans systemError');
  res.status(500).send('Sorry cant find that!');
};


exports.other = function(req, res) {
  // to do fn A
  console.log('dans other');
  res.send(200).end();
};

exports.other2 = function(req, res) {
  // to do fn A
  console.log('dans other2');
  res.send(200).end();
};

exports.end = function(req, res) {
  // to do fn A
  console.log('dans end');
  res.send(200).end();
};

exports.test1 = function(req, res) {
  // to do fn A
  console.log('dans test1');
  res.send(200).end();
};

exports.test2 = function(req, res) {
  // to do fn A
  console.log('dans test2');
  res.send(200).end();
};