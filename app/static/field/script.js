'use strict';


const setClassName = (elem, classList) => {
    elem.classList.add(classList);
    return elem
}

const idToNum = (id) => +(id.replace(/\w/, ''));

const giveHexSelector = (h) => `#r${h.rowId} #${h.id}`;
const prepareHex = hex => ({
    selector: giveHexSelector(hex),
    innerText: hex.querySelector('.hexagon-editedField') ? hex.querySelector('.hexagon-editedField').innerText : '',
    about: hex.about,
    num: +hex.querySelector('.hexagon-num').innerText,
    chainId: hex.chainId,
    userId: hex.userId
})
const stringifyHexs = hexsArr => {
    return JSON.stringify(hexsArr.map(prepareHex))
}


let paramsRes = fetch(`/categ/${document.title}/params`);

document.addEventListener('DOMContentLoaded', async () => {
    document.querySelector('.loading').style.opacity = 1;
    
    paramsRes.then(async params => {
        if(params.ok) params = await params.json()
        else{
            showModal('Critical error', 'the administrator has been notified, please try again in later');
            return
        }
        document.querySelector('.loading').style.opacity = 0;
        let isTransEnd = false;
        let main = document.querySelector('.loading').ontransitionend = async () => {
            if(isTransEnd) return   
            isTransEnd = true;

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
                    
                    editedField.onfocus = () => {    
                        editedField.innerText = editedField.innerText.trim();
                        let dataToHistory = {
                            action: 'change',
                            categ: document.title,
                            data: {
                                hex: giveHexSelector(hexagon),
                                was: {
                                    innerText: editedField.innerText,
                                    about: hexagon.about
                                }
                            }
                        }
        
                        editedField.onblur = () => {
                            editedField.setAttribute('contenteditable','false');
                            hexagon.classList.remove('hexagon-active');
                            hexagon.isFocused = false;
        
                            dataToHistory.data.became = {
                                innerText: editedField.innerText,
                                about: hexagon.about
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
        
                    if(hex.about){
                        hexagon.about = hex.about
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
        
                    hexagon.userId = hex.userId;
                    visibleHexs.push(hexagon);
                    parsedHexs.push(hexagon);   
                }
        
                return parsedHexs
            }
            
            document.body.className = 'field';
            document.body.style.width = '';
            document.body.style.height = '';
            let loadingElem = document.querySelector('.loading'); 
            if(loadingElem){ 
                loadingElem.className = 'hexsCont';
                loadingElem.innerHTML = '';
            }
            document.querySelector('.hexsCont').style.opacity = 1;
            
            document.documentElement.style.width = (GRID_WIDTH * HEXAGON_WIDTH + HEXAGON_WIDTH/2) + 'px';
            // создание сетки
            for(let i = 1; i <= GRID_HEIGHT; i+=2){
                let hexagonStr = `<div class="hexagon">
                <svg class="polygon"> 
                <polygon points="0,${TRIANGLE_HEIGHT} ${HEXAGON_WIDTH/2},0 ${HEXAGON_WIDTH},${TRIANGLE_HEIGHT} ${HEXAGON_WIDTH},${HEXAGON_HEIGHT-TRIANGLE_HEIGHT} ${HEXAGON_WIDTH/2},${HEXAGON_HEIGHT} 0,${HEXAGON_HEIGHT-TRIANGLE_HEIGHT}"></polygon>
                </svg>
                <div class="hexagon-num">0</div>
                </div>`.repeat(GRID_WIDTH);
                
                document.querySelector('.hexsCont').innerHTML += `
                <div id="r${i}" class="row" style="width:${GRID_WIDTH * HEXAGON_WIDTH}px">${hexagonStr}</div>
                <div id="r${i+1}" class="row row-moved" style="width:${GRID_WIDTH * HEXAGON_WIDTH}px">${hexagonStr}</div>
                `
            }
            document.querySelectorAll(`#r1, #r${GRID_HEIGHT}, #h1, #h${GRID_WIDTH}`).forEach(elem => {
                elem.style.pointerEvents = 'none';
            });
            
            let zoomIndex = 1;
            document.addEventListener('wheel', evt => {
                if(evt.metaKey || evt.ctrlKey){
                    evt.preventDefault();
    
                    console.log('zoom');
                    
                    zoomIndex += -(evt.deltaY/1260);
                    
                    if(zoomIndex <= 0) zoomIndex = 0.01;
    
                    let user = JSON.parse(sessionStorage.getItem('user') || '{}');
                    if(user.userRole != 2 && zoomIndex < 0.5) return;
    
                    document.querySelector('.hexsCont').style.transform = `scale(${zoomIndex})`
                }
            }, {passive: false})
        
            let visibleHexs = [];
            let chains = [];
            const getChain = id => {
                for(let chain of chains){
                    if(chain && chain.id == id) return chain
                }
            }
            let lastChainId = 0;
            
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
                        
                        let changeData = JSON.parse(change.data || '[]');
        
                        if(change.action == 'new'){
                            changeData.forEach(hex => {
                                deleteHex(document.querySelector(hex.selector));
                                
                            })
                            
                            socket.emit('hexs', {
                                action: 'delete',
                                categ: document.title,
                                data: JSON.stringify(changeData.map(hex => hex.selector))
                            })
                        }else if(change.action == 'delete'){
        
                            let newHexs = parseHexsFromJson(changeData);
                            
                            fetch(`/hexs/${document.title}/new`, {
                                method: 'POST',
                                body: stringifyHexs(newHexs)
                            })
                        }else if(change.action == 'change'){
                            let hexagon = document.querySelector(changeData.hex);
                            
                            let editedField = createEditedField(hexagon);
                            editedField.innerText = changeData.was.innerText;
                            hexagon.about = changeData.was.about;
        
                            let hexagonAbout = hexagon.querySelector('.hexagon-about')
                            if(hexagonAbout){
                                hexagonAbout.innerText = changeData.was.about;
        
                                const range = document.createRange();
                                range.selectNodeContents(hexagonAbout);
                                range.collapse(false);
                                const sel = window.getSelection();
                                sel.removeAllRanges();
                                sel.addRange(range);
                            }
                            
                            socket.emit('hexs', {
                                action: 'change',
                                categ: document.title,
                                data: stringifyHexs([hexagon])
                            })
                        }
                        if(currentHistoryStepIndex < -1) currentHistoryStepIndex++;
                    }
                    if(((evt.code == 'KeyY' || evt.key == 'y') && (evt.ctrlKey || evt.metaKey)) || ((evt.code == 'KeyZ' || evt.key == 'z') && (evt.ctrlKey || evt.metaKey) && evt.shiftKey)){
                        if(currentHistoryStepIndex >= history.length - 1) currentHistoryStepIndex = history.length - 2
        
        
                        
                        let change = history[++currentHistoryStepIndex];
                        while(change.categ != document.title){
                            change = history[++currentHistoryStepIndex];
                            if(currentHistoryStepIndex >= history.length - 1) return
                        }
        
                        let changeData = JSON.parse(change.data || '[]');
        
                        if(change.action == 'new'){
                            parseHexsFromJson(changeData);
        
                            fetch(`/hexs/${document.title}/new`, {
                                method: 'POST',
                                body: change.data
                            })
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
                            hexagon.about = changeData.became.about;
        
                            let hexagonAbout = hexagon.querySelector('.hexagon-about')
                            if(hexagonAbout){
                                hexagonAbout.innerText = changeData.became.about;
        
                                const range = document.createRange();
                                range.selectNodeContents(hexagonAbout);
                                range.collapse(false);
                                const sel = window.getSelection();
                                sel.removeAllRanges();
                                sel.addRange(range);
                            }
                            
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
                    
                    document.querySelector('.hexsCont').style.transform = `scale(${zoomIndex += (0.1)})`
                }
                if(evt.key == '-' && (evt.ctrlKey || evt.metaKey)){
                    evt.preventDefault();
                    zoomIndex += -(0.1)
                    
                    if(zoomIndex > 0) zoomIndex = 0.01;
                    
                    let user = JSON.parse(sessionStorage.getItem('user') || '{}');
                    if(user.role != 2 && zoomIndex < 0.3) return;
    
                    document.querySelector('.hexsCont').style.transform = `scale(${zoomIndex})`
                }
    
                if(evt.code == 'Space'){
                    console.log(document.activeElement);
                    if(document.activeElement == document.body)evt.preventDefault();
                    console.log('space');
                }
            }, {passive: false})
            
            document.addEventListener('click', evt => {
                document.querySelectorAll('.contextmenu').forEach(elem => {elem.remove()});
            })
            
            document.body.oncontextmenu = (evt) => {
                document.querySelectorAll('.contextmenu').forEach(elem => {elem.remove()});
                window.onscroll = () => {document.querySelectorAll('.contextmenu').forEach(elem => {elem.remove()});}
        
                
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
                    }
                    if(noCreate){
                        contextmenu.innerHTML = 'not here';
                        contextmenu.style.color = 'red'
                    }else{
                        contextmenu.innerHTML = 'create here';
                        
                        contextmenu.onclick = () => {
                            hexagon.classList.add('hexagon-visible');
        
        
                            hexagon.userId = user.userId;
                            
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
                            }else{
                                chain = {
                                    id: ++lastChainId,
                                    hexs: [hexagon]
                                }
                                chains.push(chain);
                                hexagon.chainId = lastChainId;
                                
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
                            fetch(`/hexs/${document.title}/new`, {
                                method: 'POST',
                                headers:{
                                    'Content-Type': 'application/json'
                                },
                                body: stringifyHexs([hexagon])
                            })
                            saveToHistory(dataToEmit);
        
                            visibleHexs.push(hexagon);
                        }
                    }
                }
                else{
                    if(hexagon.userId && !(user.userId == hexagon.userId) && user.userRole != 2) return false
                    contextmenu.innerHTML = 'delete';
                    hexagon.isContextmenu = true;
        
                    contextmenu.onclick = () => {
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
                hexagon.querySelector('polygon').id = 'p' + ([].indexOf.call(row.children, hexagon) + 1)
                hexagon.rowId = idToNum(row.id);
                hexagon.text = ''
                hexagon.userId = 0;
                
                hexagon.ondblclick = (evt) => {
                    evt.preventDefault()
                    if(!hexagon.classList.contains('hexagon-visible')){
                        return
                    }
                    hexagon.isFocused = true;
                    hexagon.classList.add('hexagon-active');   
                    
                    let editedField = createEditedField(hexagon);
                    
                    editedField.setAttribute('contenteditable','true');
                    editedField.focus();
                    
                }
        
                // окно подробнее
                hexagon.about = '';
        
                hexagon.onclick = evt => {
                    if(!hexagon.classList.contains('hexagon-visible')){
                        return
                    }
        
                    if(evt.metaKey || evt.ctrlKey){
                        document.querySelectorAll('.contextmenu').forEach(elem => {elem.remove()});
                        
                        evt.stopPropagation();
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
        
                        hexagonAbout.addEventListener('DOMNodeRemoved', () => {
                            hexagonAbout.blur()
                            hexagon.classList.remove('hexagon-active');
                        });
                        
                        hexagonAbout.addEventListener('mousedown', evt => {
                            evt.stopPropagation();
                        })
        
                        hexagonAbout.addEventListener('dblclick', evt => {
                            evt.preventDefault();
                            evt.stopPropagation();
        
                            const range = document.createRange();
                            range.selectNodeContents(hexagonAbout);
                            range.collapse(true);
                            const sel = window.getSelection();
                            sel.removeAllRanges();
                            sel.addRange(range);
        
                            hexagonAbout.onfocus = () => {
        
                                let dataToHistory = {
                                    action: 'change',
                                    categ: document.title,
                                    data: {
                                        hex: giveHexSelector(hexagon),
                                        was: {
                                            innerText: hexagon.text,
                                            about: hexagon.about
                                        }
                                    }
                                }
                            
                                hexagonAbout.onblur = () => {
                                    hexagonAbout.setAttribute('contenteditable','false');
                                    hexagon.about = hexagonAbout.innerText;
        
                                    dataToHistory.data.became = {
                                        innerText: hexagon.text,
                                        about: hexagon.about
                                    }
            
                                    socket.emit('hexs', {
                                        action: 'change',
                                        categ: document.title,
                                        data: stringifyHexs([hexagon])
                                    })
        
                                    dataToHistory.data = JSON.stringify(dataToHistory.data);
                                    saveToHistory(dataToHistory);
                                }
                            }
        
                            hexagonAbout.setAttribute('contenteditable','true');
                            
                            hexagonAbout.focus();
                        })
                        // hexagonAbout.oninput = evt => {
                        //     hexagon.about = hexagonAbout.innerText;
                        // }
                        hexagonAbout.onkeypress = evt => {
                            if(evt.key == 'enter' && evt.metaKey || evt.ctrlKey){
                                hexagonAbout.blur();
                            }
                        } 
                        hexagonAbout.innerText = hexagon.about;
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
            }
            document.querySelectorAll('.hexagon').forEach(setHexProps);
            
            const backup = () => {
                localStorage.setItem('userScroll', JSON.stringify({x: window.pageXOffset, y: window.pageYOffset}));
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
            
            try{
                let res = await fetch('/hexs/' + document.title);
                if(res.ok){
                    res = await res.json();
                    
                    sessionStorage.setItem('user', JSON.stringify({
                        userId: res.userId,
                        userRole: res.userRole
                    }))
                    
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
                        
                        let hexagonAbout = hexagon.querySelector('.hexagon-about')
                        if(hexagonAbout){
                            hexagonAbout.innerText = hex.about;
                            
                            const range = document.createRange();
                            range.selectNodeContents(hexagonAbout);
                            range.collapse(false);
                            const sel = window.getSelection();
                            sel.removeAllRanges();
                            sel.addRange(range);
                        }
                        hexagon.about = hex.about;
                    })
                }
            })
            
            
            if(window.location.href.split('?#r')[1]){
                let selector = window.location.href.split('?')[1];
                let isFromSearch = selector.includes('%20');
                console.log(selector);
                selector = selector.replace(/\s+/g, '').replace('%20', '').split(/#/).filter(s => s);
                // console.log(window.innerWidth);
                console.log(selector);
                let foundedHex = document.querySelector(`#${selector[0]} #${selector[1]}`);
                
                window.scrollTo(foundedHex.offsetLeft - (document.documentElement.clientWidth - foundedHex.offsetWidth/2) / 2, 0);
                foundedHex.scrollIntoView(true)
                window.scrollBy(0, -(window.innerHeight - foundedHex.offsetHeight/2)/2);
                
                foundedHex.classList.add('founded-polygon');
                
                setTimeout(() => {
                    foundedHex.classList.remove('founded-polygon');
                    if(isFromSearch) window.location.href = window.location.href.replace(window.location.href.split('?')[1], '#no-elem');
                }, 4000)
                
            }else{
                let scrollCoords = JSON.parse(localStorage.getItem('userScroll') || `{"x": ${document.body.scrollWidth / 2}, "y":  ${document.body.scrollHeight / 2}}`)
                window.scrollTo(scrollCoords.x, scrollCoords.y);
            }

            // настройки  
            document.querySelector('.settings-button').onclick = () => {
                let settingsCont = showModal('', '', true).firstElementChild;
                settingsCont.classList.add('settings');

                settingsCont.innerHTML = `
                <h1 class="settings-title">Settings</h1>
                <div class="colors">
                    <h2 class="colors-title">Theme colors</h2>
                    <div class="colors-grid colors"></div>
                    </div>
                <div class="hexs-dColors">
                    <h2 class="colors-title">Hexagon colors</h2>
                    <div class="colors-grid dColors"></div>
                </div>
                <div class="btn-cont" style="display: flex;">
                    <button class="save-button">Save</button>
                    <button class="close-button">Close</button>
                </div>
                `;


                for(let color in colors){
                    settingsCont.querySelector('.colors-grid.colors').innerHTML += `<div><label for="${color}">${color}: </label><br> <input id="${color}" class="color-input" value="${colors[color]}" data-jscolor="{}"></div>`
                }
                settingsCont.querySelectorAll('.color-input').forEach(input => {
                    input.onchange = () => {
                        colors[input.id] = input.value;

                        localStorage.setItem('colors', JSON.stringify(colors));
                    }
                })

                for(let i = 0; i < hexsColors.length; i++){
                    settingsCont.querySelector('.colors-grid.dColors').innerHTML += `
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

                settingsCont.querySelector('.colors-grid.dColors').innerHTML += `<div class="plus-cont"></div>`;

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


                settingsCont.querySelector('.save-button').onclick = () => {
                    try{
                        window.location.reload();
                    }catch(err){
                        showModal('An error occurred while changing the settings', err);
                    }
                }
                settingsCont.querySelector('.close-button').onclick = () => {
                    document.querySelector('.modal').style.display = 'none';
                }
                

                jscolor.install();
            }

            document.querySelector('.hexsCont').style.borderWidth = 'unset';
        }

        if(!isTransEnd) main();
        
    })
})
