const {app,BrowserWindow,Menu,session,ipcMain,shell}=require('electron');
const path=require('path');
let win;
const KEYS=new Set(['t','w','l','d','h','j','r',',','tab']);
function create(){
  win=new BrowserWindow({width:1280,height:820,minWidth:700,minHeight:500,title:'LARPER',backgroundColor:'#111113',autoHideMenuBar:true,
    webPreferences:{preload:path.join(__dirname,'preload.js'),webviewTag:true,contextIsolation:true,nodeIntegration:false}});
  win.loadFile('index.html');
  win.webContents.setWindowOpenHandler(({url})=>{shell.openExternal(url);return{action:'deny'}});
}
app.on('web-contents-created',(_,wc)=>{
  if(wc.getType()!=='webview')return;
  wc.setWindowOpenHandler(({url})=>{win.webContents.send('open-tab',url);return{action:'deny'}});
  wc.on('before-input-event',(e,i)=>{
    if(i.type!=='keyDown')return;
    if((i.control||i.meta)&&KEYS.has(i.key.toLowerCase())){e.preventDefault();win.webContents.send('key',{key:i.key,shift:i.shift})}
  });
});
app.whenReady().then(()=>{
  Menu.setApplicationMenu(Menu.buildFromTemplate([{role:'editMenu'}]));
  session.fromPartition('persist:larper').on('will-download',(e,item)=>{
    const id=Date.now()+Math.random();
    const send=m=>win&&!win.isDestroyed()&&win.webContents.send('dl',{id,...m});
    item.setSavePath(path.join(app.getPath('downloads'),item.getFilename()));
    send({type:'start',name:item.getFilename(),url:item.getURL(),size:item.getTotalBytes()});
    item.on('updated',()=>{const t=item.getTotalBytes();if(t>0)send({type:'prog',p:Math.round(item.getReceivedBytes()/t*100)})});
    item.once('done',(_,state)=>send({type:'done',state,path:item.getSavePath()}));
  });
  ipcMain.on('show',(_,p)=>shell.showItemInFolder(p));
  create();
  app.on('activate',()=>{if(!BrowserWindow.getAllWindows().length)create()});
});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit()});
