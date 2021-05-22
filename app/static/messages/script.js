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

const createMessage = (message) => {
    if(!message || document.querySelector('#m' + message.id) || message.chatId != activeChatId) return;
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

    if(message.date){
        message.date = new Date((message.date - (new Date).getTimezoneOffset() * 60) * 1000);
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
    msgElem.querySelector('.message-text').innerText = message.text;
    
    const messages = document.querySelector('.messages');
    messages.append(msgElem);
    messages.scrollTop = messages.scrollHeight;
    
    socket.on('delete-message-' + message.id, () => msgElem.remove());
    
    if(message.user.id == user.userId || chatAdminsRoles.includes(user.chatRole)){
        const deleteBtn = setClassName(document.createElementNS('http://www.w3.org/2000/svg', 'svg'), 'message-delete');
        deleteBtn.innerHTML = '<line x1="50%" y1="0%" x2="50%" y2="100%"></line><line x1="0%" y1="50%" x2="100%" y2="50%"></line>';
        msgElem.querySelector('.message').append(deleteBtn);

        deleteBtn.onclick = () => {
            showAsk(() => socket.emit('delete-message', message.id))
        };
    }
}

socket.on('new-message', msg => createMessage(JSON.parse(msg)));

const getMyMemdership = async (chatId) => {
    try{
        let myMembership = await fetch(`/chats/${chatId}/members/i`);
        if(!myMembership.ok){
            showModal('An erron occured while loading your chat role', 'Please try later. Status: ' + myMembership.status);
            return;
        };
        
        myMembership = await myMembership.json();

        return myMembership;
    }catch(err){
        showModal('An erron occured while loading your chat role', err);
    }
}

const createMessages = async (messages) => {
    const chat = document.querySelector('#c' + activeChatId);
    
    if(!messages || !chat) return;
    
    const myMembership = await getMyMemdership(chat.uuid);
    user.chatRole = myMembership.role.name;
    messages.forEach(msg => createMessage(msg, chat));
    delete user.chatRole;
}

const changeChat = (id = null) => {
    if(!user) document.addEventListener('userLoaded', changeChat)

    if(id) activeChatId = id;

    document.querySelector('.messages').innerHTML = ''

    const msgsTitle = document.querySelector('.messages-title');
    const msgsCont = document.querySelector('.messages-cont');
    if(!activeChatId){
        msgsTitle.innerText = 'Select chat';
        msgsCont.classList.remove('messages-cont-active');
        return
    }

    const chat = document.querySelector('#c' + activeChatId);
    msgsTitle.innerText = chat.getAttribute('chatname');
    msgsCont.classList.add('messages-cont-active');

    fetch(`/chats/${activeChatId}/messages`)
    .then(res => {
        if(!res.ok) return showModal('An erron occured while loading messages', 'Please try later. Status: ' + res.status);
        
        return res.json();
    })
    .then(createMessages)
    .catch(err => {
        showModal('An erron occured while loading messages', err);
    });
}

class ElChat extends HTMLDivElement{
    constructor() {
        super();
    }
    connectedCallback() { 
        this.uuid = this.id.replace('c', '');
        this.addEventListener('click', () => {
            activeChatId = this.uuid;
            changeChat();
        });

        setTimeout(() => {
            const infoBtn = setClassName(document.createElementNS('http://www.w3.org/2000/svg', 'svg'), 'chat-open-info');
            infoBtn.setAttribute('viewBox', '0,0,100,100')
            infoBtn.innerHTML = `
                <circle stroke-width="5" cx="50" cy="50" r="40"></circle>
                <line x1="50" y1="25" x2="50" y2="35"></line>
                <line x1="50" y1="45" x2="50" y2="75"></line>`;

            infoBtn.addEventListener('click', (evt) => {
                evt.stopImmediatePropagation();

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

                    const myMembership = await getMyMemdership(this.uuid);
                    if(!myMembership) return;

                    const isIChatAdmin = chatAdminsRoles.includes(myMembership.role.name);

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
                                        ${isIChatAdmin ? `
                                            <button class="chatAbout-delete" style="color: var(--red-c);">Delete chat</button>
                                            <button class="chatAbout-addMember">Add member</button>`
                                        : ''}
                                        <button class="chatAbout-quit">Quit</button>
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

                            successCallback && successCallback();
                        })
                        .catch(err => showModal('An error occured while deleting chat member', err))
                    }
                    const createMember = m => {
                        const memberElem = setClassName(document.createElement('li'), 'chatAbout-member-cont');

                        memberElem.innerHTML = `<div class="chatAbout-member">
                            <span class="role">${m.role.name}</span>
                            <a href="/users/${m.user.id}" class="username">${ m.user.name }</a>
                        </div>`;

                        membersElem.append(memberElem);

                        if(m.user.id != user.userId && isIChatAdmin){
                            const deleteBtn = setClassName(document.createElementNS('http://www.w3.org/2000/svg', 'svg'), 'chatAbout-member-delete');
                            deleteBtn.innerHTML = '<line x1="50%" y1="0%" x2="50%" y2="100%"></line><line x1="0%" y1="50%" x2="100%" y2="50%"></line>';
                            memberElem.firstElementChild.append(deleteBtn);
                    
                            deleteBtn.onclick = () => {
                                showAsk(() => {
                                    deleteMember(m.id, memberElem)
                                })
                            };
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
                                deleteMember(myMembership.id, null, () => {
                                    window.location.reload();
                                });
                            });
                        }
                    }

                    for(let action in actions){
                        if(chatAbout.querySelector('.chatAbout-' + action)) 
                            chatAbout.querySelector('.chatAbout-' + action).onclick = actions[action];   
                    }
                })
                .catch(err => {
                    showModal('An error occured while loading chat members', err);
                })
            }, {passive: false})

            this.append(infoBtn);
        }, 0);
    }
}

customElements.define('el-chat', ElChat, {extends: 'div'})

tasks.push(() => {
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

    document.addEventListener('keyup', (evt) => {
        if(evt.key == 'Escape'){
            activeChatId = 0;
            changeChat();
        } 
    });

    const input = document.querySelector('#newMsg');
    const sendMsg = document.querySelector('.message-send').onclick=() => {

        if(!activeChatId || !input || !input.value) return;

        
        socket.emit('new-message', {
            text: input.value,
            chatId: activeChatId,
            userId: user.userId
        });

        input.value = '';
    }
    input.onkeyup = (evt) => {
        if(evt.key == 'Enter'){
            sendMsg();
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

    if(document.documentElement.clientWidth < 550){
        
    }
});
