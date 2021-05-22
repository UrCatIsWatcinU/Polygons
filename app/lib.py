
from datetime import datetime
import os
import shutil
import time
from sqlalchemy.inspection import inspect
from stringcase import camelcase

def create_dir(name):
    try:
        os.mkdir(os.getcwd() + name)
    except OSError:
        pass
def delete_dir(name):
    try:
        shutil.rmtree(os.getcwd() + name)
    except FileNotFoundError:
        pass 

def serialize(row, not_needed_attrs=[]):
    result = {}

    for c in inspect(row).attrs.keys():
        c_type = str(type(getattr(row, c)))
        if c not in not_needed_attrs and not ('app' in c_type or 'sqlalchemy' in c_type):
            c_name = camelcase(c)
            result[c_name] = getattr(row, c)
            if isinstance(result[c_name], datetime):
                result[c_name] = time.mktime(result[c_name].timetuple())
    return result