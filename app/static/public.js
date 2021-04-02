const socket = io();

function getRand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function hexToRgb(color, alpha = 1){
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
                if(++clickCount >= 1){
                    clickCount = 0;

                    hideModal();
                }
            }
        }
        
        modal.querySelector('.modal-title').innerText = title;
        modal.querySelector('.modal-body').innerText = body;
    }
    
    return modal;
}

function hideModal(){
    modal = document.querySelector('.modal');
    
    if(!modal) return

    modal.style.display = 'none';

    if(modal.querySelector('.modal-title') && modal.querySelector('.modal-body')){
        modal.querySelector('.modal-title').innerText = '';
        modal.querySelector('.modal-body').innerText = '';
    }
}

function createDropMenu(btns){
    if(btns && btns.length){
        btns = Array.from(btns);

        let dropMenu = document.createElement('div');
        dropMenu.className = 'drop-menu';

        dropMenu.innerHTML = `<svg class="drop-menu-svg" viewBox="0 0 384 277.5">
        <path
            d="m368 32h-352c-8.832031 0-16-7.167969-16-16s7.167969-16 16-16h352c8.832031 0 16 7.167969 16 16s-7.167969 16-16 16zm0 0" />
        <path id="middle-path"
            d="m368 154.667969h-352c-8.832031 0-16-7.167969-16-16s7.167969-16 16-16h352c8.832031 0 16 7.167969 16 16s-7.167969 16-16 16zm0 0" />
            <path
                d="m368 277.332031h-352c-8.832031 0-16-7.167969-16-16s7.167969-16 16-16h352c8.832031 0 16 7.167969 16 16s-7.167969 16-16 16zm0 0" />
        </svg>
        <div class="drop-menu-cont"></div>`;
        let isDropMenu = false;

        dropMenu.addEventListener('click', (evt) => {
            evt.stopPropagation();

            let cont = dropMenu.querySelector('.drop-menu-cont');

            if(!isDropMenu){
                isDropMenu = true;
                let svg = dropMenu.querySelector('.drop-menu-svg'); 

                svg.firstElementChild.style.transform = `rotate(45deg) translateY(${(277.5 - svg.firstElementChild.getBoundingClientRect().height * (384 / svg.getBoundingClientRect().height) / 2) / 2}px) scaleX(.9)`;    
                svg.lastElementChild.style.transform = `rotate(-45deg) translateY(-${(277.5 - svg.lastElementChild.getBoundingClientRect().height * (384 / svg.getBoundingClientRect().height) / 2) / 2}px) scaleX(.9)`;

                svg.lastElementChild.previousElementSibling.style.opacity = 0;
                
                cont.append(...btns);
                cont.style.opacity = 1;
                btns.forEach(btn => {
                    btn.classList.add('drop-menu-button');
                    if(btn.getBoundingClientRect().height > 30){
                        btn.style.width = 'max-content';
                    }
                });

                document.addEventListener('click', closeDropMenu);
            }else{
                closeDropMenu();
            }
            
            function closeDropMenu(){
                if(isDropMenu){
                    isDropMenu = false;
                    dropMenu.querySelectorAll('path').forEach(elem => {
                        elem.style = ''
                    })
                    cont.style.opacity = 0;
    
                    btns.forEach(btn => {
                        btn.remove();
                    });
                    document.removeEventListener('click', closeDropMenu);
                }
            }

            dropMenu.querySelector('.drop-menu-cont').style.top = (dropMenu.parentElement.getBoundingClientRect().height + 5) + 'px'
        }, {passive: false});


        btns[0].parentElement.append(dropMenu);
        btns.forEach(btn => {
            setTimeout(() => {btn.remove()}, 10)
        });


        return dropMenu;
    }
}

let otherSettings = {
    rounded: false, 
    bordered: false,
    turned: false,
    innerNum: false,
    hideBtns: false
}

let colors = {
    BODY_BGC:'#f0f0f0',
    ABOUT_BGC: '#dfdfdf',
    BLACK_C:'#333333',
    MAIN_C:'#974E9E',
    DARK_MAIN_C: '#703868',
    HEX_STROKE_C: '#333333'
}

let hexsColors = [
    '#00A9B6', '#82B034', '#FFCA56', '#FF7626', '#FB91AF'
]

let font = {
    family: 'Arial',
    size: ".98em"
};

// const savedSettings = localStorage.getItem('otherSettings');
// if(savedSettings){
//     otherSettings = JSON.parse(savedSettings);
// }

// if(localStorage.getItem('font')){
//     font = JSON.parse(localStorage.getItem('font'));
// }

// if(localStorage.getItem('hexsColors')){
//     hexsColors = JSON.parse(localStorage.getItem('hexsColors'))
// }

// if(localStorage.getItem('colors')){
//     colors = JSON.parse(localStorage.getItem('colors'));
// }
const BODY_HEIGHT = 52;
const TRIANGLE_HEIGHT = BODY_HEIGHT * (35 / 60);
const HEXAGON_HEIGHT  = TRIANGLE_HEIGHT * 2 + BODY_HEIGHT;
let HEXAGON_WIDTH = HEXAGON_HEIGHT

const main = async () => {
    let mainLogo = document.querySelector('.header-img');
    let smallLogo = document.querySelector('.header-img.small');
    if(mainLogo && smallLogo){
        if(window.innerWidth < 500){
            mainLogo.remove();
        }else{
            smallLogo.remove();
        }
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

                    localStorage.setItem('colors', JSON.stringify(settings.colors || '{}'));
                }else{
                    showModal('An error occurred while loading the settings', 'Please try later. The settings are set to default');
                }
            }
        }
    }catch(err){
        showModal('An error occurred while loading the settings', err)
    }

    if(font.family != 'Arial'){
        WebFont.load({
            google: {
                families: [font.family],
            }
        })
    }
    
    const setCSSPropsVals = () => {
        document.body.style.setProperty('--body-height', BODY_HEIGHT + 'px');
        document.body.style.setProperty('--body-bgc', colors.BODY_BGC);
        document.body.style.setProperty('--about-bgc', colors.ABOUT_BGC);
        document.body.style.setProperty('--grid-c', hexToRgb(colors.MAIN_C, 0.1));
        document.body.style.setProperty('--main-c', colors.MAIN_C);
        document.body.style.setProperty('--dark-main-c', colors.DARK_MAIN_C);
        document.body.style.setProperty('--black-c', colors.BLACK_C);
        document.body.style.setProperty('--hex-stroke-c', colors.HEX_STROKE_C);
        document.body.style.setProperty('--font', font.family);
        document.body.style.setProperty('--font-size', font.size);
    }
    setCSSPropsVals();
    
    
    window.onerror = (msg) => {
        showModal('Error', msg);
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
                if(window.location.pathname.replace(/\/?fields\//, '') == neededHex.categ){
                    let foundedHex = document.querySelector(neededHex.selector);
            
                    window.scrollTo(foundedHex.offsetLeft-(window.innerWidth - foundedHex.offsetWidth/2) / 2, 0);
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

    if(document.body){
        document.body.style.width = window.innerWidth + 'px';
        document.body.style.height = window.innerHeight + 'px';
        window.onresize = () => {
            document.body.style.width = window.innerWidth + 'px';
            document.body.style.height = window.innerHeight + 'px';
        }
    }


    if(document.querySelector('.logout')){
        document.querySelector('.logout').onclick = () => {
            window.location.href = '/logout';
            localStorage.clear();
            sessionStorage.clear();
        }
    }

    if(document.documentElement.offsetWidth < 800 || otherSettings.hideBtns){
        createDropMenu(document.querySelectorAll('.btns button'))
    }

    document.body.classList.remove('while-loading');

    let loading = document.querySelector('.loading');
    if(loading){
        loading.style.opacity = 0;
        
        loading.ontransitionend = () => {
            loading.remove()
        }
    }
}
window.addEventListener('load', main);

socket.on('reload', () => {
    window.location.href = '/'
});