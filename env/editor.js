var editor;
var outf;
var builtinRead;
var runit;
$(document).ready(function () {
    editor = CodeMirror.fromTextArea(document.getElementById('code'), {
        parserfile: ["parsepython.js"],
        autofocus: true,
        theme: "solarized dark",
        lineNumbers: true,
        textWrapping: false,
        indentUnit: 4,
        height: "160px",
        fontSize: "9pt",
        autoMatchParens: true,
        parserConfig: {'pythonVersion': 2, 'strictErrors': true},
    });

    outf = function outf(text) { 
        var mypre = document.getElementById("output"); 
        mypre.innerHTML = mypre.innerHTML + text; 
    } 

    builtinRead = function builtinRead(x) {
        if (Sk.builtinFiles === undefined || Sk.builtinFiles["files"][x] === undefined)
                throw "File not found: '" + x + "'";
        return Sk.builtinFiles["files"][x];
    }
    
    // Here's everything you need to run a python program in skulpt
    // grab the code from your textarea
    // get a reference to your pre element for output
    // configure the output function
    // call Sk.importMainWithBody()
    runit = function runit() { 
        var mypre = document.getElementById("output"); 
        mypre.innerHTML = ''; 
        Sk.pre = "output";
        Sk.configure({output:outf, read:builtinRead}); 
        eval(Sk.importMainWithBody("<stdin>",false,editor.getValue())); 
    } 
});
