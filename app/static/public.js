const socket = io();

translate.add({
    contextmenu:{
        create: 'Create here',
        delete: 'Delete',
        not: 'Not here',
        needFill: 'Fill previous',
        edit: 'Edit',
        send: 'Send to chat',
        copy: 'Copy link',
        move: 'Move',
        img: 'Add image',
        copyMsgs: {
            s: 'Copied',
            uns: 'Was not possible to copy the link'
        },
        complain: 'Complaint',
        user: 'Author',
        chain: 'Chain',
        uid: 'Uid',
        date: 'Date'
    },
    defaults: {
        askTitle: 'Are you sure?',
        askBody: 'You will not be able to cancel this action',
        y: 'Yes',
        n: 'No'
    },
    specific: {
        hexDeletionAskBody: 'If you delete this hexagon, all the following hexagons in the chain will be deleted along with it',
        hexDeletionAskBodyAddon: '\n\nThis is first hexagon of the chain, if you delete it, the chain and all comments to it will be deleted'
    },
    hexAbout: {
        images: 'Images',
        content: 'Content',
        comments: 'Comments',
        yourComment: 'Your comment',
        inReply: 'in reply to'
    },
    complaint: {
        text: 'Text',
        successT: 'Your complaint has been successfully recorded',
        successB: 'It will soon be reviewed by the administration'
    },
    sets: {
        h1: 'Settings',
        themeC: 'Theme colors',
        hexsC: 'Hexagons colors',
        font: 'Font',
        fontF: 'Family from',
        fontS: 'Size',
        fontEG: 'Font settings example',
        other: 'Other settings',
        check: {
            R: 'Rounded corners',
            B: 'Borders',
            T: 'Turned hexagons',
            I: 'Inner numeration',
            Z: 'Zoom with ctrl button',
            S: 'Slide speed',
            RC: 'Reverse comments',
        },
        save: 'Save',
        reset: 'Reset',
        colorTs: {
            FIELD_BGC: 'Field background',
            ABOUT_BGC: 'About background',
            HEX_FGC: 'Hexagon\'s font',
            ABOUT_FGC: 'About\'s font',
            HEX_STROKE_C: 'Hexagon stroke',
        }
    },
    subs: {
        title: 'Subscribers'
    },
    chats: {
        chooseToSend: 'Choose chat to send ',
        select: 'Select chat'
    },
    chatAbout: {
        h1: 'Chat info',
        delete: 'Delete',
        addMember: 'Add member',
        add: 'Add',
        quit: 'Quit',
        changeRoleMsg: 'Be careful when change member role, not to give authority to users you can\'t trust',
        members: 'Members',

    },
    newChat: {
        h1: 'Create chat',
        name: 'Name',
        membs: 'Members separated by comma',
        create: 'Create chat'
    },
    btns: {
        send: 'Send',
        close: 'Close'
    },
    upload: {
        cant: 'Cannot upload file',
        cantD: 'Your browser don\'t support files uploads',
        format: 'Wrong file format',
        formatD: 'Please choose file with one of these extentions',
        big: 'Big file',
        max: 'Max file size is ',
        one: 'Choose one file',
        fitstT: 'First hexagon',
        fitstD: 'You can\'t upload image to the first hexagon'
    },
    ptl: 'Please try later',
    ptls: 'Please try later. Status: '
}, 'en');

translate.add({
    contextmenu:{
        create: 'Создать',
        delete: 'Удалить',
        edit: 'Изменить',
        send: 'Отправить',
        move: 'Переместить',
        copy: 'Ссылка',
        img: 'Вставить картинку',
        complain: 'Пожаловаться',
        user: 'Автор',
        chain: 'Цепочка',
        uid: 'Uid',
        date: 'Дата',
        not: 'Не здесь',
        needFill: 'Заполните предыдущие',
        copyMsgs: {
            s: 'Ссылка скопирована',
            uns: 'Не удалось скопировать ссылку'
        },
    },
    defaults: {
        askTitle: 'Вы уверены?',
        askBody: 'Вы не сможете отменить это действие',
        y: 'Да',
        n: 'Нет'
    },
    specific: {
        hexDeletionAskBody: 'При удалении шестиугольника все следующие после него также удалятся и информация будет утерена',
        hexDeletionAskBodyAddon: '\n\nЭто первый шестиугольник в цепочке, и если вы удалите его, то все коментарии к цепочке будут удалены'
    },
    hexAbout: {
        images: 'Картинки',
        content: 'Контент',
        comments: 'Комментарии',
        yourComment: 'Ваш комментарий',
        inReply: 'в ответ'
    },
    complaint: {
        text: 'Текст жалобы',
        successT: 'Ваша жалоба успешно записана',
        successB: 'В скором времени она будет рассмотрена администрацией'
    },
    chats: {
        chooseToSend: 'Выберите чат для отправки ',
        select: 'Выберите чат'
    },
    sets: {
        h1: 'Настройки',
        themeC: 'Цвета темы',
        hexsC: 'Цвета шестиугольников',
        font: 'Шрифт',
        fontF: 'Название шрифта с ',
        fontS: 'Размер',
        fontEG: 'Пример текста с этим шрифтом',
        other: 'Остальное',
        check: {
            R: 'Закругленные края',
            B: 'Рамки',
            T: 'Повернутые шестиугольники',
            I: 'Нумерация внутри',
            Z: 'Зум только с зажатым ctrl',
            S: 'Скорость навигации',
            RC: 'Обратный порядок комментариев',
        },
        save: 'Сохранить',
        reset: 'Сбросить',
        colorTs: {
            FIELD_BGC: 'Фон поля',
            ABOUT_BGC: 'Фон "подробнее"',
            HEX_FGC: 'Шрифт в шестиугольнике',
            ABOUT_FGC: 'Шрифт в "подробнее"',
            HEX_STROKE_C: 'Обводка шестиугольников',
        }
    },
    subs: {
        title: 'Подписчики'
    },
    chatAbout: {
        h1: 'Информация о чате',
        delete: 'Удалить',
        addMember: 'Новый участник',
        add: 'Добавить',
        quit: 'Покинуть чат',
        changeRoleMsg: 'Будте аккуратны, когда меняете роль участника. Не давайте прав управления чатом людям, которым не можете доверять',
        members: 'Участники',

    },
    newChat: {
        h1: 'Новый чат',
        name: 'Название',
        membs: 'Участники, разделенные запятыми',
        create: 'Создать чат'
    },
    btns: {
        send: 'Отправить',
        close: 'Закрыть'
    },
    upload: {
        cant: 'Невозможно залить файл',
        cantD: 'Ваш браузер не поддерживает отправку файлов',
        format: 'Неподходящее расширение',
        formatD: 'Выберите файл с расширением из этого списка',
        big: 'Слишком большой файл',
        max: 'Максимальный размер файла - ',
        one: 'Выберите один файл',
        fitstT: 'Этот шестиугольник - первый',
        fitstD: 'Вы не можете добавить фоновое изображение в первый шестиугольник цепочки',
        limitT: 'Достигнут лимит',
        limitD: 'В одной цепочке может быть не больше <b>пяти</b> хексов с фоновой картинокой',
    },
    ptl: 'Пожалуйста, попробуйте позже',
    ptls: 'Пожалуйста, попробуйте позже. Статус: ',
    errors: {
        common: 'Возникла ошибка',
        loading: 'Возникла ошибка при запросе',
    }
}, 'ru');

const allowedLangs = ['ru'];
const searchParams = new URLSearchParams(window.location.search);

const savedLocale = localStorage.getItem('lang');

const currentShortLocale = !savedLocale || savedLocale === 'auto' ? window.navigator.language.split('-')[0] || searchParams.get('lang') : savedLocale;
document.documentElement.setAttribute('lang', currentShortLocale);

if(!searchParams.get('lang') && savedLocale && savedLocale != 'auto') window.location.search += `&lang=${currentShortLocale}`;

translate.setLocale(allowedLangs.includes(currentShortLocale) ? currentShortLocale : 'en');


function getRand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function hexToRgb(color, alpha = 1){
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
    return result ? `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})` : null;
} 

/** 
*    @return {HTMLElement}
*/
function setClassName(elem, classList){
    elem.classList.add(...classList.split(/[(\s+)(,\s+)]/));
    return elem
}
function isTouchDevice() {
    return ('ontouchstart' in window);
} 
function isIOS() {
    return [
      'iPad Simulator',
      'iPhone Simulator',
      'iPod Simulator',
      'iPad',
      'iPhone',
      'iPod'
    ].includes(navigator.platform)
    // iPad on iOS 13 detection
    || (navigator.userAgent.includes("Mac") && "ontouchend" in document)
}

const setCSSProps = (cssProps, prefix='', units='') => {
    for(let prop in cssProps){
        document.body.style.setProperty(`--${prefix}${prop}`, cssProps[prop] + units)
    }
}
const setHexVisible = (hexagon, num) => {
    if(num){
        hexagon.style.setProperty('--bgc', hexsColors[((num-1) - hexsColors.length * (Math.ceil((num-1) / hexsColors.length) - 1)) - 1]);
        if(num == 1){
            hexagon.classList.add('hexagon-first');
            hexagon.style.setProperty('--bgc', '');
        }
    }


    hexagon.style.transition = 'inherit';
    hexagon.classList.add('hexagon-visible');
    
    if(hexagon.querySelector('.polygon')) hexagon.querySelector('.polygon').remove();
    
    hexagon.insertAdjacentHTML('afterbegin', `<svg class="polygon"> 
    <use href="#hex-path" x="0" y="0"></use>
    </svg>`);
}

const showAsk = (yesCallback, body=translate('defaults.askBody'), title = translate('defaults.askTitle'), noCallback = () => {document.querySelector('.ask').remove()}) => {
    let ask = document.createElement('div');
    ask.className = 'ask';
    ask.innerHTML = `
    <div class="ask-content">
        <h2 class="ask-title">${title}</h2>
        <p class="ask-body">${body}</p>
        <div class="ask-btns"></div>
    </div>`;

    let yBtn = document.createElement('button');
    yBtn.innerText = translate('defaults.y');
    let nBtn = document.createElement('button');
    nBtn.innerText = translate('defaults.n');;

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
            <button>${translate('btns.close')}</button>
        </div>`;   

        if(needToClose){
            modal.onclick = () => {
                modal.style.display = 'none';
            
                modal.querySelector('.modal-title').innerHTML = '';
                modal.querySelector('.modal-body').innerHTML = '';
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
        if(currentShortLocale != 'en'){
            const titleToCheck = title.toLowerCase();
            if(titleToCheck.includes('error')){
                title = titleToCheck.includes('loading') ? translate('errors.loading') : translate('errors.common') 
            } 
        }

        modal.querySelector('.modal-title').innerHTML = title;
        modal.querySelector('.modal-body').innerHTML = body;
    }
    
    return modal;
}

const showFlash = (message) => {
    let flash = setClassName(document.createElement('div'), 'flash');
    flash.innerText = message;

    document.body.append(flash);
    setTimeout(() => {
        flash.style.opacity = 1;
    }, 0)
    setTimeout(() => {
        flash.style.opacity = 0;
    }, 3000)
}

function hideModal(){
    modal = document.querySelector('.modal');
    
    if(!modal) return

    modal.style.display = 'none';
    modal.querySelector('.modal-content').className = 'modal-content';

    if(modal.querySelector('.modal-title') && modal.querySelector('.modal-body')){
        modal.querySelector('.modal-title').innerText = '';
        modal.querySelector('.modal-body').innerText = '';
    }
}

function createDropMenu(dropMenu = null, userCont = null, attachElem = null){
    if(!dropMenu) dropMenu = document.querySelector('.drop-menu');
    if(!userCont) userCont = document.querySelector('.user-cont');


    if(dropMenu){
        let isDropMenu = false;

        const toggleDropMenu = (evt) => {
            evt.stopPropagation();
            
            if(!isDropMenu){
                isDropMenu = true;
                
                document.addEventListener('click', closeDropMenu);
                userCont.classList.add('drop-menu-opened');
            }else{
                closeDropMenu();
            }
            
            function closeDropMenu(){
                if(isDropMenu){
                    isDropMenu = false;
    
                    document.removeEventListener('click', closeDropMenu);
                }
                userCont.classList.remove('drop-menu-opened');
            }
            
            dropMenu.style.top = (dropMenu.parentElement.getBoundingClientRect().height + 5) + 'px';
        }
        
        if(userCont && !attachElem) userCont.addEventListener('click', toggleDropMenu, {passive: false});
        
        if(attachElem) userCont.addEventListener('click', (evt) => {
            if(evt.target == attachElem) toggleDropMenu(evt);
        }, {passive: false});

        return dropMenu;
    }
}

const MAX_SIZE = 3000000;
const EXTENTIONS = ['png', 'jpg', 'jpeg', 'gif'];
const uploadFile = (files, url, successCB, evt=null, filename='img') => {
    if(!window.FileReader){
        showModal(translate('upload.cant'), translate('upload.cantD'));
        return;
    }
    
    if(evt){    
        evt.preventDefault();
        evt.stopImmediatePropagation();
    }

    if(files.length > 1){
        showModal(translate('upload.one'));
        return;
    }
    
    let file = files[0];
    
    if(!EXTENTIONS.map(ext => `image/${ext}`).includes(file.type)){
        showModal(translate('upload.format'), `${translate('upload.formatD')}:\n ${EXTENTIONS.map(ext => ext.toUpperCase()).join(', ')}`);
        return;
    }

    if(file.size > MAX_SIZE){
        showModal(translate('upload.big'), translate('upload.max') + MAX_SIZE / 1000000 + 'MB');
        return
    }

    const fileForm = new FormData();
    file.arrayBuffer().then(result => {
        const blob = new Blob([result], {type: file.type});
        fileForm.append('file', blob, filename);

        fetch(url, {
            method: 'POST',
            body: fileForm
        }).then(res => {
            if(!res.ok){
                showModal('An error occurred while uploading the image', translate('ptls') + res.status);
            }else{
                return res.json()
            }
        }).then(imgUploadRes => {
            if(!imgUploadRes || !imgUploadRes.success) return showModal('An error occurred while uploading the image', translate('ptls'));
            successCB(imgUploadRes);
        });
    }); 

    return file;
}

const localTimeZoneOffset = (new Date).getTimezoneOffset() * 60;

const shortDateFormater = Intl.DateTimeFormat(currentShortLocale, {
    hour: 'numeric',
    minute: 'numeric',
});
const middleDateFormater = Intl.DateTimeFormat(currentShortLocale, {
    hour: 'numeric',
    minute: 'numeric',
    weekday: 'short'
});
const longDateFormater = Intl.DateTimeFormat(currentShortLocale, {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    weekday: 'short'
});

const tasks = [];

let otherSettings = {
    rounded: false, 
    bordered: false,
    turned: false,
    innerNum: false,
    ctrlZoom: true,
    slideSpeed: 1.6
}

let colors = {
    FIELD_BGC:'#f0f0f0',
    ABOUT_BGC: '#dfdfdf',
    ABOUT_FGC:'#333333',
    HEX_FGC: '#f0f0f0',
    HEX_STROKE_C: '#333333',
}
const defaultColors = Object.assign({}, colors);

const constColors = {
    BLACK_C:'#333333',
    WHITE_C: '#f0f0f0',
    RED_C: '#f52e2e',
    GREEN_C: '#1bb123',
    GREY_C: '#dfdfdf',
    MAIN_C:'#974E9E',
    BODY_BGC: '#f0f0f0',
    DARK_MAIN_C: '#703868',
}

let hexsColors = [
    '#00A9B6', '#82B034', '#FFCA56', '#FF7626', '#FB91AF'
]

let font = {
    family: 'Arial',
    size: ".98em"
};

let hexSizes = {
    setBodyHeight(bh){
        this.BODY_HEIGHT = bh,
        this.TRIANGLE_HEIGHT = this.BODY_HEIGHT * (35 / 60);
        this.HEXAGON_HEIGHT = this.TRIANGLE_HEIGHT * 2 + this.BODY_HEIGHT;
        this.HEXAGON_WIDTH = this.HEXAGON_HEIGHT;
    },
    setTriangleHeight(th){
        this.TRIANGLE_HEIGHT = th;
        this.HEXAGON_HEIGHT = this.TRIANGLE_HEIGHT * 2 + this.BODY_HEIGHT;
        this.HEXAGON_WIDTH = this.HEXAGON_HEIGHT;
    },

    createCSSProps(){
        const cssProps = {};
        for(let sizeProp in this){
            if(typeof(hexSizes[sizeProp]) != 'number') continue
            cssProps[sizeProp.toLowerCase().replace('_', '-')] = hexSizes[sizeProp] + 'px';
        }
        return cssProps
    }
}
hexSizes.setBodyHeight(52 * 1.5);

let hexPath = () => `M 0 ${hexSizes.TRIANGLE_HEIGHT} L ${hexSizes.HEXAGON_WIDTH/2} 0 L ${hexSizes.HEXAGON_WIDTH} ${hexSizes.TRIANGLE_HEIGHT} L ${hexSizes.HEXAGON_WIDTH} ${hexSizes.HEXAGON_HEIGHT-hexSizes.TRIANGLE_HEIGHT} L ${hexSizes.HEXAGON_WIDTH/2} ${hexSizes.HEXAGON_HEIGHT} L 0 ${hexSizes.HEXAGON_HEIGHT-hexSizes.TRIANGLE_HEIGHT} Z`;

/**
 * @param {HTMLElement} hexagon 
 * @param {HTMLElement} hexagonAbout 
 */
const setHexAboutPosition = (hexagon, hexagonAbout) => {
    hexagonAbout.addEventListener('dblclick', evt => {
        evt.stopPropagation();
    }, {passive: false})
    const checkHexVisibility = (r, h) => document.querySelector(`#r${r} #h${h}`) ? document.querySelector(`#r${r} #h${h}`).classList.contains('hexagon-visible') : false;
    let rId = hexagon.rowId;
    let hId = +hexagon.id.replace('h', '');
    const localHexSizes = {};
    for(let p in hexSizes){
        if(typeof(hexSizes[p]) == 'number') localHexSizes[p] = hexSizes[p] * (1 / document.zoomIndex);
    }

    const pads = {
        top: (5 + (document.hexPad || 0)) * (1 / document.zoomIndex),
        side: (7.5 + (document.hexPad || 0)) * (1 / document.zoomIndex)
    }
    if(document.zoomIndex && document.zoomIndex != 1) hexagonAbout.style.transform = `scale(${1 / document.zoomIndex})`;

    if(checkHexVisibility(rId, hId + 1) && checkHexVisibility(rId, hId - 1)){
        if(hexagon.parentElement.classList.contains('row-moved')){
            if(checkHexVisibility(rId - 1 , hId) || checkHexVisibility(rId - 1, hId + 1)){
                hexagonAbout.style.top = (localHexSizes.HEXAGON_HEIGHT + pads.top) + 'px';
            }else if(checkHexVisibility(rId + 1, hId) || checkHexVisibility(rId + 1, hId + 1)){
                hexagonAbout.style.top = '-' + (+getComputedStyle(hexagonAbout).height.replace('px', '')  + pads.top) + 'px';
            }else{
                hexagonAbout.style.top = (localHexSizes.HEXAGON_HEIGHT + pads.top) + 'px';
            }
        }else{
            if(checkHexVisibility(rId - 1 , hId) || checkHexVisibility(rId - 1, hId - 1)){
                hexagonAbout.style.top = (localHexSizes.HEXAGON_HEIGHT + pads.top) + 'px';
            }else if(checkHexVisibility(rId + 1, hId) || checkHexVisibility(rId + 1, hId - 1)){
                hexagonAbout.style.top = '-' + (+getComputedStyle(hexagonAbout).height.replace('px', '')  + pads.top) + 'px';
            }else{
                hexagonAbout.style.top = (localHexSizes.HEXAGON_HEIGHT + pads.top) + 'px';
            }
        }
    }else if(checkHexVisibility(rId, hId + 1)){
        hexagonAbout.style.left = '-' + (+getComputedStyle(hexagonAbout).width.replace('px', '')  + pads.side) + 'px';
    }else if(checkHexVisibility(rId, hId - 1)){
        hexagonAbout.style.left = (localHexSizes.HEXAGON_WIDTH + pads.side) + 'px'
    }else{
        if(hexagon.parentElement.classList.contains('row-moved')){
            if(checkHexVisibility(rId + 1, hId) && checkHexVisibility(rId + 1, hId+ 1)){
                hexagonAbout.style.top = '-' + (+getComputedStyle(hexagonAbout).height.replace('px', '')  + pads.top - localHexSizes.TRIANGLE_HEIGHT) + 'px';
                if(checkHexVisibility(rId - 1, hId)){
                    hexagonAbout.style.bottom = 0
                    hexagonAbout.style.left = (localHexSizes.HEXAGON_WIDTH + pads.side) + 'px'
                }else if(checkHexVisibility(rId - 1, hId + 1)){
                    hexagonAbout.style.bottom = 0
                    hexagonAbout.style.left = '-' + (+getComputedStyle(hexagonAbout).width.replace('px', '')  + pads.side) + 'px';
                }else{
                    hexagonAbout.style.left = (localHexSizes.HEXAGON_WIDTH + pads.side) + 'px'
                }
            }else if(checkHexVisibility(rId + 1, hId)){
                hexagonAbout.style.left = (localHexSizes.HEXAGON_WIDTH + pads.side) + 'px'
            }else if(checkHexVisibility(rId + 1, hId + 1)){
                hexagonAbout.style.left = '-' + (+getComputedStyle(hexagonAbout).width.replace('px', '')  + pads.side) + 'px';
            }else{
                hexagonAbout.style.left = (localHexSizes.HEXAGON_WIDTH + pads.side) + 'px'
            }
        }else{
            if(checkHexVisibility(rId + 1, hId - 1) && checkHexVisibility(rId + 1, hId)){
                hexagonAbout.style.top = '-' + (+getComputedStyle(hexagonAbout).height.replace('px', '')  + pads.top - localHexSizes.TRIANGLE_HEIGHT) + 'px';
                if(checkHexVisibility(rId - 1, hId)){
                    hexagonAbout.style.bottom = 0
                    hexagonAbout.style.left = (localHexSizes.HEXAGON_WIDTH + pads.side) + 'px'
                }else if(checkHexVisibility(rId - 1, hId + 1)){
                    hexagonAbout.style.bottom = 0
                    hexagonAbout.style.left = '-' + (+getComputedStyle(hexagonAbout).width.replace('px', '')  + pads.side) + 'px';
                }else{
                    hexagonAbout.style.left = (localHexSizes.HEXAGON_WIDTH + pads.side) + 'px'
                }
            }else if(checkHexVisibility(rId + 1, hId - 1)){
                hexagonAbout.style.left = (localHexSizes.HEXAGON_WIDTH + pads.side) + 'px'
            }else if(checkHexVisibility(rId + 1, hId)){
                hexagonAbout.style.left = '-' + (+getComputedStyle(hexagonAbout).width.replace('px', '')  + pads.side) + 'px';
            }else{
                hexagonAbout.style.left = (localHexSizes.HEXAGON_WIDTH + pads.side) + 'px'
            }
        }
    }
    // hexagonAbout.style.opacity = 1;
    hexagonAbout.addEventListener('contentLoaded', () => {
        const rect = hexagonAbout.getBoundingClientRect();
        
        const neededY = rect.top + document.body.scrollTop - (document.body.clientHeight - rect.height) / 2;
        const neededX = rect.left + document.body.scrollLeft - (rect.width > document.body.clientWidth ? 0 : (document.body.clientWidth - rect.width) / 2);

        // document.body.style.scrollBehavior = 'smooth'
        document.body.scrollTo({
            top: neededY,
            left: neededX,
            behavior: 'smooth'
        });

        // document.body.style.scrollBehavior = ''

        // const SPEED = .12;
        // const oneStepY = (neededY - document.body.scrollTop) * SPEED;
        // let oneStepX = (neededX - document.body.scrollLeft) * SPEED;
        
        // let previousY = document.body.scrollTop;
        // let previousX = document.body.scrollLeft;
        
        // const changeScroll = () => {
        //     let needNext = false;
        //     if(
        //         Math.round(document.body.scrollTop) != Math.round(previousY) ||    
        //         Math.round(document.body.scrollLeft) != Math.round(previousX)    
        //     ) return;
                
        //     if(Math.abs(neededY - document.body.scrollTop) >= Math.abs(oneStepY)){
        //         document.body.scrollTop += oneStepY;
        //         previousY = document.body.scrollTop;
        //         needNext = true;
        //     }   
            
        //     if(Math.abs(neededX - document.body.scrollLeft) >= Math.abs(oneStepX)){
        //         document.body.scrollLeft += oneStepX;
        //         needNext = true;
        //         previousX = document.body.scrollLeft;
        //     }   
            
        //     if(needNext){
        //         requestAnimationFrame(changeScroll);
        //         console.log(Math.abs(neededY - document.body.scrollTop), Math.abs(oneStepY));
        //     }
        //     else{
        //         oneStepX /= 2;

        //         requestAnimationFrame(changeScroll)
        //     } 
        // }
        
        // requestAnimationFrame(changeScroll);
    });
}

/**
 * @param {HTMLElement} hexagon 
 */
const createBgHex = (hexagon, url, path = hexPath(), onlyView = false) => {
    if(hexagon.querySelector('.hexagon-editedField') && !onlyView) return;
    
    hexagon.BGImg = url;
    hexagon.querySelector('.polygon').innerHTML = `
    <mask id="hexagon-bgImg-mask">
    <path fill="#fff" d="${path}"></path>
    </mask>
    <image draggable="false" style="pointer-events: none;" mask="url(#hexagon-bgImg-mask)" href="/${url}" preserveAspectRatio="xMidYMid slice" width="100%" height="100%"></image>`;
    if(!onlyView){
        hexagon.classList.add('hexagon-bg');

        hexagon.addEventListener('click', (evt) => {
            if(hexagon.classList.contains('hexagon-active')) return;
            hexagon.classList.add('hexagon-active');

            
            if(hexagon.querySelector('.hexagon-about')){
                evt.stopImmediatePropagation();
                return;
            }
            const imgAbout = setClassName(document.createElement('div'), 'hexagon-about image-about');
            const deleteObserver = new MutationObserver((mList) => {
                mList.forEach(mutation => {
                    if(Array.from(mutation.removedNodes).includes(imgAbout)){
                        hexagon.classList.remove('hexagon-active');
                    }
                });
            });
            deleteObserver.observe(hexagon, { childList: true });
            
            imgAbout.addEventListener('mousedown', (evt) => {
                evt.stopImmediatePropagation();
            }, {passive: false});

            const clearAbouts = () => {
                if(hexagon.isContextmenu || document.querySelectorAll('.ask').length) return;
                document.querySelectorAll('.hexagon-about').forEach(elem => {
                    elem.remove();
                });
                document.removeEventListener('mousedown', clearAbouts);
            }
            clearAbouts();

            imgAbout.innerHTML = `<img src="/${url}" alt="Hexagon image">`;
            hexagon.append(imgAbout);
            imgAbout.querySelector('img').onload = () => {
                imgAbout.dispatchEvent(new Event('contentLoaded'));
            }

            setHexAboutPosition(hexagon, imgAbout);

            document.addEventListener('mousedown', clearAbouts);
            
        }, {passive: false})
    }
}

const main = async () => {
    if(isIOS()) document.body.classList.add('ios');
    if(isTouchDevice()) document.body.classList.add('touch-device');

    const menuBtnsActions = {
        lang: (btn) => {
            const langDrop = setClassName(document.createElement('div'), 'menu-cont-drop menu-cont-langDrop');
            
            for(let l of allowedLangs.concat(['en', 'auto'])){
                langDrop.innerHTML += `<div class="menu-cont-dropItem${l == currentShortLocale ? ' menu-cont-dropItem-selected' : ''}">${l}</div>`;
            }
            langDrop.onclick = (evt) => {
                if(evt.target.classList.contains('menu-cont-dropItem') && !evt.target.classList.contains('menu-cont-dropItem-selected')){
                    if(evt.target.innerText !== 'auto') window.location.search = 'lang=' + evt.target.innerText;
                    localStorage.setItem('lang', evt.target.innerText);
                }
            }
            
            langDrop.style.left = btn.offsetLeft + 'px';
            btn.parentElement.append(langDrop);
            langDrop.style.top = btn.parentElement.offsetHeight + 'px';
        }
    }

    const clearDrops = () => {
        const drops = document.querySelectorAll('.menu-cont-drop');
        for(let drop of drops){
            drop.remove();
        };

        document.removeEventListener('click', clearDrops);
        return drops.length;
    }
    for(let action in menuBtnsActions){
        const actionBtn = document.querySelector('.menu-cont-' + action); 
        if(actionBtn) actionBtn.onclick = () => {
            if(!clearDrops()){
                menuBtnsActions[action](actionBtn);
                setTimeout(() => {
                    document.addEventListener('click', clearDrops);
                }, 0)
            } 
        }; 
    }

    socket.on('new-notification-for-' + document.documentElement.getAttribute('userId'), (data) => {
        if(document.title.toLowerCase().includes('notifications')) return;
        const notificationCount = document.querySelector('.notifications-count');
        if(notificationCount){
            ++notificationCount.innerText;
            notificationCount.classList.remove('notifications-countInvisible');
        }
    });
    
    let mainLogo = document.querySelector('.header-img.big');
    let smallLogo = document.querySelector('.header-img.small');
    if(mainLogo && smallLogo){
        if(document.documentElement.clientWidth < 470){
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
                        if(settings.colors) colors = Object.assign(colors, settings.colors);
                        hexsColors = settings.hexsColors;
                        font = settings.font;
                    }

                    localStorage.setItem('colors', JSON.stringify(settings.colors || '{}'));
                    window.dispatchEvent(new Event('settingsLoaded'))
                }else{
                    showModal('An error occurred while loading the settings', 'Please try later. The settings are set to default');
                }
            }
        }
    }catch(err){
        showModal('An error occurred while loading the settings', err)
    }

    if(otherSettings.rounded){
        const oldHexPath = hexPath;
        hexPath = () => roundPathCorners(oldHexPath(), .05, true);
    }

    const hexPathSprite = setClassName(document.createElementNS('http://www.w3.org/2000/svg', 'svg'), 'hexPath-sprite');
    hexPathSprite.innerHTML = `
    <symbol id="hex-path">
        <path d="${hexPath()}"></path>
    </symbol>`;
    document.body.append(hexPathSprite);

    if(font.family != 'Arial'){
        WebFont.load({
            google: {
                families: [font.family],
            }
        })
    }

    const tinyAbouFgc = tinycolor(colors.ABOUT_FGC);
    const cssProps = {
        'max-about-height': (document.documentElement.clientHeight - 100) + 'px',
        'grid-c': hexToRgb(constColors.MAIN_C, 0.1),
        'about-fgc-a': tinyAbouFgc.isDark() ? tinyAbouFgc.lighten(25) : tinyAbouFgc.darken(30),
        'font': font.family,
        'font-size': font.size,
        'trans-dur': '.2s',
    }
    cssProps.trans = `all ${cssProps['trans-dur']} ease`;
    let allColors = Object.assign(colors, constColors);
    for(let color in allColors){
        cssProps[color.toLowerCase().replace(/_/g, '-',)] = allColors[color] || defaultColors[color];
    }

    cssProps['scroll-thumb-c'] = tinycolor(colors.BLACK_C).setAlpha(.3);
    
    setCSSProps(Object.assign(cssProps, hexSizes.createCSSProps()));
    
    window.onerror = (msg, url, line) => {
        showModal('Error', `${msg} in ${url.split('/').pop()}:${line}`);
    };

    // поиск
    if(document.querySelector('.find-button')){
        const search = document.querySelector('.find-button').onclick = async (evt) => {
            let input = document.querySelector('.find-input').value.trim().toLowerCase();

            if(!input) return;
            
            let keywords = input.split(/[,-\.:]\s?/).filter(word => word);
            let hexs = await fetch('/hexs/all');
            
            let hexsFound = []; 
            let neededHex;
            
            if(hexs.ok){
                hexs = await hexs.json();
    
                let first = keywords.shift();
                const splitedFirst = first.split(' '); 
                for(let hex of hexs.body){
                    const hexText = hex.innerText.toLowerCase().trim(); 
                    if(!hexText) continue;
                    if(hexText.includes(first)){
                        hexsFound.push(hex);
                    }
                    
                    if(splitedFirst.length >= 2 && hexText.split(' ').length > 2 && hexText.match(new RegExp(`.*(${splitedFirst.join('|')}).*`.repeat(splitedFirst.length)))){
                        hexsFound.push(hex);
                    }
                }
    
                if(hexsFound.length == 1){
                    neededHex = hexsFound[0];
                }else if(!keywords.length){
                    neededHex = hexsFound[getRand(0, hexsFound.length - 1)]
                }else{
                    hexsFound.forEach(hex => {
                        let hexChain = hexs.body.filter(hexToCheck => hexToCheck.chainId == hex.chainId && hexToCheck != hex);
    
                        for(let chainHex of hexChain){
                            if(keywords.includes(chainHex.innerText)){
                                neededHex = hex;
                                return;
                            }
                        }
                    });
                }
            }
            
            if(neededHex){
                const visibleHexs = Array.from(document.querySelectorAll('.hexagon-visible'))
                let foundedHex = visibleHexs && visibleHexs.filter(hex => hex.uuid == neededHex.id)[0];
                
                if(foundedHex){
                    foundedHex.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                        inline: 'center'
                    });
                
                    foundedHex.classList.add('founded-polygon');
                    
                    setTimeout(() => {
                        foundedHex.classList.remove('founded-polygon');
                    }, 4000);  
                }else{
                    window.location.href = '/hexs/' + neededHex.id;
                }
            }
        }

        document.querySelector('.find-input').onkeypress = (evt) => {
            if(evt.key == 'Enter'){
                search();
            }
        }
    }

    if(document.body || !window.location.href.includes('fields')){
        document.body.style.width = document.documentElement.clientWidth + 'px';
        document.body.style.height = document.documentElement.clientHeight + 'px';
        window.onresize = () => {
            document.body.style.width = document.documentElement.clientWidth + 'px';
            document.body.style.height = document.documentElement.clientHeight + 'px';
        }
    }
    
    
    if(document.querySelector('.logout')){
        document.querySelector('.logout').onclick = () => {
            window.location.href = '/logout';
            localStorage.clear();
            sessionStorage.clear();
        }
    }

    if(document.querySelector('.header-img')){
        document.querySelector('.header-img').onclick = () => {
            window.location.href = '/';
        }
    }
    
    createDropMenu();

    document.body.classList.remove('while-loading');

    let loading = document.querySelector('.loading');
    if(loading){
        loading.style.opacity = 0; 

        let transEnd = false;        
        let deleteLoading = loading.ontransitionend = () => {
            transEnd = true;        
            
            loading.remove()
        }

        setTimeout(() => {
            if(!transEnd){
                deleteLoading();
            }
        }, 1000)
    }
    
    tasks.forEach(task => {
        try{
            task();
        }catch(err){
            showModal('Critical error', `${err} in tasks`)
        }
    });
}
window.addEventListener('load', main);

socket.on('reload', () => {
    window.location.href = '/'
});



const loading = `<div class="inline-loading loading">
<svg class='loading-svg' version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
  viewBox="0 0 52 12" enable-background="new 0 0 0 0" xml:space="preserve">
  <circle stroke="none" cx="6" cy="6" r="6">
    <animate
      attributeName="opacity"
      dur="1s"
      values="0;1;0"
      repeatCount="indefinite"
      begin="0.1"/>    
  </circle>
  <circle stroke="none" cx="26" cy="6" r="6">
    <animate
      attributeName="opacity"
      dur="1s"
      values="0;1;0"
      repeatCount="indefinite" 
      begin="0.2"/>       
  </circle>
  <circle stroke="none" cx="46" cy="6" r="6">
    <animate
      attributeName="opacity"
      dur="1s"
      values="0;1;0"
      repeatCount="indefinite" 
      begin="0.3"/>     
  </circle>
</svg>
</div>`;

