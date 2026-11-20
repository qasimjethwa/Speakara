const {chromium}=require('playwright');const {spawn}=require('child_process');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1920,height:1080}});
await p.goto('file://'+process.cwd()+'/compose.html');await p.waitForFunction(()=>window.ready());await p.waitForTimeout(1500);
const ff=spawn('ffmpeg',['-loglevel','error','-y','-f','image2pipe','-framerate','30','-c:v','mjpeg','-i','-','-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p','video.mp4'],{stdio:['pipe','inherit','inherit']});
const N=167*30;for(let i=0;i<N;i++){await p.evaluate(t=>seek(t),i/30);const buf=await p.screenshot({type:'jpeg',quality:92});if(!ff.stdin.write(buf))await new Promise(r=>ff.stdin.once('drain',r));if(i%600==0)console.log(i);}
ff.stdin.end();ff.on('close',()=>{console.log('done');b.close()});})();
