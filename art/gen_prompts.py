import os, re
ART = "/Users/elchanan/Desktop/projects/nodal-electronics/art"
man = open(f"{ART}/MANIFEST.md", encoding="utf-8").read()
style = re.search(r"> (Premium product.*?)\n\n## ", man + "\n\n## ", re.S).group(1)
style = " ".join(line.lstrip("> ").strip() for line in style.splitlines())
TRANSP = "Fully transparent background (alpha channel), no backdrop, no floor."
rows = re.findall(r"^\| ([\w.-]+\.png) \| (.+?) \|$", man, re.M)
names = []
for fname, brief in rows:
    brief = brief.strip()
    if fname.startswith(("p-", "o-")):
        prompt = f"{brief} {TRANSP} {style}"
    else:
        prompt = f"{brief} {style}"
    name = fname[:-4]
    open(f"{ART}/prompts/{name}.txt", "w", encoding="utf-8").write(prompt + "\n")
    names.append(name)
open(f"{ART}/prompts/_list.txt", "w").write("\n".join(names) + "\n")
print(len(names), names)
print(open(f"{ART}/prompts/p-halo-anc-headphones.txt").read())
