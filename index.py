from app import app, db, socketio
from app.models import User, Role, Hexagon, Categ

@app.shell_context_processor
def make_shell_context(): 
    return {'db': db, 'U': User, 'R': Role, 'H': Hexagon, 'C': Categ}
