// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
/*
const {ipcRenderer, remote} = require('electron')
const { Menu, MenuItem, dialog } = remote;
const fs = require('fs');

let currentFile = null; //当前文档保存的路径
let isSaved = true;     //当前文档是否已保存
let codeEditor = document.getElementById('codeEditor'); //获得TextArea文本框的引用



//监听与主进程的通信
ipcRenderer.on('action', (event, arg) => {
    switch(arg){        
    case 'new': //新建文件
        askSaveIfNeed();
        currentFile=null;
        codeEditor.value='';   
        document.title = "Python Editor - Untitled";
        isSaved=true;
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
            currentFile=files[0];
            const pyRead=readPython(currentFile);
            codeEditor.value=pyRead;
            document.title = "Python Editor - " + currentFile;
            isSaved=true;
        }
        break;
    case 'save': //保存文件
        openHandler();
        break;
    case 'save_as': //另存为
        saveCurrentDoc();
        break;
    case 'rename': //重命名
        saveCurrentDoc();
        break;
    case 'exiting':
        askSaveIfNeed();
        ipcRenderer.sendSync('reqaction', 'exit');
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
        const pySave=codeEditor.value;
        savePython(pySave, currentFile);
        isSaved=true;
        document.title = "Python Editor - " + currentFile;
    }
}

//如果需要保存，弹出保存对话框询问用户是否保存当前文档
function askSaveIfNeed(){
    if(isSaved) return;
    const response=dialog.showMessageBox(remote.getCurrentWindow(), {
        message: 'Do you want to save the current document?',
        type: 'question',
        buttons: [ 'Yes', 'No' ]
    });
    if(response==0) saveCurrentDoc(); //点击Yes按钮后保存当前文档
}
*/