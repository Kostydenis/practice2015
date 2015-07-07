import os
from setuptools import setup

print os.system(r'sudo rm -rf mac_build mac_dist savi_log.txt')		

APP = ['dwnldData.py']
OPTIONS = {	'argv_emulation': True}

setup(
	app=APP,
	options={'py2app': OPTIONS},
	setup_requires=['py2app'],
	version="0.2.3"
)