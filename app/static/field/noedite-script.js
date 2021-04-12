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
            showModal('Critical error', 'the administrator has been notified, please try again in later');
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
        
                    hexagon.append(editedField);
                }
        
                return editedField;
            }
        
            function parseHexsFromJson(savedHexs){  
        
                if(!savedHexs.length) return []
                let parsedHexs = []
                for(let hex of savedHexs){
                    let hexagon = document.querySelector(hex.selector);
                    if(hexagon.classList.contains('hexagon-visible')) continue
                    hexagon.classList.add('hexagon-visible');
                    
                    
                    if(hex.innerText){
                        let editedField = createEditedField(hexagon); 
                        
                        editedField.innerText = hex.innerText;
                    }
                    
                    hexagon.querySelector('.hexagon-num').innerText = hex.num;
                    hexagon.style.setProperty('--bgc', hexsColors[((hex.num-1) - hexsColors.length * (Math.ceil((hex.num-1) / hexsColors.length) - 1)) - 1])
                    hexagon.chainId = hex.chainId;
                    let hexChain = getChain(hex.chainId);
                    if(!hexChain){
                        if(hex.chainId > lastChainId) lastChainId = hex.chainId;
                        hexChain = {
                            id: lastChainId,
                            hexs:[],
                        }
                        chains.push(hexChain);
                    }
                    hexChain.hexs[hex.num-1] = hexagon;
                    
                    if(hex.num == 1){
                        hexagon.classList.add('hexagon-first');
                        hexagon.style.setProperty('--bgc', colors.MAIN_C);
                    }

                    hexagon.uuid = hex.uuid;
                    
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
                <svg class="polygon"> 
                <polygon points="0,${TRIANGLE_HEIGHT} ${HEXAGON_WIDTH/2},0 ${HEXAGON_WIDTH},${TRIANGLE_HEIGHT} ${HEXAGON_WIDTH},${HEXAGON_HEIGHT-TRIANGLE_HEIGHT} ${HEXAGON_WIDTH/2},${HEXAGON_HEIGHT} 0,${HEXAGON_HEIGHT-TRIANGLE_HEIGHT}"></polygon>
                </svg>
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
                evt.preventDefault()
                zoomIndex += -(evt.deltaY/1260)

                if(zoomIndex < 0.5) zoomIndex = 0.5;
                
                hexsCont.style.top = -(hexsCont.offsetHeight - (hexsCont.offsetHeight * zoomIndex)) + 'px';
                hexsCont.style.left = -(hexsCont.offsetWidth - (hexsCont.offsetWidth * zoomIndex)) + 'px';

                hexsCont.style.transform = `scale(${zoomIndex})`
            }, {passive: false})
        
            let visibleHexs = [];
            let chains = [];
            const getChain = id => {
                for(let chain of chains){
                    if(chain && chain.id == id) return chain
                }
            }
            let lastChainId = 0;
            
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
                hexagon.querySelector('polygon').id = 'p' + ([].indexOf.call(row.children, hexagon) + 1)
                hexagon.rowId = idToNum(row.id);

                const editedField = createEditedField();
            
        
                // окно подробнее
                hexagon.about = '';
                
                if(!editedField) return;
                hexeditedFieldagon.onclick = evt => {
                    if(!hexagon.classList.contains('hexagon-visible')){
                        return
                    }
        
                    document.querySelectorAll('.contextmenu').forEach(elem => {elem.remove()});
                    
                    evt.stopPropagation();
                    hexagon.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                        inline: 'center'
                    })

                    if(hexagon.classList.contains('hexagon-active')) return
                    hexagon.classList.add('hexagon-active');
                    const clearAbouts = evt => {
                        document.querySelectorAll('.hexagon-about').forEach(elem => {
                            elem.remove();
                        });
                        document.removeEventListener('mousedown', clearAbouts);
                    }
                    clearAbouts();
    
                    let hexagonAbout = document.createElement('div');
                    hexagonAbout.className = 'hexagon-about';
    
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
                    })
    
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
                                    aboutRes.text().then(aboutContent => {
                                        content.innerHTML = hexagon.about = aboutContent;
                                        hexagonAbout.append(content);
                                        // content.innerHTML = aboutContent;

                                        const loading = hexagonAbout.querySelector('.loading');
                                        loading.style.opacity = 0;
                                        
                                        loading.ontransitionend = () => {
                                            loading.remove();
                                        }
                                    });
                                }
                            });
                        }
                        loadAbout();

                        socket.on('changeAbout' + hexagon.uuid, () => {
                            loadAbout();
                        });
                    }else{
                        content.innerHTML = hexagon.about;
                        hexagonAbout.append(content);
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
                }
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
                let res = await fetch('/hexs/' + document.title);
                if(res.ok){
                    res = await res.json();
                    parseHexsFromJson(res.body);
                }
            }catch(err){
        
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