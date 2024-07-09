var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/re', function(req, res, next) {
  res.render('indexe', { title: 'Express' });
});

module.exports = router;
