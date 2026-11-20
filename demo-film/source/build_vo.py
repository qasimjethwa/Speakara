import json,subprocess,re
ST={"s1":0.6,"s2":12.8,"s3":33.6,"s4":51,"s5":83,"s6":108,"s7":127,"s8":152}
P=json.load(open("vo2/phr.json")); ins=[];flt=[];subs=[];k=0
for sc,ph in P.items():
  c=ST[sc]
  for x in ph:
    print(f"{c:7.2f} {x['t'][:50]}")
    ins+=["-i",x["f"]]; ms=int(c*1000); flt.append(f"[{k}]aresample=48000,adelay={ms}|{ms},apad[a{k}]"); k+=1
    t=x["t"].replace("...","…").replace("100,000 dollars","$100,000").replace("one dollar","$1"); parts=[]
    for s in re.split(r'(?<=[.?!])\s+',t):
      while len(s)>60:
        i=s.rfind(' ',0,56); parts.append(s[:i]); s=s[i+1:]
      parts.append(s)
    tot=sum(map(len,parts)); cc=c
    for p in parts: e=cc+(x["d"]-0.15)*len(p)/tot; subs.append([round(cc,2),round(e,2),p]); cc=e
    c+=x["d"]+x["pause"]
fl=";".join(flt)+";"+"".join(f"[a{i}]" for i in range(k))+f"amix={k}:normalize=0,atrim=0:167,acompressor=threshold=-20dB:ratio=2.5:attack=10:release=150,equalizer=f=180:t=q:w=1:g=1.5,equalizer=f=3500:t=q:w=1.5:g=2[v]"
subprocess.run(["ffmpeg","-loglevel","error","-y",*ins,"-filter_complex",fl,"-map","[v]","-ac","2","narration2.wav"],check=True)
json.dump(subs,open("subs.json","w")); open("subs.js","w").write("window.SUBS_DATA="+json.dumps(subs)+";")
f=lambda x:"%02d:%02d:%02d,%03d"%(x//3600,x%3600//60,x%60,round(x%1*1000))
open("speakara_demo.srt","w").write("\n".join(f"{i+1}\n{f(a)} --> {f(b)}\n{t}\n" for i,(a,b,t) in enumerate(subs)))
