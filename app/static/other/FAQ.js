tasks.push(() => {
    const content = document.querySelector('.content');
    const nav = document.querySelector('.nav');

    content.style.marginLeft = nav.offsetWidth + 40 + 'px';
    if(document.documentElement.clientWidth > 900) content.style.paddingRight = (nav.offsetWidth - 40) + 'px';

    setCSSProps({
        'marker-c': tinycolor(constColors.MAIN_C).setAlpha(.7),
        'active-linkedElem-bgc': tinycolor(constColors.MAIN_C).setAlpha(.2),
        'note-bgc': tinycolor(constColors.MAIN_C).setAlpha(.1),
    });

    document.querySelectorAll('.text').forEach(text => {
        const btns = text.innerHTML.match(/\[[^[\]/:]+(?=\])\s*(?!\[])/g) || [];
        btns.forEach(btn => {
            btn = btn.replace('[', '');
            text.innerHTML = text.innerHTML.replace(`[${btn}]`, `<span class="btn">${btn}</span>`);
        });

        const classes =  text.innerHTML.match(/\{[^{\}]+(?=\})\s*(?!\{})/g) || [];
        classes.forEach(cls => {
            cls = cls.replace('{', '');
            const clsName = cls.split(':')[0];
            const clsText = cls.split(':')[1];
            text.innerHTML = text.innerHTML.replace(`{${cls}}`, `<span class="${clsName}">${clsText}</span>`);
        });
        
        const boldes = text.innerHTML.match(/\*[^*]+\*/g) || [];
        boldes.forEach(bold => {
            text.innerHTML = text.innerHTML.replace(`${bold}`, `<b>${bold.replace(/\*/g, '')}</b>`);
        });

        const italics = text.innerHTML.match(/[^<:\/"]\/[^/\d<>]+\//g) || [];
        italics.forEach(italic => {
            italic = italic.replace(italic[0], '');
            text.innerHTML = text.innerHTML.replace(`${italic}`, `<i>${italic.replace(/\//g, '')}</i>`);
        });

        const fns = text.innerHTML.match(/\w+\([^\(\)]*\)/g) || [];
        fns.forEach(fn => {
            const fnName = fn.split(/[\(\)]/)[0];
            const fnArgs = fn.split(/[\(\)]/)[1].split(/,\s/);

            const handlers = {
                translate: () => {
                    text.innerHTML = text.innerHTML.replace(`${fn}`, `${translate(...fnArgs)}`);
                },
                fileSize: () => {
                    text.innerHTML = text.innerHTML.replace(`${fn}`, MAX_SIZE / 1000000 + 'MB');
                },
                fileExts: () => {
                    text.innerHTML = text.innerHTML.replace(`${fn}`, EXTENTIONS.map(ext => ext.toUpperCase()).join(', '));
                }
            }

            if(typeof(handlers[fnName]) == 'function') handlers[fnName]()
        });
    });

    document.querySelectorAll('a').forEach(a => {
        a.onclick = () => {
            if(!a.getAttribute('href').includes('#')) return;
            
            const linkedElem = document.querySelector(a.getAttribute('href'));
            if(!linkedElem) return;

            linkedElem.classList.add('active-linkedElem');
            setTimeout(() => {
                linkedElem.classList.remove('active-linkedElem');
            }, 4000);
        }
    });
});