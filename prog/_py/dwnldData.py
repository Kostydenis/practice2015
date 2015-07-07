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
with open("../base/base.html", "w") as f:
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
        if cell[2].text not in base:
            base[cell[2].text] = dict()
        if cell[3].strong.text not in base[cell[2].text]:
            base[cell[2].text][cell[3].strong.text] = dict()
        if cell[0].text+cell[1].text[0:3] not in base[cell[2].text][cell[3].strong.text]:
            base[cell[2].text][cell[3].strong.text][cell[0].text+cell[1].text[0:3]] = dict()

        base[cell[2].text][cell[3].strong.text][cell[0].text+cell[1].text[0:3]].update({headers[3].text.replace('Оператор/', '') : cell[3].span.text})
        base[cell[2].text][cell[3].strong.text][cell[0].text+cell[1].text[0:3]].update({headers[1].text : cell[1].text})

print('Parsing was successful')
print('Exporting to JSON')

# export to JSON-format
with open('../base/base.json', 'w') as outfile:
    json.dump(base, outfile, sort_keys=True, indent=4, ensure_ascii=False)

print('Exporting was successful')
print('Exiting...')

# exit with code 0 (with no errors)
raise SystemExit(0)
