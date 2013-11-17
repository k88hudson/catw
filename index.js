var globwatcher = require('globwatcher').globwatcher;
var glob = require('glob');
var through = require('through');
var EventEmitter = require('events').EventEmitter;
var fs = require('fs');

module.exports = function (patterns, opts, cb) {
    if (typeof opts === 'function' || !opts) {
        cb = opts;
        opts = {}
    }
    if (!opts) opts = {};
    
    var cat = new EventEmitter;
    var s = concat(function () {
        if (opts.watch !== false) {
            watcher(function () {
                cat.emit('stream', concat());
            })
        }
    });
    if (cb) cat.on('stream', cb);
    process.nextTick(function () {
        cat.emit('stream', s);
    });
    return cat;
    
    function concat (cb) {
        var stream = through();
        
        (function nextPattern (index) {
            if (index >= patterns.length) {
                stream.queue(null);
                return cb && cb();
            }
            
            glob(patterns[index], function (err, files) {
                if (err) files = [];
                files.sort();
                (function nextFile () {
                    if (files.length === 0) return nextPattern(index + 1);
                    
                    var file = files.shift();
                    var rs = fs.createReadStream(file);
                    rs.on('error', function (err) { stream.emit('error', err) });
                    
                    rs.pipe(stream, { end: false });
                    rs.on('data', function () {});
                    rs.on('end', nextFile);
                })();
            });
        })(0);
        
        return stream;
    }
    
    function watcher (cb) {
        var w = globwatcher(patterns);
        w.on('added', cb);
        w.on('deleted', cb);
        w.on('changed', cb);
    }
};
