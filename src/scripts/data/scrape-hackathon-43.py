import re, json, sys, os, urllib.request, time

DATA_DIR = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(DATA_DIR, "hackathon-43.raw.json")

IDS = [502,593,524,578,579,582,505,565,605,568,585,602,589,575,570,584,573,499,
       497,583,507,588,597,603,580,567,595,581,596,508,519,571,592]

def fetch(pid):
    url = f"https://www.hackathonparty.com/hackathons/43/projects/{pid}"
    req = urllib.request.Request(url, headers={"User-Agent":"Mozilla/5.0"})
    return urllib.request.urlopen(req, timeout=40).read().decode("utf-8","ignore")

def decode(html):
    chunks = re.findall(r'self\.__next_f\.push\(\[1,"(.*?)"\]\)', html, re.S)
    s = "".join(chunks)
    # Proper JSON string decoding preserves UTF-8 (em dashes, accents, emoji).
    return json.loads('"' + s + '"')

def resolve_ref(s, ref):
    # ref like "$39" -> find row "39:T<hexlen>,<text>"
    if not isinstance(ref, str) or not ref.startswith("$"):
        return ref
    rid = ref[1:]
    m = re.search(r'(?:^|[^0-9a-zA-Z])' + re.escape(rid) + r':T([0-9a-f]+),', s)
    if not m:
        # try plain string row  rid:"..."
        m2 = re.search(r'(?:^|[^0-9a-zA-Z])' + re.escape(rid) + r':"', s)
        return ref
    start = m.end()
    length = int(m.group(1), 16)
    # length is byte length of utf-8 text
    raw = s[start:start+length*2]  # over-grab
    b = raw.encode("utf-8", "ignore")
    text = b[:length].decode("utf-8", "ignore")
    return text

def extract(s):
    out = {}
    i = s.find('"submission":{')
    j = s.find('"submissionTeam":')
    sub = s[i+len('"submission":'): j].rstrip(", ")
    # sub may end with } ; find matching brace
    # robust: take from first { to matching }
    depth=0; end=None
    for k,ch in enumerate(sub):
        if ch=='{': depth+=1
        elif ch=='}':
            depth-=1
            if depth==0:
                end=k+1; break
    sub = sub[:end]
    subobj = json.loads(sub)
    # team
    rest = s[j+len('"submissionTeam":'):]
    depth=0; end=None
    for k,ch in enumerate(rest):
        if ch=='[': depth+=1
        elif ch==']':
            depth-=1
            if depth==0:
                end=k+1; break
    team = json.loads(rest[:end])
    md = subobj.get("markdown")
    if isinstance(md,str) and md.startswith("$"):
        md = resolve_ref(s, md)
    subobj["markdown_resolved"] = md
    return subobj, team

results=[]
for pid in IDS:
    try:
        html = fetch(pid)
        s = decode(html)
        sub, team = extract(s)
        results.append({"id":pid,"submission":sub,"team":team})
        print(f"OK {pid} {sub.get('name')!r} team={len(team)}", file=sys.stderr)
    except Exception as e:
        print(f"ERR {pid} {e}", file=sys.stderr)
        results.append({"id":pid,"error":str(e)})
    time.sleep(0.4)

json.dump(results, open(RAW, "w"), indent=2)
print("wrote " + RAW, file=sys.stderr)
