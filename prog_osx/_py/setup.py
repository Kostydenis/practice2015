from setuptools import setup

setup(
	name = "dwnldData",
	app=["dwnldData.py"],
	version = "0.1",
	setup_requires=["py2app"],
	options={'py2app':{}},
)