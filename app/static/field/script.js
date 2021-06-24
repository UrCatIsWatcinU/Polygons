'use strict';

const scrollTo = (element, to, duration) => {
    if (duration <= 0) return;
    let difference = to - element.scrollLeft;
    let perTick = difference / duration * 10;

    setTimeout(function() {
        element.scrollLeft = element.scrollLeft + perTick;
        if (element.scrollLeft === to) return;
        scrollTo(element, to, duration - 10);
    }, 10);
}

const idToNum = (id) => +(id.replace(/\w/, ''));

const giveHexSelector = (h) => `#r${h.rowId} #${h.id}`;
const prepareHex = hex => ({
    selector: giveHexSelector(hex),
    innerText: hex.querySelector('.hexagon-editedField') ? hex.querySelector('.hexagon-editedField').innerText : '',
    num: +hex.querySelector('.hexagon-num').innerText,
    chainId: hex.obj.chainId,
    userId: hex.obj.userId
})
const stringifyHexs = hexsArr => {
    return JSON.stringify(hexsArr.map(prepareHex))
}

let paramsRes = fetch(`/categ/${document.title}/params`);

window.addEventListener('load', async () => {
    // document.querySelector('.loading').style.opacity = 1;
    
    paramsRes.then(async params => {
        if(params.ok) params = await params.json()
        else{
            showModal('Critical error', 'The administrator has been notified, please try again in later');
            return
        }

        try{
            let user = await fetch('/users/i')
            if(user.ok){
                user = await user.json();
                if(!user.err){
                    let settingsRes = await fetch('/settings');
                    if(settingsRes.ok){
                        let settings = await settingsRes.json();
                        if(settings.success){
                            settings = JSON.parse(settings.body);
            
                            otherSettings = settings.otherSettings;
                            colors = settings.colors;
                            hexsColors = settings.hexsColors;
                            font = settings.font;
                        }
                    }else{
                        showModal('An error occurred while loading the settings', translate('ptl'));
                    }
                }
            }
        }catch(err){
            showModal('An error occurred while loading the settings', err)
        }

        let isTransEnd = false;
        let main = async () => {
            if(isTransEnd) return   
            isTransEnd = true;
            
            if(otherSettings.turned){
                document.body.style.setProperty('--hexagon-width', (hexSizes.HEXAGON_WIDTH -= 20) + 'px');
            }
            let size = params.size.split(/[x\sх]+/);
            const GRID_HEIGHT = size[0]; // измеряется в секторах
            const GRID_WIDTH = size[1]; // измеряется в секторах

            const showComplaintModal = (hex, to = null) => {
                let complaint = showModal('','', true);
                complaint = complaint.firstElementChild;
                complaint.classList.add('complaint');

                complaint.innerHTML = `
                <h1 class="complaint-title">${translate('contextmenu.complain')}</h1>
                <svg class="complaint-close"><line x1="50%" y1="0%" x2="50%" y2="100%"></line><line x1="0%" y1="50%" x2="100%" y2="50%"></line></svg>
                <div class="complaint-textarea">
                    <label for="complaint-text">${translate('complaint.text')}</label> 
                    <br> 
                    <textarea id="complaint-text" autofocus maxlength="400" spellcheck="true" wrap="soft"></textarea>
                </div>
                <div class="btn-cont" style="display: flex;">
                    <button class="send-button">${translate('btns.send')}</button>
                    <button class="close-button">${translate('btns.close')}</button>
                </div>
                `;

                complaint.querySelector('.send-button').onclick = async () => {
                    try{
                        let res = await fetch('/complaints/new', {
                            method: 'POST',
                            body:JSON.stringify({
                                hexagon: hex,
                                to: to,
                                text: complaint.querySelector('#complaint-text').value
                            })
                        })

                        if(res.ok){
                            res = await res.json();

                            if(res.success) showModal(translate('complaint.successT'), translate('complaint.successB'));
                            else showModal('An error occurred while recording the complaint', translate('ptl'));
                        }else{
                            showModal('An error occurred while recording the complaint', translate('ptl'));
                        }
                    }catch(err){
                        showModal('An error occurred while sending the complaint', err);
                    }
                };
                complaint.querySelector('.close-button').onclick = hideModal;
                complaint.querySelector('.complaint-close').onclick = hideModal;
            }

            const createEditedField = hexagon => {
                if(hexagon.BGImg) return null;
                let editedField = hexagon.querySelector('.hexagon-editedField');
                if(!editedField){
                    editedField = document.createElement('div');
                    editedField.className = 'hexagon-editedField';
                    
                    editedField.onfocus = () => {    
                        editedField.innerText = editedField.innerText.trim();
                        
                        editedField.onblur = () => {
                            editedField.setAttribute('contenteditable','false');
                            hexagon.classList.remove('hexagon-active');
                            hexagon.isFocused = false;
            
                            socket.emit('hexs', {
                                action: 'change',
                                categ: document.title,
                                data: stringifyHexs([editedField.parentElement])
                            });
            
                            hexagon.obj.innerText = hexagon.text = editedField.innerText;
                            
                        }
                    }
                    editedField.oninput = () => {
                        if(editedField.innerText.trim().split(/\s+/).filter(word => word).length > +params.maxWords - 1){
                            editedField.blur();
                        }
                    }
            
                    editedField.style.opacity = 0;
                    editedField.style.transition = 'all .13s linear';
                    hexagon.append(editedField);
                    editedField.style.opacity = 1;
                }
            
                // плашка подробнее
                editedField.onclick = evt => {
                    if(!hexagon.classList.contains('hexagon-visible') || !editedField.innerText) return;
            
                    clearContextMenus();
            
                    evt.stopPropagation();
            
                    if(hexagon.classList.contains('hexagon-active')) return;
                    hexagon.classList.add('hexagon-active');

                    const saveChanges = hexAboutElem => {
                        if(!hexAboutElem || !hexAboutElem.editor) return;

                        const editor = hexagonAbout.editor;

                        hexagon.about = editor.getContents();

                        fetch(`/hexs/${hexagon.uuid}/about/change`, {
                            method: 'POST',
                            body: JSON.stringify(hexagon.about)
                        })
                        .then(res => res.ok && res)
                        .then(res => res || showModal('An error occured while uploading your changes', translate('ptl')))
                    }
            
                    const clearAbouts = () => {
                        if(hexagon.isContextmenu || document.querySelectorAll('.ask').length) return;
                        document.querySelectorAll('.hexagon-about').forEach(elem => {
                            saveChanges(elem);
                            elem.remove();
                        });
                        document.removeEventListener('mousedown', clearAbouts);
                    }
                    clearAbouts();
            
                    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
            
                    let hexagonAbout = document.createElement('div');
                    hexagonAbout.className = 'hexagon-about';
                    hexagonAbout.innerHTML = `
                    <div class="hexagon-about-controls">
                        <div class="hexagon-about-controls-btns">
                            <span class="hexagon-about-btn contentBtn">${translate('hexAbout.content')}</span>
                            <span class="hexagon-about-btn imagesBtn">${translate('hexAbout.images')}</span>
                            <span class="hexagon-about-btn commentsBtn">${translate('hexAbout.comments')}</span>
                        </div>
                        <div class="hexagon-about-rating"> 
                            <svg class="hexagon-about-rating-btn rating-plus">
                                <line x1="50%" y1="0%" x2="50%" y2="100%"></line><line x1="0%" y1="50%" x2="100%" y2="50%"></line>
                            </svg>
                            <span class="hexagon-about-rating-num">0</span>
                            <svg class="hexagon-about-rating-btn rating-minus">
                                <line x1="0%" y1="50%" x2="100%" y2="50%"></line>
                            </svg>
                        </div>
                    </div>
                    <div class="hexagon-about-content">
                        <div class="hexagon-about-editor"></div>
                    </div>
                    <div class="hexagon-about-images" style="display: none"></div>
                    <div class="hexagon-about-comments" style="display: none">
                        <div class="hexagon-about-comments-cont"></div>
                        <div class="hexagon-about-comments-form">
                            <label class="hexagon-about-comments-label" for="newComment">${translate('hexAbout.yourComment')}: </label><br>
                            <textarea id="newComment" class="hexagon-about-comments-input"></textarea>
                            <div class="hexagon-about-comments-btns"><button class="send-comment">${translate('btns.send')}</button></div>
                        </div>
                    </div>`;
                    let activeAboutTab = 'content';
                    const selectActiveTab = () => {
                        if(hexagonAbout.querySelector(`.${activeAboutTab}Btn`)){
                            hexagonAbout.querySelector(`.${activeAboutTab}Btn`).style.textDecoration = 'underline';
                        }
                        if(hexagonAbout.querySelector(`.hexagon-about-${activeAboutTab}`)){
                            hexagonAbout.querySelector(`.hexagon-about-${activeAboutTab}`).style.display = '';
                        }
                    }

                    const content = () => hexagonAbout.querySelector('.hexagon-about-content');

                    const setUpEditor = () => {
                        let editorOptions = {
                            theme: 'snow',
                            debug: false, 
                            modules: {
                                toolbar: false
                            },
                            readOnly: true,
                        };
                        if(hexagon.userId == user.userId || user.userRole == 2){
                            editorOptions = {
                                readOnly: false,
                                debug: 'warn',
                                theme: 'snow',
                                modules: {
                                    toolbar: [
                                        ['bold', 'italic', 'underline'],
                                        
                                        [{ 'header': 1 }, { 'header': 2 }],
                                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],

                                        ['clean']
                                    ]
                                }
                            }
                        }
                        
                        const editor = new Quill('.hexagon-about-editor', editorOptions);
                        
                        if(typeof(hexagon.about) == 'string'){
                            if(hexagon.about[0] == '{' || hexagon.about[0] == '['){
                                hexagon.about = JSON.parse(hexagon.about || '{}');
                                editor.setContents(hexagon.about);
                            } 
                            else{
                                editor.insertText(0, hexagon.about);
                            }
                        }else if(typeof(hexagon.about) == 'object'){
                            editor.setContents(hexagon.about);
                        }
                        
                        editor.disable();
                        
                        editor.on('selection-change', (range, oldRange) => {
                            if(range === null && oldRange !== null) {
                                // hexagonAbout.dispatchEvent(new Event('editorBlur'));
                                saveChanges(hexagonAbout);
                                editor.disable();
                            }
                        });

                        hexagonAbout.editor = editor;
                    }
                    
                    const createImageCont = (imgObj) => {
                        if(!imgObj || !imgObj.url) return;
                        
                        let imgCont = setClassName(document.createElement('div'), 'hexagon-about-images-imgCont');
                        const img = document.createElement('img');
                        img.setAttribute('draggable', 'false')
                        img.src = '/' + imgObj.url;
                        img.uuid = imgObj.uuid;
                        img.isBG = imgObj.isBG;
            
                        imgCont.append(img);
                        imgCont.img = img;
                        img.onerror = () => {
                            imgCont.remove();
                            hexagon.imgs = hexagon.imgs.filter(i => i.uuid != img.uuid);
                        }
            
                        if(hexagon.userId != user.userId && user.userRole != 2 || img.isBG) return imgCont;
            
                        const deleteImgButton = setClassName(document.createElementNS('http://www.w3.org/2000/svg', 'svg'), 'hexagon-about-img-close');
                        deleteImgButton.innerHTML = '<line x1="50%" y1="0%" x2="50%" y2="100%"></line><line x1="0%" y1="50%" x2="100%" y2="50%"></line>';
                        
                        imgCont.append(deleteImgButton);
                        deleteImgButton.onclick = () => {
                            fetch(`/hexs/imgs/delete/` + imgObj.uuid, {
                                method: 'DELETE'
                            }).then(res => {
                                if(!res.ok) return showModal('An error occurred while deleting the image', translate('ptls') + res.status);
            
                                return res.json();
                            }).then(deleteImgRes => {
                                if(!deleteImgRes.success) return showModal('An error occurred while deleting the image', translate('ptl'));
            
                                hexagon.imgs.splice(hexagon.imgs.indexOf(imgObj), 1);
                                createImages();
                            });
                        }
                        return imgCont;
                    }
                    let isSlideAnimationActive = false;
                    const startImgsSlider = () => {
                        const conts = Array.from(hexagonAbout.querySelectorAll('.hexagon-about-images-imgCont'));
                        const images = hexagonAbout.querySelector('.hexagon-about-images');
            
                        if(!conts || !conts.length || conts.length == 1) return;
            
                        const inner = () => {
                            console.log('create slider');
                            images.slideTo = (n) => {
                                const slider = images.firstElementChild;
                                let neededScroll = 0;
                                if(typeof n == 'number') {
                                    neededScroll = slider.offsetWidth * (n-1);
                                }else if(typeof n == 'string'){
                                    if(n == 'next'){   
                                        neededScroll = slider.scrollLeft + slider.offsetWidth;
                                    }else if(n == 'prev'){
                                        neededScroll = slider.scrollLeft - slider.offsetWidth;
                                    }
                                }
                                
                                if(neededScroll > slider.scrollWidth - slider.offsetWidth){
                                    return Math.round(slider.scrollWidth / slider.offsetWidth) - 1;
                                } else if(neededScroll < 0){
                                    return 0;
                                } 
            
                                let step = Math.abs(neededScroll - slider.scrollLeft) * .05;
            
                                const anim = () => {
                                    isSlideAnimationActive = true;
                                    if(Math.floor(slider.scrollLeft) == Math.floor(neededScroll)){
                                        isSlideAnimationActive = false;
                                        return;
                                    } 
                                    if(slider.scrollLeft > neededScroll){
                                        slider.scrollLeft -= step;
                                        requestAnimationFrame(anim);
                                    }else{
                                        slider.scrollLeft += step;
                                        requestAnimationFrame(anim);
                                    }
                                }
                                requestAnimationFrame(anim);
                                
                                return Math.round((neededScroll - slider.offsetWidth) / slider.offsetWidth) + 1;
                            }
            
                            images.style.height = `calc(${(Math.max(...conts.map(cont => cont.img.height)))}px + (${images.imagesArrowsSize} + ${images.arrowPad * 2}px) * 2)`;
            
                            const bullets = images.querySelector('.hexagon-about-images-bullets');
                            bullets.style.left = `calc(50% - ${bullets.offsetWidth}px / 2)`;
                            bullets.firstElementChild.classList.add('hexagon-about-images-active-bullet');
                        }
                        if(!areImagesLoaded)hexagonAbout.addEventListener('allImagesLoaded', inner, {once: true});
                        else inner(); 
                    }
                    let areImagesLoaded = false;
                    const createImages = () => {
                        const images = hexagonAbout.querySelector('.hexagon-about-images') || setClassName(document.createElement('div'), 'hexagon-about-images');
                        if(!activeAboutTab == 'images') images.style.display = 'none';
                        images.innerHTML = '<div class="hexagon-about-images-slider"></div>';
                        images.arrowPad = 5;
                        images.imagesArrowsSize = '1em';
                        images.style.setProperty('--arrow-pad', images.arrowPad + 'px')
                        images.style.setProperty('--size', images.imagesArrowsSize)
                        
                        if(!hexagon.imgs || !hexagon.imgs.length) return;
                        
                        let imgsConts = hexagon.imgs.map(createImageCont);
                        
                        let notLoadedImgs = hexagon.imgs.map(img => img.uuid);
                        imgsConts.forEach(imgCont => {
                            if(imgsConts.length == 1) return;
                            imgCont.img.onload = () => {
                                notLoadedImgs = notLoadedImgs.filter(uuid => imgCont.img.uuid != uuid);
                                if(!notLoadedImgs.length){  
                                    areImagesLoaded = true;
            
                                    const bullets = setClassName(document.createElement('div'), 'hexagon-about-images-bullets');
                                    const nextBtn = setClassName(document.createElementNS('http://www.w3.org/2000/svg', 'svg'), 'hexagon-about-images-switch hexagon-about-images-next');
                                    const prevBtn = setClassName(document.createElementNS('http://www.w3.org/2000/svg', 'svg'), 'hexagon-about-images-switch hexagon-about-images-prev');
                                    
                                    const changeActiveBullet = (n) => {
                                        Array.from(bullets.children).forEach((btn, i, btns) => {
                                            btn.classList.remove('hexagon-about-images-active-bullet');
                                            
                                            
                                            if(i == n){
                                                btn.classList.add('hexagon-about-images-active-bullet');
                                                prevBtn.classList.remove('hexagon-about-images-switch-disabled');
                                                nextBtn.classList.remove('hexagon-about-images-switch-disabled');
            
                                                if(i === 0){
                                                    prevBtn.classList.add('hexagon-about-images-switch-disabled');
                                                }else if(i == btns.length - 1){
                                                    nextBtn.classList.add('hexagon-about-images-switch-disabled');
                                                }
                                            }
                                        });
                                    }
                                    imgsConts.forEach((cont, i) => {
                                        const bullet = setClassName(document.createElementNS('http://www.w3.org/2000/svg', 'svg'), 'hexagon-about-images-bullet');
                                        bullet.setAttribute( 'viewBox', '0 0 100 100');
                                        bullet.innerHTML = `<circle cx="50" cy="50" r="40"></circle>`;
            
                                        bullet.onclick = () => {
                                            if(isSlideAnimationActive) return;
                                            images.slideTo(i + 1);
                                            changeActiveBullet(i);
                                        }
            
                                        bullets.append(bullet);
                                    });
                                    images.append(bullets);
            
                                    
                                    nextBtn.onclick = () => { 
                                        if(isSlideAnimationActive) return;
                                        changeActiveBullet(images.slideTo('next')); 
                                    }
                                    prevBtn.onclick = () => { 
                                        if(isSlideAnimationActive) return;
                                        changeActiveBullet(images.slideTo('prev')); 
                                    }
                                    
                                    [nextBtn, prevBtn].forEach(btn => {
                                        btn.setAttribute( 'viewBox', '0 0 100 100');
                                        btn.innerHTML = `<polygon points="0,0 100,50 0,100"></polygon>`;
            
                                        images.append(btn);
                                    });
            
                                    hexagonAbout.dispatchEvent(new Event('allImagesLoaded'));
                                    if(activeAboutTab == 'images') startImgsSlider();
                                }
                            } 
                        });
                        
                        if(!hexagonAbout.querySelector('.hexagon-about-images')) hexagonAbout.append(images);
                        images.firstElementChild.append(...imgsConts);
            
                        images.addEventListener('wheel', (evt) => {
                            evt.stopPropagation();
                            evt.preventDefault();
                        });
                    }

                    const createComments = async () => {
                        hexagonAbout.comments = [];
                        const commentsElem = hexagonAbout.querySelector('.hexagon-about-comments-cont');
                        const createComment = (comment, num) => {
                            typeof(hexagonAbout.comments) === 'object' && hexagonAbout.comments.push(comment);
                            let commentElem = setClassName(document.createElement('div'), 'hexagon-about-comment');
                            commentElem.id = 'comment' + comment.id;
                            commentElem.userId = comment.userId
            
                            commentElem.innerHTML = `
                            <div class="hexagon-about-comment-userCont">
                                <span class="hexagon-about-comment-num">#${num + 1 || ''}</span>&nbsp;
                                <a href="/users/${comment.userId}" class="hexagon-about-comment-user"></a>
                            </div>
                            <div class="hexagon-about-comment-body"></div>
                            <div class="hexagon-about-comment-btns">
                                <svg xmlns="http://www.w3.org/2000/svg" title="complain" class="hexagon-about-comment-complaintBtn" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                    <line x1="12" y1="9" x2="12" y2="13"></line>
                                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                                </svg>
                                <svg xmlns="http://www.w3.org/2000/svg" title="reply" class="hexagon-about-comment-replyBtn" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="15 14 20 9 15 4"></polyline>
                                    <path d="M4 20v-7a4 4 0 0 1 4-4h12"></path>
                                </svg>
                            </div>`;
                            const commentUser = commentElem.querySelector('.hexagon-about-comment-user');
                            commentElem.username = commentUser.innerText = comment.username;

                            const commentBody = commentElem.querySelector('.hexagon-about-comment-body');
    
                            commentBody.innerHTML = comment.body.trim().replace(/</g, '&lt;').replace(/\n/g, '<br>');
                            
                            const usersLinks = comment.body.match(/@\S+/gi) || [];
                            usersLinks.forEach(uL => {
                                fetch(`/users/${uL.replace('@', '')}/json`)
                                .then(res => res.ok && res.json())
                                .then(res => {
                                    if(!res) return;
                                    
                                    commentBody.innerHTML = commentBody.innerHTML.replace(uL.replace('@', ''), `<a href="/users/${res.id}">${res.name}</a>`) 
                                })
                                .catch(err => showModal('An error occured', err))
                                .finally(() => {
                                    // username = null;
                                });
                            });
            
                            // comment btns
                            if(comment.userId == user.userId || user.userRole == 2){
                                const deleteCommentBtn = setClassName(document.createElementNS('http://www.w3.org/2000/svg', 'svg'), 'hexagon-about-comment-close');
                                deleteCommentBtn.innerHTML = '<line x1="50%" y1="0%" x2="50%" y2="100%"></line><line x1="0%" y1="50%" x2="100%" y2="50%"></line>';
                                commentElem.querySelector('.hexagon-about-comment-btns').append(deleteCommentBtn);
                                deleteCommentBtn.onclick = () => {
                                    showAsk(() => {
                                        fetch('/chains/comments/delete/' + commentElem.id.replace('comment', ''), {
                                            method: 'DELETE'
                                        });
                                    })
                                }
                            }

                            const replyBtn = commentElem.querySelector('.hexagon-about-comment-replyBtn') || {};

                            replyBtn.onclick = () => {
                                const input = hexagonAbout.querySelector('#newComment');
                                input.value = `[reply ${comment.id}]`
                            }

                            commentElem.querySelector('.hexagon-about-comment-complaintBtn').onclick = () => {
                                showComplaintModal(null, JSON.stringify({
                                    entity: 'comment',
                                    url: `/hexs/${hexagon.uuid}`,
                                    urlText: `#${num} ${comment.username}:`,
                                    entityText: comment.body,
                                    text: comment.body
                                }))
                            };
                            
                            
                            if(comment.userId == user.userId){
                                commentElem.style.setProperty('--underline-color', 'var(--main-c)')
                            }

                            if(hexagonAbout.querySelector('.hexagon-about-comments-empty')) hexagonAbout.querySelector('.hexagon-about-comments-empty').remove();
                            if(comment.replyToId){
                                const replyTo = hexagonAbout.querySelector(`#comment${comment.replyToId}`);
                                if(replyTo){
                                    commentElem.classList.add('hexagon-about-comment-reply');
                                    replyTo.after(commentElem);

                                    commentUser.parentElement.innerHTML += `
                                    <span class="hexagon-about-comment-userInReply">${translate('hexAbout.inReply')} 
                                        <a href="/users/${replyTo.userId}">${replyTo.username}</a>
                                    </span>`;

                                    return;
                                }
                            }
                            if(otherSettings.reverseComments) commentsElem.append(commentElem);
                            else commentsElem.prepend(commentElem);
                        }

                        const commentsRes = await fetch(`/chains/${hexagon.chainId}/comments`);
                        if(!commentsRes.ok) return;
            
                        const comments = (await commentsRes.json()).sort((a, b) => a.id - b.id);
                        
                        if(!comments || !comments.length){
                            commentsElem.innerHTML = '<h3 class="hexagon-about-comments-empty">No comments</h3>';
                        }else{
                            comments.forEach(createComment)
                        }
            
                        socket.on('newComment' + hexagon.chainId, (data) => {
                            try{
                                createComment(JSON.parse(data), hexagonAbout.comments.length)
                            }catch(err){
                                console.log(err);
                            }
                        });
                        
                        socket.on('deleteComment' + hexagon.chainId, (id) => {
                            try{
                                hexagonAbout.querySelector('#comment' + id).remove();
                            }catch(err){
                                console.log(err);
                            }
                        });
                    }
            
                    if(!hexagon.about && typeof(hexagon.about) != 'string'){
                        const loadAbout = () => {
                            hexagonAbout.innerHTML += `<div class="loading about-loading">
                            <svg class='loading-svg about-loading-svg' version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
                              viewBox="0 0 52 100" enable-background="new 0 0 0 0" xml:space="preserve">
                              <circle stroke="none" cx="6" cy="50" r="6">
                                <animate
                                  attributeName="opacity"
                                  dur="1s"
                                  values="0;1;0"
                                  repeatCount="indefinite"
                                  begin="0.1"/>    
                              </circle>
                              <circle stroke="none" cx="26" cy="50" r="6">
                                <animate
                                  attributeName="opacity"
                                  dur="1s"
                                  values="0;1;0"
                                  repeatCount="indefinite" 
                                  begin="0.2"/>       
                              </circle>
                              <circle stroke="none" cx="46" cy="50" r="6">
                                <animate
                                  attributeName="opacity"
                                  dur="1s"
                                  values="0;1;0"
                                  repeatCount="indefinite" 
                                  begin="0.3"/>     
                              </circle>
                            </svg>
                            </div>`;
                            fetch(`/hexs/${hexagon.uuid}/about`)
                            .then(res => res.ok && res.text())
                            .then(aboutContent => {
                                if(aboutContent === false) return;

                                hexagon.about = aboutContent;

                                setUpEditor();

                                selectActiveTab();
    
                                const loading = hexagonAbout.querySelector('.loading');
                                loading.style.opacity = 0;
                                
                                loading.ontransitionend = () => {
                                    loading.remove();
                                    loading.isDeleted = true;
                                }
                                setTimeout(() => {if(!loading.isDeleted) loading.remove()}, 1000)
                            });
                        }
                        loadAbout();
            
                        // socket.on('changeAbout' + hexagon.uuid, (data) => {
                        //     if(JSON.parse(data).userId == JSON.parse(sessionStorage.getItem('user') || '{}').userId) return ;
                        //     loadAbout();
                        // });
                    }else{
                        selectActiveTab();
                        
                        setTimeout(() => {
                            setUpEditor();
                        }, 0)
                    }
                    
                    fetch(`/chains/${hexagon.chainId}/rating`).then(async rating => {
                        if(rating.ok){
                            rating = await rating.json()

                            const ratingNumElem = hexagonAbout.querySelector('.hexagon-about-rating-num');
                            if(!ratingNumElem) return; 

                            ratingNumElem.innerText = rating.num ? rating.num : '0';

                            hexagonAbout.allowedChange = rating.allowedChange;
                            if(rating.allowedChange == -1){
                                hexagonAbout.querySelector('.rating-plus').style.opacity = 0;
                                hexagonAbout.querySelector('.rating-plus').style.pointerEvents = 'none';
                            }else if(rating.allowedChange == 1){
                                hexagonAbout.querySelector('.rating-minus').style.opacity = 0;
                                hexagonAbout.querySelector('.rating-minus').style.pointerEvents = 'none';
                            }

                            if(rating.num > 0){
                                ratingNumElem.classList.add('rating-positive')
                            }else if(rating.num < 0){
                                ratingNumElem.classList.add('rating-negative')
                            } 
                        } 
                    });
                    createImages();
                    createComments();
            
                    // загрузка изображения и редактирование текста
                    if(hexagon.userId == user.userId || user.userRole == 2){
                        hexagonAbout.addEventListener('dragover', (evt) => {
                            if(activeAboutTab != 'images') return;
                            evt.preventDefault();
                            evt.stopImmediatePropagation();
                            hexagonAbout.classList.add('hexagon-about-drag');
                        }, {passive: false});
                        
                        hexagonAbout.addEventListener('drop', (evt) => {
                            if(activeAboutTab != 'images') return;
                            hexagonAbout.classList.remove('hexagon-about-drag');
                            evt.preventDefault();
                            uploadFile(evt.dataTransfer.files, `/hexs/${hexagon.uuid}/imgs/upload`,(imgUploadRes) => {
                                delete imgUploadRes.success;
            
                                hexagon.imgs.push(imgUploadRes);
        
                                const images = document.querySelector('.hexagon-about-images');
                                if(images){
                                    images.remove(); 
                                } 
                                createImages();
                            }, evt);
                        }, {passive: false});
                        
                        hexagonAbout.ondragleave = () => {
                            hexagonAbout.classList.remove('hexagon-about-drag');
                        }

                        content().addEventListener('dblclick', evt => {
                            evt.preventDefault();
                            evt.stopPropagation();
            
                            if(hexagonAbout.editor){
                                hexagonAbout.editor.enable();
                                hexagonAbout.editor.focus();
                            } 
                        }, {passive: false});
                    }
            
                    const deleteObserver = new MutationObserver((mList) => {
                        mList.forEach(mutation => {
                            if(Array.from(mutation.removedNodes).includes(hexagonAbout)){
                                hexagon.classList.remove('hexagon-active');
                                saveChanges(hexagonAbout);
                            }
                        });
                    });
                    deleteObserver.observe(hexagon, {
                        childList: true
                    });
            
                    
                    hexagonAbout.addEventListener('mousedown', evt => {
                        evt.stopPropagation();
                    });
            
                    selectActiveTab();
                    const changeTab = (newTabName) => {
                        if(hexagonAbout.querySelector(`.${activeAboutTab}Btn`)){
                            hexagonAbout.querySelector(`.${activeAboutTab}Btn`).style.cssText = '';
                        }
                        if(hexagonAbout.querySelector(`.hexagon-about-${activeAboutTab}`)){
                            hexagonAbout.querySelector(`.hexagon-about-${activeAboutTab}`).style.display = 'none';
                        }
                        activeAboutTab = newTabName;
                        selectActiveTab();
                    }
                    hexagonAbout.addEventListener('click', (evt) => {
                        if(evt.target.classList.contains('hexagon-about-btn')){
                            const btn = evt.target;
                            changeTab(btn.classList[1].replace('Btn', ''));
            
                            let currentBlock = hexagonAbout.querySelector(`.hexagon-about-${activeAboutTab}`);
                            if(currentBlock.classList.contains('hexagon-about-images')){
                                startImgsSlider();
                            }
                        }else if(evt.target.classList.contains('hexagon-about-rating-btn')){
                            const btn = evt.target;
                            const num = hexagonAbout.querySelector('.hexagon-about-rating-num');
            
                            let change = 0;
                            if(btn.classList.contains('rating-plus')){
                                change++;
                            }else{
                                change--;
                            }
            
                            fetch(`/chains/${hexagon.chainId}/rating/change`, {
                                method: 'POST',
                                body: JSON.stringify({
                                    change: change
                                })
                            }).then(async res =>{
                                if(!res.ok) return;
                                res = await res.json();
                                
                                const plus = hexagonAbout.querySelector('.rating-plus');
                                const minus = hexagonAbout.querySelector('.rating-minus');
                                if(res.success){
                                    if(res.change == -1){
                                        minus.style.opacity = 0;
                                        minus.style.pointerEvents = 'none';
                                        
                                        plus.style.opacity = 1;
                                        plus.style.pointerEvents = 'auto';
                                    }else if(res.change == 1){
                                        plus.style.opacity = 0;
                                        plus.style.pointerEvents = 'none';
            
                                        minus.style.opacity = 1;
                                        minus.style.pointerEvents = 'auto';
                                    }else if(res.change == 0){
                                        [minus, plus].forEach(b => {
                                            b.style.opacity = 1;
                                            b.style.pointerEvents = 'auto';
                                        });
                                    }

                                    num.innerText = res.num ? res.num : '0';

                                    if(res.num > 0){
                                        num.classList.add('rating-positive');
                                    }else if(res.num < 0){
                                        num.classList.add('rating-negative');
                                    }else{
                                        num.classList.remove('rating-negative');
                                        num.classList.remove('rating-positive');
                                    }
                                }else{
                                    change = 0;
                                }
                            });
            
                            if(num.innerText == 0) return;
                            // btn.style.opacity = 0;
                            // btn.style.pointerEvents = 'none';
                        }else if(evt.target.classList.contains('send-comment')){
                            const input = hexagonAbout.querySelector('#newComment');
                            if(!input || !input.value || typeof(input.value) != 'string') return;
                            const newCommentObj = {
                                body: input.value.trim(),
                            }

                            let replyStr = input.value.match(/\[[^\[\]]+(?=\])/);
                            replyStr = replyStr && replyStr[0];

                            if(typeof(replyStr) == 'string' && replyStr.replace('[', '').split(/\s+/)[0] == 'reply'){
                                replyStr = replyStr.replace('[', '');
                                const replyTo = replyStr.split(/\s+/)[1];

                                if(+replyTo){
                                    newCommentObj.replyTo = replyTo;       
                                }else{
                                    const userComments = typeof(hexagonAbout.comments) == 'object' 
                                    && hexagonAbout.comments.filter(c => c.username == replyTo);
                                    
                                    if(userComments && userComments.length){
                                        newCommentObj.replyTo = userComments.pop().id;       
                                    }
                                }

                                const bodyWithoutReplyStr = newCommentObj.body.replace(`[${replyStr}]`, '');
                                if(!bodyWithoutReplyStr.trim()) return;
                                
                                newCommentObj.body = bodyWithoutReplyStr;
                            }
            
                            fetch(`/chains/${hexagon.obj.chainId}/comments/new`, {
                                method: 'POST',
                                body: JSON.stringify(newCommentObj)
                            }).then(() => {
                                input.value = '';
                            });
                        }
                    });
            
                    hexagon.append(hexagonAbout);
                    
                    if(!isIOS()){
                        setHexAboutPosition(hexagon, hexagonAbout);
                    }
                    
                    document.addEventListener('mousedown', clearAbouts);
                    
                    hexagonAbout.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                        inline: 'center'
                    });
                }
            
                return editedField;
            }
            // определение свойст шестиугольника
            const setHexProps = hexagon => {
                hexagon.classList = 'hexagon';

                // ид ряда и ид шестиугольника
                let row = hexagon.parentElement;
                hexagon.id = 'h' +  ([].indexOf.call(row.children, hexagon) + 1 + hexagon.sectorCol* document.sectorSettings.width);
                // hexagon.querySelector('polygon').id = 'p' + ([].indexOf.call(row.children, hexagon) + 1)
                hexagon.rowId = idToNum(row.id);
                hexagon.obj = {
                    innerText: '',
                    username: '',
                    uuid: 0,
                    chainId: 0,
                    userId: 0,
                    creationDate: 0
                };
                
                for(let prop in hexagon.obj){
                    if(typeof(hexagon[prop]) != 'undefined') continue;
                    Object.defineProperty(hexagon, prop, {
                        get() {
                            return hexagon.obj[prop];
                        },
                        set(value) {
                            hexagon.obj[prop] = value;
                        }
                    });
                }
                const user = JSON.parse(sessionStorage.getItem('user') || '{}');
                
                hexagon.ondblclick = (evt) => {
                    if(user.userId != hexagon.userId && user.userRole != 2) return;     
                    let editedField = createEditedField(hexagon);
                    if(!editedField) return;
                    evt.preventDefault();
                    if(!hexagon.classList.contains('hexagon-visible')) return;
                    hexagon.isFocused = true;
                    hexagon.classList.add('hexagon-active');   
                    
                    
                    editedField.setAttribute('contenteditable','true');
                    editedField.focus();
                    
                }
            
                const canCreateBgHex = () => hexagon.classList.contains('hexagon-visible') && !hexagon.obj.about;
                hexagon.addEventListener('dragover', (evt) => {
                    if(user.userId != hexagon.userId && user.userRole != 2) return;     
                    evt.preventDefault();
                    if(!canCreateBgHex()) return;

                    hexagon.classList.add('hexagon-drag');
                }, {passive: false, capture: true});
                
                hexagon.addEventListener('drop', (evt) => {
                    hexagon.classList.remove('hexagon-drag');

                    if(hexagon.querySelector('.hexagon-editedField')) return;
                    uploadFile(evt.dataTransfer.files,`/hexs/${hexagon.uuid}/imgs/upload`, (imgUploadRes) => {
                        delete imgUploadRes.success;
            
                        hexagon.imgs.push(imgUploadRes);
        
                        createBgHex(hexagon, imgUploadRes.url);
                    }, evt);
                }, {passive: false});
                
                hexagon.ondragleave = () => {
                    hexagon.classList.remove('hexagon-drag');
                }
            
                for(let setting in otherSettings){
                    if(otherSettings[setting] && ['bordered', 'turned', 'innerNum'].includes(setting)){
                        hexagon.classList.add('hexagon-' + setting);
                    }
                }
            
                hexagon.obj.about = null;
                hexagon.obj.imgs = [];
            }
            
            class ElHexagon extends HTMLElement{
                constructor() {
                    super();
                }
                connectedCallback() { 
                    this.sectorCol = this.getAttribute('sectorCol');
                    this.sectorRow = this.getAttribute('sectorRow');
                    setHexProps(this);

                    this.classList.add  ('hexagon')
                }
            }
            
            customElements.define('el-hexagon', ElHexagon);
        
            const deleteHex = hexagon => {
                let deletedHexs = [];
                
                const deleteHexInner = hexagon => {
                    if(!hexagon) return;
                    deletedHexs.push(hexagon);
                    let chain = getChain(hexagon.chainId);
                    
                    let elem = document.querySelector(hexagon.selector);
                    if(elem){
                        setHexProps(elem);
                        elem.innerHTML = '<div class="hexagon-num">0</div>'
                    }
                    
                    if(hexagon.num === 1){
                        if(chain){
                            console.log(chain.hexs, chain);
                            deletedHexs.concat(chain.hexs);
                
                            chain.hexs = chain.hexs.filter(h => h.selector != hexagon.selector);
                            delete chains[chains.indexOf(chain)]
                            chain.hexs.forEach(deleteHexInner);
                        } 
                    }else{
                        if(chain){
                            if(hexagon.num > 1){
                                let hexsToDelete = [];
                                chain.hexs = chain.hexs.filter(h => {
                                    if(h.num <   hexagon.num) return true;

                                    hexsToDelete.push(h);
                                });

                                console.log(hexsToDelete);
                                deletedHexs.concat(hexsToDelete);
                                hexsToDelete.forEach(deleteHexInner);
                            }
                        }
                    }
                    
                    visibleHexs = visibleHexs.filter(hex => hex.uuid != hexagon.uuid);
                }
                deleteHexInner(hexagon);
        
                return deletedHexs.filter(h => h);
            }

            function parseHexsFromJson(savedHexs){    
                if(!savedHexs.length) return [];
        
                let parsedHexs = [];
                for(let hex of savedHexs){
                    try{
                        let hexagon = document.querySelector(hex.selector);
                        if(!hexagon || !hexagon.classList || hexagon.classList.contains('hexagon-visible')) continue;
                        setHexVisible(hexagon);      
                        
                        if(hex.innerText){
                            let editedField = createEditedField(hexagon); 
                            
                            editedField.innerText = hex.innerText;
                        }
                        
                        hexagon.querySelector('.hexagon-num').innerText = hex.num;
                        hexagon.style.setProperty('--bgc', hexsColors[((hex.num-1) - hexsColors.length * (Math.ceil((hex.num-1) / hexsColors.length) - 1)) - 1]);
                        
                        if(hex.num == 1){
                            hexagon.classList.add('hexagon-first');
                            hexagon.style.setProperty('--bgc', '');
                        }
    
                        ['chainId', 'userId', 'username', 'creationDate', 'uuid', 'num', 'BGImg', 'selector'].forEach(prop => {
                            hexagon[prop] = hex[prop];
                        });
                        hexagon.imgs = hex.imgs ? !hex.imgs.length ? [] : hex.imgs : [];
    
                        if(hex.BGImg){
                            createBgHex(hexagon, hex.BGImg);
                        }

                        hexagon.obj = hex;

                        parsedHexs.push(hexagon);   
                    }catch(err){
                        console.log(err);
                    }
                }
        
                return parsedHexs
            }

            function sendHexsCreationReq(hexs, needToCheckFirsts = true){
                const useResData = async data => {
                    if(!data.ok) return showModal('An error occurred while creating the hexagon', translate('ptls') + data.status);
                    
                    data = await data.json();
                    if(!data.success) return showModal('An error occurred while creating the hexagon', translate('ptl'));

                    data.hexs.forEach(hex => {
                        let hexToSetId = document.querySelector(hex.selector);

                        if(hexToSetId) hexToSetId.obj = hex
                    });

                    visibleHexs.push(...data.hexs)
                }

                let firstHexs = hexs.filter(hexToCheck => !hexToCheck.chainId);
                
                if(!firstHexs.length || !needToCheckFirsts){
                    fetch(`/hexs/${document.title}/new`, {
                        method: 'POST',
                        headers:{
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(hexs)
                    }).then(useResData);
                }else{
                    firstHexs.forEach(async firstHex => {
                        try{
                            let newChainRes = await fetch(`/chains/${document.title}/new`);
                            if(!newChainRes.ok) return showModal('An error occurred while creating the hexagon', translate('ptls') + newChainRes.status)
                            
                            newChainRes = await newChainRes.json();

                            if(!newChainRes.success) return showModal('An error occurred while creating the hexagon', translate('ptl'));
                            
                            let newChainHexs = hexs.filter(hex => hex.chainId == firstHex.chainId);
                            newChainHexs.forEach(hexToCreate => {
                                hexToCreate.chainId = newChainRes.chainId;
                            });

                            delete newChainRes.success;
                            newChainRes.id = newChainRes.chainId 
                            delete newChainRes.chainId;
                            newChainRes.hexs = newChainHexs;
                            chains.push(newChainRes)
                            
                            sendHexsCreationReq(newChainHexs, false);
                        }catch(err){
                            showModal('An error occurred while creating the hexagon', err)
                            console.error(err);
                        }
                    });

                }
            }

            const hexsCont = document.querySelector('.hexsCont');

            hexsCont.style.opacity = 1;
            
            const hexPad = 6;
            const hexsContPad = 400;
            document.sectorSettings = {
                width: 10,
                height: 10,
            }
            document.sectorSettings.heightPx = document.sectorSettings.height * (hexSizes.HEXAGON_HEIGHT + hexPad) - document.sectorSettings.height * (hexSizes.TRIANGLE_HEIGHT - hexPad);
            document.sectorSettings.widthPx = document.sectorSettings.width * (hexSizes.HEXAGON_WIDTH + hexPad * 2);
            setCSSProps({
                'field-hex-pad': hexPad + 'px',
                'cont-pad': hexsContPad + 'px',
                'cont-grid': `${document.sectorSettings.heightPx + hexSizes.TRIANGLE_HEIGHT}px repeat(${GRID_HEIGHT - 1}, ${document.sectorSettings.heightPx}px) / repeat(${GRID_WIDTH}, ${document.sectorSettings.widthPx}px)`,
            }); 
            
            let sectorsStr = '';
            
            const sectors = document.sectors = [];
            const filledSectors = document.filledSectors = [];

            for(let i = 0; i < GRID_HEIGHT; i++){
                // sectorsStr += `<div id="sr${i}" class="sectors-row">`
                sectors.push([]);
                for (let j = 0; j < GRID_WIDTH; j++) {
                    sectorsStr += `
                    <div 
                        id="s-r${i}c${j}" 
                        class="sector${i == 0 ? ' sector-in-first-row' : i == GRID_HEIGHT - 1 ? ' sector-in-last-row' : ''}${j == 0 ? ' sector-in-first-col' : j == GRID_WIDTH - 1 ? ' sector-in-last-col' : ''}">
                    </div>`;

                    sectors[i].push({
                        rowId: i,
                        colId: j,
                        isActive: false,
                        el(){
                            return document.querySelector(`#s-r${this.rowId}c${this.colId}`)
                        },
                        fill(){
                            if(this.isActive) return false;
                            
                            const hexsStr = `<el-hexagon sectorRow="${this.rowId}" sectorCol="${this.colId}" class="hexagon"><div class="hexagon-num">0</div> </el-hexagon>`.repeat(document.sectorSettings.width);
                            let rowsStr = '';
                            for(let m = 0; m < document.sectorSettings.height; m += 2){
                                rowsStr += `
                                    <div id="r${m + 1 + this.rowId * document.sectorSettings.height}" class="row">${hexsStr}</div>
                                    <div id="r${m + 2 + this.rowId * document.sectorSettings.height}" class="row row-moved">${hexsStr}</div>
                                `;
                            }
                            const sectorElem = this.el();
                            sectorElem.innerHTML = rowsStr;
                            
                            this.isActive = true;

                            filledSectors.push(this);
                            if(filledSectors.length > 6) filledSectors.shift().clear();

                            if(typeof(visibleHexs) == 'object'){
                                parseHexsFromJson(visibleHexs);
                            }

                            return true;
                        },
                        clear(){
                            this.el().innerHTML = '';
                            this.isActive = false;
                        }
                    });
                }   
                // sectorsStr += '</div>'
            }
            hexsCont.innerHTML = sectorsStr;
            
            // document.querySelector('#sr0').classList.add('row-first');

            if(otherSettings.turned){
                hexsCont.style.transform = 'rotate(90deg)';
                document.documentElement.style.width = 'auto';
                document.documentElement.style.height = (GRID_WIDTH * document.sectorSettings.width * hexSizes.HEXAGON_WIDTH + hexSizes.HEXAGON_WIDTH/2) + 'px';
            }

            let zoomIndex = 1;
            const changeZoom = (change) => {
                zoomIndex += change;

                if(zoomIndex <= 0) zoomIndex = 0.01;

                let user = JSON.parse(sessionStorage.getItem('user') || '{}');
                if(user.userRole != 2 && zoomIndex < 0.6) return;

                // const oH = hexsCont.offsetHeight;
                // const oW = hexsCont.offsetWidth;

                // hexsCont.style.top =  (oH * zoomIndex - oH) + 'px';
                // hexsCont.style.left = (oW * zoomIndex - oW) + 'px';
                hexsCont.style.transform = `scale(${zoomIndex})`;

                hexsCont.style.padding = (hexsContPad / zoomIndex) + 'px';
            }   
            

            const clearContextMenus = () => {
                document.querySelectorAll('.contextmenu').forEach(elem => {elem.remove()});
            }

            if(!isTouchDevice()){
                const SLIDE_SPEED = 1;
                const MIN_CHANGE = 20;
                const slider = document.body;
                let isDown = false;
    
                let startX, scrollLeft, startY, scrollTop;
    
                slider.addEventListener('mousedown', (e) => {   
                    if(document.querySelector('.contextmenu') || e.buttons != 1 || document.querySelector('.modal') && getComputedStyle(document.querySelector('.modal')).display != 'none') return;
                    isDown = true;
                    startX = e.pageX - slider.offsetLeft;
                    scrollLeft = slider.scrollLeft;
                    
                    startY = e.pageY - slider.offsetTop;
                    scrollTop = slider.scrollTop;
                });
                slider.addEventListener('mouseleave', () => {
                    isDown = false;
                    // slider.classList.remove('active');
                });
                slider.addEventListener('mouseup', () => {
                    isDown = false;
                    // slider.classList.remove('active');
                });
                slider.addEventListener('mousemove', (e) => {
                    if(!isDown) return;
                    e.preventDefault();
                    const x = e.pageX - slider.offsetLeft;
                    const walkX = (x - startX) * SLIDE_SPEED; //scroll-fast
                    
                    const y = e.pageY - slider.offsetTop;
                    const walkY = (y - startY) * SLIDE_SPEED; //scroll-fast
                    if(Math.abs(walkX) > MIN_CHANGE || Math.abs(walkY) > MIN_CHANGE){
                        // slider.classList.add('active');
                    } 
                    requestAnimationFrame(function scroll(){

                        slider.scrollLeft = scrollLeft - walkX;
                        slider.scrollTop = scrollTop - walkY;
                        if(isDown) requestAnimationFrame(scroll);
                    })
                });

                document.addEventListener('wheel', evt => {
                    if(otherSettings.ctrlZoom){
                        if(!(evt.metaKey || evt.ctrlKey)) return;
                        else{
                            evt.preventDefault();
                        }
                    } 
                    if((document.querySelector('.settings') && document.querySelector('.settings').style.display != 'none') || document.querySelector('.hexagon-about')) return;
                    clearContextMenus();
                    evt.preventDefault();
                    
                    changeZoom(-(evt.deltaY/1260));
                }, {passive: false});

                const scrollBtns = setClassName(document.createElement('div'), 'scroll-btns');
    
                const plusScrollBtn = setClassName(document.createElementNS('http://www.w3.org/2000/svg', 'svg'), 'scroll-btn plus-scroll');
                plusScrollBtn.innerHTML = `<line x1="50%" y1="0%" x2="50%" y2="100%"></line><line x1="0%" y1="50%" x2="100%" y2="50%"></line>`;
                plusScrollBtn.onclick = () => {
                    changeZoom(.1);
                }
                
                const minusScrollBtn = setClassName(document.createElementNS('http://www.w3.org/2000/svg', 'svg'), 'scroll-btn minus-scroll');
                minusScrollBtn.onclick = () => {
                    changeZoom(-.1);
                }
                minusScrollBtn.innerHTML = `<line x1="0%" y1="50%" x2="100%" y2="50%"></line>`
                
                scrollBtns.append(plusScrollBtn, minusScrollBtn);
                document.body.append(scrollBtns)
                scrollBtns.style.bottom = `calc(50% - ${scrollBtns.offsetHeight / 2}px)`;
            
                document.documentElement.addEventListener('keydown', evt => {
                    if(evt.key == '=' && (evt.ctrlKey || evt.metaKey)){
                        evt.preventDefault();
                        changeZoom(.1)
                    }
                    if(evt.key == '-' && (evt.ctrlKey || evt.metaKey)){
                        evt.preventDefault();
                        changeZoom(-.1)
                    }
        
                    if(evt.code == 'Space'){
                        if(document.activeElement == document.body) evt.preventDefault();
                    }
                }, {passive: false});
            }else{
                const MAX_CHANGE = 5;
                let touchIsDown = false;
                let contextMenuOpen = false;
                let startMoveX, startMoveY;
                document.body.ontouchstart = (evt) => {
                    if(hexsCont.isPinched) return;

                    touchIsDown = true;
                    startMoveX = evt.changedTouches[0].clientX;
                    startMoveY = evt.changedTouches[0].clientY;
                    setTimeout(() => {
                        if(touchIsDown){
                            let contextMenuEvt = new Event('contextmenu', {
                                clientX: evt.changedTouches[0].clientX,
                                clientY: evt.changedTouches[0].clientY,
                            });
                            contextMenuEvt.clientX = evt.changedTouches[0].clientX;
                            contextMenuEvt.clientY = evt.changedTouches[0].clientY;
                            document.body.dispatchEvent(contextMenuEvt);
    
                            contextMenuOpen = true;
                        }
                    }, 400)
                }
                document.body.addEventListener('touchmove', (evt) => {
                    if(startMoveX - evt.changedTouches[0].clientX > MAX_CHANGE || startMoveY - evt.changedTouches[0].clientY > MAX_CHANGE){
                        clearContextMenus();
                        touchIsDown = false;
                    }
                });
    
                let touchEnd = evt => {
                    if(contextMenuOpen){
                        if(evt.cancelable){
                            evt.preventDefault();
                        } 
                        contextMenuOpen = false;
                    }else{
    
                    }
                    touchIsDown = false;
                }
                addEventListener('touchend', touchEnd, {
                    passive: false,
                });
                addEventListener('touchcancel', touchEnd, {
                    passive: false,
                });

                // let pz = new PinchZoom(hexsCont, {
                //     maxZoom: 10, 
                //     minZoom: 5,
                //     tapZoomFactor: 5
                // });
                let hammerHexsCont = new Hammer(hexsCont);
                hammerHexsCont.get('pinch').set({ enable: true });

                let lastScale = 1;
                hammerHexsCont.on('pinch pinchend', evt => {
                    if (evt.type == 'pinch'){
                        hexsCont.isPinched = true;
                        clearContextMenus();
                        
                        zoomIndex = Math.max(.2, Math.min(lastScale * (evt.scale), 4));
                        changeZoom(0);
                    }
                    if(evt.type == "pinchend"){
                        hexsCont.isPinched = false;

                        lastScale = zoomIndex;
                    }
                });
            }

            let visibleHexs = document.visibleHexs =  [];
            let chains = [];
            const getChain = id => {
                for(let chain of chains){
                    if(chain && chain.id == id) return chain
                }
            }
            
            document.addEventListener('click', clearContextMenus);

            document.body.oncontextmenu = (evt) => {
                clearContextMenus();
        
                let hexagon = document.elementFromPoint(evt.clientX, evt.clientY);
                if(hexagon == document.body) return false;
                while(!hexagon.classList.contains('hexagon')){
                    hexagon = hexagon.parentElement;
                    if(hexagon == document.body) return false;
                }
        
                if(hexagon.isFocused){
                    hexagon.isFocused = false;
                    hexagon.querySelector('.hexagon-editedField').blur();
                }
        
                let contextmenu  = document.createElement('div');
                contextmenu.className = 'contextmenu';
        
                const deleteObserver = new MutationObserver((mList) => {
                    mList.forEach(mutation => {
                        if(Array.from(mutation.removedNodes).includes(contextmenu)){
                            hexagon.isContextmenu = false;
                            deleteObserver.disconnect();
                        }
                    });
                });
                deleteObserver.observe(document.body, {
                    childList: true
                });
        
                const getNeighbors = hexagon => {
                    const getTwoHexagons = (id1, id2, rowId) => row ? Array.from(document.querySelectorAll(`#r${rowId} #h${id1},#r${rowId} #h${id2}`)) : [];
                    let row = hexagon.parentElement;
                    let hexagonNeighbors = getTwoHexagons(idToNum(hexagon.id) - 1, idToNum(hexagon.id) + 1, idToNum(row.id));
                    if(row.classList.contains('row-moved')){
                        hexagonNeighbors.push(...getTwoHexagons(idToNum(hexagon.id), idToNum(hexagon.id) + 1, idToNum(row.id)+1));    
                        hexagonNeighbors.push(...getTwoHexagons(idToNum(hexagon.id), idToNum(hexagon.id) + 1, idToNum(row.id)-1));    
                    }else{
                        hexagonNeighbors.push(...getTwoHexagons(idToNum(hexagon.id), idToNum(hexagon.id) - 1, idToNum(row.id)+1));    
                        hexagonNeighbors.push(...getTwoHexagons(idToNum(hexagon.id), idToNum(hexagon.id) - 1, idToNum(row.id)-1));
                    }
                    
                    return hexagonNeighbors;
                }
                contextmenu.onclick = null;
                
                let user = JSON.parse(sessionStorage.getItem('user') || '{}');
                
                // создание шестиугольника
                if(!hexagon.classList.contains('hexagon-visible')){
                    let noCreate = false;
                    let needFillLast = false;
        
                    let hexVisibleNeighbors = getNeighbors(hexagon).filter(elem => elem.classList.contains('hexagon-visible'));

                    for(let hex of hexVisibleNeighbors){
                        for(let hexToCheck of hexVisibleNeighbors){
                            if(hex != hexToCheck && hex.obj.chainId != hexToCheck.obj.chainId){
                                noCreate = true; 
                                break;
                            } 
                        }
                        if(user.userRole != 2 && getChain(hex.chainId).userId != user.userId){
                            noCreate = true; 
                            break;
                        } 
                    }

                    let chain = getChain(hexVisibleNeighbors[0] && hexVisibleNeighbors[0].chainId);

                    chain && chain.hexs.forEach(hexToCheck => { 
                        if(!hexToCheck.innerText && !hexToCheck.BGImg){
                            needFillLast = true;
                            return;
                        }
                    });

                    if(noCreate){
                        contextmenu.innerHTML = translate('contextmenu.not');
                        contextmenu.style.color = 'var(--red-c)'; 
                    }else if(needFillLast){
                        contextmenu.innerHTML = translate('contextmenu.needFill');
                        contextmenu.style.color = 'var(--red-c)'; 
                    }else{
                        contextmenu.innerHTML = translate('contextmenu.create');
                        
                        contextmenu.onclick = () => {
                            hexagon.obj = {
                                userId: user.userId,
                                username: document.querySelector('.username').innerText,
                                creationDate: (new Date()).getTime() / 1000,
                                selector: giveHexSelector(hexagon),
                                innerText: ''
                            };
                            
                            let hexagonIdInChain = 0;
                            if(hexVisibleNeighbors.length){
                                chain = getChain(hexVisibleNeighbors[0].obj.chainId);
                                console.log(chain);
                                hexagon.obj.chainId = chain.id;
                                chain.hexs.push(hexagon.obj);
                                
                                chain.hexs.forEach(hex => {
                                    if(hex.num > hexagonIdInChain) hexagonIdInChain = hex.num
                                })
                                hexagon.style.setProperty('--bgc', hexsColors[(hexagonIdInChain - hexsColors.length * (Math.ceil(hexagonIdInChain / hexsColors.length) - 1)) - 1]);
                                
                            }else{
                                hexagon.obj.chainId = 0;
                                hexagon.classList.add('hexagon-first');
                                hexagon.style.setProperty('--bgc', '');
                                hexagonIdInChain = 0;
                            }
                            
                            setHexVisible(hexagon);
                            
                            hexagon.querySelector('.hexagon-num').innerText = hexagon.obj.num = hexagonIdInChain + 1;
                            
                            sendHexsCreationReq([hexagon.obj]);
                        }
                    }
                }else{
                    hexagon.isContextmenu = true;
                    let hexDate = new Date(hexagon.obj.creationDate * 1000);
                    contextmenu.innerHTML = ` 
                    <div class="contextmenu-item send-btn">Send to chat</div> 
                    <div class="contextmenu-item copy-btn">Copy link</div> 
                    <div class="contextmenu-item complain-btn">Complain</div>
                    <hr class="contextmenu-line">
                    <div class="contextmenu-item contextmenu-info">${translate('contextmenu.user')}: <a href="/users/${hexagon.obj.userId}">${hexagon.obj.username}</a></div>
                    <div class="contextmenu-item contextmenu-info">${translate('contextmenu.chain')}: ${hexagon.obj.chainId}</div>
                    <div class="contextmenu-item contextmenu-info">${translate('contextmenu.uid')}: ${hexagon.obj.uuid}</div>
                    <div class="contextmenu-item contextmenu-info">${translate('contextmenu.date')}: ${hexDate.toLocaleDateString()}</div>`;

                    if(!hexagon.obj.userId || (user.userId == hexagon.obj.userId) || user.userRole == 2){
                        contextmenu.insertAdjacentHTML('afterbegin', `
                        <div class="delete-btn contextmenu-item">Delete</div>
                        ${hexagon.obj.BGImg ? '' : '<div class="contextmenu-item edit-btn">Edit</div>'}
                        ${user.userRole == 2 ? '<div class="move-btn contextmenu-item">Move</div>' : ''}`);
                    }

                    
                    if(user.userRole == 2){
                        // contextmenu.innerHTML += ``;
                        contextmenu.innerHTML += `<div class="contextmenu-item contextmenu-info">Row: ${hexagon.rowId}</div>`;
                        contextmenu.innerHTML += `<div class="contextmenu-item contextmenu-info">Column: ${hexagon.id.replace('h', '')}</div>`;
                    }

                    const actions = {
                        delete: () => {
                            showAsk(() => {
                                let virtualVisibleHexs = [...visibleHexs];
                                
                                deleteHex(hexagon.obj);
                                socket.emit('hexs', {
                                    action: 'delete',
                                    categ: document.title,
                                    data: JSON.stringify(virtualVisibleHexs.filter(hex => !visibleHexs.includes(hex)).map(h => h.selector))
                                });
                            }, translate('specific.hexDeletionAskBody') + (hexagon.obj.num == 1 ? translate('specific.hexDeletionAskBodyAddon') : ''))
                        },
                        move: () => {
                            fetch('/categs/names').then(async res => {
                                if(!res.ok) return showModal('An error occurred while loading category names', 'Try later');
                                
                                res = await res.json();
                                if(!res.success) return showModal('An error occurred while loading category names', 'Try later');
                                const categNamesStr = res.categs.map(categ => `<option ${categ.name == document.title ? 'disabled' : ''} value="${categ.id}|${categ.name}">id: ${categ.id} | name: ${categ.name}</option>`).join('');
    
                                let moveModal = showModal('', '', true);
                                moveModal.onclick = null;
                                moveModal = moveModal.firstElementChild;
                                moveModal.classList.add('moveModal');
                                moveModal.innerHTML = `
                                <h1 class="moveModal-title">Move</h1>
                                <svg class="moveModal-close"><line x1="50%" y1="0%" x2="50%" y2="100%"></line><line x1="0%" y1="50%" x2="100%" y2="50%"></line></svg>
                                <div class="moveModal-select">
                                    <div>
                                        <label for="moveModal-text">Categ</label> 
                                        <br> 
                                        <select id="moveModal-text" class="moveModal-select">
                                            ${categNamesStr}
                                        </select>
                                    </div>
                                    <div> 
                                        <label for="moveModal-row">Row</label> 
                                        <br> 
                                        <input type="number" min="0" id="moveModal-row" value="${getChain(hexagon.obj.chainId).hexs[0].rowId}">
                                        <br>
                                        <label for="moveModal-hex">Column</label> 
                                        <br> 
                                        <input type="number" min="0" id="moveModal-hex" value="${getChain(hexagon.obj.chainId).hexs[0].id.replace('h', '')}">
                                    </div>
                                </div>
                                <div class="btn-cont" style="display: flex;">
                                    <button class="move-button">Move</button>
                                    <button class="close-button">Close</button>
                                </div>
                                `;
                                moveModal.querySelector('.move-button').onclick = () => {
                                    const selectedCategStr = moveModal.querySelector('#moveModal-text').value;
                                    fetch(`/chains/${hexagon.obj.chainId}/move`, {
                                        method: 'POST',
                                        body: JSON.stringify({
                                            categId: selectedCategStr.split('|')[0],
                                            newRow: +document.querySelector('#moveModal-row').value,
                                            newHex: +document.querySelector('#moveModal-hex').value,
    
                                        })
                                    }).then(res => {
                                        if(!res.ok) return showModal('An error occurred while moving the chain', translate('ptls') + res.status);
                                        
                                        const nextCategUrl = new URL(`/fields/${selectedCategStr.split('|')[1]}`, window.location.origin)
                                        nextCategUrl.searchParams.append('selector', `#r${document.querySelector('#moveModal-row').value} #h${document.querySelector('#moveModal-hex').value}`);

                                        window.location = nextCategUrl;
                                    });
                                }
    
                                moveModal.querySelector('.moveModal-close').onclick = moveModal.querySelector('.close-button').onclick = hideModal;
                            })
                        },
                        complain: () => {
                            showComplaintModal({
                                selector: giveHexSelector(hexagon),
                                categ: document.title
                            })
                        },
                        edit: () => {
                            hexagon.dispatchEvent(new Event('stopClearing'));

                            if(hexagon.querySelector('.hexagon-about-content')){
                                evt.stopImmediatePropagation();
                                hexagon.querySelector('.hexagon-about-content').dispatchEvent(new Event('dblclick'));
                            }else{
                                hexagon.dispatchEvent(new Event('dblclick'));
                            }
                        },
                        copy: () => {
                            let link = new URL(window.location.pathname, window.location.origin);
                            link.searchParams.append('hexId', hexagon.uuid);
                            
                            if (!navigator.clipboard) {
                                let textArea = document.createElement("textarea");
                                textArea.setAttribute('value', link);
                                textArea.value = link;

                                textArea.style.position = "fixed";
                                // textArea.style.visibility = "hidden";

                                document.body.appendChild(textArea);

                                setTimeout(() => {
                                    textArea.focus();
                                    textArea.select();
                                
                                    try {
                                        let success = document.execCommand('copy');
                                        if(success){
                                            showFlash(translate('contextmenu.copyMsgs.s'));
                                        }else{
                                            showModal(translate('contextmenu.copyMsgs.uns'));
                                        }
                                    } catch (err) {
                                        showModal(translate('contextmenu.copyMsgs.uns'), err);
                                    }
                                
                                    document.body.removeChild(textArea); 
                                }, 10)           
                            }else{
                                window.navigator.clipboard.writeText(link)
                                .then(() => showFlash(translate('contextmenu.copyMsgs.s')))
                                .catch(err => {
                                    showModal(translate('contextmenu.copyMsgs.uns'), err);
                                });
                            }
                        },
                        send: () => {
                            const nextLink = new URL('/chats', window.location.origin); 
                            nextLink.searchParams.append('send', `[hex ${hexagon.uuid}]`);
                            window.location = nextLink;
                        }
                    } 

                    for(let action in actions){
                        const actionBtn = contextmenu.querySelector(`.${action}-btn`); 
                        if(actionBtn){
                            actionBtn.innerText = translate(`contextmenu.${action}`)
                            actionBtn.addEventListener('click', actions[action], {passive: false})
                        } 
                    }
                }
                contextmenu.style.top = evt.clientY + 'px';
                contextmenu.style.left = evt.clientX + 'px';
                document.body.append(contextmenu);
        
                return false
            }
            
            const backup = () => {
                localStorage.setItem('userScroll-' + document.title, JSON.stringify({x: document.body.scrollLeft, y: document.body.scrollTop}));
            }
            window.onunload = backup;
            window.addEventListener('beforeunload', (evt) => {
                backup();
                return false
            });
            
            window.onerror = () => {
                backup();
            };
            
            document.querySelector('.back').addEventListener('click', () => {
                sessionStorage.clear();
            });
            
            socket.on('hexs', (data) => {
                if(data.categ != document.title) return;
                
                data.body = JSON.parse(data.body || '[]');
                
                if(data.action == 'new' && typeof(data.body) == 'object'){
                    visibleHexs.push(...data.body);
                }else if(data.action == 'delete'){
                    data.body.forEach(deleteHex);
                }else if(data.action == 'change'){
                    data.body.forEach(hex => {
                        let hexagon = visibleHexs.find(h => h.selector == hex.selector);
                        hexagon.innerText = hex.innerText;
                        const elem = document.querySelector(hexagon.selector);
                        if(elem){
                            let editedField = createEditedField(elem);
                            
                            editedField.innerText = hex.innerText;
                        }

                    });
                }
            });

            let scrollChangeY = 0;
            let scrollChangeX = 0;
            let prevScrollX = document.body.scrollTop;
            let prevScrollY = document.body.scrollLeft;
            const sW = document.sectorSettings.widthPx;
            const sH = document.sectorSettings.heightPx;
            const b = document.body;

            const chooseRow = i => i > 0 ? i < sectors.length ? i : sectors.length - 1 : 0;
            const getSectorForHex = hex => {
                console.log(hex);
                let hexRow = hex.selector.match(/r\d+/);
                let hexCol = hex.selector.match(/h\d+/);

                hexRow = hexRow && Math.round(+hexRow[0].replace(/^\w/, '') / document.sectorSettings.width);
                hexCol = hexCol && Math.round(+hexCol[0].replace(/^\w/, '') / document.sectorSettings.height);

                console.log(hexRow, hexCol);

                return sectors[chooseRow(hexRow)][hexCol];
            } 

            const fillSectors = () => {
                clearContextMenus();

                const rawRowIndex = Math.round(b.scrollTop / sH / zoomIndex);
                const rawColIndex = Math.round(b.scrollLeft / sW / zoomIndex);
                
                const nearSectors = [
                    sectors[chooseRow(rawRowIndex)][rawColIndex - 1],
                    sectors[chooseRow(rawRowIndex)][rawColIndex],
                    sectors[chooseRow(rawRowIndex - 1)][rawColIndex],
                    sectors[chooseRow(rawRowIndex - 1)][rawColIndex - 1],
                ];

                for(let s of nearSectors){
                    if(s){
                        s.fill();
                    }
                }
            }
            document.body.addEventListener('scroll', (evt) => {
                scrollChangeY += (b.scrollTop - prevScrollX) / zoomIndex;
                scrollChangeX += (b.scrollLeft - prevScrollY) / zoomIndex;
                
                if(Math.abs(scrollChangeY) > hexsContPad / 2){
                    scrollChangeY = 0;
                    
                    fillSectors(scrollChangeY);
                }
                
                if(Math.abs(scrollChangeX) > hexsContPad / 2){
                    scrollChangeX = 0;
                    
                    fillSectors(scrollChangeX);
                }
                // if(scrollYChange > )
                prevScrollX = b.scrollTop;
                prevScrollY = b.scrollLeft;
            });
            
            const urlParams = new URLSearchParams(window.location.search);
            let foundedHex = null;
            window.addEventListener('hexsLoaded', () => {
                foundedHex = visibleHexs.find(hex => hex.selector == urlParams.get('selector') || hex.uuid == urlParams.get('hexId'))  

                if(foundedHex){
                    getSectorForHex(foundedHex).el().scrollIntoView();
                    
                    setTimeout(() => {
                        const foundedElem = document.querySelector(foundedHex.selector)
                        foundedElem.scrollIntoView({
                            block: 'center',
                            inline: 'center'
                        });
                        
                        foundedElem.classList.add('founded-polygon');
                        
                        setTimeout(() => {
                            foundedElem.classList.remove('founded-polygon');
                            history.pushState(null, null, '/fields/' + document.title); 
                        }, 4000)
                    }, 0)
                    
                }else{
                    let scrollCoords = JSON.parse(localStorage.getItem('userScroll-' + document.title) || `{"x": ${document.body.scrollWidth / 2}, "y":  ${document.body.scrollHeight / 2}}`);
                    document.body.scrollTo(scrollCoords.x, scrollCoords.y);
                    
                }
            });
            if(document.body.scrollLeft < hexsContPad) document.body.scrollLeft = hexsContPad;
            if(document.body.scrollTop < hexsContPad) document.body.scrollTop = hexsContPad;

            try{
                let res = await fetch('/chains/' + document.title);
                if(!res.ok) return showModal('An error occurred when loading hexagons', translate('ptls') + res.status);
                res = await res.json();
                
                sessionStorage.setItem('user', JSON.stringify({
                    userId: res.userId,
                    userRole: res.userRole
                }));

                console.log(res.body);
                for(let chain of res.body){
                    visibleHexs.push(...chain.hexs);
                    chains.push(chain);
                }

                window.dispatchEvent(new Event('hexsLoaded'));
            }catch(err){
                showModal('An error occurred when loading hexagons', err);
            }

            // настройки  
            document.querySelector('.settings-button').onclick = () => {
                document.querySelector('.modal').onclick = null;
                let settingsCont = showModal('', '', true).firstElementChild;
                settingsCont.classList.add('settings');

                settingsCont.innerHTML = `
                <h1 class="settings-title">${translate('sets.h1')}</h1>
                <svg class="settings-close"><line x1="50%" y1="0%" x2="50%" y2="100%"></line><line x1="0%" y1="50%" x2="100%" y2="50%"></line></svg>
                <div class="settings-cont">
                    <div class="colors">
                        <h2 class="settings-title">${translate('sets.themeC')}</h2>
                        <div class="settings-grid colors"></div>
                    </div>
                    <div class="hexs-dColors">
                        <h2 class="settings-title">${translate('sets.hexsC')}</h2>
                        <div class="settings-grid dColors"></div>
                    </div>
                    <div class="font">
                        <h2 class="settings-title">${translate('sets.font')}</h2>
                        <div class="font-cont">
                            <span class="font-input-cont"><label for="font-family">${translate('sets.fontF')} <a target="_blank" href="https://fonts.google.com/">Google</a></label>:&nbsp<input type="text" id="font-family" value="${font.family}"></span>
                            <span class="font-input-cont"><label for="font-size">${translate('sets.fontS')}</label>:&nbsp<input type="range" min=".5" max="2" step="0.05" id="font-size" value="${font.size.replace('em', '')}"></span>
                        </div>
                        <div class="font-preview">
                        <h3 style="font-family: inherit; margin: 10px 0">Font settings example</h3>
                        <p style="font-family: inherit; margin: 0; max-width: 500px; white-space: pre-wrap;">Lorem ipsum dolor sit amet, consectetur adipisicing elit. Nulla consequatur ullam beatae laudantium eveniet voluptatum facere impedit repudiandae amet laboriosam.</p>
                        </div>
                    </div>
                    <div class="other">
                        <h2 class="settings-title">${translate('sets.other')}</h2>
                        <div class="other-cont">
                            <div class="rounded-cont check-cont"><label class="check-label" for="rounded">${translate('sets.check.R')}</label><input class="check-input" type="checkbox" id="rounded"><div class="check-custom"></div></div>
                            <div class="bordered-cont check-cont"><label class="check-label" for="bordered">${translate('sets.check.B')}</label><input class="check-input" type="checkbox" id="bordered"><div class="check-custom"></div></div>
                            <!-- <div class="turned-cont check-cont"><label class="check-label" for="turned">${translate('sets.check.B')}</label><input class="check-input" type="checkbox" id="turned"><div class="check-custom"></div></div> -->
                            <div class="innerNum-cont check-cont"><label class="check-label" for="innerNum">${translate('sets.check.I')}</label><input class="check-input" type="checkbox" id="innerNum"><div class="check-custom"></div></div>
                            <div class="ctrlZoom-cont check-cont"><label class="check-label" for="ctrlZoom">${translate('sets.check.Z')}</label><input class="check-input" type="checkbox" id="ctrlZoom"><div class="check-custom"></div></div>
                            <div class="reverseComments-cont check-cont"><label class="check-label" for="reverseComments">${translate('sets.check.RC')}</label><input class="check-input" type="checkbox" id="reverseComments"><div class="check-custom"></div></div>
                            <!-- <div class="slideSpeed-cont check-cont short-text-cont"><label class="check-label" for="slideSpeed">${translate('sets.check.S')}</label><input class="short-text-input" type="text" value="${otherSettings.slideSpeed}" id="slideSpeed"></div> -->
                        </div>
                    </div>
                </div>
                <div class="btn-cont" style="display: flex;">
                    <button class="save-button">${translate('sets.save')}</button>
                    <button class="close-button">${translate('btns.close')}</button>
                    <button class="reset-button">${translate('sets.reset')}</button>
                </div>
                `;


                for(let color in defaultColors){
                    settingsCont.querySelector('.settings-grid.colors').innerHTML += `<div><label for="${color}">${color}: </label><br> <input id="${color}" class="color-input" value="${colors[color] || defaultColors[color]}" data-jscolor="{}"></div>`
                }
                settingsCont.querySelectorAll('.color-input').forEach(input => {
                    input.onchange = () => {
                        colors[input.id] = input.value;

                        localStorage.setItem('colors', JSON.stringify(colors));
                    }
                })

                for(let i = 0; i < hexsColors.length; i++){
                    settingsCont.querySelector('.settings-grid.dColors').innerHTML += `
                    <div class="dColor-cont">
                        <label class="dColor-label" for="dC${i+1}">${i+1}.</label> <input id="dC${i+1}" class="dColor-input" value="${hexsColors[i]}" data-jscolor="{}">
                        <svg class="settings-minus"><line x1="0%" y1="50%" x2="100%" y2="50%"></line></svg> 
                    </div>`;
                }

                const inputHeight = getComputedStyle(settingsCont.querySelector('input')).height
                const setDColorProps = input => {
                    let num = +input.previousElementSibling.innerText.replace('.', '') - 1;

                    input.onchange = () => {
                        hexsColors[num] = input.value;
                        localStorage.setItem('hexsColors', JSON.stringify(hexsColors));
                    }
                    
                    let minus = input.nextElementSibling;
                    minus.style.width = inputHeight;
                    minus.style.height = inputHeight;
                    input.style.width = (input.offsetWidth - +inputHeight.replace('px', '') - 10 - 40 - 8 - input.parentElement.firstElementChild.offsetWidth) + 'px';
                    
                    minus.onclick = () => {
                        if(!input.toDelete){
                            input.toDelete = true;
                            hexsColors.splice(num, 1);
                            
                            minus.classList.add('settings-overline');
                            minus.style.width = '';
                        }else{
                            input.toDelete = false;
                            minus.classList.remove('settings-overline');
                            minus.style.width = getComputedStyle(settingsCont.querySelector('.jscolor')).height;
                            
                            hexsColors.splice(num, 0, input.value);
                        }
                        localStorage.setItem('hexsColors', JSON.stringify(hexsColors));
                    }
                }

                setTimeout(() => {
                    settingsCont.querySelectorAll('.dColor-input').forEach(setDColorProps)
                }, 0);

                jscolor.install();

                settingsCont.querySelector('.settings-grid.dColors').innerHTML += `<div class="plus-cont"></div>`;

                let plus = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                plus.classList.add('settings-plus');
                plus.innerHTML = `<line x1="50%" y1="0%" x2="50%" y2="100%"></line><line x1="0%" y1="50%" x2="100%" y2="50%"></line>`;

                settingsCont.querySelector('.plus-cont').append(plus);

                plus.style.width = getComputedStyle(settingsCont.querySelector('.jscolor')).height;
                plus.style.height = getComputedStyle(settingsCont.querySelector('.jscolor')).height;

                plus.onclick = () => {
                    const getRandColor = () =>{
                        let symbols = [1, 2, 3, 4, 5, 6, 7, 8, 9,'a','b','c','d', 'f'];
                        let result = '#';
                    
                        for (let i = 0; i < 6; i++){
                            result += symbols[getRand(0, symbols.length-1)]
                        } 
                        return result;
                    }
                    let color = getRandColor();
                    hexsColors.push(color);
                    let colorInput = document.createElement('div');
                    colorInput.classList.add('dColor-cont');
                    colorInput.innerHTML = `${hexsColors.length}. <input class='color-input' value="${color}" data-jscolor="{}">`;
                    colorInput.innerHTML = `
                    <label class="dColor-label" for="dC${hexsColors.length}">${hexsColors.length}.</label> <input id="dC${hexsColors.length}" class="dColor-input" value="${color}" data-jscolor="{}">
                    <svg class="settings-minus"><line x1="0%" y1="50%" x2="100%" y2="50%"></line></svg>`;
                    setDColorProps(colorInput.querySelector('input'))

                    settingsCont.querySelector('.plus-cont').before(colorInput);

                    jscolor.install();

                    localStorage.setItem('hexsColors', JSON.stringify(hexsColors));
                }   

                const checkSvg = `<svg id="check" xmlns="http://www.w3.org/2000/svg" class="check-svg" width="13.5" height="13.5" viewBox="0 0 2000 2000">
                    <path class="cls-2" d="M250,1045l559,760L1880,108"/>
                </svg>`;

                settingsCont.querySelectorAll('.check-input').forEach(input => {
                    let checkBox = input.nextElementSibling;

                    if(otherSettings[input.id]){
                        input.setAttribute('checked', 'true');
                        checkBox.innerHTML = checkSvg;
                    }

                    checkBox.addEventListener('click', () => {
                        input.checked = !input.checked;
                    });

                    checkBox.onclick = input.onchange = () => {
                        otherSettings[input.id] = input.checked;
                        localStorage.setItem('otherSettings', JSON.stringify(otherSettings));

                        if(input.checked){
                            checkBox.innerHTML = checkSvg;
                        }else{
                            checkBox.firstElementChild.classList.add('check-svg-beforeDelete');

                            checkBox.firstElementChild.onanimationend = () => {
                                checkBox.firstElementChild.classList.remove('check-svg-beforeDelete');
                                
                                checkBox.innerHTML = '';
                            }
                        }
                    }
                    
                    
                });

                settingsCont.querySelectorAll('.short-text-input').forEach(input => {
                    input.onchange = () => {
                        otherSettings[input.id] = +input.value;
                    }
                });

                // шрифты
                settingsCont.querySelector('#font-family').onchange = (evt) => {
                    if(settingsCont.querySelector('.font-wrong')) settingsCont.querySelector('.font-wrong').remove();
                    const loadConf = {
                        google: {
                            families: [evt.target.value],
                        },
                        timeout: 300,
                        inactive: () => {
                            let wrongFontElem = document.createElement('span');
                            wrongFontElem.innerText = 'Wrong font family';
                            wrongFontElem.className = 'font-wrong';
                            setTimeout(() => {
                                if(wrongFontElem) wrongFontElem.remove();
                            }, 10000)
                            
                            settingsCont.querySelector('.font-cont').append(wrongFontElem);
                        }, 
                        active: () => {
                            settingsCont.querySelector('.font-preview').style.fontFamily = evt.target.value;
                            font = {family: evt.target.value, size: settingsCont.querySelector('#font-size').value + 'em'};
                            // localStorage.setItem('font', JSON.stringify(font));
                        }
                    }
                    try{
                        WebFont.load(loadConf)
                    }catch(err){
                        console.log(err);
                        loadConf.inactive();
                    }
                }
                settingsCont.querySelector('#font-size').onchange = (evt) => {
                    settingsCont.querySelector('.font-preview').style.fontSize = evt.target.value + 'em';

                    font = {family: settingsCont.querySelector('#font-family').value, size: evt.target.value + 'em'};
                    localStorage.setItem('font', JSON.stringify(font));
                }

                // кнопки
                settingsCont.querySelector('.save-button').onclick = async () => {
                    try{
                        let res = await fetch('/settings/set', {
                            method: 'POST',
                            body: JSON.stringify({
                                hexsColors: hexsColors,
                                colors: colors,
                                otherSettings: otherSettings,
                                font: font
                            })
                        });
                        if(res.ok){
                            res = await res.json();
                            if(!res.success){
                                showModal('An error occurred while changing the settings');
                            }else{
                                window.location.reload();
                                localStorage.setItem('colors', JSON.stringify(colors));
                            } 
                        }else{
                            showModal('An error occurred while changing the settings', translate('ptls') + res.status);
                        }
                    }catch(err){
                        showModal('An error occurred while changing the settings', err);
                    }
                }
                settingsCont.querySelector('.settings-close').onclick = settingsCont.querySelector('.close-button').onclick = hideModal;
                settingsCont.querySelector('.reset-button').onclick = () => {
                    showAsk(() => {
                        fetch('/settings/reset').then(() => {
                            window.location.reload();
                        });
                    });
                }
                
                jscolor.install();
            }
        }
        if(document.querySelector('.loading')) document.querySelector('.loading').ontransitionend = main;

        if(!isTransEnd) main();
        
    })
})