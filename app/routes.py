import os
import json
import shutil
import time
import re
from threading import Timer

from app import app, socketio, db
from app.forms import LoginForm, RegistrationForm
from app.models import Chain, Comment, Complaint, Hexagon, Image, RatingChange, User, Categ, UserRating
from app.lib import create_dir, delete_dir

from flask import render_template, redirect, url_for, request
from flask_socketio import emit
from flask_login import current_user, login_user, logout_user, login_required
from werkzeug.urls import url_parse
from flask_sqlalchemy import sqlalchemy
from sqlalchemy import func
from sqlalchemy.sql.expression import select


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
    users = User.query.all()
    return render_template('users.html', users=sorted(users, key=lambda u: u.get_rating(), reverse=True), user=current_user, title="Users list")

@app.route('/users/<id>')
def user(id):
    owner = User.query.get(id)
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

    return render_template('user.html', title=owner.username, owner=owner, allowed_change=allowed_change, hexs_sort_fn=hexs_sort_fn, user=user)
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
    
    rating = db.session.execute(select([func.sum(UserRating.change)]).where(UserRating.user_id == id)).first().values()[0] or 0

    return json.dumps({'success': True, 'num': rating, 'change': change_num})

@app.route('/users/i')
def give_current_user():
    if(current_user and current_user.is_authenticated):
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

@app.route('/settings/reset')
@login_required
def delete_settings():
    current_user.settings = None
    db.session.add(current_user)
    db.session.commit()
    return json.dumps({"success": "true"})





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
    "selector": hex.selector,
    "num": hex.num,
    "innerText": hex.inner_text,
    "chainId": hex.chain_id,
    "userId": hex.user_id,
    "username": User.query.get(hex.user_id).username if User.query.get(hex.user_id) else 'none',
    "creationDate": time.mktime(hex.created_at.timetuple()),
    'BGImg': hex.BG_img,
    "imgs": list(map(lambda img: {
        "uuid": img.id,
        "url": f"static/uploadedImgs/{hex.categ.name}/{hex.chain.id}/{hex.id}/{img.id}.{img.ext}",
        "isBG": img.is_BG
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
            "selector": hex.selector,
            "innerText": hex.inner_text,
            "categ": hex.categ.name,
            "chainId": hex.chain_id,
            "num": hex.num
        }, all_hexs))
    else:
        categ = Categ.query.filter_by(name=categ_name).first_or_404()
        hexs_to_send = list(map(prepare_hex_to_send, categ.hexs))

    return json.dumps({"body": hexs_to_send, "userId": userId, "userRole": userRole})

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

            if not str(hex_to_check.inner_text):
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
        chains_to_send.append({
            'id': chain.id,
            'userId': chain.user_id,
            'hexs': list(map(prepare_hex_to_send, chain.hexs))
        })

    return json.dumps({"body": chains_to_send, "userId": userId, "userRole": userRole})

@app.route('/chains/<categ_name>/new')
@login_required
def create_chain(categ_name):
    categ = Categ.query.filter_by(name=categ_name).first_or_404()

    chain = Chain(categ_id=categ.id, user_id=current_user.id)
    db.session.add(chain)
    db.session.commit()

    return json.dumps({'success': True, 'chainId': chain.id, 'userId': chain.user_id}) 
@app.route('/chains/<id>/comments')
def get_comments(id):
    return json.dumps(list(map(lambda comment: {
        'id': comment.id,
        'body': comment.body,
        'userId': comment.user_id,
        'username': comment.author.username
    }, Chain.query.get_or_404(id).comments)))
@app.route('/chains/<id>/comments/new', methods=['POST'])
@login_required
def create_comment(id):
    chain = Chain.query.get_or_404(id)
    
    raw_comment = request.get_json(True)
    comment = Comment(
        body=raw_comment['body'],
        user_id=current_user.id,
        chain_id=chain.id
    )
    db.session.add(comment)
    db.session.commit()

    socketio.emit(f'newComment{chain.id}', json.dumps({'id': comment.id, 'body': comment.body, 'userId': current_user.id, 'username': current_user.username}))
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
    rating = db.session.execute(select([func.sum(RatingChange.change)]).where(RatingChange.chain_id == id)).first().values()[0]
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
    
    rating = db.session.execute(select([func.sum(RatingChange.change)]).where(RatingChange.chain_id == id)).first().values()[0]

    return json.dumps({'success': True, 'num': rating, 'change': change_num})

@app.route('/chains/<chain_id>/move', methods=['POST'])
@login_required
def chain_move(chain_id):
    def get_rId(selector):
        return int(selector.split(' ')[0].replace('#r', ''))
    def get_hId(selector):
        return int(selector.split(' ')[1].replace('#h', ''))
    def change_hex_selector(selector, r_offset, h_offset):
        changed_r = re.sub(r"(?<=r)\d", selector, str(get_rId(selector) + r_offset))
        changed_h = re.sub(r"(?<=h)\d", selector, str(get_hId(selector) + h_offset))
        return f"#r{changed_r} #h{changed_h}"
    
    chain = Chain.query.get_or_404(chain_id)

    categ_id = request.get_json(True)['categId']

    r_offset = request.get_json(True)['newRow'] - get_rId(chain.hexs[0].selector)
    h_offset = request.get_json(True)['newHex'] - get_hId(chain.hexs[0].selector)

    if(current_user.role_id != 2):
        return json.dumps({'success': False})
    old_dir = f"/app/static/uploadedImgs/{chain.categ.name}/{chain.id}"

    chain.categ_id = categ_id
    for hex in chain.hexs:
        hex.selector = change_hex_selector(hex.selector, r_offset, h_offset)
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
        return "<h1>You don't have access</h1"

    return render_template('complaints.html', complaints=Complaint.query.all(), title="Complaints", user=current_user)

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

    db.session.execute(Complaint.__table__.delete().where(Complaint.id > 0))
    db.session.commit()

    return redirect(url_for('get_complaints'))