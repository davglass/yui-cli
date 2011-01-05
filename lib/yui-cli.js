#!/usr/bin/env node

var YUI = require('yui3').YUI;
var fs = require('fs');

var cli = require('cli');

cli.enable('status', 'help');
cli.parse({
    use: ['u', 'Required: Comma seperated list of modules to pass to YUI().use()', 'string'],
    type: ['t', 'The file type to produce: debug, raw, min', 'string', 'min'],
    file: [false, 'File to save output to', 'file', './combined.js'],
    joinwith: ['j', 'The character to join the files with', 'string', '\n']
});

var parseUse = function(u) {
    u = u.replace(/ /g, '').split(',');
    return u;
}

cli.main(function() {
    if (!this.options.use) {
        cli.getUsage();
        return;
    }
    this.options.use = parseUse(this.options.use);

    delete YUI.GlobalConfig.modules;
    YUI.GlobalConfig.debug = false;
    YUI.GlobalConfig.loaderPath = YUI.GlobalConfig.loaderPath.replace('-debug', '-min');

    var files = [YUI.GlobalConfig.base + 'yui/yui-min.js'];
    var content = [];
    var opts = this.options;

    var inc = YUI.include;
    YUI.include = function(file, cb) {
        files.push(file);
        if (file.indexOf('loader') > 0) {
            inc(file, function(err, data) {
                cb(null, function() {});
            });
        } else {
            cb(null, function() {});
        }
    }

    cli.info('Using the following modules: ' + this.options.use.join(','));
    var u = this.options.use;
    u.push(function(Y) {
        cli.debug('Use callback finished');
        files.forEach(function(v, k) {
            if (opts.type) {
                cli.debug('Converting file to: ' + opts.type);
                var r = ((opts.type === 'raw') ? '' : '-' + opts.type);
                v = v.replace('-min', r);
            }
            cli.debug(v);
            content.push(fs.readFileSync(v, 'utf-8'));
        });
        fs.writeFileSync(opts.file, content.join(opts.joinwith), 'utf-8');
        cli.ok('File (' + opts.file + ') written.');
    });
    cli.debug('Creating YUI Instance');
    var Y = YUI();
    cli.debug('Calling Use');
    Y.use.apply(Y, u);
});
