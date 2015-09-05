import sys
from datetime import datetime
import requests
import json
from bs4 import BeautifulSoup

# if script started with date-argument then download base for that date
if len(sys.argv) > 1:
    dwnldate = sys.argv[1]
else:
    dwnldate = datetime.strftime(datetime.now(), "%d.%m.%Y")

# check os and set right path to base
# NB! basePath is path without extension
if sys.platform == 'win32':
    basePath = 'base/base'
elif sys.platform == 'darwin':
    basePath = '../../../../base/base'
else:
    print('You are running on unsupported OS.')
    print('Or cygwin under the Windows (run in cmd)')
    raise SystemExit(1) # exit with code 1 (error)

# collecting data from mtt.ru

# form request
data = {
    'g': 'mtt',
    'm': 'def_codes',
    'a': 'processRequest',
    'def': "*",
    'def_number': "",
    'area': "*",
    'operator': "*",
    'standard': "*",
    'date': dwnldate
}

print('Starting downloading')

# send request
r = requests.post("http://www.mtt.ru/?callback=?", params=data)

# parse from json
r = r.json()

if r.get('status') == 'success':
	print('Download was successful')
elif r.get('status') == 'captcha':
	print('Too many requests from your IP. Try again later.')
	raise SystemExit(1) # exit with code 1 (error)
else:
	print('Something went wrong. Download was unsuccessful')
	raise SystemExit(1) # exit with code 1 (error)

# take html-table with data
r = r.get('resultHTML')
# r = "<table>\r\n" + r + "\r\n</table>"

# write html-table into file
with open(basePath+".html", "w", encoding='utf-8') as f:
	f.write(r)
print('Starting parsing')
base = dict()

# creating object for html-parser
html = BeautifulSoup(r, 'html.parser')

# for each row of table
# get each cell of row
# if location or provider of def-code doesnt exist, create dict-entity in base-dictionary
for row in html.findAll('tr'):
    if row.findAll('th'): # save header of table
        headers = row.findAll('th')
    else:
        cell = row.findAll('td')

        intvl_head = headers[1].text

        code = cell[0].text
        intvl = cell[1].text
        loc = cell[2].text
        prov = cell[3].strong.text

        if loc not in base:
            base[loc] = dict()
        if prov not in base[loc]:
            base[loc][prov] = dict()
        if code not in base[loc][prov]:
            base[loc][prov][code] = dict()

        base[loc][prov][code].update({intvl: {}})

print('Parsing was successful')
print('Exporting to JSON')

# export to JSON-format
with open(basePath+'.json', 'w', encoding='utf-8') as outfile:
    json.dump(base, outfile, sort_keys=True, indent=4, ensure_ascii=False)

print('Exporting was successful')
print('Exiting...')

# exit with code 0 (with no errors)
raise SystemExit(0)
