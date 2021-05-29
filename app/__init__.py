from flask import Flask
from config import Config
from flask_socketio import SocketIO
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_login import LoginManager
from flask_babel import Babel
from flask_mail import Mail

app = Flask(__name__)
app.config.from_object(Config)

socketio = SocketIO(app)

login = LoginManager(app)
login.login_view = 'login'

db = SQLAlchemy(app)
migrate = Migrate(app, db)

babel = Babel(app)

mail = Mail(app)

from app import routes, models