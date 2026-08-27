#!/usr/bin/env python3
"""Fetch one distinct CC0 object image per capture in the Verso run.

Every capture in the filmstrip and the review queue is a different object, so
the deck never shows the same photograph twice. Source is the Cleveland Museum
of Art open access API, filtered to cc0=1 and share_license_status CC0.
Writes obj/<key>.jpg and objects.json (the accession list, for provenance).
"""
import json, os, subprocess, urllib.parse

# how many distinct objects each department bucket needs
BUCKETS = {
    "cer": (13, {"type": "Ceramic"}),
    "tex": (4, {"type": "Textile"}),
    "art": (4, {"type": "Print"}),
    "arc": (4, {"department": "Egyptian and Ancient Near Eastern Art"}),
    "mar": (3, {"type": "Metalwork", "q": "instrument"}),
    "soc": (4, {"type": "Jewelry"}),
}

os.makedirs("obj", exist_ok=True)


def api(**kw):
    kw.update({"cc0": "1", "has_image": "1", "limit": "60", "skip": "0"})
    u = "https://openaccess-api.clevelandart.org/api/artworks/?" + urllib.parse.urlencode(kw)
    r = subprocess.run(["curl", "-s", "-A", "Mozilla/5.0", u], capture_output=True, text=True)
    return json.loads(r.stdout).get("data", [])


manifest, seen = {}, set()
for key, (n, params) in BUCKETS.items():
    got = 0
    for a in api(**params):
        if got >= n:
            break
        acc = a.get("accession_number")
        img = (a.get("images") or {}).get("web", {}).get("url")
        if not acc or not img or acc in seen or a.get("share_license_status") != "CC0":
            continue
        name = f"{key}{got}"
        if subprocess.run(["curl", "-sf", "-A", "Mozilla/5.0", "-o", f"obj/{name}.jpg", img]).returncode:
            continue
        seen.add(acc)
        manifest[name] = {"accession": acc, "title": a["title"][:60],
                          "dept": a.get("department", ""), "licence": "CC0"}
        got += 1
    print(f"{key}: {got}/{n}")

json.dump(manifest, open("objects.json", "w"), indent=1)
print(f"{len(manifest)} objects -> obj/")
