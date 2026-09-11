from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    HRFlowable,
    KeepTogether,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
)


OUTPUT = Path('output/pdf/Ezequiel_Olivero_Frontend_CV_2026.pdf').resolve()
OUTPUT.parent.mkdir(parents=True, exist_ok=True)

FONT_DIR = Path(r'C:\Windows\Fonts')
pdfmetrics.registerFont(TTFont('Arial', FONT_DIR / 'arial.ttf'))
pdfmetrics.registerFont(TTFont('Arial-Bold', FONT_DIR / 'arialbd.ttf'))

CHARCOAL = colors.HexColor('#1E293B')
SLATE = colors.HexColor('#475569')
MUTED = colors.HexColor('#64748B')
ACCENT = colors.HexColor('#0891B2')
LINE = colors.HexColor('#CBD5E1')

styles = getSampleStyleSheet()


def style(name, **kwargs):
    return ParagraphStyle(name, parent=styles['Normal'], **kwargs)


name_style = style(
    'Name',
    fontName='Arial-Bold',
    fontSize=28,
    leading=30,
    textColor=CHARCOAL,
    alignment=TA_CENTER,
    spaceAfter=4,
)
headline_style = style(
    'Headline',
    fontName='Arial-Bold',
    fontSize=11.2,
    leading=13.5,
    textColor=ACCENT,
    alignment=TA_CENTER,
    spaceAfter=4,
)
contact_style = style(
    'Contact',
    fontName='Arial',
    fontSize=9.4,
    leading=11.5,
    textColor=SLATE,
    alignment=TA_CENTER,
    spaceAfter=7,
)
section_style = style(
    'Section',
    fontName='Arial-Bold',
    fontSize=11.8,
    leading=14,
    textColor=CHARCOAL,
    spaceBefore=8,
    spaceAfter=3,
)
body_style = style(
    'Body',
    fontName='Arial',
    fontSize=10.2,
    leading=13.3,
    textColor=CHARCOAL,
    spaceAfter=3,
)
skills_style = style(
    'Skills',
    fontName='Arial',
    fontSize=9.7,
    leading=12.4,
    textColor=CHARCOAL,
    spaceAfter=2,
)
role_style = style(
    'Role',
    fontName='Arial-Bold',
    fontSize=11.5,
    leading=13.5,
    textColor=CHARCOAL,
    spaceAfter=1,
)
meta_style = style(
    'Meta',
    fontName='Arial',
    fontSize=9.4,
    leading=11.8,
    textColor=MUTED,
    spaceAfter=3,
)
context_style = style(
    'Context',
    fontName='Arial',
    fontSize=9.7,
    leading=12.2,
    textColor=SLATE,
    spaceAfter=4,
)
bullet_style = style(
    'Bullet',
    fontName='Arial',
    fontSize=9.8,
    leading=12.5,
    textColor=CHARCOAL,
    leftIndent=10,
    firstLineIndent=-8,
    bulletIndent=0,
    spaceAfter=3,
)
education_style = style(
    'Education',
    fontName='Arial',
    fontSize=9.9,
    leading=12.5,
    textColor=CHARCOAL,
    spaceAfter=1,
)


def section(title):
    return [
        Paragraph(title.upper(), section_style),
        HRFlowable(
            width='100%',
            thickness=0.7,
            color=ACCENT,
            spaceBefore=0,
            spaceAfter=4,
        ),
    ]


doc = SimpleDocTemplate(
    str(OUTPUT),
    pagesize=A4,
    leftMargin=17 * mm,
    rightMargin=17 * mm,
    topMargin=13 * mm,
    bottomMargin=12 * mm,
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
        '<link href="mailto:eze.olivero96@gmail.com" color="#475569">'
        'eze.olivero96@gmail.com</link> | '
        '<link href="tel:+4740322011" color="#475569">+47 403 22 011</link><br/>'
        '<link href="https://ezequielolivero.vercel.app/" color="#475569">'
        'ezequielolivero.vercel.app</link> | '
        '<link href="https://www.linkedin.com/in/ezequiel-olivero" '
        'color="#475569">linkedin.com/in/ezequiel-olivero</link>',
        contact_style,
    ),
]

story.extend(section('Professional Summary'))
story.append(
    Paragraph(
        'Frontend Developer with 4+ years of experience building and maintaining '
        'production applications with React and TypeScript. Specialized in frontend '
        'architecture, microfrontends, real-time communication, and performance '
        'optimization within a fully remote product team.',
        body_style,
    )
)

story.extend(section('Core Technical Skills'))
skills = [
    ('Core', 'React, TypeScript, JavaScript, Single-SPA, Microfrontends'),
    (
        'Architecture & Performance',
        'IndexedDB, Web Workers, List Virtualization, Storybook',
    ),
    (
        'State, UI & Testing',
        'Redux Toolkit, Zustand, Material UI, Tailwind CSS, Jest',
    ),
    ('Real-Time & APIs', 'WebSockets, WebRTC, REST APIs'),
    ('Backend & Cloud', 'Node.js, Express, MongoDB, AWS Cognito, Azure DevOps, Git'),
]
for label, values in skills:
    story.append(Paragraph(f'<b>{label}:</b> {values}', skills_style))

story.extend(section('Professional Experience'))
story.append(Paragraph('Full Stack Developer', role_style))
story.append(
    Paragraph('Trii Software | Jul 2022 - Present | Remote', meta_style)
)
story.append(
    Paragraph(
        'Enterprise SaaS platform for omnichannel communication, chat, ticketing, '
        'and business operations.',
        context_style,
    )
)

bullets = [
    '<b>Microfrontend architecture:</b> Introduced Single-SPA, migrated '
    'approximately 10 modules, and mentored two teammates on adoption.',
    '<b>Omnichannel product delivery:</b> Built approximately 90% of a chat '
    'feature spanning WhatsApp, Facebook, and Instagram, then refactored it into '
    'a decoupled architecture.',
    '<b>Frontend performance:</b> Implemented cache-first loading with IndexedDB '
    'and Web Workers plus list virtualization, cutting chat load times to near-instant.',
    '<b>Reusable platform tooling:</b> Built a shared Single-SPA chat parcel and '
    'an internal React component library distributed through Storybook and npm, '
    'reducing duplication across modules.',
    '<b>Real-time systems:</b> Built chat, notifications, and live data updates '
    'using WebSockets.',
]
for text in bullets:
    story.append(Paragraph(f'- {text}', bullet_style))

story.extend(section('Education'))
story.append(
    Paragraph(
        '<b>Technical Degree in Software Development</b> | ITEC | 2021 - 2024',
        education_style,
    )
)

story.extend(section('Languages'))
story.append(Paragraph('<b>Spanish:</b> Native | <b>English:</b> C2', body_style))

doc.build(story)
print(OUTPUT)
