const socket = io();

function getRand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const hexToRgb = (color, alpha = 1) =>  {
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
    return result ? `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})` : null;
}   

const showAsk = (yesCallback, noCallback = () => {document.querySelector('.ask').remove()}, title = 'Are you sure?', body='You will not be able to cancel this action') => {
    let ask = document.createElement('div');
    ask.className = 'ask';
    ask.innerHTML = `
    <div class="ask-content">
        <h2 class="ask-title">${title}</h2>
        <p class="ask-body">${body}</p>
        <div class="ask-btns"></div>
    </div>`;

    let yBtn = document.createElement('button');
    yBtn.innerText = 'Yes';
    let nBtn = document.createElement('button');
    nBtn.innerText = 'No';

    yBtn.addEventListener('click', yesCallback);
    yBtn.addEventListener('click', () => {document.querySelector('.ask').remove()});
    nBtn.addEventListener('click', noCallback);

    ask.querySelector('.ask-btns').append(yBtn, nBtn);

    ask.style.display = 'flex';
    document.body.append(ask);
}

function showModal(title, body, empty = false){
    let modal = document.querySelector('.modal');
    let needToClose = true;
    if(getComputedStyle(modal).display != 'none'){
        console.log(modal.style.display);
        modal.innerHTML = ''
        modal.onclick = null;
        needToClose = false;

    } 

    modal.style.display = 'flex';
    if(!empty){
        modal.innerHTML =  `
        <div class="modal-content">
            <h2 class="modal-title"></h2>
            <p class="modal-body"></p>
            <button>Close</button>
        </div>`;   

        if(needToClose){
            modal.onclick = () => {
                modal.style.display = 'none';
            
                modal.querySelector('.modal-title').innerText = '';
                modal.querySelector('.modal-body').innerText = '';
            }
        }else{
            let clickCount = 0;
            modal.onclick = () => {
                if(clickCount++ >= 1){
                    clickCount = 0;
                    modal.style.display = 'none';
                
                    modal.querySelector('.modal-title').innerText = '';
                    modal.querySelector('.modal-body').innerText = '';
                }
            }
        }
    
        modal.querySelector('.modal-title').innerText = title;
        modal.querySelector('.modal-body').innerText = body;
    }

    return modal;
}

let colors = {
    BODY_BGC:'#f0f0f0',
    ABOUT_BGC: '#dfdfdf',
    BLACK_C:'#333333',
    MAIN_C:'#974E9E',
    DARK_MAIN_C: '#703868',
}

let hexsColors = [
    '#00A9B6', '#82B034', '#FFCA56', '#FF7626', '#FB91AF'
]
if(localStorage.getItem('hexsColors')){
    hexsColors = JSON.parse(localStorage.getItem('hexsColors'))
}

if(localStorage.getItem('colors')){
    colors = JSON.parse(localStorage.getItem('colors'));
}
const BODY_HEIGHT = 52;
const TRIANGLE_HEIGHT = BODY_HEIGHT * (35 / 60);
const HEXAGON_HEIGHT  = TRIANGLE_HEIGHT * 2 + BODY_HEIGHT;
const HEXAGON_WIDTH = HEXAGON_HEIGHT

document.addEventListener('DOMContentLoaded', () => {
    document.body.style.setProperty('--body-height', BODY_HEIGHT + 'px');
    document.body.style.setProperty('--body-bgc', colors.BODY_BGC);
    document.body.style.setProperty('--about-bgc', colors.ABOUT_BGC);
    document.body.style.setProperty('--grid-c', hexToRgb(colors.MAIN_C, 0.1));
    document.body.style.setProperty('--main-c', colors.MAIN_C);
    document.body.style.setProperty('--dark-main-c', colors.DARK_MAIN_C);
    document.body.style.setProperty('--black-c', colors.BLACK_C);

    window.onerror = (msg) => {
        showModal('Произошла ошибка', msg);
    };

    if(document.querySelector('.find-button')){
        document.querySelector('.find-button').onclick = async (evt) => {
            let input = document.querySelector('.find-input').value.trim().toLowerCase();
            
            let keywords = input.split(/[,-\.:]/).filter(word => word);
            let hexs = await fetch('/hexs/all');
            
            let hexsFound = []; 
            
            let neededHex;
            
            if(hexs.ok){
                hexs = await hexs.json()
    
                let first = keywords.shift()
                for(let hex of hexs.body){
                    if(hex.innerText.toLowerCase().includes(first)){
                        hexsFound.push(hex)
                    }
                }
    
                if(hexsFound.length == 1){
                    neededHex = hexsFound[0];
                }else if(!keywords.length){
                    neededHex = hexsFound[getRand(0, hexsFound.length - 1)]
                }else{
                    hexsFound.forEach(hex => {
                        let hexChain = hexs.body.filter(hexToCheck => hexToCheck.chainId == hex.chainId && hexToCheck != hex && hexToCheck.categ == hex.categ);
    
                        for(let chainHex of hexChain){
                            if(keywords.includes(chainHex.innerText)){
                                neededHex = hex;
                                return
                            }
                        }
                    })
                }
            }
            
            if(neededHex){
                console.log(neededHex);
                if(window.location.pathname.replace(/\/?fields\//, '') == neededHex.categ){
                    let foundedHex = document.querySelector(neededHex.selector);
            
                    window.scrollTo(foundedHex.offsetLeft-(window.innerWidth - foundedHex.offsetWidth/2) / 2, 0);
                    foundedHex.scrollIntoView(true)
                    window.scrollBy(0, -(window.innerHeight - foundedHex.offsetHeight/2)/2);
                
                    foundedHex.classList.add('founded-polygon');
                    
                    setTimeout(() => {
                        foundedHex.classList.remove('founded-polygon');
                    }, 4000)  
                }else{ 
                    window.location.href = `/fields/${neededHex.categ}?${neededHex.selector.replace(/\s+/g, '')}`;
                } 
            }
        }
    }
    
    let mainLogo = document.querySelector('.header-img');
    let smallLogo = document.querySelector('.header-img.small');
    if(mainLogo && smallLogo){
        if(window.innerWidth < 500){
            mainLogo.remove();
        }else{
            smallLogo.remove();
        }
    }

    if(document.body){
        document.body.style.width = window.innerWidth + 'px';
        document.body.style.height = window.innerHeight + 'px';
        window.onresize = () => {
            document.body.style.width = window.innerWidth + 'px';
            document.body.style.height = window.innerHeight + 'px';
        }
    }
})

socket.on('reload', () => {
    window.location.href = '/'
})