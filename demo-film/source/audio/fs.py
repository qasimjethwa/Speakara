import re,sys,json,time,urllib.request,urllib.parse,ssl
ctx=ssl.create_default_context(cafile="/root/.ccr/ca-bundle.crt")
G=lambda u:urllib.request.urlopen(urllib.request.Request(u,headers={"User-Agent":"Mozilla/5.0"}),context=ctx,timeout=30).read()
man=[]
for cat,q in [("whoosh","soft whoosh transition"),("pop","ui pop"),("click","mouse click"),("impact","cinematic soft impact"),("chime","positive notification chime"),("riser","short riser")]:
  h=G("https://freesound.org/search/?q="+urllib.parse.quote(q)+"&f=license:%22Creative+Commons+0%22&f=duration:[0+TO+6]").decode()
  ids=list(dict.fromkeys(re.findall(r'/people/([^/]+)/sounds/(\d+)/',h)))[:3]
  for user,i in ids:
    p=G(f"https://freesound.org/people/{user}/sounds/{i}/").decode()
    m=re.search(r'og:audio" content="([^"]+)"',p); lic=re.search(r'creativecommons.org/[^"]+',p)
    if not m: continue
    fn=f"{cat}_fs{i}.mp3"; open(fn,"wb").write(G("https://"+m.group(1).split("https://")[-1]))
    man.append({"file":fn,"id":i,"user":user,"url":f"https://freesound.org/people/{user}/sounds/{i}/","licence":lic.group(0) if lic else "?"}); time.sleep(1)
json.dump(man,open("manifest.json","w"),indent=1)
for x in man: print(x["file"],x["user"],x["licence"])
