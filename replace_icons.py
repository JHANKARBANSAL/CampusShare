import os
import re

pages_dir = 'public/pages'

replacements = [
    (r'<svg class="icon nav-icon" aria-hidden="true">\s*<use href="#i-home"></use>\s*</svg>', '<img src="../images/house(2).png" alt="Home" class="nav-icon">'),
    (r'<svg class="icon nav-icon" aria-hidden="true">\s*<use href="#i-activity"></use>\s*</svg>', '<img src="../images/square-chart-gantt.png" alt="Activity" class="nav-icon">'),
    (r'<svg class="icon nav-icon" aria-hidden="true">\s*<use href="#i-search"></use>\s*</svg>', '<img src="../images/search.png" alt="Looking For" class="nav-icon">'),
    (r'<svg class="icon nav-icon" aria-hidden="true">\s*<use href="#i-user"></use>\s*</svg>', '<img src="../images/users.png" alt="Profile" class="nav-icon">'),
]

for filename in os.listdir(pages_dir):
    if filename.endswith('.html'):
        filepath = os.path.join(pages_dir, filename)
        with open(filepath, 'r') as f:
            content = f.read()
        
        for old, new in replacements:
            content = re.sub(old, new, content)
            
        with open(filepath, 'w') as f:
            f.write(content)

print("Replaced icons in HTML files.")
