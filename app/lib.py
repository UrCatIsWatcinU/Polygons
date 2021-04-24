import os
import shutil

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

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ['png', 'jpg', 'jpeg', 'gif']