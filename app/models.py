from app import db, login

from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin
from datetime import datetime


class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), index=True, unique=True)
    email = db.Column(db.String(120), index=True, unique=True)
    password_hash = db.Column(db.String(128))
    role_id = db.Column(db.Integer, db.ForeignKey('role.id'), nullable=False, default=1)
    settings = db.Column(db.String(400))
    hexs = db.relationship('Hexagon', backref='author', lazy='dynamic')
    complaints = db.relationship('Complaint', backref='author', lazy='dynamic')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def __repr__(self):
        return f'<User {self.username} {self.role_id}>'

class Role(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(64), index=True, unique=True)
    users = db.relationship('User', backref='role', lazy='dynamic', cascade="all, delete-orphan")

@login.user_loader
def load_user(id):
    return User.query.get(int(id))


class Hexagon(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    selector = db.Column(db.String(10), index=True)
    chain_id = db.Column(db.Integer, index=True)
    num = db.Column(db.Integer)
    inner_text = db.Column(db.String(64), index=True)
    about = db.Column(db.Text)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), index=True)
    categ_id = db.Column(db.Integer, db.ForeignKey('categ.id'), index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    complaints = db.relationship('Complaint', backref='hex', lazy='dynamic', cascade="all, delete-orphan")

class Categ(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(64), unique=True, index=True)
    color = db.Column(db.String(6), unique=True)
    text_color = db.Column(db.String(6))
    params = db.Column(db.String(100))
    hexs = db.relationship('Hexagon', backref='categ', lazy='dynamic', cascade="all, delete-orphan")

class Change(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    body = db.Column(db.String(400), index=True)

class Complaint(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    body = db.Column(db.String(400), index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), index=True)
    hex_id = db.Column(db.Integer, db.ForeignKey('hexagon.id'), index=True)

