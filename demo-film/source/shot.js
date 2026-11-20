const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1920,height:1080}});
await p.goto('file://'+process.cwd()+'/compose.html');await p.waitForFunction(()=>window.ready());await p.waitForTimeout(800);
for(const t of process.argv.slice(2)){await p.evaluate(t=>seek(+t),t);await p.waitForTimeout(150);await p.screenshot({path:`prev_${t}.jpg`,quality:70});}await b.close()})();
