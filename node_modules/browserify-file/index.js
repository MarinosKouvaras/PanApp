var through = require('through2');
var minify = require('html-minifier').minify;

module.exports = function(opt) {
    opt = opt || {};

    return function browserify_file(file) {
        if (!/\.html/.test(file)) {
            return through();
        }

        var source = '';
        var stream = through(function(chunk, enc, cb) {
            source += chunk.toString();
            cb();
        }, function(cb) {
            if (opt.minify) {
                source = minify(source, opt.minify);
            }

            source = source.replace(/'/g, '\\\'');
            this.push('module.exports=\'' + source + '\';');
            cb();
        });

        return stream;
    };
};
