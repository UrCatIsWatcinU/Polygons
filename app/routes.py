from app import app, socketio, db
from app.forms import LoginForm, RegistrationForm
from app.models import Change, Complaint, Hexagon, User, Categ

from flask import render_template, redirect, url_for, request
from flask_socketio import emit
from flask_login import current_user, login_user, logout_user, login_required
from werkzeug.urls import url_parse
from flask_sqlalchemy import sqlalchemy

import json
import time

@app.route('/')
@app.route('/index')
def index():
    user = ''
    if current_user:
        user = current_user
    
    categs = Categ.query.all()
    rows = []
    for i in range(len(categs)):
        if i == 0 or (i % 5) == 0:
            rows.append([categs[i]])
        else:
            rows[i // 5].append(categs[i])

    return render_template('index.html', rows=rows, title='Main', is_auth=current_user.is_authenticated, user=user)

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
    db.session.delete(categ)
    db.session.commit()
    socketio.emit('reload')
    return json.dumps({"success":True})

@app.route('/categ/<categ_name>/params')
def give_categ_params(categ_name):
    return Categ.query.filter_by(name=categ_name).first_or_404().params


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
        return redirect(url_for('login'))
    return render_template('registration.html', title='Register', form=form)

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(username=form.username.data).first()
        if user is None or not user.check_password(form.password.data):
            return 'Вы ввели неправильный логин/пароль!'
        login_user(user, remember=form.remember_me.data)
        next_page = request.args.get('next')
        if not next_page or url_parse(next_page).netloc != '':
            next_page = url_for('index')
        return redirect(next_page)
    return render_template('login.html', title='Login', form=form)

@app.route('/logout')
def logout():
    logout_user()
    return redirect(url_for('index'))

@app.route('/users')
@login_required
def users_all():
    if current_user.role_id != 2:
        return "<h1>You don't have access</h1"
    
    return render_template('users.html', users=User.query.all())


@app.route('/users/i')
def give_current_user():
    if(current_user and current_user.is_authenticated):
        return json.dumps({'userId': current_user.id, 'userRole': current_user.role_id, 'username': current_user.username})
    else:
        return json.dumps({'err': 'no user'})

@app.route('/users/delete/<id>', methods=['DELETE'])
@login_required
def delete_user(id):
    if current_user.role_id != 2:
        return "<h1>You don't have access</h1"
    
    user = User.query.get_or_404(id)
    db.session.delete(user)
    db.session.commit()
    return json.dumps({"success":True})


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
    return json.dumps({"success": "true"})


@app.route('/fields/<categ_name>')
def fields(categ_name):
    categ = Categ.query.filter_by(name=categ_name).first_or_404()

    if categ:
        if current_user.is_authenticated:
            return render_template('field.html', field_name=categ_name, role=current_user.role_id, username=current_user.username)
        else:
            return render_template('noedite-field.html', field_name=categ_name)
    else:
        return render_template('no-field.html')

@app.route('/hexs/<categ_name>')
def get_hexs(categ_name):
    
    userId = 0
    userRole = 0
    if current_user.is_authenticated:
        userId = current_user.id
        userRole = current_user.role_id

    # hexs = categ.hexs.all()
    hexs_to_send = []
    if categ_name == 'all':
        all_hexs = Hexagon.query.all()
        hexs_to_send = list(map(lambda hex: {
            "selector": hex.selector,
            "innerText": hex.inner_text,
            "categ": hex.categ.name,
            "chainId": hex.chain_id,
            "num": hex.num
        }, all_hexs))
    else:
        categ = Categ.query.filter_by(name=categ_name).first_or_404()
        hexs_to_send = list(map(lambda hex: {
            "selector": hex.selector,
            "about": hex.about,
            "num": hex.num,
            "innerText": hex.inner_text,
            "chainId": hex.chain_id,
            "userId": hex.user_id,
            "username": User.query.get(hex.user_id).username if User.query.get(hex.user_id) else 'none',
            "creationDate": time.mktime(hex.created_at.timetuple())
        }, categ.hexs))

    return json.dumps({"body": hexs_to_send, "userId": userId, "userRole": userRole})

@app.route('/hexs/<categ_name>/new', methods=['POST'])
@login_required
def new_hex(categ_name):
    if categ_name == 'all': return json.dumps({"success": False})
    new_hexs = request.get_json(True)
    categ = Categ.query.filter_by(name=categ_name).first_or_404()

    for raw_hex in new_hexs:
        hex = Hexagon(
            selector=raw_hex['selector'],
            chain_id=raw_hex['chainId'],
            num=raw_hex['num'],
            inner_text=raw_hex['innerText'],
            about=raw_hex['about'],
            author=current_user,
            categ=categ
        )
        db.session.add(hex)
    
    db.session.commit()

    if(categ):
        socketio.emit('hexs', {
            "action": 'new',
            "categ": categ.name,
            "body": json.dumps(new_hexs)
        })
        return json.dumps({"success": True, "userId": current_user.id})
    else:
        return json.dumps({"success": False})

@socketio.on('hexs')
def handle_hexs(data):
    categ_name = data['categ']
    categ = Categ.query.filter_by(name=categ_name).first_or_404()
    change = Change(body=json.dumps(data))

    data_to_send = {'action':'', "categ": categ_name}

    if data['action'] == 'change':
        changed_hexs = json.loads(data['data'])

        for changed_hex in changed_hexs:
            hex = Hexagon.query.filter(Hexagon.selector == changed_hex['selector'], Hexagon.categ_id == categ.id).first()

            if hex:
                hex.inner_text = changed_hex['innerText']
                hex.about = changed_hex['about']
                db.session.add(hex)

        
        data_to_send = {'action': 'change', "body": json.dumps(changed_hexs)}
        
    elif data['action'] == 'delete':
        hexs_to_delete_selectors = json.loads(data['data'])
        for hex_to_delete_selector in hexs_to_delete_selectors:
            hex = Hexagon.query.filter(Hexagon.selector == hex_to_delete_selector, Hexagon.categ_id == categ.id).first()
            if(hex):
                db.session.delete(hex)
        
        data_to_send = {'action': 'delete','body': json.dumps(hexs_to_delete_selectors)}
    
    data_to_send['categ'] = categ_name

    db.session.commit()
    
    emit('hexs', data_to_send, broadcast=True)


@app.route('/complaints')
@login_required
def get_complaints():
    if current_user.role_id != 2:
        return "<h1>You don't have access</h1"

    return render_template('complaints.html', complaints=Complaint.query.all(), title="Complaints")

@app.route('/complaints/new', methods=['POST'])
@login_required
def create_complaint():
    raw_complaint = request.get_json(True)
    raw_hex = raw_complaint['hexagon']
    hex_id = Hexagon.query.filter(Hexagon.selector == raw_hex['selector'], Hexagon.categ_id == Categ.query.filter_by(name=raw_hex['categ']).first_or_404().id).first().id

    if not hex_id:
        return json.dumps({'success': False, 'message': 'No such hexagon'})

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

    delete_q = Complaint.__table__.delete().where(Complaint.id > 0)
    db.session.execute(delete_q)
    db.session.commit()

    return redirect(url_for('get_complaints'))