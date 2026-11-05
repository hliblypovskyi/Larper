const {contextBridge,ipcRenderer}=require('electron');
const on=(c,f)=>ipcRenderer.on(c,(_,d)=>f(d));
contextBridge.exposeInMainWorld('larper',{onOpenTab:f=>on('open-tab',f),onKey:f=>on('key',f),onDl:f=>on('dl',f),show:p=>ipcRenderer.send('show',p)});
