from app import app, db
from app.models import ChatRole, User, Role, Hexagon, Categ, UserRating

@app.shell_context_processor
def make_shell_context(): 
    return {'db': db, 'U': User, 'R': Role, 'H': Hexagon, 'C': Categ, 'CR': ChatRole}
