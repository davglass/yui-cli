#!/usr/bin/env node

var YUI = require('yui').YUI,
    fs = require('fs'),
    path = require('path'),
    url = require('url'),
    http = require('http'),
    cli = require('cli'),
    start = (new Date()).getTime();

cli.enable('help');
cli.parse({
    modules: ['m', 'Required: Comma seperated list of modules to pass to YUI().use()', 'string'],
    filter: ['f', 'The file type to produce: debug, raw, min', 'string', 'min'],
    file: [false, 'File to save JS output to', 'file', './combined.js'],
    cssfile: [false, 'File to save CSS output to', 'file', './combined.css'],
    version: ['v', 'The YUI version to use', 'string', '3.5.0'],
    gversion: ['gv', 'The Gallery version to use', 'string'],
    yui2: ['yui2', 'The YUI2 version to use', 'string', '2.8.0'],
    env: ['e', 'Modules that are already on the page.', 'string'],
    meta: ['M', 'External module meta data JSON file.', 'file']
});

var parseUse = function(u) {
    u = u.replace(/ /g, '').split(',');
    return u;
}

var outData = {
    js: [],
    css: []
};


var fetchHTTP = function(file, cb) {
    var u = url.parse(file);
    http.get({
        host: u.host,
        path: u.path
    }, function(res) {
        var data = '';
        res.on('data', function(d) {
            data += d;
        });
        res.on('end', function() {
            cb(data);
        });
    });
};

var fetchFile = function(file, cb) {
    var p = path.normalize(path.join(process.cwd(), file));
    fs.readFile(p, 'utf8', function(err, data) {
        cb(data);
    });
}

var fetch = function(path, cb) {
    if (path.match(/^https?:\/\//)) {
        fetchHTTP(path, cb);
    } else {
        fetchFile(path, cb);
    }
};

var noop = function() {};

cli.main(function() {
    if (!this.options.modules) {
        cli.getUsage();
        return;
    }

    var opts = this.options;

    if (opts.modules) {
        opts.modules = opts.modules.replace(/ /, '').split(',');
    }
    if (opts.env) {
        opts.env = opts.env.replace(/ /, '').split(',');
    }
    
    if (opts.meta) {
        var p = path.normalize(path.join(process.cwd(), opts.meta));
        if (path.existsSync(p)) {
            opts.meta = require(p);
        } else {
            console.error('Failed to resolve: ', p);
            process.exit(1);
        }
    }
    console.log(opts);

    var Y = YUI({useSync: true}).use('parallel');
    var loaderConfig = {
        ignoreRegistered: true,
        filter: opts.filter,
        require: opts.modules
    };
    if (opts.env) {
        loaderConfig.ignore = opts.env;
    }
    if (opts.meta) {
        loaderConfig.modules = opts.meta;
    }
    var loader = new Y.Loader(loaderConfig);

    var out = loader.resolve(true);
    
    console.log('Loader resolved ' + out.js.length + ' JS files and ' + out.css.length + ' CSS files. Fetching..');
    var stack = new Y.Parallel();
    
    out.js.forEach(function(v, k) {
        fetch(v, stack.add(function(file, key) {
            return function(data) {
                outData.js[key] = data;
            }
        }(v, k)));
    });

    out.css.forEach(function(v, k) {
        fetch(v, stack.add(function(file, key) {
            return function(data) {
                outData.css[key] = data;
            }
        }(v, k)));
    });

    stack.done(function() {
        console.log('All Files Fetched, combining..');

        if (outData.js.length) {
            var p = path.normalize(path.join(process.cwd(), opts.file));
            console.log('Writing JS to: ', p);
            fs.writeFileSync(p, outData.js.join('\n'), 'utf8');
        }

        if (outData.css.length) {
            var p = path.normalize(path.join(process.cwd(), opts.cssfile));
            console.log('Writing CSS to: ', p);
            fs.writeFileSync(p, outData.css.join('\n'), 'utf8');
        }
    });
    

});
