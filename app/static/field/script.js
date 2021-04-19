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
    chainId: hex.chainId,
    userId: hex.userId
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
                        showModal('An error occurred while loading the settings', 'Please try later. The settings are set to default');
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
                document.body.style.setProperty('--hexagon-width', (HEXAGON_WIDTH -= 20) + 'px');
            }
            let size = params.size.split(/[x\sх]+/);
            const GRID_HEIGHT = size[0]; // измеряется в шестиугольниках
            const GRID_WIDTH = size[1]; // измеряется в шестиугольниках
        
            const deleteHex = hexagon => {
                let deletedHexs = [];
                const deleteHexInner = hexagon => {
                    deletedHexs.push(prepareHex(hexagon));
                    
                    hexagon.classList.remove('hexagon-visible');
                    hexagon.classList.remove('hexagon-active');
                    hexagon.classList.remove('hexagon-first');
                    hexagon.style.setProperty('--bgc', 'transparent');
                    
                    if(hexagon.querySelector('.hexagon-editedField')){
                        hexagon.querySelector('.hexagon-editedField').innerText = '';
                        hexagon.querySelector('.hexagon-editedField').remove();
                    }
                    if(hexagon.querySelector('.hexagon-about')){
                        hexagon.querySelector('.hexagon-about').remove();
                    }   
                    hexagon.about = ''
                    
                    let chain = getChain(hexagon.chainId);
                    if(+hexagon.querySelector('.hexagon-num').innerText === 1){
                        if(chain){
                            deletedHexs.concat(chain.hexs.map(prepareHex));
                
                            chain.hexs.splice(getChain(hexagon.chainId).hexs.indexOf(hexagon), 1);
                            delete chains[chains.indexOf(chain)]
                            chain.hexs.forEach(deleteHexInner);
                        } 
                    }else{
                        if(chain){
                            if(chain.hexs.indexOf(hexagon) > 0){
                                let hexsToDelete = chain.hexs.splice(chain.hexs.indexOf(hexagon) + 1, chain.hexs.length);
                                deletedHexs.concat(hexsToDelete.map(prepareHex));
                                hexsToDelete.forEach(deleteHexInner);
                            }
                        }
                    }
                    
                    delete hexagon.chainId;
            
                    hexagon.querySelector('.hexagon-num').innerText = '0';
            
                    visibleHexs = visibleHexs.filter(hex => hex != hexagon);
                }
                deleteHexInner(hexagon);
        
                return deletedHexs;
            }
        
            const createEditedField = hexagon => {
                let editedField = hexagon.querySelector('.hexagon-editedField');
                if(!editedField){
                    editedField = document.createElement('div');
                    editedField.className = 'hexagon-editedField';
                    if(isTouchDevice()) editedField.style.textDecoration = 'underline';
                    
                    editedField.onfocus = () => {    
                        editedField.innerText = editedField.innerText.trim();
                        let dataToHistory = {
                            action: 'change',
                            categ: document.title,
                            data: {
                                hex: giveHexSelector(hexagon),
                                was: {
                                    innerText: editedField.innerText,
                                }
                            }
                        }
        
                        editedField.onblur = () => {
                            editedField.setAttribute('contenteditable','false');
                            hexagon.classList.remove('hexagon-active');
                            hexagon.isFocused = false;
        
                            dataToHistory.data.became = {
                                innerText: editedField.innerText,
                            }
            
                            socket.emit('hexs', {
                                action: 'change',
                                categ: document.title,
                                data: stringifyHexs([editedField.parentElement])
                            })
                            
                            dataToHistory.data = JSON.stringify(dataToHistory.data);
                            saveToHistory(dataToHistory);
        
                            hexagon.text = editedField.innerText;
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

                editedField.onclick = evt => {
                    if(!hexagon.classList.contains('hexagon-visible') || !editedField.innerText) return;

                    document.querySelectorAll('.contextmenu').forEach(elem => {elem.remove()});
                    
                    evt.stopPropagation();

                    if(hexagon.classList.contains('hexagon-active')) return;
                    hexagon.classList.add('hexagon-active');

                    const clearAbouts = evt => {
                        document.querySelectorAll('.hexagon-about').forEach(elem => {
                            elem.remove();
                        });
                        document.removeEventListener('mousedown', clearAbouts);
                    }
                    clearAbouts();

                    const uploadChanges = () => {
                        hexagon.about = content.innerHTML;
    
                        fetch(`/hexs/${hexagon.uuid}/about/change`, {
                            method: 'POST',
                            body: hexagon.about
                        });
                    }
                    
                    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    
                    let hexagonAbout = document.createElement('div');
                    hexagonAbout.className = 'hexagon-about';
                    hexagonAbout.innerHTML = `
                    <div class="hexagon-about-controls">
                        <div>
                            <span class="hexagon-about-btn contentBtn">Content</span>
                            <span class="hexagon-about-btn imagesBtn">Images</span>
                            <span class="hexagon-about-btn commentsBtn">Comments</span>
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
                    <div id='slidr-img' class="hexagon-about-images"></div>
                    <div class="hexagon-about-comments">
                        <div class="hexagon-about-comments-cont"></div>
                        <div class="hexagon-about-comments-form">
                            <label class="hexagon-about-comments-label" for="newComment">Your comment: </label><br>
                            <textarea id="newComment" class="hexagon-about-comments-input"></textarea>
                            <div class="hexagon-about-comments-btns"><button class="send-comment">Send</button></div>
                        </div>
                    </div>`;
                    let activeAboutTab = 'content';
                    const selectActiveTab = () => {
                        if(hexagonAbout.querySelector(`.${activeAboutTab}Btn`)){
                            hexagonAbout.querySelector(`.${activeAboutTab}Btn`).style.textDecoration = 'underline';
                        }
                        if(hexagonAbout.querySelector(`.hexagon-about-${activeAboutTab}`)){
                            hexagonAbout.querySelector(`.hexagon-about-${activeAboutTab}`).style.display = 'unset';
                        }
                    }
                    
                    const content = document.createElement('div');
                    content.className = 'hexagon-about-content';
                    
                    const createImages = () => {
                        const images = hexagonAbout.querySelector('.hexagon-about-images');
                        hexagon.imgs = Array.from(content.querySelectorAll('img')).map(img => img.cloneNode(true));
                        
                        if(!hexagon.imgs || !hexagon.imgs.length) return;
                        let imgsConts = [];
                        hexagon.imgs.forEach((img, i) => {
                            let imgCont = setClassName(document.createElement('div'), 'hexagon-about-images-imgCont');
                            imgCont.append(img);

                            imgCont.setAttribute('data-slidr', ''+(i+1));
                            imgCont.style.setProperty('--num', `'pic. ${i+1}'`)
                            imgsConts.push(imgCont);
                        }); 

                        images.innerHTML = '';
                        images.append(...imgsConts);
                        
                        if(hexagon.imgs.length == 1) return
                        setTimeout(() => {
                            images.slider =  slidr.create('slidr-img', {
                                breadcrumbs: true,
                                controls: 'border',
                                direction: 'h',
                                fade: true,
                                keyboard: true,
                                overflow: true,
                                pause: false,
                                theme: colors.MAIN_C,
                                timing: { 'linear': '0.4s linear' },
                                touch: true,
                                transition: 'linear'
                            }); 
                        }, 10)  
                    }
                    const createComments = async () => {
                        const commentsElem = hexagonAbout.querySelector('.hexagon-about-comments-cont');

                        const commentsRes = await fetch(`/chains/${hexagon.chainId}/comments`);
                        if(!commentsRes.ok) return;
    
                        const comments = await commentsRes.json();
                        
                        const createComment = comment => {
                            let commentElem = setClassName(document.createElement('div'), 'hexagon-about-comment');
                            commentElem.id = 'comment' + comment.id;

                            commentElem.innerHTML = `<a href="/users/${comment.userId}" class="hexagon-about-comment-user">${comment.username}</a>:&nbsp<br>
                            <div class="hexagon-about-comment-body">${comment.body}</div>`;

                            if(comment.userId == user.userId || user.userRole == 2){
                                const deleteCommentBtn = setClassName(document.createElementNS('http://www.w3.org/2000/svg', 'svg'), 'hexagon-about-comment-close');
                                deleteCommentBtn.innerHTML = '<line x1="50%" y1="0%" x2="50%" y2="100%"></line><line x1="0%" y1="50%" x2="100%" y2="50%"></line>';
                                commentElem.append(deleteCommentBtn)
                                deleteCommentBtn.onclick = () => {
                                    fetch('/chains/comments/delete/' + commentElem.id.replace('comment', ''), {
                                        method: 'DELETE'
                                    });
                                }
                            }

                            if(comment.userId == user.userId){
                                commentElem.style.setProperty('--underline-color', 'var(--main-c)')
                            }

                            if(hexagonAbout.querySelector('.hexagon-about-comments-empty')) hexagonAbout.querySelector('.hexagon-about-comments-empty').remove();
                            commentsElem.append(commentElem)
                        }
                        if(!comments || !comments.length){
                            commentsElem.innerHTML = '<h3 class="hexagon-about-comments-empty">No comments</h3>';
                        }else{
                            comments.forEach(createComment)
                        }

                        socket.on('newComment' + hexagon.chainId, (data) => {
                            try{

                                createComment(JSON.parse(data))
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

                    if(!hexagon.about){
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
                            fetch(`/hexs/${hexagon.uuid}/about`).then(aboutRes => {
                                if(aboutRes.ok){
                                    aboutRes.text().then(async aboutContent => {
                                        hexagonAbout.querySelectorAll('.hexagon-about-content').forEach(elem => elem.remove());
                                        content.innerHTML = hexagon.about = aboutContent;
                                        hexagonAbout.append(content);
                                        
                                        createImages();
                                        
                                        
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
                            });
                        }
                        loadAbout();

                        socket.on('changeAbout' + hexagon.uuid, (data) => {
                            if(JSON.parse(data).userId == JSON.parse(sessionStorage.getItem('user') || '{}').userId) return ;
                            loadAbout();
                        });
                    }else{
                        content.innerHTML = hexagon.about;
                        hexagonAbout.append(content);
                        selectActiveTab();
                        createImages();
                    }

                    fetch(`/chains/${hexagon.chainId}/rating`).then(async rating =>{
                        if(rating.ok){
                            rating = await rating.json()
                            hexagonAbout.querySelector('.hexagon-about-rating-num').innerText = rating.num;
                            hexagonAbout.allowedChange = rating.allowedChange;
                            if(rating.allowedChange == -1){
                                hexagonAbout.querySelector('.rating-plus').style.opacity = 0;
                                hexagonAbout.querySelector('.rating-plus').style.pointerEvents = 'none';
                            }else if(rating.allowedChange == 1){
                                hexagonAbout.querySelector('.rating-minus').style.opacity = 0;
                                hexagonAbout.querySelector('.rating-minus').style.pointerEvents = 'none';
                            } 
                        } 
                    });
                    createComments();

                    hexagonAbout.addEventListener('dragover', (evt) => {
                        evt.preventDefault();
                        hexagonAbout.classList.add('hexagon-about-drag');
                    }, {passive: false});
                    
                    hexagonAbout.addEventListener('drop', (evt) => {
                        hexagonAbout.classList.remove('hexagon-about-drag');
                        if(!window.FileReader){
                            showModal('Cannot upload file', 'Your browser don\'t support files uploads');
                            return;
                        }
                        const MAX_SIZE = 3000000;
                        const EXTENTIONS = ['png', 'jpg', 'jpeg', 'gif'];

                        evt.preventDefault();

                        if(evt.dataTransfer.files.length > 1){
                            showModal('Drag one file');
                            return
                        }
                        
                        let file = evt.dataTransfer.files[0];
                        
                        if(!EXTENTIONS.map(ext => `image/${ext}`).includes(file.type)){
                            showModal('Wrong file format', `Please drag file with one of these extentions:\n ${EXTENTIONS.map(ext => ext.toUpperCase()).join(', ')}`);
                            return;
                        }
                        if(file.size > MAX_SIZE){
                            showModal('Big file', 'Max file size is ' + MAX_SIZE / 1000000 + 'MB')
                        }

                        // let image = setClassName(document.createElement('img'), 'hexagon-about-image');
                        let image = document.createElement('img')

                        const reader = new FileReader();
                        reader.readAsDataURL(file)
                        reader.onload = (evt) => {
                            image.setAttribute('src', evt.target.result);
                            createImages();
                        }
                        
                        content.append(image);

                        content.setAttribute('contenteditable','true');
                        content.focus();
                        uploadChanges();
                    }, {passive: false});
                    
                    hexagonAbout.ondragleave = () => {
                        hexagonAbout.classList.remove('hexagon-about-drag');
                    }
    
                    const deleteObserver = new MutationObserver((mList) => {
                        mList.forEach(mutation => {
                            if(Array.from(mutation.removedNodes).includes(hexagonAbout)){
                                hexagon.classList.remove('hexagon-active');
                            }
                        });
                    });
                    deleteObserver.observe(hexagon, {
                        childList: true
                    });

                    const clearStyles = node => {
                        if(node.style){
                            node.style.cssText = '';

                            if(node.hasChildNodes()){
                                Array.from(node.childNodes).forEach(clearStyles);
                            }
                        }
                    }
                    const insertObserver = new MutationObserver((mList) => {
                        mList.forEach(mutation => {
                            mutation.addedNodes.forEach(node => {
                                clearStyles(node);

                                if(node.nodeName == 'IMG') node.setAttribute('draggable', 'false');
                            });

                            
                        });
                    });
                    insertObserver.observe(content, {
                        childList: true,
                        subtree: true
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
                            hexagonAbout.querySelector(`.hexagon-about-${activeAboutTab}`).style.cssText = '';
                        }
                        activeAboutTab = newTabName;
                        selectActiveTab();
                    }
                    hexagonAbout.addEventListener('click', (evt) => {
                        if(evt.target.classList.contains('hexagon-about-btn')){
                            const btn = evt.target;
                            changeTab(btn.classList[1].replace('Btn', ''));

                            let currentBlock = hexagonAbout.querySelector(`.hexagon-about-${activeAboutTab}`);
                            if(activeAboutTab == 'images'){
                                if(!hexagon.imgs || !hexagon.imgs.length) return;
                                currentBlock.style.setProperty('--about-image-width', hexagonAbout.offsetWidth <= hexagon.imgs[0].width ? `calc(100% - 20px)` : `100%`);
                                
                                currentBlock.style.height = Math.max(...hexagon.imgs.map(img => img.height)) + 'px';
                                currentBlock.style.setProperty('--imgCont-height', Math.max(...hexagon.imgs.map(img => img.height)) + 'px');
                                currentBlock.style.display = 'block';
                                
                                try{
                                    if(currentBlock.slider) currentBlock.slider.start('1');
                                }catch(err){
                                    console.log(err);
                                }
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
                                res = await res.json()
                                
                                const plus = hexagonAbout.querySelector('.rating-plus');
                                const minus = hexagonAbout.querySelector('.rating-minus');
                                if(res.success){
                                    if(res.change == -1){
                                        minus.style.opacity = 0;
                                        minus.style.pointerEvents = 'null';
                                        
                                        plus.style.opacity = 1;
                                        plus.style.pointerEvents = 'auto';
                                    }else if(res.change == 1){
                                        plus.style.opacity = 0;
                                        plus.style.pointerEvents = 'null';

                                        minus.style.opacity = 1;
                                        minus.style.pointerEvents = 'auto';
                                    }else if(res.change == 0){
                                        [minus, plus].forEach(b => {
                                            b.style.opacity = 1;
                                            b.style.pointerEvents = 'auto';
                                        });
                                    }
                                    num.innerText = res.num
                                }else{
                                    change = 0;
                                }
                            });

                            if(num.innerText == 0) return;
                            // btn.style.opacity = 0;
                            // btn.style.pointerEvents = 'none';
                        }else if(evt.target.classList.contains('send-comment')){
                            const input = hexagonAbout.querySelector('#newComment');
                            if(!input || !input.value) return;

                            fetch(`/chains/${hexagon.chainId}/comments/new`, {
                                method: 'POST',
                                body: JSON.stringify({
                                    body: input.value,
                                })
                            }).then(() => {
                                input.value = '';
                            });
                        }
                    });

                    content.onfocus = () => {
                        content.onblur = () => {
                            content.setAttribute('contenteditable','false');
                            uploadChanges();
                        }
                    }
                    
                    content.addEventListener('dblclick', evt => {
                        evt.preventDefault();
                        evt.stopPropagation();
    
                        const range = document.createRange();
                        range.selectNodeContents(content);
                        range.collapse(true);
                        const sel = window.getSelection();
                        sel.removeAllRanges();
                        sel.addRange(range);
    
                        content.setAttribute('contenteditable','true');
                        
                        content.focus();
                    });

                    content.onkeypress = evt => {
                        if(evt.key == 'enter' && evt.metaKey || evt.ctrlKey){
                            content.blur();
                        }
                    } 

                    
                    hexagon.append(hexagonAbout);
    
                    const checkHexVisibility = (r, h) => document.querySelector(`#r${r} #h${h}`) ? document.querySelector(`#r${r} #h${h}`).classList.contains('hexagon-visible') : false;
                    let rId = hexagon.rowId;
                    let hId = +hexagon.id.replace('h', '');
    
                    if(checkHexVisibility(rId, hId + 1) && checkHexVisibility(rId, hId - 1)){
                        if(hexagon.parentElement.classList.contains('row-moved')){
                            if(checkHexVisibility(rId - 1 , hId) || checkHexVisibility(rId - 1, hId + 1)){
                                hexagonAbout.style.top = (HEXAGON_HEIGHT + 5) + 'px';
                            }else if(checkHexVisibility(rId + 1, hId) || checkHexVisibility(rId + 1, hId + 1)){
                                hexagonAbout.style.top = '-' + (+getComputedStyle(hexagonAbout).height.replace('px', '')  + 5) + 'px';
                            }else{
                                hexagonAbout.style.top = (HEXAGON_HEIGHT + 5) + 'px';
                            }
                        }else{
                            if(checkHexVisibility(rId - 1 , hId) || checkHexVisibility(rId - 1, hId - 1)){
                                hexagonAbout.style.top = (HEXAGON_HEIGHT + 5) + 'px';
                            }else if(checkHexVisibility(rId + 1, hId) || checkHexVisibility(rId + 1, hId - 1)){
                                hexagonAbout.style.top = '-' + (+getComputedStyle(hexagonAbout).height.replace('px', '')  + 5) + 'px';
                            }else{
                                hexagonAbout.style.top = (HEXAGON_HEIGHT + 5) + 'px';
                            }
                        }
                    }else if(checkHexVisibility(rId, hId + 1)){
                        hexagonAbout.style.left = '-' + (+getComputedStyle(hexagonAbout).width.replace('px', '')  + 7.5) + 'px';
                    }else if(checkHexVisibility(rId, hId - 1)){
                        hexagonAbout.style.left = (HEXAGON_WIDTH + 7.5) + 'px'
                    }else{
                        if(hexagon.parentElement.classList.contains('row-moved')){
                            if(checkHexVisibility(rId + 1, hId) && checkHexVisibility(rId + 1, hId+ 1)){
                                hexagonAbout.style.top = '-' + (+getComputedStyle(hexagonAbout).height.replace('px', '')  + 5 - TRIANGLE_HEIGHT) + 'px';
                                if(checkHexVisibility(rId - 1, hId)){
                                    hexagonAbout.style.bottom = 0
                                    hexagonAbout.style.left = (HEXAGON_WIDTH + 7.5) + 'px'
                                }else if(checkHexVisibility(rId - 1, hId + 1)){
                                    hexagonAbout.style.bottom = 0
                                    hexagonAbout.style.left = '-' + (+getComputedStyle(hexagonAbout).width.replace('px', '')  + 7.5) + 'px';
                                }else{
                                    hexagonAbout.style.left = (HEXAGON_WIDTH + 7.5) + 'px'
                                }
                            }else if(checkHexVisibility(rId + 1, hId)){
                                hexagonAbout.style.left = (HEXAGON_WIDTH + 7.5) + 'px'
                            }else if(checkHexVisibility(rId + 1, hId + 1)){
                                hexagonAbout.style.left = '-' + (+getComputedStyle(hexagonAbout).width.replace('px', '')  + 7.5) + 'px';
                            }else{
                                hexagonAbout.style.left = (HEXAGON_WIDTH + 7.5) + 'px'
                            }
                        }else{
                            if(checkHexVisibility(rId + 1, hId - 1) && checkHexVisibility(rId + 1, hId)){
                                hexagonAbout.style.top = '-' + (+getComputedStyle(hexagonAbout).height.replace('px', '')  + 5 - TRIANGLE_HEIGHT) + 'px';
                                if(checkHexVisibility(rId - 1, hId)){
                                    hexagonAbout.style.bottom = 0
                                    hexagonAbout.style.left = (HEXAGON_WIDTH + 7.5) + 'px'
                                }else if(checkHexVisibility(rId - 1, hId + 1)){
                                    hexagonAbout.style.bottom = 0
                                    hexagonAbout.style.left = '-' + (+getComputedStyle(hexagonAbout).width.replace('px', '')  + 7.5) + 'px';
                                }else{
                                    hexagonAbout.style.left = (HEXAGON_WIDTH + 7.5) + 'px'
                                }
                            }else if(checkHexVisibility(rId + 1, hId - 1)){
                                hexagonAbout.style.left = (HEXAGON_WIDTH + 7.5) + 'px'
                            }else if(checkHexVisibility(rId + 1, hId)){
                                hexagonAbout.style.left = '-' + (+getComputedStyle(hexagonAbout).width.replace('px', '')  + 7.5) + 'px';
                            }else{
                                hexagonAbout.style.left = (HEXAGON_WIDTH + 7.5) + 'px'
                            }
                        }
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

            let hexPath = `M 0 ${TRIANGLE_HEIGHT} L ${HEXAGON_WIDTH/2} 0 L ${HEXAGON_WIDTH} ${TRIANGLE_HEIGHT} L ${HEXAGON_WIDTH} ${HEXAGON_HEIGHT-TRIANGLE_HEIGHT} L ${HEXAGON_WIDTH/2} ${HEXAGON_HEIGHT} L 0 ${HEXAGON_HEIGHT-TRIANGLE_HEIGHT} Z`;
            if(otherSettings.rounded){
                hexPath = roundPathCorners(hexPath, .05, true);
            }
            
            const setHexVisible = hexagon => {
                hexagon.style.transition = 'inherit';
                hexagon.style.opacity = 1;
                hexagon.classList.add('hexagon-visible');
                
                if(hexagon.querySelector('.polygon')) return;
                
                hexagon.innerHTML += `<svg class="polygon"> 
                <path d="${hexPath}"></path>
                </svg>`;
            }
            function parseHexsFromJson(savedHexs){    
                if(!savedHexs.length) return [];
        
                let parsedHexs = [];
                for(let hex of savedHexs){
                    let hexagon = document.querySelector(hex.selector);
                    if(hexagon.classList.contains('hexagon-visible')) continue;
                    setHexVisible(hexagon);      
                    
                    if(hex.innerText){
                        let editedField = createEditedField(hexagon); 
                        
                        editedField.innerText = hex.innerText;
                    }
        
                    // if(hex.about){
                    //     hexagon.about = hex.about
                    // }
                    
                    hexagon.querySelector('.hexagon-num').innerText = hex.num;
                    hexagon.style.setProperty('--bgc', hexsColors[((hex.num-1) - hexsColors.length * (Math.ceil((hex.num-1) / hexsColors.length) - 1)) - 1]);
                    
                    if(hex.num == 1){
                        hexagon.classList.add('hexagon-first');
                        hexagon.style.setProperty('--bgc', colors.MAIN_C);
                    }

                    ['chainId', 'userId', 'username', 'creationDate', 'uuid'].forEach(prop => {
                        hexagon[prop] = hex[prop];
                    });

                    visibleHexs.push(hexagon);
                    parsedHexs.push(hexagon);   
                }
        
                return parsedHexs
            }

            function sendHexsCreationReq(hexs, needToCheckFirsts = true){
                const useResData = async data => {
                    if(!data.ok) return showModal('An error occurred while creating the hexagon', 'Please try again later. Status: ' + data.status);
                    
                    data = await data.json();
                    if(!data.success) return showModal('An error occurred while creating the hexagon', 'Please try again later');

                    data.hexs.forEach(hex => {
                        let hexToSetId = document.querySelector(hex.selector);

                        if(hexToSetId){
                            ['chainId', 'userId', 'username', 'creationDate', 'uuid'].forEach(prop => {
                                hexToSetId[prop] = hex[prop];
                            });
                        }
                    });
                }

                let firstHexs = hexs.filter(hexToCheck => hexToCheck.querySelector('.hexagon-num').innerText == 1);
                
                if(!firstHexs.length || !needToCheckFirsts){
                    fetch(`/hexs/${document.title}/new`, {
                        method: 'POST',
                        headers:{
                            'Content-Type': 'application/json'
                        },
                        body: stringifyHexs(hexs)
                    }).then(useResData);
                }else{
                    firstHexs.forEach(async firstHex => {
                        try{
                            let newChainRes = await fetch(`/chains/${document.title}/new`);
                            if(!newChainRes.ok) return showModal('An error occurred while creating the hexagon', 'Please try again later. Status: ' + newChainRes.status)
                            
                            newChainRes = await newChainRes.json();

                            if(!newChainRes.success) return showModal('An error occurred while creating the hexagon', 'Please try again later');
                            
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
                        }
                    });

                }
            }
            
            document.body.className = 'field';
            document.body.style.width = '';
            document.body.style.height = '';

            let hexsCont = document.querySelector('.hexsCont');

            hexsCont.style.opacity = 1;
            
            // создание сетки
            for(let i = 1; i <= GRID_HEIGHT; i++){
                let hexagonStr = `<div class="hexagon">
                <div class="hexagon-num">0</div>
                </div>`;
                
                let row = setClassName(document.createElement('div'), 'row');
                row.id = 'r' + i;
                if(i % 2 == 0){
                    row.classList.add('row-moved');
                }
                hexsCont.append(row);
                
                row.innerHTML = hexagonStr.repeat(GRID_WIDTH);
            }

            document.querySelector('#r2').classList.add('row-first');
            document.querySelector('#r' + GRID_HEIGHT).classList.add('row-last');
            

            document.querySelectorAll(`#r1, #r${GRID_HEIGHT}, #h1, #h${GRID_WIDTH}`).forEach(elem => {
                elem.style.pointerEvents = 'none';
            });

            if(otherSettings.turned){
                hexsCont.style.transform = 'rotate(90deg)';
                document.documentElement.style.width = 'auto';
                document.documentElement.style.height = (GRID_WIDTH * HEXAGON_WIDTH + HEXAGON_WIDTH/2) + 'px';
            }

            if(!isTouchDevice()){
                const SLIDE_SPEED = otherSettings.slideSpeed || 1.6;
                const MIN_CHANGE = 20;
                const slider = document.body;
                let isDown = false;
    
                let startX;
                let scrollLeft;
    
                let startY;
                let scrollTop;
    
                slider.addEventListener('mousedown', (e) => {
                    isDown = true;
                    setTimeout(() => {
                        if(isDown){
                            slider.classList.add('active');
                        }
                    }, 500)
                    startX = e.pageX - slider.offsetLeft;
                    scrollLeft = slider.scrollLeft;
                    
                    startY = e.pageY - slider.offsetTop;
                    scrollTop = slider.scrollTop;
                });
                slider.addEventListener('mouseleave', () => {
                    isDown = false;
                    slider.classList.remove('active');
                });
                slider.addEventListener('mouseup', () => {
                    isDown = false;
                    slider.classList.remove('active');
                });
                slider.addEventListener('mousemove', (e) => {
                    if(!isDown) return;
                    e.preventDefault();
                    const x = e.pageX - slider.offsetLeft;
                    const walkX = (x - startX) * SLIDE_SPEED; //scroll-fast
                    
                    const y = e.pageY - slider.offsetTop;
                    const walkY = (y - startY) * SLIDE_SPEED; //scroll-fast
                    if(Math.abs(walkX) > MIN_CHANGE || Math.abs(walkY) > MIN_CHANGE){
                        slider.classList.add('active');
                    } 
                    requestAnimationFrame(function scroll(){

                        slider.scrollLeft = scrollLeft - walkX;
                        slider.scrollTop = scrollTop - walkY;
                        if(isDown) requestAnimationFrame(scroll);
                    })
                });
            }
            
            let zoomIndex = 1;
            document.addEventListener('wheel', evt => {
                if(otherSettings.ctrlZoom){
                    if(!(evt.metaKey || evt.ctrlKey)) return;
                    else{
                        evt.preventDefault();
                    }
                } 
                if((document.querySelector('.settings') && document.querySelector('.settings').style.display != 'none') || document.querySelector('.hexagon-about')) return;
                document.querySelectorAll('.contextmenu').forEach(elem => {elem.remove()});
                evt.preventDefault();
                
                zoomIndex += -(evt.deltaY/1260);
                
                if(zoomIndex <= 0) zoomIndex = 0.01;

                let user = JSON.parse(sessionStorage.getItem('user') || '{}');
                if(user.userRole != 2 && zoomIndex < 0.5) return;

                hexsCont.style.top = -(hexsCont.offsetHeight - (hexsCont.offsetHeight * zoomIndex)) + 'px';
                hexsCont.style.left = -(hexsCont.offsetWidth - (hexsCont.offsetWidth * zoomIndex)) + 'px';
                hexsCont.style.transform = `scale(${zoomIndex})`;
            }, {passive: false});

        
            let visibleHexs = [];
            let chains = [];
            const getChain = id => {
                for(let chain of chains){
                    if(chain && chain.id == id) return chain
                }
            }
            
            let history = JSON.parse(localStorage.getItem('history') || '[]');
            let currentHistoryStepIndex = history.length - 1 >= 0 ? history.length - 1 : 0;
            const saveToHistory = change => {
                history.push(change);
                if(history.length > 70) history.shift();
                
                currentHistoryStepIndex = history.length - 1 >= 0 ? history.length - 1 : 0;
                localStorage.setItem('history', JSON.stringify(history));
            }
        
            document.documentElement.addEventListener('keydown', evt => {
                if(history){
                    if((evt.code == 'KeyZ' || evt.key == 'z') && (evt.ctrlKey || evt.metaKey) && !evt.shiftKey){
                        if(currentHistoryStepIndex < 0) return;
        
                        let change = history[currentHistoryStepIndex--];
                        while(change.categ != document.title){
                            if(currentHistoryStepIndex == 0) return;
                            change = history[currentHistoryStepIndex--];
                        }
                        
                        let changeData = typeof(change.data) == 'string' ?  JSON.parse(change.data || '[]') : change.data;
        
                        if(change.action == 'new'){
                            changeData.forEach(hex => {
                                deleteHex(document.querySelector(hex.selector));
                            });
                            
                            socket.emit('hexs', {
                                action: 'delete',
                                categ: document.title,
                                data: JSON.stringify(changeData.map(hex => hex.selector))
                            });
                        }else if(change.action == 'delete'){
                            let newHexs = parseHexsFromJson(changeData);
                            
                            sendHexsCreationReq(newHexs);

                        }else if(change.action == 'change'){
                            let hexagon = document.querySelector(changeData.hex);
                            
                            let editedField = createEditedField(hexagon);
                            editedField.innerText = changeData.was.innerText;
                            
                            socket.emit('hexs', {
                                action: 'change',
                                categ: document.title,
                                data: stringifyHexs([hexagon])
                            })
                        }
                        if(currentHistoryStepIndex < -1) currentHistoryStepIndex++;
                    }
                    if(((evt.code == 'KeyY' || evt.key == 'y') && (evt.ctrlKey || evt.metaKey)) || ((evt.code == 'KeyZ' || evt.key == 'z') && (evt.ctrlKey || evt.metaKey) && evt.shiftKey)){
                        if(currentHistoryStepIndex >= history.length - 1) currentHistoryStepIndex = history.length - 2;
                        
                        let change = history[++currentHistoryStepIndex];
                        while(change.categ != document.title){
                            change = history[++currentHistoryStepIndex];
                            if(currentHistoryStepIndex >= history.length - 1) return
                        }
        
                        let changeData = JSON.parse(change.data || '[]');
        
                        if(change.action == 'new'){
                            let newHexs = parseHexsFromJson(changeData);
        
                            sendHexsCreationReq(newHexs);
                        }else if(change.action == 'delete'){    
                            changeData.map(hex => document.querySelector(hex.selector)).forEach(deleteHex);
        
                            socket.emit('hexs', {
                                action: 'delete',
                                categ: document.title,
                                data: JSON.stringify(changeData.map(hex => hex.selector))
                            })
                        }else if(change.action == 'change'){
                            let hexagon = document.querySelector(changeData.hex);
                            
                            let editedField = createEditedField(hexagon);
                            editedField.innerText = changeData.became.innerText;
                            
                            socket.emit('hexs', {
                                action: 'change',
                                categ: document.title,
                                data: stringifyHexs([hexagon])
                            })
                        }
        
                        if(currentHistoryStepIndex > history.length - 1) currentHistoryStepIndex--
                    }
                }
                
                if(evt.key == '=' && (evt.ctrlKey || evt.metaKey)){
                    evt.preventDefault();
                    
                    hexsCont.style.transform = `scale(${zoomIndex += (0.1)})`
                }
                if(evt.key == '-' && (evt.ctrlKey || evt.metaKey)){
                    evt.preventDefault();
                    zoomIndex += -(0.1)
                    
                    if(zoomIndex > 0) zoomIndex = 0.01;
                    
                    let user = JSON.parse(sessionStorage.getItem('user') || '{}');
                    if(user.role != 2 && zoomIndex < 0.3) return;
    
                    hexsCont.style.transform = `scale(${zoomIndex})`
                }
    
                if(evt.code == 'Space'){
                    if(document.activeElement == document.body) evt.preventDefault();
                }
            }, {passive: false});


            if(isTouchDevice()){
                const MAX_CHANGE = 5;
                let touchIsDown = false;
                let contextMenuOpen = false;
                let startMoveX;
                let startMoveY;
                document.body.ontouchstart = (evt) => {
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
                        document.querySelectorAll('.contextmenu').forEach(elem => {elem.remove()});
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
            }
            
            document.addEventListener('click', evt => {
                document.querySelectorAll('.contextmenu').forEach(elem => {elem.remove()});
            });

            document.body.oncontextmenu = (evt) => {
                document.querySelectorAll('.contextmenu').forEach(elem => {elem.remove()});
        
                
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
        
                contextmenu.addEventListener('DOMNodeRemoved', () => {
                    hexagon.isContextmenu = false;
                });
        
                const getNeighbors = hexagon => {
                    const getTwoHexagons = (id1, id2, row) => Array.from(row.querySelectorAll(`#h${id1},#h${id2}`))
                    let row = hexagon.parentElement;
                    let hexagonNeighbors = getTwoHexagons(idToNum(hexagon.id) - 1, idToNum(hexagon.id) + 1, row);
                    if(row.classList.contains('row-moved')){
                        hexagonNeighbors.push(...getTwoHexagons(idToNum(hexagon.id), idToNum(hexagon.id) + 1, document.querySelector(`#r${idToNum(row.id)+1}`)));    
                        hexagonNeighbors.push(...getTwoHexagons(idToNum(hexagon.id), idToNum(hexagon.id) + 1, document.querySelector(`#r${idToNum(row.id)-1}`)));    
                    }else{
                        hexagonNeighbors.push(...getTwoHexagons(idToNum(hexagon.id), idToNum(hexagon.id) - 1, document.querySelector(`#r${idToNum(row.id)+1}`)));    
                        hexagonNeighbors.push(...getTwoHexagons(idToNum(hexagon.id), idToNum(hexagon.id) - 1, document.querySelector(`#r${idToNum(row.id)-1}`)));
                    }
        
                    return hexagonNeighbors;
                }
                contextmenu.onclick = null;
                
                let user = JSON.parse(sessionStorage.getItem('user'));
        
                if(!hexagon.classList.contains('hexagon-visible')){
                    let noCreate = false;
        
                    let hexVisibleNeighbors = getNeighbors(hexagon).filter(elem => elem.classList.contains('hexagon-visible'));
                    for(let hex of hexVisibleNeighbors){
                        for(let hexToCheck of hexVisibleNeighbors){
                            if(hex != hexToCheck && hex.chainId != hexToCheck.chainId) noCreate = true; 
                        }
                        if(user.userRole != 2 && getChain(hex.chainId).userId != user.userId) noCreate = true; 
                    }
                    if(noCreate){
                        contextmenu.innerHTML = 'Not here';
                    }else{
                        contextmenu.innerHTML = 'Create here';
                        
                        contextmenu.onclick = () => {
                            
                            hexagon.userId = user.userId;
                            hexagon.creationDate = (new Date()).getTime() / 1000;
                            hexagon.username = document.querySelector('.username').innerText;
                            
                            let chain;
                            let hexagonIdInChain = 0;
                            if(hexVisibleNeighbors.length){
                                
                                chain = getChain(hexVisibleNeighbors[0].chainId);
                                hexagon.chainId = chain.id;
                                chain.hexs.push(hexagon);
                                
                                chain.hexs.forEach(hex => {
                                    if(+hex.querySelector('.hexagon-num').innerText > hexagonIdInChain) hexagonIdInChain = +hex.querySelector('.hexagon-num').innerText
                                })
                                hexagon.style.setProperty('--bgc', hexsColors[(hexagonIdInChain - hexsColors.length * (Math.ceil(hexagonIdInChain / hexsColors.length) - 1)) - 1]);
                                
                                setHexVisible(hexagon);
                                visibleHexs.push(hexagon);
                            }else{
                                hexagon.chainId = 0;
                                hexagon.classList.add('hexagon-first');
                                hexagon.style.setProperty('--bgc', colors.MAIN_C);
                                hexagonIdInChain = 0;
                            }
                            
                            hexagon.querySelector('.hexagon-num').innerText = hexagonIdInChain + 1;
        
                            let dataToEmit = {
                                action: 'new',
                                categ: document.title,
                                data: stringifyHexs([hexagon])
                            }

                            sendHexsCreationReq([hexagon])

                            saveToHistory(dataToEmit);
                        }
                    }
                }else{
                    hexagon.isContextmenu = true;
                    let hexDate = new Date(hexagon.creationDate * 1000);
                    contextmenu.innerHTML = `
                    <div style="margin-bottom: 5px;" class="contextmenu-item edit">Edit</div> 
                    <div style="margin-bottom: 5px;" class="contextmenu-item copy">Copy link</div> 
                    <div class="contextmenu-item complain">Complain</div>
                    <hr class="contextmenu-line">
                    <div style="margin-bottom: 5px" class="contextmenu-item contextmenu-info">User: ${hexagon.username}</div>
                    <div style="" class="contextmenu-item contextmenu-info">Date: ${hexDate.toLocaleDateString()}</div>`;

                    if(!hexagon.userId || (user.userId == hexagon.userId) || user.userRole == 2){
                        let menuInfo = contextmenu.innerHTML;
                        contextmenu.innerHTML = `
                        <div style="margin-bottom: 5px;" class="delete-btn contextmenu-item">Delete</div>  
                        ` + menuInfo;

                    }
                    
                    if(user.userRole == 2){
                        contextmenu.innerHTML += `<div class="contextmenu-item contextmenu-info">Chain: ${hexagon.chainId}</div>`;
                    }
                    if(contextmenu.querySelector('.delete-btn')){
                        contextmenu.querySelector('.delete-btn').onclick = () => {
                            showAsk(() => {
                                let virtualVisibleHexs = [...visibleHexs];
                                let deletedHexs =  deleteHex(hexagon);
                                
                                socket.emit('hexs', {
                                    action: 'delete',
                                    categ: document.title,
                                    data: JSON.stringify(virtualVisibleHexs.filter(hex => !visibleHexs.includes(hex)).map(giveHexSelector))
                                })
                                saveToHistory({
                                    action: 'delete',
                                    categ: document.title,
                                    data: JSON.stringify(deletedHexs)
                                });
                                
                            }, '');
                        }
                    }
                    
                    contextmenu.querySelector('.complain').onclick = () => {
                        let complaint = showModal('','', true);
                        complaint.onclick = null;
                        complaint = complaint.firstElementChild;
                        complaint.classList.add('complaint');

                        complaint.innerHTML = `
                        <h1 class="complaint-title">Complaint</h1>
                        <svg class="complaint-close"><line x1="50%" y1="0%" x2="50%" y2="100%"></line><line x1="0%" y1="50%" x2="100%" y2="50%"></line></svg>
                        <div class="complaint-textarea">
                            <label for="complaint-text">Text</label> 
                            <br> 
                            <textarea id="complaint-text" autofocus maxlength="400" spellcheck="true" wrap="soft"></textarea>
                        </div>
                        <div class="btn-cont" style="display: flex;">
                            <button class="send-button">Send</button>
                            <button class="close-button">Close</button>
                        </div>
                        `;

                        complaint.querySelector('.send-button').onclick = async () => {
                            try{
                                let res = await fetch('/complaints/new', {
                                    method: 'POST',
                                    body:JSON.stringify({
                                        hexagon: {
                                            selector: giveHexSelector(hexagon),
                                            categ: document.title
                                        },
                                        text: complaint.querySelector('#complaint-text').value
                                    })
                                })

                                if(res.ok){
                                    res = await res.json();

                                    if(res.success) showModal('Your complaint has been successfully recorded', 'It will soon be reviewed by the administration');
                                    else showModal('An error occurred while recording the complaint', 'Try later');
                                }else{
                                    showModal('An error occurred while recording the complaint', 'Try later');
                                }
                            }catch(err){
                                showModal('An error occurred while sending the complaint', err);
                            }
                        };
                        complaint.querySelector('.close-button').onclick = hideModal;
                        complaint.querySelector('.complaint-close').onclick = hideModal;
                    }
                    contextmenu.querySelector('.edit').onclick = () => {
                        hexagon.dispatchEvent(new Event('dblclick'));
                    }
                    contextmenu.querySelector('.copy').onclick = () => {
                        let link = window.location.href + '?' + giveHexSelector(hexagon).replace(/\s+/, '');
                        const ifCopySuccess = () => {
                            let flash = setClassName(document.createElement('div'), 'flash');
                            flash.innerText = 'Copied';

                            document.body.append(flash);
                            setTimeout(() => {
                                flash.style.opacity = 1;
                            }, 0)
                            setTimeout(() => {
                                flash.style.opacity = 0;
                            }, 3000)
                        }
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
                                        ifCopySuccess();
                                    }else{
                                        showModal('Was not possible to copy the link');
                                    }
                                } catch (err) {
                                    showModal('Was not possible to copy the link', err);
                                }
                            
                                document.body.removeChild(textArea); 
                            }, 10)           
                        }else{
                            window.navigator.clipboard.writeText(link)
                            .then(ifCopySuccess)
                            .catch(err => {
                                showModal('Something went wrong', err);
                            });
                        }
                    }
                }
                contextmenu.style.top = evt.clientY + 'px';
                contextmenu.style.left = evt.clientX + 'px';
                document.body.append(contextmenu);
        
                return false
            }
        
            // определение свойст шестиугольника
            const setHexProps = hexagon => {
                // ид ряда и ид шестиугольника
                let row = hexagon.parentElement;
                hexagon.id = 'h' +  ([].indexOf.call(row.children, hexagon) + 1);
                // hexagon.querySelector('polygon').id = 'p' + ([].indexOf.call(row.children, hexagon) + 1)
                hexagon.rowId = idToNum(row.id);
                hexagon.text = '';
                hexagon.userId = 0;
                hexagon.username = '';
                
                hexagon.ondblclick = (evt) => {
                    let editedField = createEditedField(hexagon);
                    evt.preventDefault();
                    if(!hexagon.classList.contains('hexagon-visible')){
                        return
                    }
                    hexagon.isFocused = true;
                    hexagon.classList.add('hexagon-active');   
                    
                    
                    editedField.setAttribute('contenteditable','true');
                    editedField.focus();
                    
                }

                for(let setting in otherSettings){
                    if(otherSettings[setting] && ['rounded', 'bordered', 'turned', 'innerNum'].includes(setting)){
                        hexagon.classList.add('hexagon-' + setting);
                    }
                }
        
                hexagon.about = '';
                hexagon.imgs = [];
            }
            document.querySelectorAll('.hexagon').forEach(setHexProps);
            
            const backup = () => {
                localStorage.setItem('userScroll-' + document.title, JSON.stringify({x: document.body.scrollLeft, y: document.body.scrollTop}));
                
            }
            window.onunload = backup;
            window.addEventListener('beforeunload', (evt) => {
                backup();
                return false
            })
            
            window.onerror = () => {
                backup();
            };
            
            document.querySelector('.clear.clear-histoty').onclick = () => {
                localStorage.setItem('history', '[]');
                history = [];
            }
            document.querySelector('.back').addEventListener('click', () => {
                sessionStorage.clear();
            })
            
            socket.on('hexs', (data) => {
                if(data.categ != document.title) return;
                
                data.body = JSON.parse(data.body || '[]');
                
                if(data.action == 'new'){
                    parseHexsFromJson(data.body);
                }else if(data.action == 'delete'){
                    data.body.map(selector => document.querySelector(selector)).forEach(deleteHex);
                }else if(data.action == 'change'){
                    data.body.forEach(hex => {
                        let hexagon = document.querySelector(hex.selector);
                        let editedField = createEditedField(hexagon);
                        
                        editedField.innerText = hex.innerText;
                    })
                }
            })
            
            if(window.location.href.split('?#r')[1]){
                let selector = window.location.href.split('?')[1];
                let isFromSearch = selector.includes('%20');
                selector = selector.replace(/\s+/g, '').replace('%20', '').split(/#/).filter(s => s);

                let foundedHex = document.querySelector(`#${selector[0]} #${selector[1]}`);
                
                // window.scrollTo(foundedHex.offsetLeft - (document.documentElement.clientWidth - foundedHex.offsetWidth/2) / 2, 0);
                // foundedHex.scrollIntoView(true)
                // window.scrollBy(0, -(document.documentElement.clientHeight - foundedHex.offsetHeight/2)/2);

                foundedHex.scrollIntoView({
                    block: 'center',
                    inline: 'center'
                })
                
                foundedHex.classList.add('founded-polygon');
                
                setTimeout(() => {
                    foundedHex.classList.remove('founded-polygon');
                    if(isFromSearch) window.location.href = window.location.href.replace(window.location.href.split('?')[1], '#no-elem');
                }, 4000)
                
            }else{
                let scrollCoords = JSON.parse(localStorage.getItem('userScroll-' + document.title) || `{"x": ${document.body.scrollWidth / 2}, "y":  ${document.body.scrollHeight / 2}}`);
                document.body.scrollLeft = scrollCoords.x;
                document.body.scrollTop = scrollCoords.y;
            }

            try{
                let res = await fetch('/chains/' + document.title);
                if(!res.ok) return showModal('An error occurred when loading hexagons', 'Please try later. Status: ' + res.status);
                res = await res.json();
                
                sessionStorage.setItem('user', JSON.stringify({
                    userId: res.userId,
                    userRole: res.userRole
                }));

                for(let chain of res.body){
                    chain.hexs = parseHexsFromJson(chain.hexs); 
                    chains.push(chain)
                }
            }catch(err){
                showModal('An error occurred when loading hexagons', err);
            }

            // настройки  
            document.querySelector('.settings-button').onclick = () => {
                document.querySelector('.modal').onclick = null;
                let settingsCont = showModal('', '', true).firstElementChild;
                settingsCont.classList.add('settings');

                settingsCont.innerHTML = `
                <h1 class="settings-title">Settings</h1>
                <svg class="settings-close"><line x1="50%" y1="0%" x2="50%" y2="100%"></line><line x1="0%" y1="50%" x2="100%" y2="50%"></line></svg>
                <div class="settings-cont">
                    <div class="colors">
                        <h2 class="settings-title">Theme colors</h2>
                        <div class="settings-grid colors"></div>
                    </div>
                    <div class="hexs-dColors">
                        <h2 class="settings-title">Hexagon colors</h2>
                        <div class="settings-grid dColors"></div>
                    </div>
                    <div class="font">
                        <h2 class="settings-title">Font</h2>
                        <div class="font-cont">
                            <span class="font-input-cont"><label for="font-family">Family from <a target="_blank" href="https://fonts.google.com/">Google</a></label>:&nbsp<input type="text" id="font-family" value="${font.family}"></span>
                            <span class="font-input-cont"><label for="font-size">Size</label>:&nbsp<input type="text" id="font-size" value="${font.size.replace('em', '')}"></span>
                        </div>
                        <div class="font-preview">
                        <h3 style="font-family: inherit; margin: 10px 0">Font settings example</h3>
                        <p style="font-family: inherit; margin: 0; max-width: 500px; white-space: pre-wrap;">Lorem ipsum dolor sit amet, consectetur adipisicing elit. Nulla consequatur ullam beatae laudantium eveniet voluptatum facere impedit repudiandae amet laboriosam.</p>
                        </div>
                    </div>
                    <div class="other">
                        <h2 class="settings-title">Other</h2>
                        <div class="other-cont">
                            <div class="rounded-cont check-cont"><label class="check-label" for="rounded">Rounded corners</label><input class="check-input" type="checkbox" id="rounded"><div class="check-custom"></div></div>
                            <div class="bordered-cont check-cont"><label class="check-label" for="bordered">Borders</label><input class="check-input" type="checkbox" id="bordered"><div class="check-custom"></div></div>
                            <!-- <div class="turned-cont check-cont"><label class="check-label" for="turned">Turned hexagons (beta)</label><input class="check-input" type="checkbox" id="turned"><div class="check-custom"></div></div> -->
                            <div class="innerNum-cont check-cont"><label class="check-label" for="innerNum">Inner numeration</label><input class="check-input" type="checkbox" id="innerNum"><div class="check-custom"></div></div>
                            <div class="hideBtns-cont check-cont"><label class="check-label" for="hideBtns">Always hide buttons</label><input class="check-input" type="checkbox" id="hideBtns"><div class="check-custom"></div></div>
                            <div class="ctrlZoom-cont check-cont"><label class="check-label" for="ctrlZoom">Zoom with ctrl button</label><input class="check-input" type="checkbox" id="ctrlZoom"><div class="check-custom"></div></div>
                            <div class="slideSpeed-cont check-cont short-text-cont"><label class="check-label" for="slideSpeed">Slide speed</label><input class="short-text-input" type="text" value="${otherSettings.slideSpeed}" id="slideSpeed"></div>
                        </div>
                    </div>
                </div>
                <div class="btn-cont" style="display: flex;">
                    <button class="save-button">Save</button>
                    <button class="close-button">Close</button>
                </div>
                `;


                for(let color in colors){
                    settingsCont.querySelector('.settings-grid.colors').innerHTML += `<div><label for="${color}">${color}: </label><br> <input id="${color}" class="color-input" value="${colors[color]}" data-jscolor="{}"></div>`
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
                const setDColorProps = input => {
                    let num = +input.previousElementSibling.innerText.replace('.', '') - 1;

                    input.onchange = () => {
                        hexsColors[num] = input.value;
                        localStorage.setItem('hexsColors', JSON.stringify(hexsColors));
                    }
                    
                    let minus = input.nextElementSibling;
                    minus.style.width = getComputedStyle(settingsCont.querySelector('.jscolor')).height;
                    minus.style.height = getComputedStyle(settingsCont.querySelector('.jscolor')).height;
                    
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
                                localStorage.setItem('colors', JSON.stringify(colors || '{}'));
                            } 
                        }else{
                            showModal('An error occurred while changing the settings');
                        }
                    }catch(err){
                        showModal('An error occurred while changing the settings', err);
                    }
                }
                settingsCont.querySelector('.settings-close').onclick = settingsCont.querySelector('.close-button').onclick = hideModal;
                
                jscolor.install();
            }


            if(document.documentElement.clientWidth < 700){
                document.querySelector('.settings-button').remove()
            }

            if(document.documentElement.clientWidth < 800 || otherSettings.hideBtns){
                let userCont = document.querySelector('.user-cont');

                if(userCont){
                    userCont.remove();
                    
                    document.querySelector('.field-btns').before(userCont);
                }

                createDropMenu(document.querySelectorAll('.field-btns button'));
            }

            hexsCont.style.borderWidth = 'unset';
        }
        if(document.querySelector('.loading')) document.querySelector('.loading').ontransitionend = main;

        if(!isTransEnd) main();
        
    })
})
