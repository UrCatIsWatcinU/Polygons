let isHexagonActive = false;

function rgbToHex(r, g, b) {
    function componentToHex(c) {
        const hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }

    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

window.addEventListener('load', async () => {
    const createEditedField = (hexagon, needToSend = true) => {
        let editedField = hexagon.querySelector('.hexagon-editedField');
        if(!editedField){
            editedField = document.createElement('div');
            editedField.className = 'hexagon-editedField';
            
            
            hexagon.append(editedField);
        }

        editedField.onfocus = () => {    
            isHexagonActive = true;
            let oldName = editedField.innerText;
            
            editedField.onblur = async () => {
                editedField.setAttribute('contenteditable','false');
                hexagon.classList.remove('hexagon-active');

                isHexagonActive = false;
                if(needToSend && editedField.innerText && editedField.innerText != oldName){
                    try{
                        let res = await fetch('/categ/change', {
                            method: 'POST',
                            body: JSON.stringify({
                                name: editedField.innerText.trim(),
                                oldName: oldName, 
                                color: hexagon.style.getPropertyValue('--bgc').replace('#', '').trim(),
                                textColor: rgbToHex(...getComputedStyle(editedField).color.replace('rgb(', '').replace(')', '').split(/\s*,\s*/).map(elem => +elem)).replace('#', '')
                            })
                        })

                        if(res.ok){
                            res = await res.json();
                            if(!res.success){
                                showModal("Couldn't change category", 'An error occurred while changing the category');
                            }
                        }else{
                            showModal("Couldn't change category", 'An error occurred while changing the category');
                        }
                    }catch(err){
                        showModal("Couldn't change category", 'An error occurred while changing the category');
                    }
                }
            }
        }
        return editedField;
    }

    document.addEventListener('click', evt => {
        document.querySelectorAll('.contextmenu').forEach(elem => {elem.remove()});
    })
    
    document.body.oncontextmenu = (evt) => {
        document.querySelectorAll('.contextmenu').forEach(elem => {elem.remove()});
        window.onscroll = () => {document.querySelectorAll('.contextmenu').forEach(elem => {elem.remove()});}

        let hexagon = document.elementFromPoint(evt.clientX, evt.clientY);
        if(hexagon == document.body) return false;
        while(!hexagon.classList.contains('categ')){
            hexagon = hexagon.parentElement;
            if(hexagon == document.body) return false;
        }

        let contextmenu  = document.createElement('div');
        contextmenu.className = 'contextmenu';

        contextmenu.onclick = null;
        
        let user = JSON.parse(sessionStorage.getItem('user'));
        if(user.userRole != 2) return false
        contextmenu.innerHTML = '<div class="contextmenu-item">Delete</div>';

        contextmenu.firstElementChild.onclick = () => {
            showAsk(() => {     
                fetch('/categ/delete/' + hexagon.innerText, {method: 'DELETE'});
            });
        }

        contextmenu.style.top = evt.clientY + 'px';
        contextmenu.style.left = evt.clientX + 'px';
        document.body.append(contextmenu);

        return false
    }

    let user = null;
    let userRes = await fetch('/users/i');
    if(userRes.ok){
        if(!userRes.message){
            userRes = await userRes.text()
            sessionStorage.setItem('user', userRes)
            user = JSON.parse(userRes)
        }
    }


    const categSizes = {
        sideL: 70,
        trH: 40,
        totalH: 120,
        pad: 7
    }
    categSizes.totalW = categSizes.sideL + categSizes.trH * 2;
    if(document.documentElement.clientWidth < 600){
        for(let prop in categSizes){
            categSizes[prop] = categSizes[prop] * (document.documentElement.clientWidth < 410 ? document.documentElement.clientWidth < 360 ? .7 : .8 : .9)
        }
    }

    setCSSProps(categSizes, 'categ-', 'px')

    const categPath = roundPathCorners(
    `M 0 ${categSizes.totalH / 2} L ${categSizes.trH} 0 L ${categSizes.totalW - categSizes.trH} 0 L ${categSizes.totalW} ${categSizes.totalH / 2} L ${categSizes.totalW - categSizes.trH} ${categSizes.totalH} L ${categSizes.trH} ${categSizes.totalH} Z`, 
    .025, true);

    const categs = Array.from(document.querySelectorAll('.categ'));
    categs.forEach(categ => {
        let polygon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        polygon.classList.add('polygon');
        polygon.setAttribute('preserveAspectRatio', 'none');
        // polygon.setAttribute('transform', `rotate(90, ${hexSizes.HEXAGON_HEIGHT / 2}, ${hexSizes.HEXAGON_WIDTH / 2})`)
        polygon.innerHTML = `<path class="categ-path" d="${categPath}"></path>`;

        categ.prepend(polygon);

        categ.addEventListener('click', async (evt) => {
            if(evt.ctrlKey || evt.metaKey){
                let user = JSON.parse(sessionStorage.getItem('user') || '{}')
                if(user.userRole != 2) return
                evt.preventDefault();
                evt.stopImmediatePropagation();

                categ.classList.add('hexagon-active');   
                
                let editedField = createEditedField(categ);
                
                editedField.setAttribute('contenteditable','true');
                editedField.focus();
            }
            
        }, {passive:false, capture:true});

        categ.addEventListener('click', () => {
            if(!isHexagonActive){
                window.location.href = '/fields/' + categ.innerText.trim();
            }
        })
    });
    const showCategs = (hexsInRow = 5) => {
        if(categs && categs.length >= hexsInRow){
    
            let splitedCategs = [];
            
            for(let i = 0; i < categs.length; i+=hexsInRow){
                splitedCategs.push(categs.slice(i, i+hexsInRow));
            }

            document.querySelectorAll('.categs-row').forEach(r => r.remove());
    
            for(let i = 0; i < splitedCategs.length; i++){
                if(!splitedCategs[i].length) continue;

                if(splitedCategs[i].length == 1) splitedCategs[i].unshift(setClassName(document.createElement('div'), 'categ'))

                let row = setClassName(document.createElement('div'), 'categs-row');
                row.style.width = ((categSizes.totalW - categSizes.trH + categSizes.pad * 2) * hexsInRow) + 'px';
                row.append(...splitedCategs[i]);
    
                document.querySelector('.categs').append(row);
            }
        }
    }

    if(document.documentElement.clientWidth < 50){
        showCategs(2);
    }else if(document.documentElement.clientWidth < 670){
        showCategs(3);
    }else if(document.documentElement.clientWidth < 820){
        showCategs(4);
    }else if(document.documentElement.clientWidth < 1020){
        showCategs(5);
    }else{
        showCategs(6);
    }
    // отрисовка плюса для создания категорий
    if(user && user.userRole == 2){
        let isNewCateg = false;

        let plus = document.createElement('button');
        plus.innerText = 'New categ'
        document.querySelector('.btns').append(plus);
        
        plus.addEventListener('click', () => {
            if(isNewCateg) return;

            showModal('', '', true);

            let modal = document.querySelector('.modal-content');
            modal.classList.add('new-categ-modal');

            modal.innerHTML = '<div class="new-categ-cont"></div>'

            isNewCateg = true;
            let newCateg = setClassName(document.createElement('div'), 'categ');
            newCateg.innerHTML =   `<svg class="polygon"> 
            <path d="${categPath}"></path>
            </svg>
            <div class="newCategPieces">
                <label for="bgc">Background</label> <input id="bgc" class='picker bgc-picker' value="${colors.BLACK_C}" data-jscolor="{}">
                <label for="fgc">Foreground</label> <input id="fgc" class='picker fgc-picker' value="${colors.WHITE_C}" data-jscolor="{}">
                <label for="size">Size</label> <input id="size" class='param new-categ-size' value="30x40">
                <label for="maxWords">Max words count</label> <input id="maxWords" class='param new-categ-maxWords' value="5">
                <button class="create-categ">Create</button>
                <button class="create-categ">Cancel</button>
            </div>`;
            newCateg.style.setProperty('--bgc', colors.BLACK_C);
            
            
            
            modal.querySelector('.new-categ-cont').append(newCateg);
            let editedField = createEditedField(newCateg);
            editedField.onfocus = null;
            editedField.onblur = null;

            jscolor.install();
            let bgc = colors.BLACK_C;
            let fgc = newCateg.style.color =  colors.WHITE_C;
            newCateg.querySelector('.bgc-picker').onchange = (evt) => {
                newCateg.style.setProperty('--bgc', evt.target.value);
                bgc = evt.target.value;
            }
            newCateg.querySelector('.fgc-picker').onchange = (evt) => {
                editedField.style.color = evt.target.value;
                fgc = evt.target.value;
            }
            
            newCateg.addEventListener('dblclick', (evt) => {
                evt.preventDefault();
                evt.stopImmediatePropagation();

                newCateg.classList.add('hexagon-active');   
                
                let editedField = createEditedField(newCateg, false);
                
                editedField.setAttribute('contenteditable','true');
                editedField.focus();
            
            }, {passive:false, capture:true})

            newCateg.querySelectorAll('button').forEach(btn => {
                btn.addEventListener('click', () => {
                    modal.parentElement.style.display = 'none';
                    modal.classList.remove('new-categ-modal');
                    isNewCateg = false;
                })
            })

            newCateg.querySelector('.create-categ').onclick = async () => {
                if(!editedField.innerText) return;

                let params = {};
                Array.from(newCateg.querySelectorAll('.param')).forEach(param => {
                    params[param.id] = param.value;
                })

                if(!params.size.match(/\d{1,3}[xх\s]\d{1,3}/) || !params.maxWords.match(/\d+/) ) return;

                newCateg.querySelector('.newCategPieces').remove();
                let res = await fetch('/categ/new', {
                    method:'POST',
                    body:JSON.stringify({
                        name: editedField.innerText.trim(),
                        color: bgc.replace('#', '').trim(),
                        textColor: fgc.replace('#', ''),
                        params: JSON.stringify(params)
                    })
                })

                if(!res.ok){
                    showModal("Couldn't create category", 'An error occurred while creating the category');
                    return
                }else{
                    res = await res.json();
                    if(!res.success){
                        showModal('Error', res.message)
                        return
                    }
                }
                window.location.reload()
            }

        })
    }

})