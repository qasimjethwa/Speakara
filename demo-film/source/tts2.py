import sys,certifi,asyncio,subprocess,json
certifi.where=lambda:"/root/.ccr/ca-bundle.crt"
import edge_tts
V="en-IN-NeerjaExpressiveNeural"; out={}
async def one(t,r,p,f): await edge_tts.Communicate(t,V,rate=r,pitch=p).save(f)
for k,l in enumerate(open("direct.txt")):
  sc,r,p,pa,t=l.strip().split("|",4); f=f"vo2/p{k:02d}.mp3"; asyncio.run(one(t,r,p,f))
  d=float(subprocess.check_output(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",f]))
  out.setdefault(sc,[]).append({"f":f,"d":d,"pause":float(pa),"t":t})
json.dump(out,open("vo2/phr.json","w"),indent=1)
for s,v in out.items(): print(s, round(sum(x["d"]+x["pause"] for x in v),2))
