"""Download only public image URLs already supplied or found on official pages."""
import concurrent.futures
import json
import pathlib
import urllib.request

root = pathlib.Path(__file__).resolve().parent.parent
data_file = root / 'data/restaurants.json'
data = json.loads(data_file.read_text(encoding='utf-8'))
official = {
    'dn-012': ('https://madamelan.vn/storage/website-cover-pc.png', 'https://madamelan.vn/', 'Madame Lân · website chính thức', 'dn-012.png'),
    'dn-013': ('https://pizza4ps.com/wp-content/uploads/2023/07/78034719_2721643444539354_2592835004560048128_n.jpg', 'https://pizza4ps.com/vn/location/944/?lang=vietnamese', "Pizza 4P’s · trang Indochina", 'dn-013.jpg'),
    'dn-018': ('https://bepcuon.net/wp-content/uploads/2026/05/131977993_398616208131261_81902362474932361_n.jpg', 'https://bepcuon.net/', 'Bếp Cuốn · website chính thức', 'dn-018.jpg'),
}
for record in data['restaurants']:
    if record['id'] in official:
        url, page, label, filename = official[record['id']]
        record['photo'] = {'url': url, 'local': '/images/restaurants/' + filename, 'kind': 'official-page', 'sourceLabel': label, 'sourceUrl': page, 'checkedAt': '2026-11-02'}
        record['website'] = page
assets = root / 'public/images/restaurants'
assets.mkdir(parents=True, exist_ok=True)

def download(pair):
    url, local = pair
    target = root / 'public' / local.lstrip('/')
    if target.exists(): return (url, True, None)
    try:
        request = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(request, timeout=20) as response:
            if not response.headers.get('Content-Type', '').startswith('image/'):
                raise ValueError('Not an image')
            content = response.read(6_000_001)
        if len(content) > 6_000_000: raise ValueError('Image too large')
        target.write_bytes(content)
        return (url, True, None)
    except Exception as error:
        return (url, False, str(error))

jobs = {(r['photo']['url'], r['photo']['local']) for r in data['restaurants'] if r['photo']['local']}
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as executor:
    results = list(executor.map(download, sorted(jobs)))
failed = {url for url, ok, error in results if not ok}
for r in data['restaurants']:
    if r['photo']['url'] in failed: r['photo']['local'] = None
data_file.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
(root / 'data/restaurant-image-report.json').write_text(json.dumps({'downloaded': sum(ok for _, ok, _ in results), 'failed': [{'url': u, 'error': e} for u, ok, e in results if not ok]}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'downloaded': sum(ok for _, ok, _ in results), 'failed': len(failed), 'officialPhotos': sum(r['photo']['kind'] == 'official-page' and r['photo']['local'] is not None for r in data['restaurants'])}))
