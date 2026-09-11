from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import HRFlowable, Paragraph, SimpleDocTemplate


OUTPUT = Path(
    'output/pdf/Ezequiel_Olivero_Frontend_CV_2026_Refined.pdf'
).resolve()
OUTPUT.parent.mkdir(parents=True, exist_ok=True)

FONT_DIR = Path(r'C:\Windows\Fonts')
pdfmetrics.registerFont(TTFont('Arial', FONT_DIR / 'arial.ttf'))
pdfmetrics.registerFont(TTFont('Arial-Bold', FONT_DIR / 'arialbd.ttf'))
pdfmetrics.registerFont(TTFont('Arial-Italic', FONT_DIR / 'ariali.ttf'))

INK = colors.HexColor('#172033')
BODY = colors.HexColor('#334155')
MUTED = colors.HexColor('#64748B')
ACCENT = colors.HexColor('#0F9E9A')

base = getSampleStyleSheet()['Normal']


def make_style(name, **kwargs):
    return ParagraphStyle(name, parent=base, **kwargs)


name_style = make_style(
    'Name',
    fontName='Arial-Bold',
    fontSize=22,
    leading=24,
    textColor=INK,
    alignment=TA_CENTER,
    spaceAfter=3,
)
headline_style = make_style(
    'Headline',
    fontName='Arial-Bold',
    fontSize=9.7,
    leading=12,
    textColor=ACCENT,
    alignment=TA_CENTER,
    spaceAfter=3,
)
contact_style = make_style(
    'Contact',
    fontName='Arial',
    fontSize=8.5,
    leading=10.8,
    textColor=MUTED,
    alignment=TA_CENTER,
    spaceAfter=6,
)
section_style = make_style(
    'Section',
    fontName='Arial-Bold',
    fontSize=10.4,
    leading=12,
    textColor=INK,
    spaceBefore=6,
    spaceAfter=2,
)
body_style = make_style(
    'Body',
    fontName='Arial',
    fontSize=9.8,
    leading=13,
    textColor=BODY,
    spaceAfter=2,
)
skill_style = make_style(
    'Skill',
    fontName='Arial',
    fontSize=9.1,
    leading=11.6,
    textColor=BODY,
    spaceAfter=1.4,
)
role_style = make_style(
    'Role',
    fontName='Arial-Bold',
    fontSize=10.6,
    leading=12.5,
    textColor=INK,
    spaceAfter=1,
)
meta_style = make_style(
    'Meta',
    fontName='Arial',
    fontSize=8.8,
    leading=11,
    textColor=MUTED,
    spaceAfter=2,
)
context_style = make_style(
    'Context',
    fontName='Arial-Italic',
    fontSize=8.8,
    leading=11,
    textColor=MUTED,
    spaceAfter=3,
)
bullet_style = make_style(
    'Bullet',
    fontName='Arial',
    fontSize=9.25,
    leading=11.8,
    textColor=BODY,
    leftIndent=10,
    firstLineIndent=-8,
    spaceAfter=2.2,
)
compact_style = make_style(
    'Compact',
    fontName='Arial',
    fontSize=9.25,
    leading=11.8,
    textColor=BODY,
    spaceAfter=1,
)


def add_section(story, title):
    story.append(Paragraph(title.upper(), section_style))
    story.append(
        HRFlowable(
            width='100%',
            thickness=0.65,
            color=ACCENT,
            spaceBefore=0,
            spaceAfter=3.5,
        )
    )


document = SimpleDocTemplate(
    str(OUTPUT),
    pagesize=A4,
    leftMargin=17 * mm,
    rightMargin=17 * mm,
    topMargin=12 * mm,
    bottomMargin=11 * mm,
    title='Ezequiel Olivero - Frontend Developer CV',
    author='Ezequiel Olivero',
    subject='Frontend Developer CV - React, TypeScript, Microfrontends',
)

story = [
    Paragraph('EZEQUIEL OLIVERO', name_style),
    Paragraph(
        'FRONTEND DEVELOPER | REACT | TYPESCRIPT | MICROFRONTENDS',
        headline_style,
    ),
    Paragraph(
        '<link href="mailto:eze.olivero96@gmail.com" color="#64748B">'
        'eze.olivero96@gmail.com</link> | '
        '<link href="tel:+4740322011" color="#64748B">+47 403 22 011</link><br/>'
        '<link href="https://ezequielolivero.vercel.app/" color="#64748B">'
        'ezequielolivero.vercel.app</link> | '
        '<link href="https://www.linkedin.com/in/ezequiel-olivero" '
        'color="#64748B">linkedin.com/in/ezequiel-olivero</link>',
        contact_style,
    ),
]

add_section(story, 'Professional Summary')
story.append(
    Paragraph(
        'Frontend Developer with 4+ years of experience building and maintaining '
        'production applications with React and TypeScript. Experienced in frontend '
        'architecture, Single-SPA microfrontends, real-time communication, and '
        'performance optimization. Introduced reusable component tooling and '
        'regularly contributes to frontend technical decisions within a small, '
        'fully remote engineering team.',
        body_style,
    )
)

add_section(story, 'Technical Skills')
skill_rows = [
    ('Core Frontend', 'React, TypeScript, JavaScript, Single-SPA, Microfrontends'),
    (
        'Architecture & Performance',
        'IndexedDB, Web Workers, List Virtualization, Storybook',
    ),
    (
        'State, UI & Testing',
        'Redux Toolkit, Zustand, Material UI, Tailwind CSS, Jest',
    ),
    ('Real-Time & APIs', 'WebSockets, WebRTC, REST APIs'),
    ('Backend & Tooling', 'Node.js, Express, MongoDB, AWS Cognito, Git, Azure DevOps'),
]
for label, values in skill_rows:
    story.append(Paragraph(f'<b>{label}:</b> {values}', skill_style))

add_section(story, 'Professional Experience')
story.append(
    Paragraph(
        'Full Stack Developer <font color="#0F9E9A">- Frontend-focused</font> '
        '| Trii Software',
        role_style,
    )
)
story.append(Paragraph('Jul 2022 - Present | Remote', meta_style))
story.append(
    Paragraph(
        'Enterprise SaaS platform for omnichannel communication, chat, ticketing, '
        'and business operations.',
        context_style,
    )
)

experience = [
    '<b>Introduced Single-SPA microfrontend architecture</b>, migrating '
    'approximately 10 modules and mentoring two teammates on adoption.',
    '<b>Built approximately 90% of an omnichannel chat feature</b> spanning '
    'WhatsApp, Facebook, and Instagram, then refactored it into a decoupled architecture.',
    '<b>Built a shared chat module with Single-SPA parcels</b>, enabling reuse '
    'across microfrontends and avoiding duplicated implementation.',
    '<b>Reduced chat load times to near-instant</b> with cache-first loading '
    'using IndexedDB and Web Workers plus list virtualization.',
    '<b>Proposed and built an internal React component library</b> distributed '
    'through Storybook and npm to reduce UI duplication across modules.',
    '<b>Built real-time chat, notifications, and live data updates</b> using WebSockets.',
]
for item in experience:
    story.append(Paragraph(f'- {item}', bullet_style))

add_section(story, 'Education')
story.append(
    Paragraph(
        '<b>Technical Degree in Software Development</b> | ITEC | 2021 - 2024',
        compact_style,
    )
)

add_section(story, 'Languages')
story.append(
    Paragraph('<b>Spanish:</b> Native | <b>English:</b> C2', compact_style)
)

document.build(story)
print(OUTPUT)
