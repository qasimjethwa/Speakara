"""Prints Anam's pre-made (stock) avatars as JSON for LIVE_AVATAR_CATALOG. Needs ANAM_API_KEY. Read-only."""
import json, os, sys, urllib.request

req = urllib.request.Request("https://api.anam.ai/v1/avatars?perPage=50", headers={"Authorization": f"Bearer {os.environ['ANAM_API_KEY']}"})
with urllib.request.urlopen(req, timeout=20) as res:
    data = json.load(res)
rows = data.get("data", data) if isinstance(data, dict) else data
stock = [a for a in rows if not a.get("createdByOrganizationId") and not a.get("isCustom")]
json.dump([{"id": a["id"], "name": a.get("displayName") or a.get("name"), "imageUrl": a.get("imageUrl")} for a in stock][:12], sys.stdout, indent=1)
print()
