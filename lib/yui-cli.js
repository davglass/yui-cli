#!/usr/bin/env node

var yui3 = require('yui3'),
    fs = require('fs'),
    cli = require('cli'),
    start = (new Date()).getTime();

cli.enable('status', 'help');
cli.parse({
    modules: ['m', 'Required: Comma seperated list of modules to pass to YUI().use()', 'string'],
    filter: ['f', 'The file type to produce: debug, raw, min', 'string', 'min'],
    file: [false, 'File to save JS output to', 'file', './combined.js'],
    cssfile: [false, 'File to save CSS output to', 'file', './combined.css'],
    version: ['v', 'The YUI version to use', 'string', '3.3.0'],
    gversion: ['gv', 'The Gallery version to use', 'string'],
    yui2: ['yui2', 'The YUI2 version to use', 'string', '2.8.0'],
    env: ['e', 'Modules that are already on the page.', 'string']
});

var parseUse = function(u) {
    u = u.replace(/ /g, '').split(',');
    return u;
}

cli.main(function() {
    if (!this.options.modules) {
        cli.getUsage();
        return;
    }

    var opts = this.options;

    var config = {
        m: opts.modules,
        v: opts.version,
        parse: true,
        filt: opts.filter,
        '2in3v': opts.yui2
    };
    if (opts.env) {
        config.env = opts.env;
    }
    if (opts.gversion) {
        config.gv = opts.gversion;
    }
    yui3.rls(config, function(js, css, data) {
        var sizes = {
            js: 0,
            css: 0
        };
        if (opts.file) {
            var d = [];
            js.forEach(function(k) {
                sizes.js += data[k].length;
                d.push(data[k]);
            });
            fs.writeFileSync(opts.file, d.join('\n'), encoding='utf8');
        }
        if (opts.cssfile) {
            var d = [];
            css.forEach(function(k, v) {
                sizes.css += data[k].length;
                d.push(data[k]);
            });
            fs.writeFileSync(opts.cssfile, d.join('\n'), encoding='utf8');
        }
        console.log('Combined %s JS files ~(%s bytes) saved to: %s', js.length, sizes.js, opts.file);
        console.log('Combined %s CSS files ~(%s bytes) saved to: %s', css.length, sizes.css, opts.cssfile);
        console.log('Build Time: %sms', (new Date()).getTime() - start);
    });
    
});
