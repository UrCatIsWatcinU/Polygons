'use strict';

const idToNum = (id) => +(id.replace(/\w/, ''));

const giveHexSelector = (h) => `#r${h.rowId} #${h.id}`;
const prepareHex = hex => ({
    selector: giveHexSelector(hex),
    innerText: hex.querySelector('.hexagon-editedField') ? hex.querySelector('.hexagon-editedField').innerText : '',
    num: +hex.querySelector('.hexagon-num').innerText,
    chainId: hex.chainId,
})
const stringifyHexs = hexsArr => {
    return JSON.stringify(hexsArr.map(prepareHex))
}


window.addEventListener('load', async () => {
    let paramsRes = fetch(`/categ/${document.title}/params`);
    
    paramsRes.then(async params => {
        if(params.ok) params = await params.json()
        else{
            showModal('Critical error', 'The administrator has been notified, please try again in later');
            return
        }
        let isTransEnd = false;
        let main = async () => {
            let size = params.size.split(/[x\sх]/);
            const GRID_HEIGHT = size[0]; // измеряется в шестиугольниках
            const GRID_WIDTH = size[1]; // измеряется в шестиугольниках
        
            const createEditedField = hexagon => {
                let editedField = hexagon.querySelector('.hexagon-editedField');
                if(!editedField){
                    editedField = document.createElement('div');
                    editedField.className = 'hexagon-editedField';
        
                    hexagon.append(editedField);
                }

                // плашка подробнее
                editedField.onclick = evt => {
                    if(!hexagon.classList.contains('hexagon-visible') || !editedField.innerText) return;
            
                    evt.stopPropagation();
            
                    if(hexagon.classList.contains('hexagon-active')) return;
                    hexagon.classList.add('hexagon-active');
            
                    const clearAbouts = () => {
                        if(hexagon.isContextmenu || document.querySelectorAll('.ask').length) return;
                        document.querySelectorAll('.hexagon-about').forEach(elem => {
                            elem.remove();
                        });
                        document.removeEventListener('mousedown', clearAbouts);
                    }
                    clearAbouts();
            
                    let hexagonAbout = document.createElement('div');
                    if(document.zoomIndex || document.zoomIndex > 1) hexagonAbout.style.transform = `scale(${1 / document.zoomIndex})`;
                    hexagonAbout.className = 'hexagon-about';
                    hexagonAbout.innerHTML = `
                    <div class="hexagon-about-controls">
                        <div class="hexagon-about-controls-btns">
                            <span class="hexagon-about-btn contentBtn">${translate('hexAbout.content')}</span>
                            <span class="hexagon-about-btn imagesBtn">${translate('hexAbout.images')}</span>
                            <span class="hexagon-about-btn commentsBtn">${translate('hexAbout.comments')}</span>
                        </div>
                        <div class="hexagon-about-rating"> 
                            <span class="hexagon-about-rating-num">0</span>
                        </div>
                    </div>
                    <div class="hexagon-about-content">
                        <div class="hexagon-about-editor"></div>
                    </div>
                    <div class="hexagon-about-images" style="display: none"></div>
                    <div class="hexagon-about-comments" style="display: none">
                        <div class="hexagon-about-comments-cont"></div>
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

                    const setUpEditor = () => {
                        let editorOptions = {
                            theme: 'snow',
                            debug: false, 
                            modules: {
                                toolbar: false
                            },
                            readOnly: true,
                        };
                        
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
                        const commentsElem = hexagonAbout.querySelector('.hexagon-about-comments-cont');
                        const createComment = (comment) => {
                            let commentElem = setClassName(document.createElement('div'), 'hexagon-about-comment');
                            commentElem.id = 'comment' + comment.id;
                            commentElem.userId = comment.userId
            
                            commentElem.innerHTML = `
                            <div class="hexagon-about-comment-userCont">
                                <a href="/users/${comment.userId}" class="hexagon-about-comment-user"></a>
                            </div>
                            <div class="hexagon-about-comment-body"></div>`;
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

                            if(hexagonAbout.querySelector('.hexagon-about-comments-empty')) hexagonAbout.querySelector('.hexagon-about-comments-empty').remove();
                            if(comment.replyToId){
                                const replyTo = hexagonAbout.querySelector(`#comment${comment.replyToId}`);
                                if(replyTo){
                                    commentElem.classList.add('hexagon-about-comment-reply');
                                    replyTo.after(commentElem);

                                    commentUser.parentElement.innerHTML += `&nbsp;
                                    <span class="hexagon-about-comment-userInReply">${translate('hexAbout.inReply')} 
                                        <a href="/users/${replyTo.userId}">${replyTo.username}</a>
                                    </span>`;

                                    return;
                                }
                            }
                            commentsElem.append(commentElem)
                        }

                        const commentsRes = await fetch(`/chains/${hexagon.chainId}/comments`);
                        if(!commentsRes.ok) return;
            
                        const comments = (await commentsRes.json()).sort((a, b) => a.id - b.id);
                        
                        if(!comments || !comments.length){
                            commentsElem.innerHTML = '<h3 class="hexagon-about-comments-empty">No comments</h3>';
                        }else{
                            hexagonAbout.comments = comments;
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
                    }else{
                        selectActiveTab();
                        
                        setTimeout(() => {
                            setUpEditor();
                        }, 0)
                    }
                    
                    fetch(`/chains/${hexagon.chainId}/rating`).then(async rating =>{
                        if(rating.ok){
                            rating = await rating.json()
                            hexagonAbout.querySelector('.hexagon-about-rating-num').innerText = rating.num ? rating.num : '0';
                        } 
                    });
                    createImages();
                    createComments();
            
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
                        }
                    });
            
                    hexagon.append(hexagonAbout);
                    
                    setHexAboutPosition(hexagon, hexagonAbout)
                    
                    document.addEventListener('mousedown', clearAbouts);
                    
                    hexagonAbout.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                        inline: 'center'
                    });
                    hexagonAbout.style.opacity = 1;
                }
        
                return editedField;
            }

            const setHexProps = hexagon => {
                hexagon.classList = 'hexagon';
                // ид ряда и ид шестиугольника
                let row = hexagon.parentElement;
                hexagon.id = 'h' +  ([].indexOf.call(row.children, hexagon) + 1 + hexagon.sectorCol * document.sectorSettings.width);
                hexagon.rowId = idToNum(row.id);

                hexagon.obj = {
                    innerText: '',
                    username: '',
                    uuid: 0,
                    chainId: 0,
                    userId: 0,
                    creationDate: 0,
                    selector: '',
                    images: [],
                    BGImg: ''
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
            }

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
            class ElHexagon extends HTMLElement{
                constructor() {
                    super();
                }
                connectedCallback() { 
                    this.sectorCol = this.getAttribute('sectorCol');
                    this.sectorRow = this.getAttribute('sectorRow');
                    setHexProps(this);
                }
            }
            
            customElements.define('el-hexagon', ElHexagon);

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
            
            if(!document.querySelector('.loading')) return;
            document.body.className = 'field';
            document.body.style.width = '';
            document.body.style.height = '';

            let hexsCont = document.querySelector('.hexsCont');
            hexsCont.style.opacity = 1;
            
            // document.documentElement.style.width = (GRID_WIDTH * hexSizes.HEXAGON_WIDTH + hexSizes.HEXAGON_WIDTH/2) + 'px';
            
            // создание сетки
            const hexPad = 6;
            const hexsContPad = 400;
            document.sectorSettings = {
                width: 16,
                height: 16,
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

            if(!isTouchDevice()){
                const SLIDE_SPEED = otherSettings.slideSpeed || 2.1;
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
            
            let zoomIndex = document.zoomIndex = 1;
            let maxScrollY = hexsCont.scrollHeight;
            const changeZoom = (change) => {
                document.zoomIndex = zoomIndex += change;
                if(zoomIndex <= 0.01) document.zoomIndex = zoomIndex = 0.01;
                
                let user = JSON.parse(sessionStorage.getItem('user') || '{}');
                if(user.userRole != 2 && zoomIndex < 0.6) document.zoomIndex = zoomIndex = 0.6;
                if(zoomIndex >= 2.5) document.zoomIndex = zoomIndex = 2.5
                
                const rectBefore = hexsCont.getBoundingClientRect();
                hexsCont.style.transform = `scale(${zoomIndex})`;
                const rectAfter = hexsCont.getBoundingClientRect();

                maxScrollY = rectAfter.height - document.documentElement.clientHeight;


                document.body.scrollTop += (rectAfter.height - rectBefore.height) * document.body.scrollTop / rectBefore.height;
                document.body.scrollLeft += (rectAfter.width - rectBefore.width) * document.body.scrollLeft / rectBefore.width;
                
                hexsCont.style.padding = (hexsContPad / zoomIndex) + 'px';
                
                const openAbout = document.querySelector('.hexagon-about')
                if(openAbout){
                    openAbout.style.transform = `scale(${1 / zoomIndex})`;
                }
            }   

            document.addEventListener('wheel', evt => {
                if(otherSettings.ctrlZoom){
                    if(!(evt.metaKey || evt.ctrlKey)) return;
                    else{
                        evt.preventDefault();
                    }
                } 
                document.querySelectorAll('.contextmenu').forEach(elem => {elem.remove()});
                evt.preventDefault();

                changeZoom(-(evt.deltaY/1260))
            }, {passive: false});
        
            let visibleHexs = [];
            let chains = [];
            const getChain = id => {
                for(let chain of chains){
                    if(chain && chain.id == id) return chain
                }
            }
            
            document.documentElement.addEventListener('keydown', evt => {
                if(evt.key == '=' && (evt.ctrlKey || evt.metaKey)){
                    evt.preventDefault();
                    
                    hexsCont.style.transform = `scale(${zoomIndex += (0.1)})`
                }
                if(evt.key == '-' && (evt.ctrlKey || evt.metaKey)){
                    evt.preventDefault();
        
                    hexsCont.style.transform = `scale(${zoomIndex += -(0.1)})`
                }
            }, {passive: false})
            
            document.body.oncontextmenu = (evt) => {
                return false
            }
            
            const backup = () => {
                localStorage.setItem('userScroll-' + document.title, JSON.stringify({x: document.body.scrollLeft, y: document.body.scrollTop}));
            }
            window.onunload = backup;
            window.onerror = (msg) => {
                backup();
            };
        
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
                let hexRow = hex.selector.match(/r\d+/);
                let hexCol = hex.selector.match(/h\d+/);

                hexRow = hexRow && Math.ceil(+hexRow[0].replace(/^\w/, '') / (document.sectorSettings.width));
                hexCol = hexCol && Math.ceil(+hexCol[0].replace(/^\w/, '') / (document.sectorSettings.height));

                console.log(hexRow, hexCol);

                return sectors[chooseRow(hexRow - 1)][hexCol - 1 >= 0 ? hexCol - 1 : 0];
            } 

            const fillSectors = () => {
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
                        s.el().dispatchEvent(new Event('sectorLoaded'))
                    }
                }
            }
            document.body.addEventListener('scroll', (evt) => {
                if(b.scrollTop > maxScrollY) b.scrollTop = maxScrollY;

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
                    const sectorEl = getSectorForHex(foundedHex).el();
                    sectorEl.scrollIntoView();
                    
                    sectorEl.addEventListener('sectorLoaded', () => {
                        console.log(foundedHex.selector);
                        const foundedElem = document.querySelector(foundedHex.selector);
                        foundedElem.scrollIntoView({
                            block: 'center',
                            inline: 'center'
                        });
                        
                        foundedElem.classList.add('founded-polygon');
                        
                        setTimeout(() => {
                            foundedElem.classList.remove('founded-polygon');
                            history.pushState(null, null, '/fields/' + document.title); 
                        history.pushState(null, null, '/fields/' + document.title); 
                            history.pushState(null, null, '/fields/' + document.title); 
                        }, 4000)
                    }, {once: true})
                    
                }else{
                    let scrollCoords = JSON.parse(localStorage.getItem('userScroll-' + document.title) || `{"x": ${document.body.scrollWidth / 2}, "y":  ${document.body.scrollHeight / 2}}`);
                    document.body.scrollTo(scrollCoords.x, scrollCoords.y);
                }
                if(document.body.scrollLeft < hexsContPad) document.body.scrollLeft = hexsContPad;
                if(document.body.scrollTop < hexsContPad) document.body.scrollTop = hexsContPad;
            });

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
        }

        if(!isTransEnd) main();
    })
})