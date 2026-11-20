import subprocess
E=[]
for t in [12,33,50,82,107,126,151]: E.append((t-0.6,"whoosh",-6))
E+= [(5.9,"riser",-10),(9.8,"impact",-4),(149.4,"riser",-12),(152.0,"chime",-3)]
for t in [13.0,18.3,25.0]: E.append((t+0.15,"pop",-6))
for t in [33.6,37.3,41.0,44.7]: E.append((t-0.1,"click",-9))
E+= [(55.2,"chime2",-8),(85.2,"pop",-8),(86.7,"pop",-8),(92.0,"chime2",-6)]
for i in range(5): E.append((108.5+i*1.6,"pop",-12))
E+= [(129.6,"impact",-12),(132.2,"impact",-10),(136.9,"chime2",-9)]
ins=["-i","../narration2.wav","-i","dl/m1.mp3"]; f=[]
for k,(t,s,g) in enumerate(E):
  ins+=["-i",f"sfx/{s}.wav"]; ms=int(t*1000); f.append(f"[{k+2}]volume={g}dB,adelay={ms}|{ms},apad[e{k}]")
f.append("".join(f"[e{k}]" for k in range(len(E)))+f"amix={len(E)}:normalize=0,atrim=0:167[fx]")
f.append("[1]aresample=48000,atrim=0:167,volume=-17dB,afade=in:d=1.5,afade=out:st=160:d=7[mus]")
f.append("[0]asplit[vo][sc]")
f.append("[mus][sc]sidechaincompress=threshold=0.03:ratio=4:attack=60:release=600[mduck]")
f.append("[vo][mduck][fx]amix=3:normalize=0,loudnorm=I=-15:TP=-1.5:LRA=9[out]")
subprocess.run(["ffmpeg","-loglevel","error","-y",*ins,"-filter_complex",";".join(f),"-map","[out]","-ar","48000","-ac","2","../mix2.wav"],check=True)
for n,a in [("music","[1]aresample=48000,atrim=0:167,volume=-17dB,afade=in:d=1.5,afade=out:st=160:d=7"),]: pass
print(len(E),"events")
