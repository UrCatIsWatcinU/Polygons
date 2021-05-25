let user = sessionStorage.getItem('user');
if(!user){
    fetch('/users/i')
    .then(res => {
        if(res.ok) return res.json();
        showModal('An erron occured while loading profile', 'Please try later. Status: ' + res.status);
    })
    .then(res => {
        if(!res) return;

        user = res;
        sessionStorage.setItem(user, JSON.stringify(user));

        document.dispatchEvent('userLoaded');
    })
    .catch(err => {
        showModal('An erron occured while loading profile', err)
    });
}else{
    user = JSON.parse(user);
}

const chatAdminsRoles = ['admin']
let activeChatId;

const localTimeZoneOffset = (new Date).getTimezoneOffset() * 60;

const shortDateFormater = Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: 'numeric',
});
const longDateFormater = Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric'
});

const createMessage = (message) => {
    if(!message || document.querySelector('#m' + message.id) || message.chatId != activeChatId) return;
    const chat = document.querySelector('#c' + message.chatId);

    if(message.date && typeof(message.date) != 'object'){
        message.date = new Date((message.date - localTimeZoneOffset) * 1000);
    }


    const msgElem = setClassName(document.createElement('div'), 'message-cont' + (message.user.id == user.userId ? ' message-my' : ''));
    msgElem.id = 'm' + message.id;  
    msgElem.innerHTML = `
    <div class="message">
        <div class="message-content">
            <a href="/users/${message.user.id}" class="message-user"></a><br>
            <div class="message-text"></div>
        </div>
        <span title="${message.date ? longDateFormater.format(message.date) : ''}" class="message-date">${message.date ? shortDateFormater.format(message.date) : ''}</span>
    </div>`;
    msgElem.querySelector('.message-user').innerText = message.user.username;
    const msgText = msgElem.querySelector('.message-text'); 
    msgText.innerHTML = message.text.trim().replace(/</g, '&lt;').replace(/\n/g, '<br>');
    
    const messages = document.querySelector('.messages');

    const usersLinks = message.text.match(/@\S+/gi);
    if(usersLinks){
        usersLinks.forEach(uL => {
            fetch(`/users/${uL.replace('@', '')}/json`)
            .then(res => res.ok && res.json())
            .then(res => {
                if(!res) return;
                
                msgText.innerHTML = msgText.innerHTML.replace(uL.replace('@', ''), `<a href="/users/${res.id}">${res.name}</a>`) 
            })
            .catch(err => showModal('An error occured', err))
            .finally(() => {
                username = null;
            });
        });
    }

    const entitiesParsers = {
        hex: (id, num) => new Promise(function(resolve, reject){
            fetch(`/hexs/${id}/json`)
            .then(res => res.ok && res.json())
            .then(res => {
                if(!res || !res.uuid) return reject();

                const attachedHex = setClassName(document.createElement('a'), 'hexagon hexagon-visible attachment');
                attachedHex.setAttribute('href', `/hexs/${res.uuid}`);
                attachedHex.setAttribute('title', `[attachment ${num}]`)

                attachedHex.innerHTML = `<div class="hexagon-editedField">${res.innerText}</div>`;

                setHexVisible(attachedHex, res.num);

                if(res.BGImg){
                    createBgHex(attachedHex, res.BGImg)
                }

                if(!msgElem.querySelector('.attacments')) msgElem.firstElementChild.append(setClassName(document.createElement('div'), 'attachments'))
                msgElem.querySelector('.attachments').append(attachedHex); 

                resolve(attachedHex);
            })
            .catch(err => reject(err));
        }),
        chain: (id, num, entity) => {
            fetch(`/chains/${id}/json`)
            .then(res => res.ok && res.json())
            .then(res => {
                if(!res || !res.id){
                    msgText.innerHTML = msgText.innerHTML.replace(`[${entity}]`, `<span class="disabled-link">[${entity}]</span>`)
                    return;
                } 

                const chainStr = `<a href="/hexs/${res.hexs[0].uuid}" class="message-attachment-inText">
                    [chain ${id}]
                </a>`;
                msgText.innerHTML = msgText.innerHTML.replace(`[${entity}]`, chainStr);
            });
        },
        link: (id, num, entity) => {
            let name = id;
            if(id.match(/\s*:\s*/)){
                const splittedLink = id.split(/\s*:\s*/); 
                name = splittedLink.shift();
                id = splittedLink.join(':');
            }
            if(!id.match(/^http:\/\//)) id = 'http://' + id;

            msgText.innerHTML = msgText.innerHTML.replace(`[${entity}]`, 
            `<a class="message-attachment-inText" href="${id}">${name}</id>`);
        }
    }
    const entities = message.text.match(/(?<=\[)[^[\]]+(?=\])\s*(?!\[])/g);
    
    if(entities){
        entities.forEach((entity, i) => {
            const entityName = entity.split(/\s+/)[0];
            const entityNum = entity.split(/\s+/)[1];

            if(entitiesParsers[entityName]){
                const entitpyParsePromise = entitiesParsers[entityName](entityNum, i+1, entity);

                if(entitpyParsePromise && entitpyParsePromise.then){
                    entitpyParsePromise
                    .then(entityAttachment => {
                        msgText.innerHTML = msgText.innerHTML.replace(`[${entity}]`, 
                        `<a ${entityAttachment.getAttribute('href') ? 'href="' + entityAttachment.getAttribute('href') + '"' : ''} class="message-attachment-inText">
                            [attachment ${i + 1}]
                        </a>`);

                        messages.scrollTop = messages.scrollHeight
                    })
                    .catch(err => err);
                }
            } 
        });
    }
    
    messages.append(msgElem);
    messages.scrollTop = messages.scrollHeight;
    
    socket.on('delete-message-' + message.id, () => msgElem.remove());
    
    if(message.user.id == user.userId || chatAdminsRoles.includes(chat.userMembership.role.name)){
        const deleteBtn = setClassName(document.createElementNS('http://www.w3.org/2000/svg', 'svg'), 'message-delete');
        deleteBtn.innerHTML = '<line x1="50%" y1="0%" x2="50%" y2="100%"></line><line x1="0%" y1="50%" x2="100%" y2="50%"></line>';
        msgElem.querySelector('.message').append(deleteBtn);
        
        deleteBtn.onclick = () => {
            showAsk(() => socket.emit('delete-message', message.id))
        }
    }
}

socket.on('new-message', msg => {
    msg = JSON.parse(msg);
    createMessage(msg)

    const chat = document.querySelector('#c' + msg.chatId);
    if(msg.isUnread && msg.user.id != user.userId){
        chat.unreadMsgsElem.style.opacity = 1;
        chat.unreadMsgsElem.innerText = ++chat.unreadedMsgs
    }
    
});
socket.on('lastMessageUpdate', msg => {
    const chat = document.querySelector('#c'+ msg.chatId);
    chat.querySelector('.last-message').innerHTML = msg.body;

    chat.cerateLastMsgDate();
})

const createMessages = async (messages) => {
    const chat = document.querySelector('#c' + activeChatId);
    
    if(!messages || !chat) return;

    messages.forEach(msg => createMessage(msg, chat));
    delete user.chatRole;
}

const changeChat = (id = null) => {
    if(!user) return document.addEventListener('userLoaded', () => changeChat())

    if(id) activeChatId = id;

    document.querySelector('.messages').innerHTML = '';

    const msgsTitle = document.querySelector('.messages-title-text');
    const msgsCont = document.querySelector('.messages-cont');
    if(!activeChatId){
        msgsTitle.innerText = urlParams.get('send') ? 'Choose chat to send ' + urlParams.get('send') : 'Select chat';
        msgsCont.classList.remove('messages-cont-active');
        document.querySelector('.app').classList.remove('app-messages');
        return;
    }

    document.querySelector('.app').classList.add('app-messages');

    const chat = document.querySelector('#c' + activeChatId);

    if(!chat.messages){
        return chat.addEventListener('messagesLoaded', () => {changeChat()});
    }

    document.querySelectorAll('.chat').forEach(c => c.classList.remove('chat-active')); 
    chat.classList.add('chat-active'); 
    msgsTitle.innerText = chat.getAttribute('chatname');
    msgsCont.classList.add('messages-cont-active');

    const input = msgsCont.querySelector('#newMsg');
    input.focus();

    createMessages(chat.messages);

    fetch(`/chats/${chat.uuid}/members/last_seen`, {method: 'PUT'})
    .then(res => res.ok && res.json())
    .then(res => {
        if(res && res.success ){
            chat.loadMessages(true);
        }
    });

    if(urlParams.get('send')){
        input.value += urlParams.get('send');
        urlParams.delete('send');

        history.pushState(null, null, '/chats'); 
    }
}

let chatRoles;
fetch('/chats/roles')
.then(res => res.ok? res.json() : showModal('An erron occured while loading chat roles', 'Please try later. Status: ' + res.status))
.then(res => {
    if(!res || !res.length) return showModal('An erron occured while loading chat roles', 'Please try later');

    chatRoles = res;
    window.dispatchEvent(new Event('chatRolesLoaded'));
})
.catch(err => showModal('An erron occured while loading chat roles', err));

let userChatWithId = 0;
let needToCreateChatWith = false;

const urlParams = new URLSearchParams(window.location.search);
if(urlParams.get('with')){
    userChatWithId = urlParams.get('with');
    needToCreateChatWith = true;
}
const createChatWith = (evt) => {
    if(!needToCreateChatWith) return;
    
    fetch('/chats/new', {
        method: "POST",
        body: JSON.stringify({
            name: null,
            members: [{
                id: evt.id,
                role: 2 
            }]
        })
    })
    .then(res => res.ok ? res.json() : showModal('An error occured while opening chat with user', 'Please try later. Status: ' + res.status))
    .then(res => {
        if(!res || !res.success) return showModal('An error occured while opening chat with user', 'Please try later');

        window.location.reload();
    })
    .catch(err => showModal('An error occured while opening chat with user', err))
}

class ElChat extends HTMLDivElement{
    constructor() {
        super();
        
    }
    connectedCallback() { 
        this.uuid = this.id.replace('c', '');
        this.addEventListener('click', () => {
            if(activeChatId != this.uuid) changeChat(this.uuid);
        });
        
        fetch(`/chats/${this.uuid}//members/i`)
        .then(res => res.ok && res.json())
        .then(res => {
            if(!res || !res.role) return showModal('An erron occured while loading your chat role', 'Please try later');
            this.userMembership = res;

            setTimeout(() => {
                const infoBtn = setClassName(document.createElementNS('http://www.w3.org/2000/svg', 'svg'), 'chat-open-info');
                infoBtn.setAttribute('viewBox', '0,0,100,100');
    
                infoBtn.innerHTML = `
                    <circle stroke-width="5" cx="50" cy="50" r="40"></circle>
                    <line x1="50" y1="25" x2="50" y2="35"></line>
                <line x1="50" y1="45" x2="50" y2="75"></line>`;
    
                fetch(`/chats/${this.uuid}/members`)
                .then(res => {
                    if(!res.ok){
                        showModal('An error occured while loading chat members', 'Please try later. Status: ' + res.status);
                        return;
                    }
    
                    return res.json()
                })
                .then(async members => {
                    if(!members) return showModal('An error occured while loading chat members', 'Please try later');
                    
                    if(!this.userMembership) return;
    
                    const isIChatAdmin = chatAdminsRoles.includes(this.userMembership.role.name);
    
                    this.members = members;
                    if(members.length == 2 && !this.getAttribute('chatname')){
                        this.with = members.filter(m => m.user.id != user.userId)[0].user;
    
                        this.setAttribute('chatname', this.with.name);
                        const chatTitle = this.querySelector('.chat-title');
                        chatTitle.insertAdjacentHTML('afterbegin', `<a href="/users/${this.with.id}"></a>`);
                        chatTitle.firstElementChild.innerText = this.with.name;
                        chatTitle.firstElementChild.addEventListener('click', evt => evt.stopImmediatePropagation(), {passive: false});
    
                    }
                    
                    if(userChatWithId && needToCreateChatWith){
                        if(this.with && userChatWithId == this.with.id){
                            needToCreateChatWith = false;
                            document.removeEventListener('createChatWith', createChatWith);
                            
                            changeChat(this.uuid); 
                            urlParams.delete('with'); 
                            history.pushState(null, null, '/chats'); 
                        }else{
                            if(this == document.querySelector('.chats-cont').lastElementChild.previousElementSibling){
                                const createWithChatEvent = new Event('createChatWith');
                                createWithChatEvent.id = userChatWithId;
                                document.dispatchEvent(createWithChatEvent);
                            }
                        }
                    }
    
                    infoBtn.addEventListener('click', (evt) => {
                        evt.stopImmediatePropagation();
                        const chatAboutBtns = isIChatAdmin  ? `
                            <button class="chatAbout-delete" style="color: var(--red-c);">Delete chat</button>
                            ${this.with ? '' : '<button class="chatAbout-addMember">Add member</button>'}`
                        : '';
        
                        const chatAbout = showModal('', '', true);
                        chatAbout.innerHTML = `<div class="modal-content chatAbout-modal-content">
                            <div>
                                <div class="chatAbout-header">
                                    <h2 class="modal-title chatAbout-title">Chat info</h2>
                                    <div class="chatAbot-dropMenu-cont">
                                        <div class="drop-menu-bullets-cont">
                                            <svg class="drop-menu-bullets" preserveAspectRatio="none" viewBox="0,0,40,150">
                                                <circle cx="20" cy="20" r="17" ></circle>
                                                <circle cx="20" cy="75" r="17" ></circle>
                                                <circle cx="20" cy="130" r="17" ></circle>
                                            </svg>
                                        </div>
                                        <div class="drop-menu">
                                            ${chatAboutBtns}
                                            ${this.with ? '' : '<button class="chatAbout-quit">Quit</button>'}
                                        </div>
                                    </div>
                                </div>
                                <div class="chatAbout-content">
                                    <h4 class="chatAbout-members-title">Members</h4>
                                    <ol class="chatAbout-members"></ol>
                                </div>
                            </div>
                            <div class="chatAbout-btns">
                                <button class="chatAbout-close">Close</button>
                            </div>
                        </div>`;
        
                        createDropMenu(chatAbout.querySelector('.drop-menu'), chatAbout.querySelector('.chatAbot-dropMenu-cont'))
        
                        const membersElem = chatAbout.querySelector('.chatAbout-members');
                        const deleteMember = (id, memberElem = null, successCallback = null) => {
                            fetch(`/chats/members/${id}/delete`, { method: 'DELETE' })
                            .then(res => res.ok ? res.json() : showModal('An error occured while deleting chat member', 'Please try later. Status: ' + res.status))
                            .then(res => {
                                if(!res || !res.success) return showModal('An error occured while deleting chat member', 'Please try later');
        
                                memberElem && memberElem.remove();
                                members = members.filter(mToCheck => mToCheck.id != id )
        
                                successCallback && successCallback();
                            })
                            .catch(err => showModal('An error occured while deleting chat member', err))
                        }
                        const createMember = (m, i) => {
                            const memberElem = setClassName(document.createElement('li'), 'chatAbout-member-cont');
                            
                            const roleStr = this.with ? '' : `<span class="role">${m.role.name}</span>`;
    
                            memberElem.innerHTML = `<div class="chatAbout-member">
                                ${roleStr}
                                <a href="/users/${m.user.id}" class="username">${ m.user.name }</a>
                            </div>`;
        
                            membersElem.append(memberElem);
        
                            if(m.user.id != user.userId && isIChatAdmin && !this.with){
                                const deleteBtn = setClassName(document.createElementNS('http://www.w3.org/2000/svg', 'svg'), 'chatAbout-member-delete');
                                deleteBtn.innerHTML = '<line x1="50%" y1="0%" x2="50%" y2="100%"></line><line x1="0%" y1="50%" x2="100%" y2="50%"></line>';
                                
                                memberElem.addEventListener('click', (evt) => {
                                    if(evt.target == memberElem.querySelector('.chatAbout-member-delete')){
                                        showAsk(() => {
                                            deleteMember(m.id, memberElem);
                                        })
                                    }
                                }, {passive: false})
        
                                memberElem.firstElementChild.append(deleteBtn);
                            }
        
                            if(isIChatAdmin){
                                const role = memberElem.querySelector('.role');
                                if(!role) return;
                                role.style.cursor = 'pointer';
        
                                const createMemberRolesList =() => {
                                    if(!chatRoles.length){
                                        window.addEventListener('chatRolesLoaded', () => {
                                            createMemberRolesList(); 
                                        });
                                        return;
                                    }
                                    const rolesStr = chatRoles.map(r => `<button class="role-select-btn" id="role${r.id}">${r.name}</button>`).join('');
                                    memberElem.innerHTML += `<div class="drop-menu${i} role-select">
                                        ${rolesStr}
                                    </div>`;
                                    createDropMenu(memberElem.querySelector('.drop-menu' + i), memberElem, memberElem.querySelector('.role'));
        
                                    memberElem.querySelectorAll('.role-select-btn').forEach(r => {
                                        r.onclick = () => {
                                            showAsk(() => {
                                                fetch(`/chats/members/${m.id}/update`, {
                                                    method: 'PUT',
                                                    body: JSON.stringify({
                                                        newRoleId: +r.id.replace('role', '')
                                                    })
                                                })
                                                .then(res => res.ok ? res.json() : showModal('An error occured while updating chat user', 'Please try later. Status: ' + res.status))
                                                .then(res => {
                                                    if(!res || !res.success) return showModal('An error occured while updating chat user', 'Please try later');
        
                                                    memberElem.querySelector('.role').innerText = r.innerText;
                                                })
                                                .catch(err => showModal('An error occured while updating chat user', err))
                                            }, 'Be careful not to give authority to users you can\'t trust', 'Do yor want change member role?');
                                        }
                                    });
                                }
                                createMemberRolesList();
                            }
                        }
                        members.forEach(createMember);
                        
                        chatAbout.querySelector('.chatAbout-close').onclick = hideModal;
                        
                        const actions = {
                            delete: () => {
                                showAsk(() => {
                                    fetch(`/chats/${this.uuid}/delete`, { method: 'DELETE' }).then((res) => 
                                        res.ok ? res.json() : showModal('An error occured while deleting chat', 'Please try later. Status: ' + res.status)
                                    ).then(res => 
                                        res.success ? window.location.reload() : showModal('An error occured while deleting chat', 'Please try later')
                                    ).catch(err => showModal('An error occured while deleting chat', err));
                                });
                            },
                            addMember: () => {
                                if(chatAbout.querySelector('.chatAbout-newMember')) return;
                                const newMember = setClassName(document.createElement('div'), 'chatAbout-newMember');
                                newMember.innerHTML = `
                                    <input placeholder="New user username" type="text" class="chatAbout-newMember-input" id="new-member">&nbsp;<button class="chatAbout-newMember">Add</button> 
                                `;
        
                                chatAbout.querySelector('.chatAbout-content').append(newMember);
        
                                const newMemberBtn = newMember.querySelector('button');
                                const newMemberInput = newMember.querySelector('#new-member');
        
                                newMemberBtn.onclick = () => {
                                    if(!newMemberInput.value) return;
        
                                    newMemberBtn.style.height = newMemberBtn.offsetHeight + 'px' 
                                    newMemberBtn.style.width = newMemberBtn.offsetWidth + 'px' 
                                    newMemberBtn.innerHTML = loading;
        
                                    fetch(`/chats/${this.uuid}/add_member`, {
                                        method: 'POST',
                                        body: JSON.stringify({
                                            user: newMemberInput.value,
                                            role: 1
                                        })
                                    }).then(res => res.ok ? res.json() : showModal('An error occured while adding chat member', 'Please try later. Status: ' + res.status))
                                    .then(res => {
                                        if(!res || ! res.success){
                                            if(!res.message) showModal('An error occured while adding chat member', 'Please try later')
                                            else showModal('An error occured while adding chat member', res.message)
                                            
                                            return
                                        }
        
                                        delete res.success;
        
                                        createMember(res);
                                    })
                                    .catch(err => showModal('An error occured while adding chat member', err))
                                    .finally(() => newMember.remove())
                                }
                            },
                            quit: () => {
                                showAsk(() => {
                                    deleteMember(this.userMembership.id, null, () => {
                                        window.location.reload();
                                    });
                                });
                            }
                        }
        
                        for(let action in actions){
                            if(chatAbout.querySelector('.chatAbout-' + action)) 
                                chatAbout.querySelector('.chatAbout-' + action).onclick = actions[action];   
                        }
                        
                    }, {passive: false})
                })
                .catch(err => {
                    showModal('An error occured while loading chat members', err);
                })
    
                this.append(infoBtn);
                
                this.loadMessages();
    
                this.cerateLastMsgDate();
            }, 0);
        })
        .catch(err => showModal('An erron occured while loading your chat role', err))

    }
    updateUnreadMsgs(){
        this.messages.forEach(msg => {
            if(msg.isUnread && msg.user.id != user.userId){
                this.unreadMsgsElem.style.opacity = 1;
                this.unreadMsgsElem.innerText = ++this.unreadedMsgs
            }
        })
    }
    loadMessages(noEvent = false){
        fetch(`/chats/${this.uuid}/messages`)
        .then(res => res.ok ? res.json() : showModal('An erron occured while loading messages', 'Please try later. Status: ' + res.status))
        .then(res => {
            if(!res) return;
            this.messages = res;

            this.unreadedMsgs = 0;
            this.unreadMsgsElem = this.querySelector('.chat-unreadMsgs');

            if(this.unreadedMsgs == 0){
                this.unreadMsgsElem.style.opacity = 0;
            }
            
            this.updateUnreadMsgs();
            if(!noEvent) this.dispatchEvent(new Event('messagesLoaded'));
        })
        .catch(err => {
            showModal('An erron occured while loading messages', err);
        });
    }
    cerateLastMsgDate() {
        const lastMsgDateElem = this.querySelector('.message-date');
        if(!lastMsgDateElem) return;

        const lastMsgDate = new Date((new Date(lastMsgDateElem.getAttribute('date'))).getTime() - localTimeZoneOffset * 1e3);
    
        lastMsgDateElem.innerText = shortDateFormater.format(lastMsgDate);
    }
}

customElements.define('el-chat', ElChat, {extends: 'div'});

hexSizes.setBodyHeight(30);
tasks.push(() => {
    const chats = Array.from(document.querySelectorAll('.chat'));
    setCSSProps(hexSizes.createCSSProps(20));

    if(userChatWithId && needToCreateChatWith){
        if(chats.length){
            document.addEventListener('createChatWith', createChatWith);
        }else{
            createChatWith({id: userChatWithId})
        }
    }

    const headerHeight = document.querySelector('header').offsetHeight;
    document.body.style.paddingTop = headerHeight + 'px';

    const messageBg = tinycolor(colors.MAIN_C).desaturate(20).lighten(38).toString();
    const cssProps = {
        'my-message-bgc': messageBg,
    }
    if(tinycolor(messageBg).isLight() && tinycolor(colors.BLACK_C).isLight()){
        cssProps['my-message-c'] = colors.WHITE_C;
    }
    setCSSProps(cssProps);

    const backToChats = () => {
        activeChatId = 0;
        changeChat();
    }
    document.addEventListener('keyup', (evt) => {
        if(evt.key == 'Escape') backToChats();
    });
    document.querySelector('.back-to-chats').onclick = backToChats;

    const input = document.querySelector('#newMsg');
    const sendMsg = document.querySelector('.message-send').onclick= () => {
        if(!activeChatId || !input || !input.value ) return;
        if(!input.value.trim()) return;
        
        socket.emit('new-message', {
            text: input.value.trim().replace(/[\t\v\f\r]+/g, ' '),
            chatId: activeChatId,
            userId: user.userId
        });

        input.value = '';
        input.focus();
    }
    input.onkeyup = (evt) => {
        if(evt.key == 'Enter' && !evt.shiftKey){
            sendMsg();
        }
    }

    const entitiesNames = ['admin', 'chain'];
    let username;
    let entity;
    input.oninput = evt => {
        if(evt.data == null){
            return [username, entity].forEach(needToClean => {
                if(needToClean && typeof(needToClean) == 'object'){
                    needToClean.pop();
                }
            });
        } 

        if(evt.data == '@' || evt.data[0] == '@') username = [];

        if(username) username.push(evt.data);

        if(username && evt.data.includes(' ')){
            username = username.join('').trim().replace(/@/g, '');
            fetch(`/users/${username}/json`)
            .then(res => res.ok && res.json())
            .then(res => {
                if(!res || !res.name){
                    showFlash(`No such user`);
                    
                    const wrongUsername = username;
                    setTimeout(() => {
                        input.value = input.value.replace(`@` + wrongUsername, '').trim();
                    }, 500)

                    return;
                };
                
                showFlash(`User ${res.name} founded`);
            })
            .catch(err => showModal('An error occured', err))
            .finally(() => {
                username = false;
            });
        }

        if(evt.data == '[' || evt.data[0] == '['){
            entity = [];
            if(evt.data[evt.data.length - 1] == ']' && !evt.data.includes('@')){
                entity = evt.data;
            }
        }
        if(typeof(entity) == 'object') entity.push(evt.data);

        if(entity && typeof(entity) == 'object' && evt.data.includes(']')){
            entity = entity.join('').replace(/[[\]]/g, '').trim();
            const entityName = entity.split(/[\s,;]+/)[0];
            const entityNum = entity.split(/[\s,;]+/)[1];
            
            if(entityName && entitiesNames.includes(entityName) && entityNum){
                fetch(`/${entityName}s/${entityNum}/json`)
                .then(res => res.ok && res.json())
                .then(res => {
                    if(!res){
                        showFlash(`No such entity`);
                        
                        const wrongEntity = entity;
                        setTimeout(() => {
                            input.value = input.value.replace(`[${wrongEntity}]`, '').trim();
                        }, 500)
                        
                        return;
                    }

                    showFlash(`${entityName.replace(entityName[0], entityName[0].toUpperCase())} ${entityNum} founded`);
                })
                .catch(err => console.error(err))
                .finally(() => {entity = false});
            }
        }   
    }

    document.querySelector('.chat-add').onclick = () => {
        const newChatModal = showModal('', '', true);
        newChatModal.innerHTML = `<div class="modal-content newChat-content">
            <div>
                <h2 class="modal-title newChat-title">Create chat</h2>
                <div class="newChat-form">
                    <div class="newChat-name">
                        <label class="newChat-label" for="nc-name">Name</label>
                        <input class="newChat-input" type="text" id="nc-name">
                    </div>
                    <div class="newChat-members">
                        <label class="newChat-label" for="nc-members">Members separated by commas</label>
                        <input class="newChat-input" type="text" id="nc-members">
                    </div>
                </div>
            </div>
            <div class="newChat-btns">
                <button class="newChat-create">Create chat</button>
                <button class="newChat-close">Close</button>
            </div>
        </div>`;

        newChatModal.querySelector('.newChat-close').onclick = hideModal;

        newChatModal.querySelector('.newChat-create').onclick = () => {
            const newChatName = newChatModal.querySelector('#nc-name');
            const newChatMembers = newChatModal.querySelector('#nc-members');

            if(!newChatName.value || !newChatMembers.value) return;

            fetch('/chats/new', {
                method: 'POST',
                body: JSON.stringify({
                    name: newChatName.value,
                    members: newChatMembers.value.split(/\s*[,;.|/:]\s*/).map(name => ({
                        username: name,
                    }))
                })
            })
            .then((res) => {
                if(!res.ok) return showModal('An error occured while creating chat', 'Pleasr try later. Status: ' + res.status);

                return res.json()
            })
            .then(res => {
                if(!res || !res.success) return showModal('An error occured while creating chat', 'Pleasr try later');

                window.location.reload();
            })
            .catch(err => {
                showModal('An error occured while creating chat', err);
            });
        }
    }

    if(urlParams.get('send')) document.querySelector('.messages-title-text').innerText = 'Choose chat to send ' + urlParams.get('send');
});