import re,json,subprocess
ST={"s1":0.6,"s2":12.8,"s3":33.6,"s4":51,"s5":83,"s6":108,"s7":127,"s8":152}
FIX={"One point four billion":"1.4 billion","Forty percent":"40%","four hundred and thirty million":"430 million","I S L":"ISL","one dollar":"$1","a hundred thousand international":"100,000 international","a hundred thousand dollars":"$100,000","a million dollars":"$1 million","one million":"1 million"}
out=[]
for line in open("lines.txt"):
  n,t=line.strip().split("|",1);d=float(subprocess.check_output(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",f"vo/{n}.mp3"]))-0.4
  for a,b in FIX.items(): t=t.replace(a,b)
  parts=[];
  for s in re.split(r'(?<=[.?!:])\s+',t):
    while len(s)>62:
      i=s.rfind(' ',0,58); i=max(s.rfind(', ',0,62)+1,i) if s.rfind(', ',0,62)>25 else i; parts.append(s[:i].strip()); s=s[i:].strip()
    parts.append(s)
  tot=sum(len(p) for p in parts); c=ST[n]
  for p in parts: e=c+d*len(p)/tot; out.append([round(c,2),round(e,2),p]); c=e
json.dump(out,open("subs.json","w"));open("subs.js","w").write("window.SUBS_DATA="+json.dumps(out)+";")
f=lambda x:"%02d:%02d:%02d,%03d"%(x//3600,x%3600//60,x%60,round(x%1*1000))
open("speakara_demo.srt","w").write("\n".join(f"{i+1}\n{f(a)} --> {f(b)}\n{t}\n" for i,(a,b,t) in enumerate(out)))
