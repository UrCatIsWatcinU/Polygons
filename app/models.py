from app import db, login
from app import app
from app.lib import date_to_timestamp


from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin
from datetime import datetime
from sqlalchemy import func
from sqlalchemy.sql.expression import select
from flask import render_template
import jwt


@login.user_loader
def load_user(id):
    return User.query.get(int(id))
class UserRating(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    change = db.Column(db.Integer, default=0)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), index=True)
    user_who_change_id = db.Column(db.Integer, db.ForeignKey('user.id'), index=True)

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), index=True, unique=True)
    email = db.Column(db.String(120), index=True, unique=True)
    password_hash = db.Column(db.String(128))
    role_id = db.Column(db.Integer, db.ForeignKey('role.id'), nullable=False, default=1)
    settings = db.Column(db.String(400))
    is_hidden =  db.Column(db.Boolean, default=False)
    addr = db.Column(db.String(16))
    is_verify = db.Column(db.Boolean, default=False)
    
    hexs = db.relationship('Hexagon', backref='author', lazy='dynamic', cascade="all, delete-orphan")
    chains = db.relationship('Chain', backref='author', lazy='dynamic', cascade="all, delete-orphan")
    complaints = db.relationship('Complaint', backref='author', lazy='dynamic', cascade="all, delete-orphan")
    comments = db.relationship('Comment', backref='author', lazy='dynamic', cascade="all, delete-orphan")
    ratings_changes = db.relationship('UserRating', foreign_keys=[UserRating.user_who_change_id], backref='author', lazy='dynamic', cascade="all, delete-orphan")
    ratings = db.relationship('UserRating', foreign_keys=[UserRating.user_id], backref='target', lazy='dynamic', cascade="all, delete-orphan")
    messages = db.relationship('Message', backref='author', lazy='dynamic', cascade="all, delete-orphan")
    chats_memberships = db.relationship('ChatMember', backref='member', lazy='dynamic', cascade="all, delete-orphan")
    ip_bans = db.relationship('BannedIp', backref='user', lazy='dynamic', cascade="all, delete-orphan")

    def gen_confirm_token(self):
        token = jwt.encode({'id': self.id}, app.config['SECRET_KEY'], algorithm='HS256')
        return token
    
    @staticmethod
    def verify_confirm_token(token):
        try:
            id = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])['id']
        except:
            return
        
        user = User.query.get(id)
        user.is_verify = True

        db.session.add(user)
        db.session.commit()

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def get_rating(self):
        return db.session.execute(select([func.sum(UserRating.change)]).where(UserRating.user_id == self.id)).first()[0] or 0

class BannedIp(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    addr = db.Column(db.String(16), unique=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), index=True)
    

class Role(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(64), index=True, unique=True)
    users = db.relationship('User', backref='role', lazy='dynamic', cascade="all, delete-orphan")

class Hexagon(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    selector = db.Column(db.String(10), index=True)
    chain_id = db.Column(db.Integer,db.ForeignKey('chain.id'), index=True)
    categ_id = db.Column(db.Integer, db.ForeignKey('categ.id'), index=True)
    num = db.Column(db.Integer)
    inner_text = db.Column(db.String(64), index=True)
    about = db.Column(db.Text)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    BG_img = db.Column(db.String(100), default='')
    complaints = db.relationship('Complaint', backref='hex', lazy='dynamic', cascade="all, delete-orphan")
    imgs = db.relationship('Image', backref='hex', lazy='dynamic', cascade="all, delete-orphan")

class Image(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    hex_id = db.Column(db.Integer,db.ForeignKey('hexagon.id'), index=True)
    ext = db.Column(db.String(5), default='.png')
    is_BG = db.Column(db.Boolean, default=False)
    
class Categ(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(64), unique=True, index=True)
    color = db.Column(db.String(6), unique=True)
    text_color = db.Column(db.String(6))
    BG_img = db.Column(db.String(200))
    params = db.Column(db.String(100))

    hexs = db.relationship('Hexagon', backref='categ', lazy='dynamic', cascade="all, delete-orphan")
    chains = db.relationship('Chain', backref='categ', lazy='dynamic', cascade="all, delete-orphan")

# таблица для мохранения изменений пользователей, чтобы админ мог откатывать, пока что не нужна
class Change(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    body = db.Column(db.String(400), index=True)

class Complaint(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    body = db.Column(db.String(400), index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), index=True)
    hex_id = db.Column(db.Integer, db.ForeignKey('hexagon.id'), index=True)

class Comment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    body = db.Column(db.String(500), index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), index=True)
    chain_id = db.Column(db.Integer,db.ForeignKey('chain.id'), index=True)
    reply_to_id = db.Column(db.Integer,db.ForeignKey('comment.id'), index=True)
    replies = db.relationship('Comment', backref='to', lazy='dynamic', cascade="all, delete-orphan", remote_side=[id], single_parent=True, uselist=True)

    

class RatingChange(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    change = db.Column(db.Integer, default=0)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), index=True)
    chain_id = db.Column(db.Integer,db.ForeignKey('chain.id'), index=True)

class Chain(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    categ_id = db.Column(db.Integer, db.ForeignKey('categ.id'), index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), index=True)
    hexs = db.relationship('Hexagon', backref='chain', lazy='dynamic', cascade="all, delete-orphan")
    comments = db.relationship('Comment', backref='chain', lazy='dynamic', cascade="all, delete-orphan")
    rating_changes = db.relationship('RatingChange', backref='chain', lazy='dynamic', cascade="all, delete-orphan")


class Chat(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), index=True)
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'), index=True)

    members = db.relationship('ChatMember', backref='chat', lazy='dynamic', cascade="all, delete-orphan")
    messages = db.relationship('Message', backref='chat', lazy='dynamic', cascade="all, delete-orphan")

    def get_last_message(self):
        return db.session.query(Message).filter_by(chat_id=self.id).order_by(db.desc(Message.date)).first()

class ChatMember(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), index=True)
    chat_id = db.Column(db.Integer, db.ForeignKey('chat.id'), index=True)
    chat_role_id = db.Column(db.Integer, db.ForeignKey('chat_role.id'), default=1, index=True)
    last_seen = db.Column(db.DateTime, default=datetime.utcnow)

class ChatRole(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(20), index=True)
    members = db.relationship('ChatMember', backref='role', lazy='dynamic', cascade="all, delete-orphan")

class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), index=True)
    chat_id = db.Column(db.Integer, db.ForeignKey('chat.id'), index=True)
    text = db.Column(db.Text)
    date = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    
    def __repr__(self):
        return render_template('parts/message.html', message=self, date_parse=date_to_timestamp)