import os
import json
import shutil
import time
import re
from threading import Timer
from datetime import datetime

from app import app, socketio, db, babel
from app.forms import LoginForm, RegistrationForm
from app.models import BannedIp, Chain, Chat, ChatMember, ChatRole, Comment, Complaint, Hexagon, Image, Message, RatingChange, User, Categ, UserRating
from app.lib import create_dir, delete_dir, serialize
from app.email import send_email

from flask import render_template, redirect, url_for, request, abort
from flask_socketio import emit
from flask_login import current_user, login_user, logout_user, login_required
from flask_babel import _
from werkzeug.urls import url_encode, url_parse
from flask_sqlalchemy import sqlalchemy
from sqlalchemy import func
from sqlalchemy.sql.expression import select


@babel.localeselector
def get_locale():
    return request.accept_languages.best_match(app.config['LANGUAGES'])

@app.before_request
def block_method():
    ip = request.environ.get('HTTP_X_REAL_IP', request.remote_addr) 
    ip_ban_list = db.session.execute(select(BannedIp.addr)).scalars().all()
    if ip in ip_ban_list:
        abort(403)

@app.errorhandler(404)
def not_found_error(error):
    user = None
    if current_user and current_user.is_authenticated:
        user = current_user
    return render_template('error-page.html', error_message='404 not found', error_description=_('If you write URL manually, check if it is correct'), user=user, title='404'), 404

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    user = None
    if current_user and current_user.is_authenticated:
        user = current_user
    return render_template('error-page.html', user=user, title='500', error_message='500 internal error', error_description=_('Some troubles happend on server. Please send message to admin')), 500

@app.route('/favicon.ico')
def get_favicon():
    return redirect(url_for('static', filename='favicon.png'))

@app.route('/')
@app.route('/index')
def index():
    user = None
    if current_user and current_user.is_authenticated:
        user = current_user
    
    categs = Categ.query.all()

    return render_template('index.html', categs=categs, title='Main', user=user)




@app.route('/categ/new', methods=['POST'])
@login_required
def create_new_categ():
    if not current_user or not current_user.is_authenticated or current_user.role_id != 2:
        return json.dumps({"success":False})
    
    new_categ = request.get_json(True)

    categ = Categ(
        name=new_categ['name'], 
        color=new_categ['color'], 
        text_color=new_categ['textColor'],
        params=new_categ['params'])
    try:
        db.session.add(categ)
        db.session.commit()
    except sqlalchemy.exc.IntegrityError:
        db.session.rollback()
        return json.dumps({"success":False, "message": 'Category already exists'})
    socketio.emit('reload')
    return json.dumps({"success":True})

@app.route('/categ/change', methods=['POST'])
@login_required
def change_categ():
    if not current_user or not current_user.is_authenticated or current_user.role_id != 2:
        return json.dumps({"success":False})
    
    changed_categ = request.get_json(True)
    categ = db.session.query(Categ).filter(Categ.name == changed_categ['oldName']).first_or_404()
    categ.name = changed_categ['name']
    categ.color = changed_categ['color']
    categ.text_color = changed_categ['textColor']
    try:
        db.session.add(categ)
        db.session.commit()
    except sqlalchemy.exc.IntegrityError:
        db.session.rollback()
        return json.dumps({"success": False, "message": 'Category already exists'})

        
    socketio.emit('reload')
    return json.dumps({"success":True})

@app.route('/categ/delete/<name>', methods=['DELETE'])
@login_required
def delete_categ(name):
    if not current_user or not current_user.is_authenticated or current_user.role_id != 2:
        return json.dumps({"success":False})

    categ = Categ.query.filter(Categ.name==name).first_or_404()
    
    delete_dir(f"/app/static/uploadedImgs/{categ.name}")

    db.session.delete(categ)
    db.session.commit()
    socketio.emit('reload')
    return json.dumps({"success":True})

@app.route('/categ/<categ_name>/params')
def give_categ_params(categ_name):
    return Categ.query.filter_by(name=categ_name).first_or_404().params

@app.route('/categs/names')
@login_required
def get_categs_names():
    if(current_user.role_id != 2):
        return json.dumps({'success': False})
    return json.dumps({
        'success': True,
        'categs': list(map(lambda categ: {
            "name": categ.name, 
            "id": categ.id
        }, Categ.query.all())) 
    })

@app.route('/categs/<int:id>/uploadBG', methods=['POST'])
@login_required
def upload_categ_BG(id):
    if(current_user.role_id != 2):
        return json.dumps({'success': False})
    
    categ = Categ.query.get_or_404(id)

    if 'file' not in request.files:
        return json.dumps({'success1': False})

    file = request.files['file']
    
    img = Image(hex_id=id)
    img.ext = file.mimetype.replace('image/', '')

    if(not img.ext in ['png', 'jpg', 'jpeg', 'gif']):
        return json.dumps({'success2': False})

    db.session.add(img)
    db.session.commit()

    try:
        file.save(os.getcwd() + f"/app/static/uploadedImgs/{img.id}.{img.ext}" )
    except BaseException:
        db.session.delete(img)
        db.session.commit()
        return json.dumps({'success3': False})

    categ.BG_img = f'{img.id}.{img.ext}'
    db.session.add(categ)
    db.session.commit()

    return json.dumps({'success': True})
    

@app.route('/categs/<id>')
@login_required
def get_categ(id):
    categ = Categ.query.get(id)

    if not categ:
        categ = Categ.query.filter_by(name=id).first_or_404()
    
    return json.dumps({'name': categ.name, 'id': categ.id})


@app.route('/registration', methods=['GET', 'POST'])
def registration():
    if current_user.is_authenticated:
        return redirect(url_for('index'))

    form = RegistrationForm()

    if form.validate_on_submit():
        user = User(username=form.username.data, email=form.email.data)
        user.set_password(form.password.data)

        db.session.add(user)
        db.session.commit()
        
        try:
            send_email('Library Hexagon: your confrimation link', user.email, 'info@libhex.com',
                render_template('parts/confirm-email.txt', user=user),
                render_template('parts/confirm-email.html', user=user)
            )
        except:
            db.session.delete(user)
            db.session.commit()
            return render_template('error_page.html', user=None, title='Reg error', error_message=_('Registration error'), error_description=_('Please try later or contact the site administrator.'))
            
        return redirect(url_for('login'))

    return render_template('registration.html', title='Register', form=form)

@app.route('/confirm_email/<token>')
def confirm_email(token):
    User.verify_confirm_token(token)
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(username=form.username.data).first()
        if user is None:
            return render_template('login.html', title='Login', form=form, errors=['username']) 
        if not user.check_password(form.password.data):
            return render_template('login.html', title='Login', form=form, errors=['pwd']) 
        
        if not user.is_verify:
            return render_template('error-page.html', title="Verify email", error_message=_('Verification required'), error_description=_('An email with a link to confirm your email address has been sent to your email address. If you have not received the email, please contact the site administrator.'))

        login_user(user, remember=form.remember_me.data)
        
        user.addr = request.environ.get('HTTP_X_REAL_IP', request.remote_addr)
        db.session.add(user)
        db.session.commit()

        next_page = request.args.get('next')
        if not next_page or url_parse(next_page).netloc != '':
            next_page = url_for('index')

        return redirect(next_page)
    return render_template('login.html', title='Login', form=form, errors=[])

@app.route('/logout')
def logout():
    logout_user()
    return redirect(url_for('index'))

@app.route('/users')
@login_required
def users_all():    
    users = User.query.all()
    return render_template('users.html', users=sorted(users, key=lambda u: u.get_rating(), reverse=True), user=current_user, title="Users list")

@app.route('/users/<id>')
def user(id):
    owner = User.query.filter_by(username=id).first()
    if not owner:
        owner = User.query.get_or_404(id)
    
    allowed_change = 0

    user = None
    if current_user.is_authenticated and current_user.id:
        user = current_user
        user_change = UserRating.query.filter_by(user_id=id, user_who_change_id=user.id).first()
        if user_change:
            allowed_change = -user_change.change

    def hexs_sort_fn(hexs):
        list(hexs).sort(key=lambda hex: hex.num)
        return hexs or []

    return render_template('user.html', title=owner.username if owner.id != user.id else 'Profile', owner=owner, allowed_change=allowed_change, hexs_sort_fn=hexs_sort_fn, user=user)

@app.route('/users/<id>/json')
def user_json(id):
    user = User.query.get(id)
    
    if not user:
        user = User.query.filter_by(username=id).first_or_404()


    return json.dumps({
        'id': user.id,
        'name': user.username
    })

@app.route('/users/<id>/change_visibility', methods=['PUT'])
@login_required
def change_visibility(id):
    user = None
    if id == 'i':
        user = User.query.get(current_user.id) 
    else:
        user = User.query.get(id)
        
    if user.id == current_user.id or current_user.role.name == 'admin':
        user.is_hidden = not user.is_hidden
        db.session.add(user)
        db.session.commit() 
        return json.dumps({'success': True})

    return json.dumps({'success': False})


@app.route('/users/<id>/rating/change', methods=['POST'])
@login_required
def change_user_rating(id):
    user = User.query.get_or_404(id)

    user_rating_change = UserRating.query.filter_by(user_who_change_id=current_user.id, user_id=id).first()

    change_num = 0
    if not user_rating_change:
        change = UserRating(change=request.get_json(True)['change'], user_who_change_id=current_user.id, user_id=id)
        change_num = request.get_json(True)['change']
        db.session.add(change)
    else:
        if user_rating_change.change == request.get_json(True)['change']:
            return json.dumps({'success': False})
        else:
            db.session.delete(user_rating_change)
    
    db.session.commit()

    return json.dumps({'success': True, 'num': user.get_rating(), 'change': change_num})

@app.route('/users/i')
def give_current_user():
    if current_user and current_user.is_authenticated:
        return json.dumps({'userId': current_user.id, 'userRole': current_user.role_id, 'username': current_user.username})
    else:
        return json.dumps({'err': 'no user'})

@app.route('/users/delete/<id>', methods=['DELETE'])
@login_required
def delete_user(id):
    user = None
    if id == 'i':
        user = User.query.get(current_user.id)
    else:
        if current_user.role_id != 2:
            return json.dumps({"success": False})
        user = User.query.get_or_404(id)

    db.session.delete(user)
    db.session.commit()
    return json.dumps({"success":True})

@app.route('/users/<int:id>/ban')
@login_required
def ban_user(id):
    if current_user.role_id != 2:
        return json.dumps({"success": False}), 403

    user = User.query.get_or_404(id)

    if not user.addr:
        return json.dumps({"success": False})
    ban = BannedIp(addr=user.addr, user_id=user.id)

    db.session.add(ban)
    db.session.commit()

    return json.dumps({"success":True})

@app.route('/users/bans')
@login_required
def bans():
    if current_user.role_id != 2:
        return json.dumps({"success": False}), 403
    
    return render_template('ip-bans.html', bans=BannedIp.query.all(), title='Bans', user=current_user)
@app.route('/users/bans/<int:id>/delete')
@login_required
def delete_ban(id):
    if current_user.role_id != 2:
        return json.dumps({"success": False}), 403
    
    db.session.delete(BannedIp.query.get_or_404(id))
    db.session.commit()
    return json.dumps({'success': True})


admins_chat_roles = ['admin']
@app.route('/chats')
@login_required
def messages():
    return render_template('messages.html', title='Messages', user=current_user, chats=[m.chat for m in current_user.chats_memberships])
    
@app.route('/chats/roles')
@login_required
def get_chat_roles():
    return json.dumps([serialize(role) for role in ChatRole.query.all()])

@app.route('/chats/new', methods=['POST'])
@login_required
def create_chat():
    raw_chat = request.get_json(True)
    chat = Chat(name=raw_chat['name'], created_by=current_user.id)
    db.session.add(chat)
    db.session.commit()

    first_chat_member = ChatMember(user_id=current_user.id, chat_id=chat.id, chat_role_id=2)

    chat_members =[]
    for raw_member in raw_chat['members']:
        user = None
        print(raw_member)
        if 'id' in raw_member.keys():
            user = User.query.get(raw_member['id'])
        else:
            user = User.query.filter_by(username=raw_member['username']).first()

        if user:
            chat_members.append(ChatMember(chat_id=chat.id, user_id = user.id, chat_role_id=(raw_member['role'] if 'role' in raw_member.keys() else 1)))

    db.session.add_all([first_chat_member] + chat_members)
    db.session.commit()
    return({'success': True, 'id': chat.id, 'firtsMemberId': first_chat_member.id})

@app.route('/chats/<id>/delete', methods=['DELETE'])
@login_required
def delete_chat(id):
    chat = Chat.query.get_or_404(id)

    current_user_membership = ChatMember.query.filter_by(chat_id=chat.id, user_id=current_user.id).first()
    if not current_user_membership or current_user_membership.role.name != 'admin':
        return  json.dumps({'success': False, 'message': _('Access denied')})

    db.session.delete(chat)
    db.session.commit()
    return json.dumps({"success":True})


prepare_cmember_to_send = lambda m: {
    **serialize(m, ['chat_role_id', 'user_id']),
    'role': {
        'id': m.chat_role_id,    
        'name': m.role.name
    },
    'user':{
        'id': m.user_id , 
        'name': m.member.username,
    }
}
@app.route('/chats/<id>/members')
@login_required 
def get_chat_members(id):
    chat = Chat.query.get_or_404(id)
    return json.dumps([prepare_cmember_to_send(m) for m in chat.members])

@app.route('/chats/<id>/members/i')
@login_required 
def get_me_of_members(id):
    chat = Chat.query.get_or_404(id)
    i = ChatMember.query.filter_by(chat_id=chat.id, user_id=current_user.id).first_or_404()

    return json.dumps(prepare_cmember_to_send(i))

@app.route('/chats/<id>/add_member', methods=['POST'])
@login_required
def add_chat_member(id):
    raw_member = request.get_json(True)
    chat = Chat.query.get_or_404(id)
    
    user = None
    if 'userId' in raw_member.values():
        user = User.query.get(raw_member['userId'])
    else:   
        user = User.query.filter_by(username=raw_member['user']).first()

    if not user:
        return json.dumps({'success': True, 'message': _('No such user')})

    if ChatMember.query.filter_by(user_id=user.id, chat_id=chat.id).first():
        return json.dumps({'success': False, 'message': _('This user alredy is a member of this chat')})

    current_user_membership = ChatMember.query.filter_by(chat_id=chat.id, user_id=current_user.id).first()
    if not current_user_membership or current_user_membership.role.name not in admins_chat_roles:
        return  json.dumps({'success': False, 'message': _('Access denied')})
    
    member = ChatMember(user_id=user.id, chat_role_id=raw_member['role'], chat_id=chat.id)
    db.session.add(member)
    db.session.commit()
    return json.dumps({'success': True, **prepare_cmember_to_send(member)})

@app.route('/chats/members/<id>/delete', methods=['DELETE'])
@login_required
def delete_chat_member(id):
    member = ChatMember.query.get_or_404(id)
    chat = Chat.query.get(member.chat_id)
    
    current_user_membership = ChatMember.query.filter_by(chat_id=chat.id, user_id=current_user.id).first()
    if not current_user_membership or (current_user.id != member.user_id and current_user_membership.role.name not in admins_chat_roles):
        return  json.dumps({'success': False})
        
    db.session.delete(member)
    db.session.commit()

    if not len(list(chat.members.all())):
        db.session.delete(chat)
        db.session.commit()
        

    return json.dumps({'success': True})

@app.route('/chats/<id>/members/last_seen', methods=['PUT'])
@login_required
def last_seen_chat_member(id):
    chat = Chat.query.get_or_404(id)

    member = ChatMember.query.filter_by(user_id=current_user.id, chat_id=chat.id).first()
    if not member:
        return json.dumps({'success': False})

    member.last_seen = datetime.utcnow()

    db.session.add(member)
    db.session.commit()

    return json.dumps({'success': True})

@app.route('/chats/members/<id>/update', methods=['PUT'])
@login_required
def update_chat_member(id):
    updation = request.get_json(True)
    member = ChatMember.query.get_or_404(id)

    current_user_membership = ChatMember.query.filter_by(chat_id=member.chat.id, user_id=current_user.id).first()
    if not current_user_membership or current_user_membership.role.name not in admins_chat_roles:
        return  json.dumps({'success': False, 'message': _('Access denied')})

    member.chat_role_id = updation['newRoleId']

    db.session.add(member)
    db.session.commit()

    return json.dumps({'success': True})

prepare_message_to_send = lambda message: {
    **serialize(message, ['user_id']),
    'user': {
        'id': message.user_id,
        'username': message.author.username
    }
}
@app.route('/chats/<id>/messages')
@login_required 
def get_chat_messages(id):
    chat = Chat.query.get_or_404(id)
    member = ChatMember.query.filter_by(user_id=current_user.id, chat_id=chat.id).first()
    if not member:
        return json.dumps({'success': False})

    unreaded_messages = [m.id for m in Message.query.filter(Message.chat_id == chat.id, Message.date > member.last_seen, Message.user_id != current_user.id).all()]
    

    return json.dumps([{**prepare_message_to_send(message), 'isUnread': (message.id in unreaded_messages)} for message in chat.messages])

@socketio.on('new-message')
def create_chat_message(raw_message):
    chat = Chat.query.get(raw_message['chatId'])
    user = User.query.get(raw_message['userId'])

    if(user and chat):
        message = Message(chat_id=chat.id, user_id=user.id, text=raw_message['text'])
        db.session.add(message)
        db.session.commit()


    socketio.emit('new-message', json.dumps({**prepare_message_to_send(message), 'isUnread': True}))
    socketio.emit('lastMessageUpdate', {'chatId': chat.id, 'body': str(message)})

@socketio.on('delete-message')
def delete_chat_messages(id):
    message = Message.query.get(id)
    chat = message.chat

    current_user_membership = ChatMember.query.filter_by(chat_id=message.chat.id, user_id=current_user.id).first()
    if not current_user_membership or (current_user.id != message.user_id and current_user_membership.role.name not in admins_chat_roles):
        return

    db.session.delete(message)
    db.session.commit()

    socketio.emit('delete-message-' + str(id), '')
    socketio.emit('lastMessageUpdate', {'chatId': message.chat_id, 'body': str(chat.get_last_message())})



@app.route('/settings')
@login_required
def get_settings():
    if current_user.settings:
        return json.dumps({"success": True, "body": current_user.settings})
    else:
        return json.dumps({"success": False})

@app.route('/settings/set', methods=['POST'])
@login_required
def set_settings():
    current_user.settings = request.get_data(as_text=True)
    db.session.add(current_user)
    db.session.commit()
    return json.dumps({"success": True})

@app.route('/settings/reset')
@login_required
def delete_settings():
    current_user.settings = None
    db.session.add(current_user)
    db.session.commit()
    return json.dumps({"success": True})





@app.route('/fields/<categ_name>')
def fields(categ_name):
    categ = Categ.query.filter_by(name=categ_name).first_or_404()

    if categ:
        if current_user.is_authenticated:
            return render_template('field.html', field_name=categ_name, role=current_user.role_id, user=current_user)
        else:
            return render_template('noedite-field.html', field_name=categ_name)
    else:
        return render_template('no-field.html')




prepare_hex_to_send = lambda hex: {
    "uuid": hex.id,
    **serialize(hex, ['id', 'categ_id', 'about', 'created_at', 'BG_img']),
    "username": User.query.get(hex.user_id).username if User.query.get(hex.user_id) else 'none',
    "creationDate": time.mktime(hex.created_at.timetuple()),
    "BGImg": hex.BG_img,
    "imgs": list(map(lambda img: {
        "uuid": img.id,
        "isBG": img.is_BG,
        "url": f"static/uploadedImgs/{hex.categ.name}/{hex.chain.id}/{hex.id}/{img.id}.{img.ext}",
    }, hex.imgs)) if hex.imgs else [],
}
@app.route('/hexs/<categ_name>')
def get_hexs(categ_name):
    userId = 0
    userRole = 0
    if current_user and current_user.is_authenticated:
        userId = current_user.id
        userRole = current_user.role_id

    hexs_to_send = []
    if categ_name == 'all':
        all_hexs = Hexagon.query.all()
        hexs_to_send = list(map(lambda hex: {
            "id": hex.id,
            "innerText": hex.inner_text,
            "chainId": hex.chain_id,
            "num": hex.num
        }, all_hexs))
    else:
        categ = Categ.query.filter_by(name=categ_name).first_or_404()
        hexs_to_send = list(map(prepare_hex_to_send, categ.hexs))

    return json.dumps({"body": hexs_to_send, "userId": userId, "userRole": userRole})


@app.route('/hexs/<int:id>')
def get_hex(id):
    hex = Hexagon.query.get_or_404(id)

    return redirect(f'/fields/{hex.categ.name}?' + url_encode({'hexId': id}))
@app.route('/hexs/<int:id>/json')
def get_hex_json(id):
    hex = Hexagon.query.get_or_404(id)
    
    return json.dumps(prepare_hex_to_send(hex))

@app.route('/hexs/<id>/about')
def get_hex_about(id): 
    return Hexagon.query.get_or_404(id).about if Hexagon.query.get_or_404(id).about else ''
@app.route('/hexs/<id>/about/change', methods=['POST'])
@login_required
def change_hex_about(id):
    hexagon = Hexagon.query.get_or_404(id)
    hexagon.about = request.get_data(as_text=True)

    db.session.add(hexagon)
    db.session.commit()

    socketio.emit(f'changeAbout{hexagon.id}', json.dumps({'userId': current_user.id}))
    return json.dumps({'success': True})

@app.route('/hexs/<id>/imgs/upload', methods=['POST'])
@login_required
def upload_hex_img(id):
    hex = Hexagon.query.get(id)
    if hex.user_id != current_user.id:
        return json.dumps({'success': False})

    if 'file' not in request.files:
        return json.dumps({'success': False})

    file = request.files['file']
    
    img = Image(hex_id=id)
    img.ext = file.mimetype.replace('image/', '')

    if(not img.ext in ['png', 'jpg', 'jpeg', 'gif']): # TODO: создать таблицу с расширениями файлов
        return json.dumps({'success': False})
    db.session.add(img)
    db.session.commit()

    categ_name = hex.categ.name
    
    create_dir("/app/static/uploadedImgs/" + categ_name)
    create_dir(f"/app/static/uploadedImgs/{categ_name}/{hex.chain.id}")
    create_dir(f"/app/static/uploadedImgs/{categ_name}/{hex.chain.id}/{hex.id}")

    filename = f"static/uploadedImgs/{categ_name}/{hex.chain.id}/{hex.id}/{img.id}.{img.ext}"
    if 'BG' in file.filename:
        hex.BG_img = filename
        for img in hex.imgs:
            img.is_BG = False
            db.session.add(img)

        img.is_BG = True
        db.session.add_all([hex, img])
        db.session.commit()


    try:
        file.save(os.getcwd() + "/app/" + filename)
    except BaseException:
        db.session.delete(img)
        db.session.commit()
        return json.dumps({'success': False})

    return json.dumps({'success': True, 'url': filename, 'uuid': img.id, "isBG": img.is_BG})

@app.route('/hexs/imgs/delete/<id>', methods=['DELETE'])
@login_required
def delete_hex_img(id):
    img = Image.query.get_or_404(id)
    
    os.remove(os.getcwd() + f"/app/static/uploadedImgs/{img.hex.categ.name}/{img.hex.chain_id}/{img.hex_id}/{img.id}.{img.ext}")

    db.session.delete(img)
    db.session.commit()

    return json.dumps({'success': True})

@app.route('/hexs/<categ_name>/new', methods=['POST'])
@login_required
def new_hex(categ_name):
    if categ_name == 'all': return json.dumps({"success": False})
    new_hexs = request.get_json(True)
    categ = Categ.query.filter_by(name=categ_name).first_or_404()

    hexs_to_send = []
    
    for raw_hex in new_hexs:
        chain = None
        chain = Chain.query.get(raw_hex['chainId'])

        if not chain:
            chain = Chain(categ_id=categ.id, user_id = current_user.id)
            db.session.add(chain)
            db.session.commit()

        hex = Hexagon(
            selector=raw_hex['selector'],
            chain_id=chain.id,
            num=raw_hex['num'],
            inner_text=raw_hex['innerText'],
            author=current_user,
            categ=categ
        )
        db.session.add(hex)
        db.session.commit()

        def delete_empty_hex():
            hex_to_check = Hexagon.query.get(hex.id)
            if not hex_to_check:
                return

            if not str(hex_to_check.inner_text) and not str(hex_to_check.BG_img):
                hexs_to_delete = []
                if hex_to_check.num == 1:
                    print(f'Delete empty chain {hex_to_check.chain_id} after 30m')
                    chain_to_delete = Chain.query.get(hex_to_check.chain_id) 
                    db.session.delete(chain_to_delete)
                    hexs_to_delete = chain_to_delete.hexs
                else:
                    for hex_to_delete in Hexagon.query.filter(Hexagon.chain_id == hex_to_check.chain_id, Hexagon.num >= hex_to_check.num).all():
                        hexs_to_delete.append(hex_to_delete)
                        db.session.delete(hex_to_delete)
                        if(hex_to_delete.inner_text):
                            return

                    
                socketio.emit('hexs', {'action': 'delete', 'categ': hex_to_check.categ.name,'body': json.dumps(list(map(lambda hex: hex.selector, hexs_to_delete)))})
                db.session.commit()

        delete_empty_timer = Timer(1800.0, delete_empty_hex)
        delete_empty_timer.start()

        hexs_to_send.append(prepare_hex_to_send(hex))

    if(categ):
        socketio.emit('hexs', {
            "action": 'new',
            "categ": categ.name,
            "body": json.dumps(hexs_to_send)
        })
        return json.dumps({"success": True, "userId": current_user.id, 'hexs': hexs_to_send})
    else:
        return json.dumps({"success": False})

@socketio.on('hexs')
def handle_hexs(data):
    categ_name = data['categ']
    categ = Categ.query.filter_by(name=categ_name).first_or_404()
    # change = Change(body=json.dumps(data))
    # db.session.add(change)

    data_to_send = {'action':'', "categ": categ_name}

    if data['action'] == 'change':
        changed_hexs = json.loads(data['data'])

        for changed_hex in changed_hexs:
            hex = Hexagon.query.filter(Hexagon.selector == changed_hex['selector'], Hexagon.categ_id == categ.id).first()

            if hex:
                hex.inner_text = changed_hex['innerText']
                db.session.add(hex)

        
        data_to_send = {'action': 'change', "body": json.dumps(changed_hexs)}
        
    elif data['action'] == 'delete':
        hexs_to_delete_selectors = json.loads(data['data'])
        for hex_to_delete_selector in hexs_to_delete_selectors:
            hex = Hexagon.query.filter(Hexagon.selector == hex_to_delete_selector, Hexagon.categ_id == categ.id).first()
            if hex:
                if hex.num == 1:
                    db.session.delete(hex.chain)
                    delete_dir(f"/app/static/uploadedImgs/{hex.categ.name}/{hex.chain.id}")
    
                db.session.delete(hex)
                delete_dir(f"/app/static/uploadedImgs/{hex.categ.name}/{hex.chain.id}/{hex.id}")
        
        data_to_send = {'action': 'delete','body': json.dumps(hexs_to_delete_selectors)}
    
    data_to_send['categ'] = categ_name

    db.session.commit()
    
    emit('hexs', data_to_send, broadcast=True)



prepare_chain_to_send = lambda chain: {
    'id': chain.id,
    'userId': chain.user_id,
    'hexs': [prepare_hex_to_send(hex) for hex in chain.hexs]
}
    
@app.route('/chains/<categ_name>')
def get_chains(categ_name):
    userId = 0
    userRole = 0
    if current_user.is_authenticated:
        userId = current_user.id
        userRole = current_user.role_id

    categ = Categ.query.filter_by(name=categ_name).first_or_404()
    
    chains_to_send = []
    for chain in Chain.query.filter_by(categ_id=categ.id).all():
        chains_to_send.append(prepare_chain_to_send(chain))

    return json.dumps({"body": chains_to_send, "userId": userId, "userRole": userRole})

@app.route('/chains/<categ_name>/new')
@login_required
def create_chain(categ_name):
    categ = Categ.query.filter_by(name=categ_name).first_or_404()

    chain = Chain(categ_id=categ.id, user_id=current_user.id)
    db.session.add(chain)
    db.session.commit()

    return json.dumps({'success': True, 'chainId': chain.id, 'userId': chain.user_id}) 

@app.route('/chains/<int:id>/json')
def get_chain_json(id):
    chain = Chain.query.get_or_404(id)
    
    return json.dumps(prepare_chain_to_send(chain))

prepare_comment_to_send = lambda comment: {**serialize(comment), 'username': comment.author.username}
@app.route('/chains/<id>/comments')
def get_comments(id):
    return json.dumps([prepare_comment_to_send(comment) for comment in Chain.query.get_or_404(id).comments])

@app.route('/chains/<id>/comments/new', methods=['POST'])
@login_required
def create_comment(id):
    chain = Chain.query.get_or_404(id)
    
    raw_comment = request.get_json(True)
    comment = Comment(
        body=raw_comment['body'],
        user_id=current_user.id,
        chain_id=chain.id,
        reply_to_id=(raw_comment['replyTo'] if 'replyTo' in raw_comment else None) 
    )
    db.session.add(comment)
    db.session.commit()

    socketio.emit(f'newComment{chain.id}', json.dumps(prepare_comment_to_send(comment)))
    return json.dumps({'success': True})

@app.route('/chains/comments/delete/<id>', methods=['DELETE'])
@login_required
def delete_comment(id):
    comment = Comment.query.get_or_404(id)
    if not (comment.user_id == current_user.id) and current_user.role_id != 2:
        return json.dumps({'success': False})
        
    db.session.delete(comment)
    db.session.commit()

    socketio.emit(f'deleteComment{comment.chain_id}', id)
    return json.dumps({'success': True})
@app.route('/chains/<id>/rating')
def get_rating(id):
    rating = db.session.execute(select([func.sum(RatingChange.change)]).where(RatingChange.chain_id == id)).scalar()
    allowed_change = 0

    if current_user.is_authenticated and current_user.id:
        user_change = RatingChange.query.filter_by(user_id=current_user.id, chain_id=id).first()
        if user_change:
            allowed_change = -user_change.change
    
    return json.dumps({'num': rating, 'allowedChange': allowed_change})

@app.route('/chains/<id>/rating/change', methods=['POST'])
@login_required
def change_rating(id):
    user_rating_change = RatingChange.query.filter_by(user_id=current_user.id, chain_id=id).first()

    change_num = 0
    if not user_rating_change:
        change = RatingChange(change=request.get_json(True)['change'], user_id=current_user.id, chain_id=id)
        change_num = request.get_json(True)['change']
        db.session.add(change)
    else:
        if user_rating_change.change == request.get_json(True)['change']:
            return json.dumps({'success': False})
        else:
            db.session.delete(user_rating_change)
    
    db.session.commit()
    
    rating = db.session.execute(select([func.sum(RatingChange.change)]).where(RatingChange.chain_id == id)).scalar()

    return json.dumps({'success': True, 'num': rating, 'change': change_num})

def get_rId(selector):
    return int(selector.split(' ')[0].replace('#r', ''))
def get_hId(selector):
    return int(selector.split(' ')[1].replace('#h', ''))
def change_hex_selector(selector, r_offset, h_offset):
    changed_r = re.sub(r"(?<=r)\d", selector, str(get_rId(selector) + r_offset))
    changed_h = re.sub(r"(?<=h)\d", selector, str(get_hId(selector) + h_offset))
    return f"#r{changed_r} #h{changed_h}"
@app.route('/chains/<chain_id>/move', methods=['POST'])
@login_required
def chain_move(chain_id):
    
    chain = Chain.query.get_or_404(chain_id)


    categ_id = request.get_json(True)['categId']

    new_categ = Categ.query.get(categ_id)
    
    r_offset = request.get_json(True)['newRow'] - get_rId(chain.hexs[0].selector)
    h_offset = request.get_json(True)['newHex'] - get_hId(chain.hexs[0].selector)

    if(current_user.role_id != 2):
        return json.dumps({'success': False})
    old_dir = f"/app/static/uploadedImgs/{chain.categ.name}/{chain.id}"

    chain.categ_id = categ_id
    for hex in chain.hexs:
        hex.selector = change_hex_selector(hex.selector, r_offset, h_offset)
        
        if hex.BG_img:
            hex.BG_img = hex.BG_img.replace(hex.categ.name, new_categ.name)
        
        hex.categ_id = categ_id
        db.session.add(hex)

    db.session.add(chain)
    db.session.commit()

    try:
        shutil.move(os.getcwd() + old_dir, os.getcwd() +  f"/app/static/uploadedImgs/{chain.categ.name}/{chain.id}")
    except FileNotFoundError:
        pass
    except:
        return '', 500
    return json.dumps({'success': True})




@app.route('/complaints')
@login_required
def get_complaints():
    if current_user.role_id != 2:
        return '', 403

    return render_template('complaints.html', complaints=Complaint.query.all(), title="Complaints", user=current_user)

@app.route('/complaints/new', methods=['POST'])
@login_required
def create_complaint():
    raw_complaint = request.get_json(True)
    raw_hex = raw_complaint['hexagon']
    hex_id = Hexagon.query.filter(Hexagon.selector == raw_hex['selector'], Hexagon.categ_id == Categ.query.filter_by(name=raw_hex['categ']).first_or_404().id).first().id

    if not hex_id:
        return json.dumps({'success': False, 'message': _('No such hexagon')})

    complaint = Complaint(
        body=raw_complaint['text'],
        hex_id=hex_id, 
        user_id=current_user.id
    )

    db.session.add(complaint)
    db.session.commit()

    return json.dumps({'success': True})

@app.route('/complaints/delete/<id>', methods=['DELETE'])
@login_required
def delete_complaint(id):
    if current_user.role_id != 2:
        return json.dumps({'success': False, "message": 'You don\'t have access'})

    complaint = Complaint.query.get_or_404(id)

    db.session.delete(complaint)
    db.session.commit()

    return json.dumps({'success': True})

@app.route('/complaints/delete/all')
@login_required
def delete_all_complaints():
    if current_user.role_id != 2:
        return json.dumps({'success': False, "message": 'You don\'t have access'})

    db.session.execute(Complaint.__table__.delete().where(Complaint.id > 0))
    db.session.commit()

    return redirect(url_for('get_complaints'))



@app.route('/help')
def help():
    user = None
    if current_user and current_user.is_authenticated:
        user = current_user
    return render_template('help.html', user=user, title='Help')