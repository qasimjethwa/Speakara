import sys, certifi, asyncio
certifi.where=lambda:"/root/.ccr/ca-bundle.crt"
import edge_tts
async def main(text,out,voice):
    c=edge_tts.Communicate(text,voice,rate="-2%")
    sub=edge_tts.SubMaker()
    with open(out,"wb") as f:
        async for ch in c.stream():
            if ch["type"]=="audio": f.write(ch["data"])
asyncio.run(main(sys.argv[1],sys.argv[2],sys.argv[3] if len(sys.argv)>3 else "en-IN-PrabhatNeural"))
