from distutils.core import setup
import py2exe

setup(
    windows=[{"script":"dwnldData.py"}],
    options={"py2exe": {}}
)