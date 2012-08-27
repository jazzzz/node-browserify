var connect = require('connect');
var http = require('http');
var fs = require('fs');
var path = require('path');
var test = require('tap').test;

test('watch', function (t) {
    t.plan(3);
    
    var port = 10000 + Math.floor(Math.random() * (Math.pow(2,16) - 10000));
    var server = connect.createServer();
    
    var bundle = require('../')({
        require : path.resolve(__dirname, 'watch/b.js'),
        mount : '/bundle.js',
        watch : { interval : 100 }
    });
    server.use(bundle);
    
    server.use(connect.static(path.resolve(__dirname, 'watch')));
    
    server.listen(port, function () {
        setTimeout(compareSources, 1000);
    });
    
    function getBundle (cb) {
        var req = { host : 'localhost', port : port, path : '/bundle.js' };
        setTimeout(function () {
            http.get(req, function (res) {
                t.equal(res.statusCode, 200);
                
                var src = '';
                res.on('data', function (buf) {
                    src += buf.toString();
                });
                
                res.on('end', function () {
                    cb(src);
                });
            });
        }, 150);
    }
    
    function compareSources () {
        getBundle(function (s1) {
            fs.writeFileSync(
                path.resolve(__dirname, 'watch/b.js'),
                "var c = require( './c' );"
            );
            getBundle(function (s2) {
                t.equal(s1, s2);
                server.close();
                t.end();
            });
            
        });
    }
});
