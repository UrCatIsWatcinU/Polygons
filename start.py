from index import Role, User, db

ru = Role(name='user')
ra = Role(name='admin')

admin=User(username='admin', role_id=2, email='urcatiswatchinu@ya.ru')
admin.set_password('hexadmin')

db.session.add_all([ru, ra, admin])
db.session.commit()