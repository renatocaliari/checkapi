var crypto = require('crypto');

exports.randomText = function (length){
    var firstHalf, secondHalf,
    	random,
    	hash = crypto.createHmac('sha1', 'api-test').update(new Date().getTime().toString() + (Math.random() * length).toString()).digest('hex');
    	firstHalf = hash.slice(0,length);
    	secondHalf = hash.slice(length);
    return firstHalf + ' ' + secondHalf;
}