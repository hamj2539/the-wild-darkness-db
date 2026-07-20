import json
from datetime import date
from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / 'data'
OUTPUT = ROOT / 'exports' / 'pdf'
SCHEMAS = json.loads((DATA / 'schemas.json').read_text(encoding='utf-8'))

rows = [['Dataset', 'Verified records', 'Required fields']]
for dataset, fields in SCHEMAS['datasets'].items():
    entries = json.loads((DATA / f'{dataset}.json').read_text(encoding='utf-8'))
    rows.append([dataset, str(len(entries)), str(len(SCHEMAS['common_required']) + len(fields))])

OUTPUT.mkdir(parents=True, exist_ok=True)
document = SimpleDocTemplate(str(OUTPUT / 'the-wild-darkness-database.pdf'), pagesize=A4, rightMargin=18*mm, leftMargin=18*mm, topMargin=18*mm, bottomMargin=18*mm)
styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='Lead', parent=styles['BodyText'], leading=16, textColor=colors.HexColor('#374151')))
story = [
    Paragraph('The Wild Darkness Database', styles['Title']),
    Spacer(1, 5*mm),
    Paragraph('Source-first database export', styles['Heading2']),
    Paragraph('This catalog is generated from the JSON datasets. It contains no unverified game facts: unknown fields must remain null until a direct, reviewable source has been recorded.', styles['Lead']),
    Spacer(1, 7*mm),
    Paragraph(f'Generated: {date.today().isoformat()} | Schema: {SCHEMAS["schema_version"]}', styles['BodyText']),
    Spacer(1, 5*mm),
]
table = Table(rows, colWidths=[65*mm, 38*mm, 55*mm], repeatRows=1)
table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1D2433')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('ALIGN', (1, 1), (-1, -1), 'CENTER'),
    ('GRID', (0, 0), (-1, -1), 0.35, colors.HexColor('#CBD5E1')),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8FAFC')]),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
]))
story.extend([table, Spacer(1, 7*mm), Paragraph('Update workflow', styles['Heading2']), Paragraph('Edit data/*.json, include source URLs and version information, run validation, then regenerate CSV, Excel, and PDF exports.', styles['BodyText'])])
document.build(story)
print('PDF export created.')
