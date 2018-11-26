// Modules to control application life and create native browser window
const electron = require('electron')
const app = electron.app
const BrowserWindow = electron.BrowserWindow
const Menu = electron.Menu
const MenuItem = electron.MenuItem
const ipcMain = electron.ipcMain
const shell = electron.shell
const dialog = electron.dialog
const path = require('path')
const fs = require('fs')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
if (process.mas) app.setName('Python Editor')
let mainWindow
//是否可以安全退出
let safeExit = false

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200, 
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: app.getName()
  })

  // and load the index.html of the app.
  mainWindow.loadURL('file://' + __dirname + '/index.html');

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', function(){
  createWindow()
})

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

/**
 * 注册键盘快捷键
 * 其中：label: '切换开发者工具',这个可以在发布时注释掉
 */
let template = [{ 
  label: '文件',
  submenu: []
},
{ 
  label: '编辑',
  submenu: [{
    label: '撤销',
    accelerator: 'CmdOrCtrl+Z',
    role: 'undo'
  }, {
    label: '重做',
    accelerator: 'Shift+CmdOrCtrl+Z',
    role: 'redo'
  }, {
    type: 'separator'
  }, {
    label: '剪切',
    accelerator: 'CmdOrCtrl+X',
    role: 'cut'
  }, {
    label: '复制',
    accelerator: 'CmdOrCtrl+C',
    role: 'copy'
  }, {
    label: '粘贴',
    accelerator: 'CmdOrCtrl+V',
    role: 'paste'
  }, {
    label: '删除',
    accelerator: 'CmdOrCtrl+D',
    role: 'delete'
  },{
    label: '全选',
    accelerator: 'CmdOrCtrl+A',
    role: 'selectall'
  }]
}, {
  label: '查看',
  submenu: [{
    label: '放大',
    accelerator: 'CmdOrCtrl+L',
    role: 'zoomin'
  },{
    label: '缩小',
    accelerator: 'CmdOrCtrl+I',
    role: 'zoomout'
  },{
    label: '默认',
    accelerator: 'CmdOrCtrl+B',
    role: 'resetzoom'
  },{
    type: 'separator'
  },{
    label: '重载',
    accelerator: 'CmdOrCtrl+R',
    click: (item, focusedWindow) => {
      if (focusedWindow) {
        // 重载之后, 刷新并关闭所有之前打开的次要窗体
        if (focusedWindow.id === 1) {
          BrowserWindow.getAllWindows().forEach(win => {
            if (win.id > 1) win.close()
          })
        }
        focusedWindow.reload()
      }
    }
  }, {
    label: '切换全屏',
    accelerator: (() => {
      if (process.platform === 'darwin') {
        return 'Ctrl+Command+F'
      } else {
        return 'F11'
      }
    })(),
    click: (item, focusedWindow) => {
      if (focusedWindow) {
        focusedWindow.setFullScreen(!focusedWindow.isFullScreen())
      }
    }
  }, {
    label: '切换开发者工具',
    accelerator: (() => {
      if (process.platform === 'darwin') {
        return 'Alt+Command+I'
      } else {
        return 'Ctrl+Shift+I'
      }
    })(),
    click: (item, focusedWindow) => {
      if (focusedWindow) {
        focusedWindow.toggleDevTools()
      }
    }
  }, {
    type: 'separator'
  }, {
    label: '应用程序菜单演示',
    click: function (item, focusedWindow) {
      if (focusedWindow) {
        const options = {
          type: 'info',
          title: '应用程序菜单演示',
          buttons: ['好的'],
          message: '此演示用于 "菜单" 部分, 展示如何在应用程序菜单中创建可点击的菜单项.'
        }
        dialog.showMessageBox(focusedWindow, options, function () {})
      }
    }
  }]
}, {
  label: '窗口',
  role: 'window',
  submenu: [{
    label: '最小化',
    accelerator: 'CmdOrCtrl+M',
    role: 'minimize'
  }, {
    label: '关闭',
    accelerator: 'CmdOrCtrl+W',
    role: 'close'
  }, {
    type: 'separator'
  }, {
    label: '重新打开窗口',
    accelerator: 'CmdOrCtrl+Shift+T',
    enabled: false,
    key: 'reopenMenuItem',
    click: () => {
      app.emit('activate')
    }
  }]
}, {
  label: '固件',
  submenu:[]
},{
  label: '串口',
  submenu:[]
},{
  label: '帮助',
  role: 'help',
  submenu: [{
    label: '学习更多',
    click: () => {
      shell.openExternal('http://www.afantor.cc')
    }
  }]
}]

/**
 * 增加更新相关的菜单选项
 */
function addUpdateMenuItems (items, position) {
  if (process.mas) return

  const version = app.getVersion()
  let updateItems = [{
    label: `当前版本 ${version}`,
    enabled: false
  }, {
    label: '正在检查更新',
    enabled: false,
    key: 'checkingForUpdate'
  }, {
    label: '检查更新',
    visible: false,
    key: 'checkForUpdate',
    click: () => {
      require('electron').autoUpdater.checkForUpdates()
    }
  }, {
    label: '重启并安装更新',
    enabled: true,
    visible: false,
    key: 'restartToUpdate',
    click: () => {
      require('electron').autoUpdater.quitAndInstall()
    }
  }]

  items.splice.apply(items, [position, 0].concat(updateItems))
}

function findReopenMenuItem () {
    const menu = Menu.getApplicationMenu()
    if (!menu) return

    let reopenMenuItem
    menu.items.forEach(function (item) {
        if (item.submenu) {
            item.submenu.items.forEach(function (item) {
                if (item.key === 'reopenMenuItem') {
                    reopenMenuItem = item
                }
            })
        }
    })
    return reopenMenuItem
}
/**
 * 增加mac系统的处理
 */
if (process.platform === 'darwin') {
  const name = app.getName()
  template.unshift({
    label: name,
    submenu: [{
      label: `关于 ${name}`,
      role: 'about'
    }, {
      type: 'separator'
    }, {
      label: '服务',
      role: 'services',
      submenu: []
    }, {
      type: 'separator'
    }, {
      label: `隐藏 ${name}`,
      accelerator: 'Command+H',
      role: 'hide'
    }, {
      label: '隐藏其它',
      accelerator: 'Command+Alt+H',
      role: 'hideothers'
    }, {
      label: '显示全部',
      role: 'unhide'
    }, {
      type: 'separator'
    }, {
      label: '退出',
      accelerator: 'Command+Q',
      click: () => {
        app.quit()
      }
    }]
  })

  // 窗口菜单.
  template[3].submenu.push({
    type: 'separator'
  }, {
    label: '前置所有',
    role: 'front'
  })

  addUpdateMenuItems(template[0].submenu, 1)
}
/**
 * 增加win系统的处理
 */
if (process.platform === 'win32') {
  const helpMenu = template[template.length - 1].submenu
  addUpdateMenuItems(helpMenu, 0)
}

app.on('ready', () => {
  const menu = Menu.buildFromTemplate(template)
  
  //在File菜单下添加名为New的子菜单
  menu.items[0].submenu.append(new MenuItem({ //menu.items获取是的主菜单一级菜单的菜单数组，menu.items[0]在这里就是第1个File菜单对象，在其子菜单submenu中添加新的子菜单
    label: "新建",
    click(){
      mainWindow.webContents.send('action', 'new') //点击后向主页渲染进程发送“新建文件”的命令
    },
    accelerator: 'CmdOrCtrl+N' //快捷键：Ctrl+N
  }))
  //在New菜单后面添加名为Open的同级菜单
  menu.items[0].submenu.append(new MenuItem({
    label: "打开",
    click(){
      mainWindow.webContents.send('action', 'open') //点击后向主页渲染进程发送“打开文件”的命令
    },
    accelerator: 'CmdOrCtrl+O' //快捷键：Ctrl+O
  })) 
  //再添加一个名为Save的同级菜单
  menu.items[0].submenu.append(new MenuItem({
    label: "保存",
    click(){
      mainWindow.webContents.send('action', 'save') //点击后向主页渲染进程发送“保存文件”的命令
    },
    accelerator: 'CmdOrCtrl+S' //快捷键：Ctrl+S
  }))
  //再添加一个名为Save as的同级菜单
  menu.items[0].submenu.append(new MenuItem({
    label: "另存为...",
    click(){
      mainWindow.webContents.send('action', 'save_as') //点击后向主页渲染进程发送“另存为”的命令
    },
    accelerator: 'Shift+CmdOrCtrl+S' //快捷键：Ctrl+S
  }))
  //添加一个分隔符
  menu.items[0].submenu.append(new MenuItem({
    type: 'separator'
  }))
  //再添加一个名为Exit的同级菜单
  menu.items[0].submenu.append(new MenuItem({
    label: "退出应用",
    role: 'quit'
  }))
  //添加一个下载MicroPython
  menu.items[4].submenu.append(new MenuItem({
    label: "更新ESP32-MicroPython固件",
    click(){
      mainWindow.webContents.send('action', 'flash_esp32') //点击后向主页渲染进程发送“另存为”的命令
    },
  }))
  menu.items[4].submenu.append(new MenuItem({
    label: "更新ESP8266-MicroPython固件",
    click(){
      mainWindow.webContents.send('action', 'flash_esp8266') //点击后向主页渲染进程发送“另存为”的命令
    },
  }))
  //添加一个串口菜单
  menu.items[5].submenu.append(new MenuItem({
    label: "打开串口列表",
    click(){
      mainWindow.webContents.send('action', 'open_comlist') //点击后向主页渲染进程发送“另存为”的命令
    },
  }))
  menu.items[5].submenu.append(new MenuItem({
    label: "打开串口助手",
    click(){
      mainWindow.webContents.send('action', 'open_comwin') //点击后向主页渲染进程发送“另存为”的命令
    },
  }))
  Menu.setApplicationMenu(menu);
  
  mainWindow.on('close', (e) => {
    if(!safeExit){
      e.preventDefault()
      mainWindow.webContents.send('action', 'exiting')
    }
  });
});

app.on('browser-window-created', () => {
  let reopenMenuItem = findReopenMenuItem()
  if (reopenMenuItem) reopenMenuItem.enabled = false
})

app.on('window-all-closed', () => {
  let reopenMenuItem = findReopenMenuItem()
  if (reopenMenuItem) reopenMenuItem.enabled = true
})
/**
 * 增加右键快捷菜单
 */
const addmenu = new Menu()
addmenu.append(new MenuItem({ label: '撤销',role: 'undo' ,accelerator: 'CmdOrCtrl+Z'}))
addmenu.append(new MenuItem({ label: '重做',role: 'redo' ,accelerator: 'Shift+CmdOrCtrl+Z'}))
addmenu.append(new MenuItem({ type: 'separator'}))
addmenu.append(new MenuItem({ label: '剪切',role: 'cut' ,accelerator: 'CmdOrCtrl+X'}))
addmenu.append(new MenuItem({ label: '复制',role: 'copy' ,accelerator: 'CmdOrCtrl+C'}))
addmenu.append(new MenuItem({ label: '粘贴',role: 'paste' ,accelerator: 'CmdOrCtrl+V'}))
addmenu.append(new MenuItem({ label: '删除',role: 'delete' ,accelerator: 'CmdOrCtrl+D'}))
addmenu.append(new MenuItem({ type: 'separator' }))
addmenu.append(new MenuItem({ label: '全选',role: 'selectall' ,accelerator: 'CmdOrCtrl+A' }))

app.on('browser-window-created', (event, win) => {
  win.webContents.on('context-menu', (e, params) => {
    addmenu.popup(win, params.x, params.y)
  })
})

ipcMain.on('show-context-menu', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  addmenu.popup(win)
})


//监听与渲染进程的通信
ipcMain.on('reqaction', (event, arg) => {
  switch(arg){
    case 'exit':
      //做点其它操作：比如记录窗口大小、位置等，下次启动时自动使用这些设置；不过因为这里（主进程）无法访问localStorage，这些数据需要使用其它的方式来保存和加载，这里就不作演示了。这里推荐一个相关的工具类库，可以使用它在主进程中保存加载配置数据：https://github.com/sindresorhus/electron-store
      //...
      safeExit=true;
      app.quit();//退出程序
      break;
  }
});

