import re

with open('public/pages/dashboard.html', 'r') as f:
    content = f.read()

content = re.sub(
    r'<svg class="icon" aria-hidden="true"><use href="#i-users"></use></svg>',
    r'<img src="../images/community.png" class="metric-img" alt="Community">',
    content
)

content = re.sub(
    r'<svg class="icon" aria-hidden="true"><use href="#i-box"></use></svg>',
    r'<img src="../images/hotspot.png" class="metric-img" alt="Active">',
    content
)

content = re.sub(
    r'<svg class="icon" aria-hidden="true"><use href="#i-shield"></use></svg>',
    r'<img src="../images/sec.png" class="metric-img" alt="Trust Score">',
    content
)

content = re.sub(
    r'<svg class="icon" aria-hidden="true"><use href="#i-hand"></use></svg>',
    r'<img src="../images/question.png" class="metric-img" alt="Asked">',
    content
)

with open('public/pages/dashboard.html', 'w') as f:
    f.write(content)

print("Metrics replaced!")
