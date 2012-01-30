YUI Command Line File Combiner
==============================

Simple command line tool to combine all the files needed for a stock YUI instance.

This app is suitable for build system deployment purposes. I wrote it while making some browser extensions, where I needed YUI, but was not allowed to dynamically load the library.

Install
-------

    npm install yui-cli


Usage
-----

    yui-cli --use dd,editor,autocomplete --file=deploy.js --type=min
    
    yui-cli --use dd,editor,autocomplete,console --file=develop.js --type=debug


    cd examples
    yui-cli -m autocomplete,dd,node,editor,baz, -e yui-base,oop,features,get,frame -f raw -M ./meta.json


TODO
----

Support `--version`
Support custom modules
