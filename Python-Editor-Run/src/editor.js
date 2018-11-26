const {ipcRenderer, remote} = require('electron')
const { Menu, MenuItem, dialog } = remote;
const fs = require('fs');

var currentWindow  = remote.getCurrentWindow();
let currentFile = null; //当前文档保存的路径
let isSaved = true;     //当前文档是否已保存
let codeEditor = document.getElementById('codeEditor'); //获得TextArea文本框的引用
//初始化对象
var editor = ace.edit("codeEditor");
var session = editor.getSession();
//设置风格和语言（更多风格和语言，请到github上相应目录查看）
var theme = "monokai"
var language = "python"
editor.setTheme("ace/theme/" + theme);
editor.session.setMode("ace/mode/" + language);

//字体大小
editor.setFontSize(16);

//设置只读（true时只读，用于展示代码）
editor.setReadOnly(false); 

//自动换行,设置为off关闭
editor.setOption("wrap", "free")

//启用提示菜单
ace.require("ace/ext/language_tools");
editor.setHighlightActiveLine(true);
editor.resize();
editor.setOptions({
    enableBasicAutocompletion: true,// the editor completes the statement when you hit Ctrl + Space
    enableSnippets: true,
    enableLiveAutocompletion: true,// the editor completes the statement while you are typing
    showPrintMargin: false // hides the vertical limiting strip
});
editor.setValue("#Python Code here");

//监控文本框内容是否改变
editor.getSession().on('change', function(e) {
    if (isSaved) {
        document.title += " *";
        isSaved = false;
    }
});
document.title = "Python Editor - Untitled"; //设置文档标题，影响窗口标题栏名称

//监听与主进程的通信
ipcRenderer.on('action', (event, arg) => {
    switch(arg){        
    case 'new': //新建文件
        askSaveIfNeed();
        currentFile = null;
        editor.setValue("#Python Code here");  
        document.title = "Python Editor - Untitled";
        isSaved = true;
        break;
    case 'open': //打开文件
        askSaveIfNeed();
        const files = remote.dialog.showOpenDialog(remote.getCurrentWindow(), {
            filters: [
                { name: "Python Files", extensions: ['py'] }, 
                { name: 'All Files', extensions: ['*'] } ],
            properties: ['openFile']
        });
        if(files){
            currentFile = files[0];
            const pyRead = readPython(currentFile);
            editor.setValue(pyRead);
            document.title = "Python Editor - " + currentFile;
            isSaved = true;
        }
        break;
    case 'save': //保存文件
        saveCurrentDoc();
        break;
    case 'save_as': //另存为
        saveOtherCurrentDoc();
        break;
    case 'exiting':
        askSaveIfNeed();
        ipcRenderer.sendSync('reqaction', 'exit');
        break;
    case 'open_comlist':
        saveOtherCurrentDoc();
        break;
    case 'open_comwin':
        openComWin();
        break;
    case 'flash_esp32':
        flashEsp32();
        break;
    case 'flash_esp8266':
        flashEsp8266();
        break;
    }
});

//读取文本文件
function readPython(file){
    const fs = require('fs');
    return fs.readFileSync(file, 'utf8');
}
//保存文本内容到文件
function savePython(py, file){
    const fs = require('fs');
    fs.writeFileSync(file, py);
}

//保存当前文档
function saveCurrentDoc(){
    if(!currentFile){
        const file = remote.dialog.showSaveDialog(remote.getCurrentWindow(), {
            filters: [
                { name: "Python Files", extensions: ['py'] }, 
                { name: 'All Files', extensions: ['*'] } ]
        });
        if(file) currentFile=file;
    }
    if(currentFile){
        const pySave = editor.getValue();
        savePython(pySave, currentFile);
        isSaved = true;
        document.title = "Python Editor - " + currentFile;
    }
}
//当前文档另存为
function saveOtherCurrentDoc(){
    const file = remote.dialog.showSaveDialog(remote.getCurrentWindow(), {
        filters: [
            { name: "Python Files", extensions: ['py'] }, 
            { name: 'All Files', extensions: ['*'] } ]
    });
    if(file) currentFile = file;  
}

//如果需要保存，弹出保存对话框询问用户是否保存当前文档
function askSaveIfNeed(){
    if(isSaved) return;
    const response=dialog.showMessageBox(remote.getCurrentWindow(), {
        message: 'Do you want to save the current python code ?',
        type: 'question',
        buttons: [ 'Yes', 'No' ]
    });
    if(response==0) saveCurrentDoc(); //点击Yes按钮后保存当前文档
}

function openComWin(){
    window.open("./putty/putty.exe")
}

function flashEsp32(){

}

function flashEsp8266(){

}