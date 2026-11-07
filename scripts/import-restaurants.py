"""Read the supplied XLSX without editing it; emit traceable demo restaurant data."""
import argparse
import collections
import json
import pathlib
import re
import xml.etree.ElementTree as ET
import zipfile

parser = argparse.ArgumentParser()
parser.add_argument('workbook', type=pathlib.Path)
args = parser.parse_args()
ns = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
root = pathlib.Path(__file__).resolve().parent.parent
with zipfile.ZipFile(args.workbook) as archive:
    strings = [''.join(si.itertext()) for si in ET.fromstring(archive.read('xl/sharedStrings.xml')).findall('s:si', ns)]
    sheet = ET.fromstring(archive.read('xl/worksheets/sheet1.xml'))
    records = []
    for row in sheet.findall('.//s:row', ns)[1:]:
        values = {}
        for cell in row.findall('s:c', ns):
            value = cell.find('s:v', ns)
            text = value.text if value is not None else ''
            if cell.get('t') == 's':
                text = strings[int(text)]
            elif cell.get('t') == 'inlineStr':
                text = ''.join(cell.find('s:is', ns).itertext())
            values[re.sub(r'\d+', '', cell.get('r'))] = text.strip()
        if not values.get('B'):
            continue
        number = int(float(values['A']))
        category = values['C']
        if 'chay' in category.lower(): group = 'Ăn chay'
        elif category == 'Hải sản': group = 'Hải sản'
        elif category == 'Fine Dining': group = 'Fine dining'
        elif category.startswith('Nước'): group = 'Cà phê & nước'
        elif category.startswith('Quán bánh') or category.startswith('Bánh /'): group = 'Bánh'
        elif 'vặt' in category.lower() or 'Vặt' in category: group = 'Ăn vặt'
        elif category == 'Ăn sáng': group = 'Ăn sáng'
        else: group = 'Món chính'
        image_id = re.search(r'photo-[\w-]+', values['G'])
        records.append({
            'id': f'dn-{number:03}', 'sourceNumber': number,
            'name': values['B'], 'category': group, 'originalCategory': category,
            'suggestedMeals': [m.strip() for m in values['D'].split(',')],
            'priceLabel': values['E'], 'priceTier': values['E'].split('(')[0].strip(),
            'address': values['F'], 'area': 'Đà Nẵng',
            'verification': 'spreadsheet',
            'photo': {'url': values['G'], 'local': f'/images/restaurants/{image_id.group()}.jpg' if image_id else None,
                      'kind': 'illustration', 'sourceLabel': 'Unsplash · link trong file Excel', 'sourceUrl': values['G']},
            'source': {'file': args.workbook.name, 'row': int(row.get('r'))},
        })
assert len(records) == 105, f'Expected 105 records, found {len(records)}'
assert len({r['id'] for r in records}) == len(records)
document = {'sourceFile': args.workbook.name, 'importedAt': '2026-11-02',
            'areaNote': 'Đà Nẵng — khu vực suy ra từ tên và địa chỉ trong file, chưa chuẩn hóa từng địa chỉ.',
            'restaurants': records}
(root / 'data/restaurants.json').write_text(json.dumps(document, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'imported': len(records), 'uniquePhotos': len({r['photo']['url'] for r in records}),
                  'categories': dict(collections.Counter(r['category'] for r in records))}, ensure_ascii=False))
