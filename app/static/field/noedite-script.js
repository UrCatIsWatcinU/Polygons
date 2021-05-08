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
            const deleteHex = hexagon => {
                let deletedHexs = [];
                const deleteHexInner = hexagon => {
                    deletedHexs.push(prepareHex(hexagon));
                    
                    hexagon.classList.remove('hexagon-visible');
                    hexagon.classList.remove('hexagon-active');
                    hexagon.classList.remove('hexagon-first');
                    hexagon.style.setProperty('--bgc', 'transparent');
                    
                    ['.hexagon-editedField', '.hexagon-about', '.polygon'].forEach(s => {
                        if(hexagon.querySelector(s)){
                            if(s.innerText) s.innerText = '';
                            hexagon.querySelector(s).remove();
                        }
                    });
                    hexagon.about = '';
                    hexagon.images = [];
                    
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
        
                    hexagon.append(editedField);
                }

                editedField.onclick = evt => {
                    if(!hexagon.classList.contains('hexagon-visible') || !editedField.innerText) return;

                    document.querySelectorAll('.contextmenu').forEach(elem => {elem.remove()});
                    
                    evt.stopPropagation();

                    if(hexagon.classList.contains('hexagon-active')) return;
                    hexagon.classList.add('hexagon-active');

                    const clearAbouts = evt => {
                        document.querySelectorAll('.hexagon-about').forEach(elem => {
                            elem.parentElement.about = elem.querySelector('.hexagon-about-content').innerHTML;
                            elem.remove();
                        });
                        document.removeEventListener('mousedown', clearAbouts);
                    }
                    clearAbouts();
    
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
                            <span class="hexagon-about-rating-num">0</span>
                        </div>
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
                    
                    const content = document.createElement('div');
                    content.className = 'hexagon-about-content';
                    content.style.display = 'none';
                    
                    const createImageCont = (imgObj) => {
                        if(!imgObj || !imgObj.url) return;
                        
                        let imgCont = setClassName(document.createElement('div'), 'hexagon-about-images-imgCont');
                        const img = document.createElement('img');
                        img.setAttribute('draggable', 'false')
                        img.src = '/' + imgObj.url;
                        img.uuid = imgObj.uuid;
                        img.onerror = () => {
                            imgCont.remove();
                            hexagon.imgs = hexagon.imgs.filter(i => i.uuid != img.uuid);
                        }

                        imgCont.append(img);
                        imgCont.img = img;

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

                                                console.log(i);
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

                        const commentsRes = await fetch(`/chains/${hexagon.chainId}/comments`);
                        if(!commentsRes.ok) return;
    
                        const comments = await commentsRes.json();
                        
                        const createComment = comment => {
                            let commentElem = setClassName(document.createElement('div'), 'hexagon-about-comment');
                            commentElem.id = 'comment' + comment.id;

                            commentElem.innerHTML = `<a href="/users/${comment.userId}" class="hexagon-about-comment-user">${comment.username}:</a>&nbsp<br>
                            <div class="hexagon-about-comment-body">${comment.body}</div>`;

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
                    }
                    
                    fetch(`/chains/${hexagon.chainId}/rating`).then(async rating => {
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
    
                    const checkHexVisibility = (r, h) => document.querySelector(`#r${r} #h${h}`) ? document.querySelector(`#r${r} #h${h}`).classList.contains('hexagon-visible') : false;
                    let rId = hexagon.rowId;
                    let hId = +hexagon.id.replace('h', '');
                    
                    if(!isIOS()){
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

            const createBgHex = (hexagon, url) => {
                hexagon.querySelector('.polygon').innerHTML = `
                <mask id="hexagon-bgImg-mask">
                    <path fill="#fff" d="${hexPath}"></path>
                </mask>
                <image mask="url(#hexagon-bgImg-mask)" href="/${url}" preserveAspectRatio="xMidYMid slice" width="100%" height="100%"></image>`;
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
                    hexagon.imgs = hex.imgs ? !hex.imgs.length ? [] : hex.imgs : [];

                    if(hex.BGImg){
                        createBgHex(hexagon, hex.BGImg);
                    }

                    visibleHexs.push(hexagon);
                    parsedHexs.push(hexagon);   
                }
        
                return parsedHexs
            }
    
            
            if(!document.querySelector('.loading')) return;
            document.body.className = 'field';
            document.body.style.width = '';
            document.body.style.height = '';

            let hexsCont = document.querySelector('.hexsCont');
            hexsCont.style.opacity = 1;
            
            // document.documentElement.style.width = (GRID_WIDTH * HEXAGON_WIDTH + HEXAGON_WIDTH/2) + 'px';
            
            // создание сетки
            for(let i = 1; i <= GRID_HEIGHT; i+=2){
                let hexagonStr = `<div class="hexagon">
                <div class="hexagon-num">0</div>
                </div>`.repeat(GRID_WIDTH);
                
                hexsCont.innerHTML += `
                <div id="r${i}" class="row">${hexagonStr}</div>
                <div id="r${i+1}" class="row row-moved">${hexagonStr}</div>
                `
            }

            document.querySelector('#r2').classList.add('row-first');
            document.querySelector('#r' + GRID_HEIGHT).classList.add('row-last');
            document.querySelectorAll(`#r1, #r${GRID_HEIGHT}, #h1, #h${GRID_WIDTH}`).forEach(elem => {
                elem.style.pointerEvents = 'none';
            });

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
            
            let zoomIndex = 1;
            document.addEventListener('wheel', evt => {
                if(otherSettings.ctrlZoom){
                    if(!(evt.metaKey || evt.ctrlKey)) return;
                    else{
                        evt.preventDefault();
                    }
                } 
                document.querySelectorAll('.contextmenu').forEach(elem => {elem.remove()});
                evt.preventDefault();
                
                zoomIndex += -(evt.deltaY/1260);
                
                if(zoomIndex <= 0) zoomIndex = 0.01;


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
            
            document.addEventListener('click', evt => {
                document.querySelectorAll('.contextmenu').forEach(elem => {elem.remove()});
            })
            
            document.body.oncontextmenu = (evt) => {
                document.querySelectorAll('.contextmenu').forEach(elem => {elem.remove()});
                window.onscroll = () => {document.querySelectorAll('.contextmenu').forEach(elem => {elem.remove()});}
        
                return false
            }
        
            // определение свойст шестиугольника
            const setHexProps = hexagon => {
                // ид ряда и ид шестиугольника
                let row = hexagon.parentElement;
                hexagon.id = 'h' +  ([].indexOf.call(row.children, hexagon) + 1);
                hexagon.rowId = idToNum(row.id);

                createEditedField(hexagon);
            }
            document.querySelectorAll('.hexagon').forEach(setHexProps);
            
            const backup = () => {
                localStorage.setItem('userScroll-' + document.title, JSON.stringify({x: document.body.scrollLeft, y: document.body.scrollTop}));
            }
            window.onunload = backup;
            window.onerror = (msg) => {
                backup();
            };
            
            try{
                let res = await fetch('/chains/' + document.title);
                if(!res.ok) return showModal('An error occurred when loading hexagons', 'Please try later. Status: ' + res.status);
                res = await res.json();

                for(let chain of res.body){
                    chain.hexs = parseHexsFromJson(chain.hexs); 
                    chains.push(chain)
                }
            }catch(err){
                showModal('An error occurred when loading hexagons', err);
            }
        
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
            hexsCont.style.borderWidth = 'unset';
        }

        if(!isTransEnd) main();
    })
})